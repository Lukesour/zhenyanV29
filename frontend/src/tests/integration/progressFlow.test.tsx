import React from 'react';
import { renderWithProviders } from './utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';

// Mock API，避免真实请求
jest.mock('../../services/api', () => ({
  apiService: {
    analyzeUserBackground: jest.fn()
  }
}));

// 轻量化集成：避免引入复杂依赖（canvas/jsPDF/Chart.js），仅验证流程与状态集成
jest.mock('../../components/UserForm', () => {
  return function MockUserForm({ onSubmit, loading }: any) {
    return (
      <div data-testid="user-form">
        <button onClick={() => onSubmit({ name: 'User' })} disabled={loading}>
          完成并开始分析
        </button>
      </div>
    );
  };
});

jest.mock('../../components/ProgressDisplay', () => {
  return function MockProgressDisplay({ isActive, onComplete, onError }: any) {
    return (
      <div data-testid="progress-display">
        {isActive && <div data-testid="progress-active">AI 分析进行中</div>}
        <button onClick={() => onComplete()} data-testid="complete-button">完成</button>
        <button onClick={() => onError('出错了')} data-testid="error-button">出错</button>
      </div>
    );
  };
});

jest.mock('../../components/AnalysisReport', () => {
  return function MockAnalysisReport({ onBack }: any) {
    return (
      <div data-testid="analysis-report">
        <button onClick={onBack} data-testid="back-button">返回</button>
      </div>
    );
  };
});

jest.mock('../../components/ErrorDisplay', () => {
  return function MockErrorDisplay({ error, onRetry }: any) {
    return (
      <div data-testid="error-display">
        <div data-testid="error-message">{error}</div>
        <button onClick={onRetry} data-testid="retry-button">重试</button>
      </div>
    );
  };
});

describe('Integration: Progress Flow (Task 7.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('form -> progress -> report', async () => {
    const mockApi = require('../../services/api').apiService;
    mockApi.analyzeUserBackground.mockResolvedValue({ result: 'success' });

    renderWithProviders(<App />);
    fireEvent.click(screen.getByText('完成并开始分析'));

    await waitFor(() => {
      expect(screen.getByTestId('progress-display')).toBeInTheDocument();
      expect(screen.getByTestId('progress-active')).toBeInTheDocument();
    });

    // 触发完成
    fireEvent.click(screen.getByTestId('complete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('analysis-report')).toBeInTheDocument();
    });
  });

  test('API error -> error display -> retry back to form', async () => {
    const mockApi = require('../../services/api').apiService;
    mockApi.analyzeUserBackground.mockRejectedValue({ userMessage: '服务暂不可用' });

    renderWithProviders(<App />);
    fireEvent.click(screen.getByText('完成并开始分析'));

    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('服务暂不可用');
    });

    fireEvent.click(screen.getByTestId('retry-button'));

    await waitFor(() => {
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });
  });
});


