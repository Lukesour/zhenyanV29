import axios, { isAxiosError } from 'axios';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时，因为现在只是轮询状态
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

// 任务状态类型
export interface AnalysisTask {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
  estimated_time?: string;
  created_at?: string;
  completed_at?: string;
  result?: AnalysisReport;
  error?: string;
}

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

// API方法
export const apiService = {
  // 健康检查
  async healthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // 启动异步分析任务
  async startAnalysis(userBackground: UserBackground): Promise<AnalysisTask> {
    const response = await apiClient.post('/api/analyze', userBackground);
    return response.data as AnalysisTask;
  },

  // 查询分析任务状态
  async getAnalysisStatus(taskId: string): Promise<AnalysisTask> {
    const response = await apiClient.get(`/api/analyze/${taskId}`);
    return response.data as AnalysisTask;
  },

  // 取消分析任务
  async cancelAnalysis(taskId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/api/analyze/${taskId}`);
    return response.data as { message: string };
  },

  // 轮询分析任务直到完成
  async pollAnalysisUntilComplete(
    taskId: string, 
    onProgress?: (task: AnalysisTask) => void,
    pollInterval: number = 5000, // 5秒轮询一次
    maxPollTime: number = 600000 // 最大轮询10分钟
  ): Promise<AnalysisReport> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxPollTime) {
      try {
        const task = await this.getAnalysisStatus(taskId);
        
        // 调用进度回调
        if (onProgress) {
          onProgress(task);
        }
        
        // 检查任务状态
        if (task.status === 'completed' && task.result) {
          return task.result;
        } else if (task.status === 'failed') {
          throw new Error(task.error || '分析任务失败');
        } else if (task.status === 'cancelled') {
          throw new Error('分析任务已取消');
        }
        
        // 等待下次轮询
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        console.error('轮询分析任务状态时出错:', error);
        // 如果是网络错误，继续重试
        if (isAxiosError(error) && !error.response) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('分析任务超时，请稍后重试');
  }
};

export default apiService;