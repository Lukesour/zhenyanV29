import axios from 'axios';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // 10分钟超时，因为AI分析需要时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    // 标准化错误信息（后端已统一为标准化错误对象）
    if (error.response) {
      const { data } = error.response;
      const code = data?.code as string | undefined;
      const message = (data?.message as string | undefined) || '请求失败，请稍后重试';
      const retryable = (data?.retryable as boolean | undefined) ?? undefined;
      error.errorResponse = data;
      error.userMessage = message;
      error.retryable = retryable;
      // 兜底：若后端不是标准对象，保持原逻辑
      if (!code && data?.detail && typeof data.detail === 'string') {
        error.userMessage = data.detail;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      error.userMessage = '网络连接失败，请检查网络设置';
    } else {
      // 其他错误
      error.userMessage = '分析失败，请稍后重试';
    }
    
    return Promise.reject(error);
  }
);

// 用户背景数据类型
export interface UserBackground {
  undergraduate_university: string;
  undergraduate_major: string;
  gpa: number;
  gpa_scale: string;
  graduation_year: number;
  language_test_type?: string;
  language_total_score?: number;
  language_reading?: number;
  language_listening?: number;
  language_speaking?: number;
  language_writing?: number;
  gre_total?: number;
  gre_verbal?: number;
  gre_quantitative?: number;
  gre_writing?: number;
  gmat_total?: number;
  target_countries: string[];
  target_majors: string[];
  target_degree_type: string;
  research_experiences?: Array<{
    name: string;
    role?: string;
    description: string;
  }>;
  internship_experiences?: Array<{
    company: string;
    position: string;
    description: string;
  }>;
  other_experiences?: Array<{
    name: string;
    description: string;
  }>;
}

// 分析报告数据类型
export interface CompetitivenessAnalysis {
  strengths: string;
  weaknesses: string;
  summary: string;
}

export interface SupportingCase {
  case_id: string;
  similarity_score: number;
  key_similarities: string;
}

export interface SchoolRecommendation {
  university: string;
  program: string;
  reason: string;
  supporting_cases: SupportingCase[];
}

export interface SchoolRecommendations {
  recommendations: SchoolRecommendation[];
  analysis_summary: string;
}

export interface CaseComparison {
  gpa: string;
  university: string;
  experience: string;
}

export interface CaseAnalysis {
  case_id: number;
  admitted_university: string;
  admitted_program: string;
  gpa: string;
  language_score: string;
  language_test_type?: string; // 语言考试类型 (TOEFL/IELTS)
  key_experiences?: string; // 主要经历摘要
  undergraduate_info: string;
  comparison: CaseComparison;
  success_factors: string;
  takeaways: string;
}

export interface ActionPlan {
  timeframe: string;
  action: string;
  goal: string;
}

export interface BackgroundImprovement {
  action_plan: ActionPlan[];
  strategy_summary: string;
}

export interface AnalysisReport {
  competitiveness: CompetitivenessAnalysis;
  school_recommendations: SchoolRecommendations;
  similar_cases: CaseAnalysis[];
  background_improvement: BackgroundImprovement | null;
  radar_scores: number[]; // 雷达图五项能力得分: [学术能力, 语言能力, 科研背景, 实习背景, 院校背景]
  degraded?: boolean;
  partial_failures?: Record<string, string>;
}

// 标准化错误对象
export interface ErrorResponse {
  code: string;
  httpStatus: number;
  message: string;
  reason?: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

// 任务状态类型
export interface AnalysisTask {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  progress?: number;
  result?: AnalysisReport;
  error?: string;
}

// 进度事件接口已在任务 2.1 中删除

// WebSocket 服务已在任务 2.1 中删除

// API方法
export const apiService = {
  // 健康检查
  async healthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // 启动异步分析任务
  async startAnalysisTask(userBackground: UserBackground): Promise<AnalysisTask> {
    const response = await apiClient.post('/api/analyze', userBackground);
    return response.data as AnalysisTask;
  },

  // 查询分析任务状态
  async getAnalysisStatus(taskId: string): Promise<AnalysisTask> {
    const response = await apiClient.get(`/api/analysis-status/${taskId}`);
    return response.data as AnalysisTask;
  },

  // 这些端点已在任务 1.2 中删除

  // 分析用户背景（保持向后兼容，但建议使用异步版本）
  async analyzeUserBackground(userBackground: UserBackground): Promise<AnalysisReport> {
    const response = await apiClient.post('/api/analyze', userBackground);
    return response.data as AnalysisReport;
  },

  // 这些端点已在任务 1.2 中删除
};

export default apiService;