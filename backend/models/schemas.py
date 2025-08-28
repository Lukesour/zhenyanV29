from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# Pydantic Models for API
class UserBackground(BaseModel):
    # Academic background
    undergraduate_university: str
    undergraduate_major: str
    gpa: float
    gpa_scale: str  # "4.0" or "100"
    graduation_year: int
    
    # Language scores (optional)
    language_test_type: Optional[str] = None  # "TOEFL" or "IELTS"
    language_total_score: Optional[int] = None
    language_reading: Optional[int] = None
    language_listening: Optional[int] = None
    language_speaking: Optional[int] = None
    language_writing: Optional[int] = None
    
    # Standardized test scores (optional)
    gre_total: Optional[int] = None
    gre_verbal: Optional[int] = None
    gre_quantitative: Optional[int] = None
    gre_writing: Optional[float] = None
    gmat_total: Optional[int] = None
    
    # Experience (optional)
    research_experience_count: Optional[int] = 0
    internship_experience_count: Optional[int] = 0
    work_experience_years: Optional[float] = 0.0
    
    # Experience details (for compatibility with frontend)
    research_experiences: Optional[List[Dict[str, str]]] = []
    internship_experiences: Optional[List[Dict[str, str]]] = []
    other_experiences: Optional[List[Dict[str, str]]] = []
    
    # Target information (optional)
    target_countries: Optional[List[str]] = []
    target_majors: Optional[List[str]] = []
    target_degree_type: Optional[str] = None  # "Master" or "PhD"

class CompetitivenessAnalysis(BaseModel):
    strengths: str
    weaknesses: str
    summary: str

class SupportingCase(BaseModel):
    case_id: str
    similarity_score: float
    key_similarities: str

class SchoolRecommendation(BaseModel):
    university: str
    program: str
    reason: str
    supporting_cases: List[SupportingCase]

class SchoolRecommendations(BaseModel):
    recommendations: List[SchoolRecommendation]
    analysis_summary: str

class CaseComparison(BaseModel):
    gpa: str
    university: str
    experience: str

class CaseAnalysis(BaseModel):
    case_id: int
    admitted_university: str
    admitted_program: str
    gpa: str
    language_score: str
    language_test_type: Optional[str] = None  # "TOEFL" or "IELTS"
    key_experiences: Optional[str] = None  # 主要经历摘要
    undergraduate_info: str
    comparison: CaseComparison
    success_factors: str
    takeaways: str

class ActionPlan(BaseModel):
    timeframe: str
    action: str
    goal: str

class BackgroundImprovement(BaseModel):
    action_plan: List[ActionPlan]
    strategy_summary: str

class AnalysisReport(BaseModel):
    competitiveness: CompetitivenessAnalysis
    school_recommendations: SchoolRecommendations
    similar_cases: List[CaseAnalysis]
    background_improvement: Optional[BackgroundImprovement] = None
    radar_scores: List[int]  # 雷达图五项能力得分: [学术能力, 语言能力, 科研背景, 实习背景, 院校背景]