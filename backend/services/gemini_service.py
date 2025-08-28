import google.generativeai as genai
import json
import logging
from typing import Dict, List, Optional
from config.settings import settings
from models.schemas import UserBackground, CompetitivenessAnalysis, SchoolRecommendations, SchoolRecommendation, SupportingCase, CaseAnalysis, BackgroundImprovement

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        # 使用环境变量中的API密钥
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise Exception("GEMINI_API_KEY environment variable is required")
        genai.configure(api_key=api_key)
        
        # 模型候选顺序：A > B > C
        self.model_candidates = [
            'gemma-3-27b-it',     # A: 主要模型
            'gemma-3-12b-it',     # B: 备选模型1
            'gemini-1.5-flash',   # C: 备选模型2
        ]
        
        # 初始化时不预测试模型，在每次调用时按顺序尝试
        self.current_model_index = 0
        logger.info("LLM scheduler initialized with model candidates: A > B > C")
    
    def _call_gemini_api(self, prompt: str, max_retries: int = 2, timeout_seconds: int = 600) -> Optional[str]:
        """Call Gemini API with model candidate fallback and retry logic"""
        # 按候选顺序尝试模型
        for model_index in range(len(self.model_candidates)):
            model_name = self.model_candidates[model_index]
            logger.info(f"Trying model {model_name} (candidate {model_index + 1})")
            
            try:
                # 创建模型实例
                model = genai.GenerativeModel(model_name)
                
                # 尝试调用，最多重试max_retries次
                for attempt in range(max_retries):
                    try:
                        response = model.generate_content(
                            prompt,
                            generation_config=genai.types.GenerationConfig(
                                temperature=0.5,
                                top_p=0.9,
                                top_k=40,
                                max_output_tokens=6144,
                            )
                        )
                        
                        if response and response.text:
                            logger.info(f"✅ API call successful with {model_name} on attempt {attempt + 1}")
                            return response.text
                        else:
                            logger.warning(f"Empty response from {model_name} on attempt {attempt + 1}")
                            
                    except Exception as e:
                        error_msg = str(e).lower()
                        logger.warning(f"{model_name} attempt {attempt + 1} failed: {str(e)}")
                        
                        # 配额错误直接切换到下一个模型
                        if "quota" in error_msg or "rate limit" in error_msg or "429" in error_msg:
                            logger.error(f"API quota exceeded for {model_name}: {str(e)}")
                            break
                        elif any(keyword in error_msg for keyword in ["network", "timeout", "deadline", "504", "503", "502"]):
                            # 网络和超时错误进行重试
                            if attempt == max_retries - 1:
                                logger.error(f"Network/timeout error after {max_retries} attempts with {model_name}: {str(e)}")
                                break
                            import time
                            wait_time = (attempt + 1) * 2
                            logger.info(f"Retrying {model_name} in {wait_time} seconds...")
                            time.sleep(wait_time)
                        else:
                            # 其他错误直接切换到下一个模型
                            logger.error(f"Non-retryable error with {model_name}: {str(e)}")
                            break
                
                # 如果当前模型的所有重试都失败了，记录并尝试下一个模型
                if model_index < len(self.model_candidates) - 1:
                    logger.warning(f"Model {model_name} failed, switching to next candidate")
                else:
                    logger.error(f"All model candidates failed")
                    
            except Exception as e:
                logger.error(f"Failed to initialize model {model_name}: {str(e)}")
                if model_index < len(self.model_candidates) - 1:
                    logger.warning(f"Switching to next candidate")
                else:
                    logger.error(f"All model candidates failed to initialize")
                    
        return None
    
    def _extract_json_from_response(self, response_text: str) -> Optional[Dict]:
        """Extract JSON from Gemini response"""
        if not response_text:
            return None
        
        try:
            # Try to find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # If no JSON found, try to parse the entire response
                return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Gemini response: {str(e)}")
            # 不记录完整响应文本，避免泄露敏感信息
            logger.error(f"Response length: {len(response_text) if response_text else 0} characters")
            return None
    
    def analyze_competitiveness(self, user_background: UserBackground) -> Optional[CompetitivenessAnalysis]:
        """Analyze user's competitiveness using Gemini API"""
        
        # Prepare user data for the prompt
        user_data = {
            "gpa": user_background.gpa,
            "gpa_scale": user_background.gpa_scale,
            "university": user_background.undergraduate_university,
            "major": user_background.undergraduate_major,
            "graduation_year": user_background.graduation_year,
            "language_test": user_background.language_test_type,
            "language_score": user_background.language_total_score,
            "gre_score": user_background.gre_total,
            "gmat_score": user_background.gmat_total,
            "target_countries": user_background.target_countries,
            "target_majors": user_background.target_majors,
            "target_degree": user_background.target_degree_type,
            "research_experiences": user_background.research_experiences,
            "internship_experiences": user_background.internship_experiences,
            "other_experiences": user_background.other_experiences
        }
        
        prompt = f"""你是一位顶级的留学申请策略规划专家。你的任务是根据用户提供的背景资料，给出一个客观、精炼的综合竞争力评估，并明确指出其核心优势和主要短板。

请为以下申请者进行竞争力评估。他/她计划申请{user_background.target_majors}专业的{user_background.target_degree_type}学位，目标国家/地区：{', '.join(user_background.target_countries)}。

用户资料：
```json
{json.dumps(user_data, ensure_ascii=False, indent=2)}
```

请输出JSON格式：
{{
  "strengths": "[核心优势分析，具体分析用户在学术背景、实践经历、语言能力等方面的突出表现]",
  "weaknesses": "[主要短板分析，客观指出用户需要改进的方面，如GPA偏低、缺乏相关实习经历等]",
  "summary": "[一段总结性文字，综合评价用户的整体竞争力水平，并给出申请成功概率的大致判断]"
}}"""

        response_text = self._call_gemini_api(prompt)
        if not response_text:
            # 如果API调用失败，抛出异常以便被上层捕获
            raise Exception("Gemini API call failed")
        
        result_json = self._extract_json_from_response(response_text)
        if not result_json:
            raise Exception("Failed to parse JSON response from Gemini API")
        
        try:
            return CompetitivenessAnalysis(
                strengths=result_json.get("strengths", ""),
                weaknesses=result_json.get("weaknesses", ""),
                summary=result_json.get("summary", "")
            )
        except Exception as e:
            logger.error(f"Error creating CompetitivenessAnalysis: {str(e)}")
            raise Exception(f"Failed to create CompetitivenessAnalysis: {str(e)}")
    
    def generate_school_recommendations(self, user_background: UserBackground, 
                                      similar_cases: List[Dict]) -> Optional[SchoolRecommendations]:
        """Generate school recommendations based on similar cases using Gemini API"""
        
        # Prepare similar cases data - 减少数据量以提高API响应速度
        cases_data = []
        for case in similar_cases[:20]:  # 减少到10个最相似案例
            case_info = case.get('case_data', {})
            cases_data.append({
                "case_id": str(case_info.get('id', '')),
                "admitted_university": case_info.get('admitted_university', ''),
                "admitted_program": case_info.get('admitted_program', ''),
                "gpa_4_scale": case_info.get('gpa_4_scale', 0),
                "undergraduate_university_tier": case_info.get('undergraduate_university_tier', ''),
                "language_score": case_info.get('language_total_score', 0),
                "similarity_score": case.get('similarity_score', 0)
            })
        
        user_data = {
            "gpa": user_background.gpa,
            "university": user_background.undergraduate_university,
            "major": user_background.undergraduate_major,
            "target_majors": user_background.target_majors,
            "target_degree": user_background.target_degree_type,
            "language_score": user_background.language_total_score,
            "gre_score": user_background.gre_total
        }
        
        prompt = f"""基于用户背景和相似案例，推荐10-12个学校项目。

用户：GPA {user_background.gpa}，{user_background.undergraduate_university} {user_background.undergraduate_major}，目标{'/'.join(user_background.target_majors)}

相似案例：
{json.dumps(cases_data, ensure_ascii=False)}

要求：
1. 推荐必须来自相似案例的录取结果
2. 每个理由100-200字，包含GPA对比和案例支撑
3. 输出JSON格式

{{
  "recommendations": [
    {{
      "university": "学校名",
      "program": "项目名", 
      "reason": "基于你GPA{user_background.gpa}和{user_background.undergraduate_university}背景，参考案例ID_X（GPA X.X，录取该项目），你们背景相似，有录取机会。",
      "supporting_cases": [{{"case_id": "案例ID", "similarity_score": 0.85, "key_similarities": "GPA和院校背景相似"}}]
    }}
  ],
  "analysis_summary": "基于10个相似案例分析总结"
}}"""

        # 使用标准超时和重试配置
        response_text = self._call_gemini_api(prompt)
        
        # 如果复杂推荐失败，尝试简化版本
        if not response_text:
            logger.warning("Complex recommendation failed, trying simplified version...")
            simplified_prompt = f"""基于相似案例推荐8个学校项目：
用户：GPA {user_background.gpa}，{user_background.undergraduate_university}
案例：{json.dumps(cases_data[:5], ensure_ascii=False)}
输出JSON：{{"recommendations":[{{"university":"学校","program":"项目","reason":"简短理由","supporting_cases":[{{"case_id":"1","similarity_score":0.8,"key_similarities":"相似点"}}]}}],"analysis_summary":"总结"}}"""
            
            response_text = self._call_gemini_api(simplified_prompt)
            if not response_text:
                raise Exception("Both complex and simplified school recommendations failed")
        
        result_json = self._extract_json_from_response(response_text)
        if not result_json:
            raise Exception("Failed to parse JSON response from Gemini API")
        
        try:
            recommendations = []
            for rec_data in result_json.get("recommendations", []):
                supporting_cases = []
                for case_data in rec_data.get("supporting_cases", []):
                    supporting_cases.append(SupportingCase(
                        case_id=str(case_data.get("case_id", "")),
                        similarity_score=float(case_data.get("similarity_score", 0)),
                        key_similarities=str(case_data.get("key_similarities", ""))
                    ))
                
                recommendations.append(SchoolRecommendation(
                    university=rec_data.get("university", ""),
                    program=rec_data.get("program", ""),
                    reason=rec_data.get("reason", ""),
                    supporting_cases=supporting_cases
                ))
            
            return SchoolRecommendations(
                recommendations=recommendations,
                analysis_summary=result_json.get("analysis_summary", "")
            )
        except Exception as e:
            logger.error(f"Error creating SchoolRecommendations: {str(e)}")
            raise Exception(f"Failed to create SchoolRecommendations: {str(e)}")
    
    def analyze_single_case(self, user_background: UserBackground, 
                           case_data: Dict) -> Optional[CaseAnalysis]:
        """Analyze a single similar case using Gemini API"""
        
        user_data = {
            "gpa": user_background.gpa,
            "gpa_scale": user_background.gpa_scale,
            "university": user_background.undergraduate_university,
            "major": user_background.undergraduate_major,
            "language_test": user_background.language_test_type,
            "language_score": user_background.language_total_score,
            "gre_score": user_background.gre_total,
            "research_experiences": user_background.research_experiences,
            "internship_experiences": user_background.internship_experiences
        }
        
        case_info = {
            "admitted_university": case_data.get('admitted_university', ''),
            "admitted_program": case_data.get('admitted_program', ''),
            "gpa_4_scale": case_data.get('gpa_4_scale', 0),
            "undergraduate_university": case_data.get('undergraduate_university', ''),
            "undergraduate_major": case_data.get('undergraduate_major', ''),
            "language_score": case_data.get('language_total_score', 0),
            "language_test_type": case_data.get('language_test_type', ''),
            "experience_text": case_data.get('experience_text', ''),
            "background_summary": case_data.get('background_summary', '')
        }
        
        prompt = f"""你是一位数据分析师，擅长对比申请者背景。请详细对比用户与以下成功案例的异同点，并深入分析该案例成功的关键因素，为用户提供可借鉴的经验。

用户资料：
```json
{json.dumps(user_data, ensure_ascii=False, indent=2)}
```

成功案例：
```json
{json.dumps(case_info, ensure_ascii=False, indent=2)}
```

请输出JSON格式，必须包含以下字段：
{{
  "language_test_type": "从案例数据中提取语言考试类型，如TOEFL或IELTS，如果没有则为null",
  "key_experiences": "对案例中的科研、实习等经历进行总结，形成一段摘要文字，例如：xx公司xx岗位实习，参与xx深度学习项目等",
  "comparison": {{
    "gpa": "用户GPA为X，案例为Y，[分析]",
    "university": "用户本科为X，案例为Y，[分析]",
    "experience": "双方在科研/实习上的异同点是...[分析]"
  }},
  "success_factors": "该案例成功的关键在于...",
  "takeaways": "用户可以从中学习到..."
}}"""

        response_text = self._call_gemini_api(prompt)
        if not response_text:
            return None
        
        result_json = self._extract_json_from_response(response_text)
        if not result_json:
            return None
        
        try:
            comparison_data = result_json.get("comparison", {})
            return CaseAnalysis(
                case_id=case_data.get('id', 0),
                admitted_university=case_data.get('admitted_university', ''),
                admitted_program=case_data.get('admitted_program', ''),
                gpa=str(case_data.get('gpa_4_scale', 0)),
                language_score=str(case_data.get('language_total_score', 0)),
                language_test_type=result_json.get("language_test_type"),
                key_experiences=result_json.get("key_experiences"),
                undergraduate_info=f"{case_data.get('undergraduate_university', '')} {case_data.get('undergraduate_major', '')}",
                comparison={
                    "gpa": comparison_data.get("gpa", ""),
                    "university": comparison_data.get("university", ""),
                    "experience": comparison_data.get("experience", "")
                },
                success_factors=result_json.get("success_factors", ""),
                takeaways=result_json.get("takeaways", "")
            )
        except Exception as e:
            logger.error(f"Error creating CaseAnalysis: {str(e)}")
            return None
    
    def generate_background_improvement(self, user_background: UserBackground, 
                                      weaknesses: str) -> Optional[BackgroundImprovement]:
        """Generate background improvement suggestions using Gemini API"""
        
        user_data = {
            "gpa": user_background.gpa,
            "gpa_scale": user_background.gpa_scale,
            "university": user_background.undergraduate_university,
            "major": user_background.undergraduate_major,
            "target_countries": user_background.target_countries,
            "target_majors": user_background.target_majors,
            "target_degree": user_background.target_degree_type,
            "current_experiences": {
                "research": user_background.research_experiences,
                "internship": user_background.internship_experiences,
                "other": user_background.other_experiences
            }
        }
        
        prompt = f"""你是一位经验丰富的留学申请导师。基于用户的完整背景和目标，请为其量身定制一套在未来6-12个月内具体、可行的背景提升行动计划。

用户资料：
```json
{json.dumps(user_data, ensure_ascii=False, indent=2)}
```

已识别的短板：
{weaknesses}

目标专业：{', '.join(user_background.target_majors)}

请输出JSON格式：
{{
  "action_plan": [
    {{"timeframe": "未来1-3个月", "action": "建议1...", "goal": "目标1..."}},
    {{"timeframe": "未来4-6个月", "action": "建议2...", "goal": "目标2..."}},
    {{"timeframe": "未来7-12个月", "action": "建议3...", "goal": "目标3..."}}
  ],
  "strategy_summary": "总体申请策略建议..."
}}"""

        response_text = self._call_gemini_api(prompt)
        if not response_text:
            return None
        
        result_json = self._extract_json_from_response(response_text)
        if not result_json:
            return None
        
        try:
            return BackgroundImprovement(
                action_plan=result_json.get("action_plan", []),
                strategy_summary=result_json.get("strategy_summary", "")
            )
        except Exception as e:
            logger.error(f"Error creating BackgroundImprovement: {str(e)}")
            return None
    
    def evaluate_research_experience(self, research_text: str) -> int:
        """
        评估科研背景质量，返回0-100的分数
        """
        if not research_text or not research_text.strip():
            return 30
        
        prompt = f"""
请根据以下科研经历描述，评估其质量并给出0-100的分数。

评估标准：
1. 科研深度和复杂性 (30%)
2. 研究成果和产出 (25%)
3. 项目知名度和影响力 (20%)
4. 个人贡献和角色 (15%)
5. 技能和方法掌握 (10%)

科研经历描述：
{research_text}

请直接返回一个0-100之间的整数分数，不需要其他解释。
如果描述很简单或缺乏具体内容，给予较低分数（30-50分）。
如果有具体的研究成果、发表论文、获奖等，给予较高分数（70-90分）。
如果是顶级期刊发表、重要奖项等，可以给予90-100分。
"""
        
        try:
            response_text = self._call_gemini_api(prompt)
            if not response_text:
                return 50
            
            # 提取数字分数
            import re
            numbers = re.findall(r'\d+', response_text)
            if numbers:
                score = int(numbers[0])
                return max(30, min(100, score))  # 确保分数在30-100范围内
            else:
                return 50
                
        except Exception as e:
            logger.error(f"评估科研背景失败: {str(e)}")
            return 50
    
    def evaluate_internship_experience(self, internship_text: str) -> int:
        """
        评估实习背景质量，返回0-100的分数
        """
        if not internship_text or not internship_text.strip():
            return 30
        
        prompt = f"""
请根据以下实习经历描述，评估其质量并给出0-100的分数。

评估标准：
1. 公司/机构知名度和声誉 (30%)
2. 实习岗位的专业性和相关性 (25%)
3. 工作内容的深度和复杂性 (20%)
4. 实习成果和贡献 (15%)
5. 技能提升和学习收获 (10%)

实习经历描述：
{internship_text}

请直接返回一个0-100之间的整数分数，不需要其他解释。
如果是知名大公司（如Google、Microsoft、腾讯、阿里等）的核心岗位，给予较高分数（80-95分）。
如果是中等知名度公司的专业岗位，给予中等分数（60-80分）。
如果是小公司或简单工作内容，给予较低分数（40-60分）。
如果描述很简单或缺乏具体内容，给予较低分数（30-50分）。
"""
        
        try:
            response_text = self._call_gemini_api(prompt)
            if not response_text:
                return 50
            
            # 提取数字分数
            import re
            numbers = re.findall(r'\d+', response_text)
            if numbers:
                score = int(numbers[0])
                return max(30, min(100, score))  # 确保分数在30-100范围内
            else:
                return 50
                
        except Exception as e:
            logger.error(f"评估实习背景失败: {str(e)}")
            return 50