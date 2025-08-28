import React from 'react';
import { renderWithProviders } from './utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';

// Mock API 返回最小有效报告，验证数据完整性渲染
jest.mock('../../services/api', () => ({
  apiService: {
    analyzeUserBackground: jest.fn()
  }
}));

// 仍然 mock 与 JSDOM 不兼容的复杂组件，专注端到端状态与数据
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
        <button onClick={() => onError('网络错误')} data-testid="error-button">出错</button>
      </div>
    );
  };
});

jest.mock('../../components/ErrorDisplay', () => {
  return function MockErrorDisplay({ error, onRetry }: any) {
    return (
      <div data-testid="error-display">
        <div data-testid="error-message">{error}</div>
        <button onClick={onRetry} data-testid="retry-button">重新尝试</button>
      </div>
    );
  };
});

jest.mock('../../components/AnalysisReport', () => {
  return function MockAnalysisReport({ report, onBack }: any) {
    return (
      <div data-testid="analysis-report">
        <div data-testid="radar-scores">{(report?.radar_scores || []).join(',')}</div>
        <div data-testid="recommendations-count">{report?.school_recommendations?.recommendations?.length ?? 0}</div>
        <div data-testid="similar-cases-count">{report?.similar_cases?.length ?? 0}</div>
        <button onClick={onBack} data-testid="back-button">返回</button>
      </div>
    );
  };
});

describe('Integration: Complete Flow (Task 7.4)', () => {
  test('full flow: form -> progress -> report with data integrity', async () => {
    const mockApi = require('../../services/api').apiService;
    const mockReport = {
      competitiveness: { strengths: 'A', weaknesses: 'B', summary: 'C' },
      school_recommendations: {
        recommendations: [
          { university: 'X', program: 'Y', reason: 'Z', supporting_cases: [] }
        ],
        analysis_summary: 'S'
      },
      similar_cases: [
        {
          case_id: 1,
          admitted_university: 'U',
          admitted_program: 'P',
          gpa: '3.8',
          language_score: '100',
          undergraduate_info: 'Info',
          comparison: { gpa: 'cmp', university: 'cmp', experience: 'cmp' },
          success_factors: 'sf',
          takeaways: 'tw'
        }
      ],
      background_improvement: { action_plan: [], strategy_summary: '' },
      radar_scores: [80, 85, 70, 60, 90]
    };

    mockApi.analyzeUserBackground.mockResolvedValue(mockReport);

    renderWithProviders(<App />);

    // 提交进入进度
    fireEvent.click(screen.getByText('完成并开始分析'));

    // 等待报告渲染
    await waitFor(() => {
      expect(screen.getByTestId('analysis-report')).toBeInTheDocument();
    });

    // 数据完整性检查
    expect(screen.getByTestId('radar-scores')).toHaveTextContent('80,85,70,60,90');
    expect(Number(screen.getByTestId('recommendations-count').textContent)).toBe(1);
    expect(Number(screen.getByTestId('similar-cases-count').textContent)).toBe(1);

    // 返回表单
    fireEvent.click(screen.getByTestId('back-button'));
    await waitFor(() => {
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });
  });

  test('error path: shows error and can retry to form', async () => {
    const mockApi = require('../../services/api').apiService;
    mockApi.analyzeUserBackground.mockRejectedValue({ userMessage: '网络错误' });

    renderWithProviders(<App />);
    fireEvent.click(screen.getByText('完成并开始分析'));

    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    const retry = screen.getByTestId('retry-button');
    fireEvent.click(retry);

    await waitFor(() => {
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });
  });
});


