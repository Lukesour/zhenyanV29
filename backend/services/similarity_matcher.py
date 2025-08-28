import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple, Optional
import logging
from models.schemas import UserBackground
from services.university_scoring_service import UniversityScoringService
from services.supabase_service import SupabaseService
from config.settings import settings

logger = logging.getLogger(__name__)

class SimilarityMatcher:
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            analyzer='char_wb',
            ngram_range=(2, 4)
        )
        self.experience_vectors = None
        self.cases_df = None
        self.university_scoring_service = UniversityScoringService()
        self.supabase_service = SupabaseService()
        self._data_loaded = False
    
    def _load_cases(self):
        """Load and prepare cases for similarity matching"""
        try:
            logger.info("Loading cases from Supabase...")
            self._load_cases_from_supabase()
        except Exception as e:
            logger.error(f"Error loading cases: {str(e)}")
            raise Exception(f"数据库连接失败: {str(e)}")
    
    def _load_cases_from_supabase(self):
        """Load cases from Supabase"""
        try:
            cases = self.supabase_service.get_all_cases()
            
            # Convert to DataFrame for easier processing
            cases_data = []
            for case in cases:
                cases_data.append({
                    'id': case.get('id', 0),
                    'original_id': case.get('original_id', 0),
                    'gpa_4_scale': case.get('gpa_4_scale', 0.0) or 0.0,
                    'undergraduate_university_tier': case.get('undergraduate_university_tier', '未知') or '未知',
                    'undergraduate_major_category': case.get('undergraduate_major_category', 'Other') or 'Other',
                    'language_total_score': case.get('language_total_score', 0) or 0,
                    'language_test_type': case.get('language_test_type', '') or '',
                    'gre_total': case.get('gre_total', 0) or 0,
                    'gmat_total': case.get('gmat_total', 0) or 0,
                    'research_experience_count': case.get('research_experience_count', 0) or 0,
                    'internship_experience_count': case.get('internship_experience_count', 0) or 0,
                    'work_experience_years': case.get('work_experience_years', 0.0) or 0.0,
                    'experience_text': case.get('experience_text', '') or '',
                    'admitted_university': case.get('admitted_university', '') or '',
                    'admitted_program': case.get('admitted_program', '') or '',
                    'admitted_country': case.get('admitted_country', '') or '',
                    'admitted_degree_type': case.get('admitted_degree_type', '') or '',
                    'undergraduate_university': case.get('undergraduate_university', '') or '',
                    'undergraduate_major': case.get('undergraduate_major', '') or '',
                })
            
            self.cases_df = pd.DataFrame(cases_data)
            self._prepare_experience_vectors()
            
        except Exception as e:
            logger.error(f"Error loading cases from Supabase: {str(e)}")
            raise Exception(f"从Supabase加载案例失败: {str(e)}")
    
    def _prepare_experience_vectors(self):
        """Prepare experience text vectors for similarity calculation"""
        if len(self.cases_df) > 0:
            experience_texts = self.cases_df['experience_text'].fillna('').tolist()
            if any(text.strip() for text in experience_texts):
                self.experience_vectors = self.tfidf_vectorizer.fit_transform(experience_texts)
            else:
                self.experience_vectors = None
        
        logger.info(f"Loaded {len(self.cases_df)} cases for similarity matching")
    
    def _calculate_gpa_similarity(self, user_gpa: float, case_gpa: float) -> float:
        """Calculate GPA similarity score (0-1)"""
        if user_gpa == 0 or case_gpa == 0:
            return 0.5  # Neutral score if either GPA is missing
        
        # Normalize the difference to 0-1 scale
        max_diff = 4.0  # Maximum possible GPA difference
        diff = abs(user_gpa - case_gpa)
        similarity = max(0, 1 - (diff / max_diff))
        return similarity
    
    def _calculate_university_tier_similarity(self, user_tier: str, case_tier: str) -> float:
        """Calculate university tier similarity score (0-1) using new tier system"""
        # 新的层级体系
        tier_hierarchy = {
            'Tier 0': 5,
            'Tier 1': 4,
            'Tier 2': 3,
            'Tier 3': 2,
            'Tier 4': 1
        }
        

        
        user_level = tier_hierarchy.get(user_tier, 1)
        case_level = tier_hierarchy.get(case_tier, 1)
        
        # Same tier gets full score
        if user_level == case_level:
            return 1.0
        
        # Adjacent tiers get partial score
        diff = abs(user_level - case_level)
        if diff == 1:
            return 0.7
        elif diff == 2:
            return 0.4
        else:
            return 0.1
    
    def _calculate_major_similarity(self, user_major_category: str, case_major_category: str) -> float:
        """Calculate major category similarity score (0-1)"""
        if user_major_category == case_major_category:
            return 1.0
        
        # Define related major categories
        related_majors = {
            'CS': ['EE', 'ME'],
            'EE': ['CS', 'ME'],
            'ME': ['CS', 'EE'],
            'Finance': ['Business'],
            'Business': ['Finance'],
        }
        
        if case_major_category in related_majors.get(user_major_category, []):
            return 0.6
        
        return 0.1
    
    def _calculate_language_similarity(self, user_score: int, case_score: int, 
                                     user_type: str, case_type: str) -> float:
        """Calculate language test similarity score (0-1)"""
        if user_score == 0 or case_score == 0:
            return 0.5  # Neutral score if either score is missing
        
        # Convert IELTS to TOEFL equivalent for comparison
        if user_type == 'IELTS' and case_type == 'TOEFL':
            user_score = user_score * 10  # Convert back from our internal representation
        elif user_type == 'TOEFL' and case_type == 'IELTS':
            case_score = case_score * 10  # Convert back from our internal representation
        elif user_type != case_type:
            return 0.3  # Different test types get lower similarity
        
        # Calculate similarity based on score difference
        max_score = 120 if 'TOEFL' in [user_type, case_type] else 90
        diff = abs(user_score - case_score)
        similarity = max(0, 1 - (diff / max_score))
        return similarity
    
    def _calculate_experience_similarity(self, user_background: UserBackground, 
                                       case_idx: int) -> float:
        """Calculate experience similarity score (0-1)"""
        if self.experience_vectors is None or case_idx >= len(self.cases_df):
            return 0.5
        
        # Prepare user experience text
        user_experience_parts = []
        
        for exp in user_background.research_experiences or []:
            user_experience_parts.append(f"{exp.get('name', '')} {exp.get('description', '')}")
        
        for exp in user_background.internship_experiences or []:
            user_experience_parts.append(f"{exp.get('company', '')} {exp.get('position', '')} {exp.get('description', '')}")
        
        for exp in user_background.other_experiences or []:
            user_experience_parts.append(f"{exp.get('name', '')} {exp.get('description', '')}")
        
        user_experience_text = ' '.join(user_experience_parts)
        
        if not user_experience_text.strip():
            return 0.5
        
        # Calculate text similarity
        try:
            user_vector = self.tfidf_vectorizer.transform([user_experience_text])
            case_vector = self.experience_vectors[case_idx:case_idx+1]
            similarity = cosine_similarity(user_vector, case_vector)[0][0]
            return max(0, similarity)
        except Exception as e:
            logger.warning(f"Error calculating experience similarity: {str(e)}")
            return 0.5
    
    def find_similar_cases(self, user_background: UserBackground, top_n: int = 150) -> List[Dict]:
        """Find the most similar cases to the user's background"""
        # Lazy load data on first use
        if not self._data_loaded:
            logger.info("Loading cases data for first time...")
            self._load_cases()
            self._data_loaded = True
        
        if self.cases_df is None or self.cases_df.empty:
            logger.error("No cases available for similarity matching")
            raise Exception("暂无案例，稍后重试")
        
        # Pre-filter cases based on target countries and degree type
        filtered_df = self.cases_df.copy()
        
        if user_background.target_countries:
            filtered_df = filtered_df[
                filtered_df['admitted_country'].isin(user_background.target_countries)
            ]
        
        if user_background.target_degree_type:
            filtered_df = filtered_df[
                filtered_df['admitted_degree_type'] == user_background.target_degree_type
            ]
        
        if filtered_df.empty:
            logger.warning("No cases match the filtering criteria")
            # Fall back to all cases if filtering is too restrictive
            filtered_df = self.cases_df.copy()
        
        # Calculate similarity scores for each case
        similarities = []
        
        # Determine user's university tier and major category
        user_tier = self._get_user_university_tier(user_background.undergraduate_university)
        user_major_category = self._get_user_major_category(user_background.undergraduate_major)
        
        # Convert user GPA to 4.0 scale
        user_gpa_4_scale = self._convert_gpa_to_4_scale(
            user_background.gpa, user_background.gpa_scale
        )
        
        for idx, case in filtered_df.iterrows():
            # Calculate individual similarity components
            gpa_sim = self._calculate_gpa_similarity(user_gpa_4_scale, case['gpa_4_scale'])
            tier_sim = self._calculate_university_tier_similarity(user_tier, case['undergraduate_university_tier'])
            major_sim = self._calculate_major_similarity(user_major_category, case['undergraduate_major_category'])
            
            # Language similarity
            lang_sim = 0.5  # Default neutral score
            if user_background.language_total_score and case['language_total_score']:
                lang_sim = self._calculate_language_similarity(
                    user_background.language_total_score,
                    case['language_total_score'],
                    user_background.language_test_type or '',
                    case['language_test_type']
                )
            
            # Experience similarity
            exp_sim = self._calculate_experience_similarity(user_background, idx)
            
            # Weighted total similarity
            weights = {
                'major': 0.25,      # Highest weight for major relevance
                'gpa': 0.25,       # Academic performance
                'tier': 0.4,       # University prestige
                'language': 0.05,  # Language ability
                'experience': 0.05  # Experience background
            }
            
            total_similarity = (
                weights['major'] * major_sim +
                weights['gpa'] * gpa_sim +
                weights['tier'] * tier_sim +
                weights['language'] * lang_sim +
                weights['experience'] * exp_sim
            )
            
            similarities.append({
                'case_id': case['id'],
                'original_id': case['original_id'],
                'similarity_score': total_similarity,
                'component_scores': {
                    'major': major_sim,
                    'gpa': gpa_sim,
                    'tier': tier_sim,
                    'language': lang_sim,
                    'experience': exp_sim
                },
                'case_data': case.to_dict()
            })
        
        # Sort by similarity score and return top N
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        return similarities[:top_n]
    
    def _get_user_university_tier(self, university_name: str) -> str:
        """Get user's university tier using new scoring service"""
        score, tier = self.university_scoring_service.get_university_score_and_tier(university_name)
        return tier
    
    def _get_user_major_category(self, major_name: str) -> str:
        """Get user's major category"""
        major_categories = {
            "计算机科学与技术": "CS", "软件工程": "CS", "网络工程": "CS", "信息安全": "CS",
            "数据科学与大数据技术": "CS", "人工智能": "CS", "物联网工程": "CS",
            "电子信息工程": "EE", "通信工程": "EE", "电气工程及其自动化": "EE",
            "自动化": "EE", "电子科学与技术": "EE",
            "机械工程": "ME", "机械设计制造及其自动化": "ME",
            "金融学": "Finance", "经济学": "Finance", "国际经济与贸易": "Finance",
            "工商管理": "Business", "市场营销": "Business", "会计学": "Business",
        }
        
        if major_name in major_categories:
            return major_categories[major_name]
        
        # Fuzzy matching
        for major, category in major_categories.items():
            if major in major_name or major_name in major:
                return category
        
        return "Other"
    
    def _convert_gpa_to_4_scale(self, gpa: float, scale: str) -> float:
        """Convert GPA to 4.0 scale"""
        if scale == "100":
            # Convert 100-point scale to 4.0 scale
            if gpa >= 90:
                return 4.0
            elif gpa >= 85:
                return 3.7
            elif gpa >= 82:
                return 3.3
            elif gpa >= 78:
                return 3.0
            elif gpa >= 75:
                return 2.7
            elif gpa >= 72:
                return 2.3
            elif gpa >= 68:
                return 2.0
            elif gpa >= 64:
                return 1.7
            elif gpa >= 60:
                return 1.0
            else:
                return 0.0
        elif scale == "5.0":
            # Convert 5.0-point scale to 4.0 scale
            return min(gpa * 4.0 / 5.0, 4.0)
        else:
            return min(gpa, 4.0)
    
    def get_case_details(self, case_ids: List[int]) -> List[Dict]:
        """Get detailed information for specific cases"""
        # Lazy load data if needed
        if not self._data_loaded:
            self._load_cases()
            self._data_loaded = True
            
        if self.cases_df is None or self.cases_df.empty:
            return []
        
        detailed_cases = []
        for case_id in case_ids:
            case_row = self.cases_df[self.cases_df['id'] == case_id]
            if not case_row.empty:
                case_data = case_row.iloc[0].to_dict()
                detailed_cases.append(case_data)
        
        return detailed_cases