import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the API service
const mockApi = {
  healthCheck: jest.fn(),
  startAnalysis: jest.fn(),
  getAnalysisStatus: jest.fn(),
  cancelAnalysis: jest.fn(),
  pollAnalysisUntilComplete: jest.fn()
};

// Mock the entire api module
jest.mock('./services/api', () => ({
  apiService: mockApi
}));

// Mock the ProgressDisplay component
jest.mock('./components/ProgressDisplay', () => {
  return function MockProgressDisplay({ isActive, onComplete }: any) {
    return (
      <div data-testid="progress-display">
        {isActive ? 'Analysis in progress...' : 'Progress display'}
        <button onClick={onComplete}>Complete Analysis</button>
      </div>
    );
  };
});

// Mock the AnalysisReport component
jest.mock('./components/AnalysisReport', () => {
  return function MockAnalysisReport({ report, onBackToForm }: any) {
    return (
      <div data-testid="analysis-report">
        <h2>Analysis Report</h2>
        <p>Report data: {JSON.stringify(report)}</p>
        <button onClick={onBackToForm}>Back to Form</button>
      </div>
    );
  };
});

// Mock the ErrorDisplay component
jest.mock('./components/ErrorDisplay', () => {
  return function MockErrorDisplay({ errorMessage, onRetry, onBackToForm }: any) {
    return (
      <div data-testid="error-display">
        <h2>Error</h2>
        <p>{errorMessage}</p>
        <button onClick={onRetry}>Retry</button>
        <button onClick={onBackToForm}>Back to Form</button>
      </div>
    );
  };
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful health check
    mockApi.healthCheck.mockResolvedValue({ status: 'healthy' });
  });

  test('renders user form initially', () => {
    render(<App />);
    expect(screen.getByText(/留学定位与选校规划系统/)).toBeInTheDocument();
  });

  test('shows loading state when form is submitted', async () => {
    render(<App />);
    
    // Fill out the form
    const universityInput = screen.getByLabelText(/本科院校/);
    const majorInput = screen.getByLabelText(/本科专业/);
    const gpaInput = screen.getByLabelText(/GPA/);
    const submitButton = screen.getByText(/开始分析/);
    
    fireEvent.change(universityInput, { target: { value: '清华大学' } });
    fireEvent.change(majorInput, { target: { value: '计算机科学' } });
    fireEvent.change(gpaInput, { target: { value: '3.8' } });
    
    // Mock successful analysis task start
    mockApi.startAnalysis.mockResolvedValue({ 
      task_id: 'test-task-123',
      status: 'pending',
      message: '分析任务已启动'
    });
    
    // Mock successful analysis completion
    mockApi.pollAnalysisUntilComplete.mockResolvedValue({ result: 'success' });
    
    fireEvent.click(submitButton);
    
    // Should show verification form
    await waitFor(() => {
      expect(screen.getByText(/验证信息/)).toBeInTheDocument();
    });
  });

  test('handles verification success and shows progress', async () => {
    render(<App />);
    
    // Fill out the form
    const universityInput = screen.getByLabelText(/本科院校/);
    const majorInput = screen.getByLabelText(/本科专业/);
    const gpaInput = screen.getByLabelText(/GPA/);
    const submitButton = screen.getByText(/开始分析/);
    
    fireEvent.change(universityInput, { target: { value: '清华大学' } });
    fireEvent.change(majorInput, { target: { value: '计算机科学' } });
    fireEvent.change(gpaInput, { target: { value: '3.8' } });
    
    // Mock successful analysis task start
    mockApi.startAnalysis.mockResolvedValue({ 
      task_id: 'test-task-123',
      status: 'pending',
      message: '分析任务已启动'
    });
    
    // Mock successful analysis completion
    const mockReport = { 
      competitiveness: { strengths: 'Strong', weaknesses: 'None' },
      school_recommendations: { recommendations: [] },
      similar_cases: [],
      background_improvement: null,
      radar_scores: [80, 85, 90, 75, 88]
    };
    mockApi.pollAnalysisUntilComplete.mockResolvedValue(mockReport);
    
    fireEvent.click(submitButton);
    
    // Should show verification form
    await waitFor(() => {
      expect(screen.getByText(/验证信息/)).toBeInTheDocument();
    });
    
    // Simulate verification success
    const verifyButton = screen.getByText(/确认信息/);
    fireEvent.click(verifyButton);
    
    // Should show progress display
    await waitFor(() => {
      expect(screen.getByTestId('progress-display')).toBeInTheDocument();
    });
  });

  test('handles analysis failure and shows error', async () => {
    render(<App />);
    
    // Fill out the form
    const universityInput = screen.getByLabelText(/本科院校/);
    const majorInput = screen.getByLabelText(/本科专业/);
    const gpaInput = screen.getByLabelText(/GPA/);
    const submitButton = screen.getByText(/开始分析/);
    
    fireEvent.change(universityInput, { target: { value: '清华大学' } });
    fireEvent.change(majorInput, { target: { value: '计算机科学' } });
    fireEvent.change(gpaInput, { target: { value: '3.8' } });
    
    // Mock successful analysis task start
    mockApi.startAnalysis.mockResolvedValue({ 
      task_id: 'test-task-123',
      status: 'pending',
      message: '分析任务已启动'
    });
    
    // Mock analysis failure
    mockApi.pollAnalysisUntilComplete.mockRejectedValue({ userMessage: 'Test error message' });
    
    fireEvent.click(submitButton);
    
    // Should show verification form
    await waitFor(() => {
      expect(screen.getByText(/验证信息/)).toBeInTheDocument();
    });
    
    // Simulate verification success
    const verifyButton = screen.getByText(/确认信息/);
    fireEvent.click(verifyButton);
    
    // Should show error display
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
  });

  test('allows user to go back to form from verification', async () => {
    render(<App />);
    
    // Fill out the form
    const universityInput = screen.getByLabelText(/本科院校/);
    const majorInput = screen.getByLabelText(/本科专业/);
    const gpaInput = screen.getByLabelText(/GPA/);
    const submitButton = screen.getByText(/开始分析/);
    
    fireEvent.change(universityInput, { target: { value: '清华大学' } });
    fireEvent.change(majorInput, { target: { value: '计算机科学' } });
    fireEvent.change(gpaInput, { target: { value: '3.8' } });
    
    // Mock successful analysis task start
    mockApi.startAnalysis.mockResolvedValue({ 
      task_id: 'test-task-123',
      status: 'pending',
      message: '分析任务已启动'
    });
    
    // Mock successful analysis completion
    mockApi.pollAnalysisUntilComplete.mockResolvedValue({ result: 'success' });
    
    fireEvent.click(submitButton);
    
    // Should show verification form
    await waitFor(() => {
      expect(screen.getByText(/验证信息/)).toBeInTheDocument();
    });
    
    // Go back to form
    const backButton = screen.getByText(/返回修改/);
    fireEvent.click(backButton);
    
    // Should show form again
    expect(screen.getByText(/开始分析/)).toBeInTheDocument();
  });

  test('allows user to retry analysis from error state', async () => {
    render(<App />);
    
    // Fill out the form
    const universityInput = screen.getByLabelText(/本科院校/);
    const majorInput = screen.getByLabelText(/本科专业/);
    const gpaInput = screen.getByLabelText(/GPA/);
    const submitButton = screen.getByText(/开始分析/);
    
    fireEvent.change(universityInput, { target: { value: '清华大学' } });
    fireEvent.change(majorInput, { target: { value: '计算机科学' } });
    fireEvent.change(gpaInput, { target: { value: '3.8' } });
    
    // Mock successful analysis task start
    mockApi.startAnalysis.mockResolvedValue({ 
      task_id: 'test-task-123',
      status: 'pending',
      message: '分析任务已启动'
    });
    
    // Mock analysis failure first time
    mockApi.pollAnalysisUntilComplete.mockRejectedValueOnce({ userMessage: '服务暂不可用' });
    
    // Mock successful analysis completion second time
    mockApi.pollAnalysisUntilComplete.mockResolvedValueOnce({ result: 'success' });
    
    fireEvent.click(submitButton);
    
    // Should show verification form
    await waitFor(() => {
      expect(screen.getByText(/验证信息/)).toBeInTheDocument();
    });
    
    // Simulate verification success
    const verifyButton = screen.getByText(/确认信息/);
    fireEvent.click(verifyButton);
    
    // Should show error display
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
    
    // Retry analysis
    const retryButton = screen.getByText(/重试/);
    fireEvent.click(retryButton);
    
    // Should show progress display again
    await waitFor(() => {
      expect(screen.getByTestId('progress-display')).toBeInTheDocument();
    });
  });

  test('allows user to go back to form from error state', async () => {
    render(<App />);
    
    // Fill out the form
    const universityInput = screen.getByLabelText(/本科院校/);
    const majorInput = screen.getByLabelText(/本科专业/);
    const gpaInput = screen.getByLabelText(/GPA/);
    const submitButton = screen.getByText(/开始分析/);
    
    fireEvent.change(universityInput, { target: { value: '清华大学' } });
    fireEvent.change(majorInput, { target: { value: '计算机科学' } });
    fireEvent.change(gpaInput, { target: { value: '3.8' } });
    
    // Mock successful analysis task start
    mockApi.startAnalysis.mockResolvedValue({ 
      task_id: 'test-task-123',
      status: 'pending',
      message: '分析任务已启动'
    });
    
    // Mock analysis failure
    mockApi.pollAnalysisUntilComplete.mockRejectedValue({ userMessage: '网络错误' });
    
    fireEvent.click(submitButton);
    
    // Should show verification form
    await waitFor(() => {
      expect(screen.getByText(/验证信息/)).toBeInTheDocument();
    });
    
    // Simulate verification success
    const verifyButton = screen.getByText(/确认信息/);
    fireEvent.click(verifyButton);
    
    // Should show error display
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
    
    // Go back to form
    const backButton = screen.getByText(/返回表单/);
    fireEvent.click(backButton);
    
    // Should show form again
    expect(screen.getByText(/开始分析/)).toBeInTheDocument();
  });

  test('handles network errors gracefully', async () => {
    render(<App />);
    
    // Fill out the form
    const universityInput = screen.getByLabelText(/本科院校/);
    const majorInput = screen.getByLabelText(/本科专业/);
    const gpaInput = screen.getByLabelText(/GPA/);
    const submitButton = screen.getByText(/开始分析/);
    
    fireEvent.change(universityInput, { target: { value: '清华大学' } });
    fireEvent.change(majorInput, { target: { value: '计算机科学' } });
    fireEvent.change(gpaInput, { target: { value: '3.8' } });
    
    // Mock network error
    mockApi.startAnalysis.mockRejectedValue(new Error('Network error'));
    
    fireEvent.click(submitButton);
    
    // Should show error display
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
  });
});
