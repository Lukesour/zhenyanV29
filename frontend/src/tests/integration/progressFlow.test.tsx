import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock the API service
const mockApi = {
  healthCheck: jest.fn(),
  startAnalysis: jest.fn(),
  getAnalysisStatus: jest.fn(),
  cancelAnalysis: jest.fn(),
  pollAnalysisUntilComplete: jest.fn()
};

// Mock the entire api module
jest.mock('../../services/api', () => ({
  apiService: mockApi
}));

// Mock the ProgressDisplay component
jest.mock('../../components/ProgressDisplay', () => {
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
jest.mock('../../components/AnalysisReport', () => {
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
jest.mock('../../components/ErrorDisplay', () => {
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

describe('Progress Flow Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful health check
    mockApi.healthCheck.mockResolvedValue({ status: 'healthy' });
  });

  test('shows progress display when analysis starts', async () => {
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
    
    // Simulate verification success
    const verifyButton = screen.getByText(/确认信息/);
    fireEvent.click(verifyButton);
    
    // Should show progress display
    await waitFor(() => {
      expect(screen.getByTestId('progress-display')).toBeInTheDocument();
    });
    
    // Verify progress display content
    expect(screen.getByText('Analysis in progress...')).toBeInTheDocument();
  });

  test('handles progress completion and shows report', async () => {
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
    
    // Simulate progress completion
    const completeButton = screen.getByText('Complete Analysis');
    fireEvent.click(completeButton);
    
    // Should show analysis report
    await waitFor(() => {
      expect(screen.getByTestId('analysis-report')).toBeInTheDocument();
    });
  });

  test('handles analysis failure during progress', async () => {
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
    mockApi.pollAnalysisUntilComplete.mockRejectedValue({ userMessage: '服务暂不可用' });
    
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
    
    // Verify error message
    expect(screen.getByText('服务暂不可用')).toBeInTheDocument();
  });
});


