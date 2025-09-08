import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ProgressDisplay from '../ProgressDisplay';

// Mock useProgressState to control UI states deterministically
jest.mock('../../hooks/useProgressState', () => {
  const mockActions = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    reset: jest.fn(),
    isRunning: jest.fn().mockReturnValue(false),
    isFinished: jest.fn().mockReturnValue(false),
    isPaused: jest.fn().mockReturnValue(false),
    getCurrentState: jest.fn(),
    getStepInfo: jest.fn(),
    getAllStepsInfo: jest.fn(),
    getStepStatistics: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    updateStepMessage: jest.fn(),
    updateStepStatus: jest.fn(),
  };

  let mockState: any = {
    isActive: false,
    isCompleted: false,
    isStopped: false,
    hasError: false,
    percentage: 0,
    currentStep: 0,
    stepTitle: '',
    estimatedTime: '预计需要 3-5 分钟',
    steps: [
      { id: 's1', title: '步骤1', status: 'pending', message: '消息1' },
      { id: 's2', title: '步骤2', status: 'pending', message: '消息2' },
    ],
    elapsedTime: 0,
    totalDuration: 600000,
  };

  const useProgressStateMock = () => [mockState, mockActions] as any;
  useProgressStateMock.__setState = (partial: Partial<typeof mockState>) => {
    mockState = { ...mockState, ...partial };
  };
  useProgressStateMock.__getActions = () => mockActions;

  return { __esModule: true, default: useProgressStateMock };
});

const useProgressStateMock: any = require('../../hooks/useProgressState').default;

describe('ProgressDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset state
    useProgressStateMock.__setState({
      isActive: false,
      isCompleted: false,
      isStopped: false,
      hasError: false,
      percentage: 0,
      currentStep: 0,
      stepTitle: '',
      estimatedTime: '预计需要 3-5 分钟',
      steps: [
        { id: 's1', title: '步骤1', status: 'pending', message: '消息1' },
        { id: 's2', title: '步骤2', status: 'pending', message: '消息2' },
      ],
    });
  });

  test('显示开始按钮并能触发 start', () => {
    render(<ProgressDisplay />);
    // Ant Design button accessible name may include icon aria-label
    const startBtn = screen.getByRole('button', { name: /开始分析/ });
    expect(startBtn).toBeInTheDocument();

    const actions = useProgressStateMock.__getActions();
    act(() => {
      fireEvent.click(startBtn);
    });
    expect(actions.start).toHaveBeenCalled();
  });

  test('激活时显示取消按钮并触发 stop', () => {
    useProgressStateMock.__setState({ isActive: true });
    render(<ProgressDisplay />);
    const cancelBtn = screen.getByRole('button', { name: /取消分析/ });
    expect(cancelBtn).toBeInTheDocument();

    const actions = useProgressStateMock.__getActions();
    act(() => {
      fireEvent.click(cancelBtn);
    });
    expect(actions.stop).toHaveBeenCalled();
  });

  test('错误状态显示并可重试', () => {
    useProgressStateMock.__setState({ hasError: true, isActive: false, errorMessage: '出错了' });
    render(<ProgressDisplay />);
    expect(screen.getByText('出错了')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /重新开始/ });

    const actions = useProgressStateMock.__getActions();
    act(() => {
      fireEvent.click(retryBtn);
    });
    expect(actions.clearError).toHaveBeenCalled();
    expect(actions.reset).toHaveBeenCalled();
    expect(actions.start).toHaveBeenCalled();
  });

  test('取消后显示已取消并可重试', () => {
    useProgressStateMock.__setState({ isStopped: true, isActive: false });
    render(<ProgressDisplay />);
    expect(screen.getByText('已取消分析')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /重新开始/ });

    const actions = useProgressStateMock.__getActions();
    act(() => {
      fireEvent.click(retryBtn);
    });
    expect(actions.reset).toHaveBeenCalled();
    expect(actions.start).toHaveBeenCalled();
  });

  test('完成状态显示成功文案', () => {
    useProgressStateMock.__setState({ isCompleted: true });
    render(<ProgressDisplay />);
    expect(screen.getByText('分析完成')).toBeInTheDocument();
  });
});


