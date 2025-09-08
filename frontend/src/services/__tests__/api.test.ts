import { apiService } from '../api';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  isAxiosError: jest.fn()
}));

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startAnalysis', () => {
    it('should start analysis task successfully', async () => {
      const mockResponse = {
        data: {
          task_id: 'test-task-123',
          status: 'pending',
          message: '分析任务已启动',
          estimated_time: '预计需要5-10分钟'
        }
      };

      const axiosInstance = require('axios').create();
      axiosInstance.post.mockResolvedValue(mockResponse);

      const userBackground = {
        undergraduate_university: '清华大学',
        undergraduate_major: '计算机科学',
        gpa: 3.8,
        gpa_scale: '4.0',
        graduation_year: 2024,
        target_countries: ['美国'],
        target_majors: ['计算机科学'],
        target_degree_type: 'Master'
      };

      const result = await apiService.startAnalysis(userBackground);

      expect(result).toEqual(mockResponse.data);
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/analyze', userBackground);
    });

    it('should handle analysis start failure', async () => {
      const axiosInstance = require('axios').create();
      axiosInstance.post.mockRejectedValue(new Error('Network error'));

      const userBackground = {
        undergraduate_university: '清华大学',
        undergraduate_major: '计算机科学',
        gpa: 3.8,
        gpa_scale: '4.0',
        graduation_year: 2024,
        target_countries: ['美国'],
        target_majors: ['计算机科学'],
        target_degree_type: 'Master'
      };

      await expect(apiService.startAnalysis(userBackground)).rejects.toThrow('Network error');
    });
  });

  describe('getAnalysisStatus', () => {
    it('should get analysis status successfully', async () => {
      const mockResponse = {
        data: {
          task_id: 'test-task-123',
          status: 'processing',
          progress: 50,
          message: '分析进行中'
        }
      };

      const axiosInstance = require('axios').create();
      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getAnalysisStatus('test-task-123');

      expect(result).toEqual(mockResponse.data);
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/analyze/test-task-123');
    });
  });

  describe('cancelAnalysis', () => {
    it('should cancel analysis task successfully', async () => {
      const mockResponse = {
        data: {
          message: '任务已取消'
        }
      };

      const axiosInstance = require('axios').create();
      axiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await apiService.cancelAnalysis('test-task-123');

      expect(result).toEqual(mockResponse.data);
      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/analyze/test-task-123');
    });
  });

  describe('pollAnalysisUntilComplete', () => {
    it('should poll until analysis completes successfully', async () => {
      const mockTask = {
        task_id: 'test-task-123',
        status: 'completed',
        result: { analysis: 'complete' }
      };

      const axiosInstance = require('axios').create();
      axiosInstance.get.mockResolvedValue({ data: mockTask });

      const onProgress = jest.fn();
      const result = await apiService.pollAnalysisUntilComplete(
        'test-task-123',
        onProgress,
        1000, // 1 second poll interval
        5000  // 5 second max time
      );

      expect(result).toEqual(mockTask.result);
      expect(onProgress).toHaveBeenCalledWith(mockTask);
    });

    it('should handle analysis failure during polling', async () => {
      const mockTask = {
        task_id: 'test-task-123',
        status: 'failed',
        error: 'Analysis failed'
      };

      const axiosInstance = require('axios').create();
      axiosInstance.get.mockResolvedValue({ data: mockTask });

      await expect(apiService.pollAnalysisUntilComplete(
        'test-task-123',
        undefined,
        1000,
        5000
      )).rejects.toThrow('Analysis failed');
    });

    it('should handle task cancellation during polling', async () => {
      const mockTask = {
        task_id: 'test-task-123',
        status: 'cancelled'
      };

      const axiosInstance = require('axios').create();
      axiosInstance.get.mockResolvedValue({ data: mockTask });

      await expect(apiService.pollAnalysisUntilComplete(
        'test-task-123',
        undefined,
        1000,
        5000
      )).rejects.toThrow('分析任务已取消');
    });

    it('should timeout if analysis takes too long', async () => {
      const axiosInstance = require('axios').create();
      axiosInstance.get.mockResolvedValue({
        data: {
          task_id: 'test-task-123',
          status: 'processing',
          progress: 30
        }
      });

      await expect(apiService.pollAnalysisUntilComplete(
        'test-task-123',
        undefined,
        1000,
        1000 // 1 second max time
      )).rejects.toThrow('分析任务超时，请稍后重试');
    });
  });

  describe('healthCheck', () => {
    it('should perform health check successfully', async () => {
      const mockResponse = {
        data: {
          status: 'healthy',
          timestamp: '2024-01-01T00:00:00Z'
        }
      };

      const axiosInstance = require('axios').create();
      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.healthCheck();

      expect(result).toEqual(mockResponse.data);
      expect(axiosInstance.get).toHaveBeenCalledWith('/health');
    });
  });
});

















