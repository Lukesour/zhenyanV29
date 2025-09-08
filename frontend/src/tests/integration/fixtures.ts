import type { UserBackground, AnalysisReport } from '../../services/api';

export const sampleUser: UserBackground = {
  undergraduate_university: '清华大学',
  undergraduate_major: '计算机科学与技术',
  gpa: 3.8,
  gpa_scale: '4.0',
  graduation_year: new Date().getFullYear(),
  target_countries: ['美国'],
  target_majors: ['计算机'],
  target_degree_type: 'Master'
};

export const sampleReport: AnalysisReport = {
  competitiveness: { strengths: '强', weaknesses: '弱', summary: '总结' },
  school_recommendations: {
    recommendations: [
      {
        university: 'MIT',
        program: 'CS',
        reason: '示例',
        supporting_cases: [{ case_id: '1', similarity_score: 0.9, key_similarities: '相似' }]
      }
    ],
    analysis_summary: '汇总'
  },
  similar_cases: [
    {
      case_id: 1,
      admitted_university: 'MIT',
      admitted_program: 'CS',
      gpa: '4.0',
      language_score: '110',
      undergraduate_info: '清华 CS',
      comparison: { gpa: '对比', university: '对比', experience: '对比' },
      success_factors: '因素',
      takeaways: '收获'
    }
  ],
  background_improvement: { action_plan: [], strategy_summary: '' },
  radar_scores: [90, 90, 80, 70, 95]
};






