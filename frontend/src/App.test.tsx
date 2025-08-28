import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the API service
jest.mock('./services/api', () => ({
  apiService: {
    analyzeUserBackground: jest.fn()
  }
}));

// Mock the components
jest.mock('./components/UserForm', () => {
  return function MockUserForm({ onSubmit, loading }: any) {
    return (
      <div data-testid="user-form">
        <button 
          onClick={() => onSubmit({ name: 'Test User' })} 
          disabled={loading}
          data-testid="submit-button"
        >
          Submit
        </button>
        {loading && <div data-testid="loading">Loading...</div>}
      </div>
    );
  };
});

jest.mock('./components/ProgressDisplay', () => {
  return function MockProgressDisplay({ isActive, onComplete, onError }: any) {
    return (
      <div data-testid="progress-display">
        {isActive && <div data-testid="progress-active">Progress Active</div>}
        <button onClick={() => onComplete()} data-testid="complete-button">Complete</button>
        <button onClick={() => onError('Test Error')} data-testid="error-button">Error</button>
      </div>
    );
  };
});

jest.mock('./components/AnalysisReport', () => {
  return function MockAnalysisReport({ report, onBack }: any) {
    return (
      <div data-testid="analysis-report">
        <div data-testid="report-content">{JSON.stringify(report)}</div>
        <button onClick={onBack} data-testid="back-button">Back</button>
      </div>
    );
  };
});

jest.mock('./components/ErrorDisplay', () => {
  return function MockErrorDisplay({ error, onRetry, onBack }: any) {
    return (
      <div data-testid="error-display">
        <div data-testid="error-message">{error}</div>
        <button onClick={onRetry} data-testid="retry-button">Retry</button>
        <button onClick={onBack} data-testid="back-button">Back</button>
      </div>
    );
  };
});

describe('App State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('初始状态应该是form', () => {
    render(<App />);
    expect(screen.getByTestId('user-form')).toBeInTheDocument();
  });

  test('表单提交后应该转换到progress状态', async () => {
    const mockApi = require('./services/api').apiService;
    mockApi.analyzeUserBackground.mockResolvedValue({ result: 'success' });

    render(<App />);
    
    // 提交表单
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // 应该显示进度界面
    await waitFor(() => {
      expect(screen.getByTestId('progress-display')).toBeInTheDocument();
    });
  });

  test('分析完成后应该转换到report状态', async () => {
    const mockApi = require('./services/api').apiService;
    const mockReport = { result: 'success', data: 'test data' };
    mockApi.analyzeUserBackground.mockResolvedValue(mockReport);

    render(<App />);
    
    // 提交表单
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // 等待分析完成
    await waitFor(() => {
      expect(screen.getByTestId('analysis-report')).toBeInTheDocument();
    });
    
    // 验证报告内容
    expect(screen.getByTestId('report-content')).toHaveTextContent(JSON.stringify(mockReport));
  });

  test('分析失败后应该转换到error状态', async () => {
    const mockApi = require('./services/api').apiService;
    mockApi.analyzeUserBackground.mockRejectedValue({ userMessage: 'Test error message' });

    render(<App />);
    
    // 提交表单
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // 等待错误状态
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
    
    // 验证错误消息
    expect(screen.getByTestId('error-message')).toHaveTextContent('Test error message');
  });

  test('从错误状态可以返回到表单状态', async () => {
    const mockApi = require('./services/api').apiService;
    mockApi.analyzeUserBackground.mockRejectedValue({ userMessage: 'Test error message' });

    render(<App />);
    
    // 提交表单触发错误
    fireEvent.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
    
    // 点击重试按钮
    fireEvent.click(screen.getByTestId('retry-button'));
    
    // 应该返回到表单状态
    await waitFor(() => {
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });
  });

  test('从报告状态可以返回到表单状态', async () => {
    const mockApi = require('./services/api').apiService;
    mockApi.analyzeUserBackground.mockResolvedValue({ result: 'success' });

    render(<App />);
    
    // 提交表单
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // 等待分析完成
    await waitFor(() => {
      expect(screen.getByTestId('analysis-report')).toBeInTheDocument();
    });
    
    // 点击返回按钮
    fireEvent.click(screen.getByTestId('back-button'));
    
    // 应该返回到表单状态
    await waitFor(() => {
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });
  });

  test('loading状态应该正确传递', async () => {
    const mockApi = require('./services/api').apiService;
    // 模拟延迟响应
    mockApi.analyzeUserBackground.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ result: 'success' }), 100))
    );

    render(<App />);
    
    // 提交表单
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // 等待转换到progress状态
    await waitFor(() => {
      expect(screen.getByTestId('progress-display')).toBeInTheDocument();
    });
    
    // 等待完成
    await waitFor(() => {
      expect(screen.getByTestId('analysis-report')).toBeInTheDocument();
    });
  });
});
