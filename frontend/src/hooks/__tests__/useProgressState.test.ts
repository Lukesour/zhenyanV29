import { renderHook, act } from '@testing-library/react';

// Mock ProgressEngine
jest.mock('../../services/ProgressEngine', () => {
  class MockProgressEngine {
    start = jest.fn();
    stop = jest.fn();
    pause = jest.fn();
    resume = jest.fn();
    reset = jest.fn();
    destroy = jest.fn();
    setProgressCallback = jest.fn();
    setCompleteCallback = jest.fn();
    setErrorCallback = jest.fn();
  }

  return {
    __esModule: true,
    ProgressEngine: MockProgressEngine,
    ProgressState: {},
    ProgressStep: {},
    StepStatus: {}
  };
});

// 使用require在mock之后再加载hook，避免提前解析真实实现
const { useProgressState } = require('../useProgressState');

// Mock console.error to suppress warnings
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('useProgressState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应该返回初始状态', () => {
    const { result } = renderHook(() => useProgressState());
    const [state] = result.current;

    expect(state.isActive).toBe(false);
    expect(state.isCompleted).toBe(false);
    expect(state.isStopped).toBe(false);
    expect(state.hasError).toBe(false);
    expect(state.percentage).toBe(0);
    expect(state.currentStep).toBe(0);
    expect(state.stepTitle).toBe('');
    expect(state.estimatedTime).toBe('');
    expect(state.steps).toHaveLength(6);
    expect(state.elapsedTime).toBe(0);
    expect(state.totalDuration).toBe(600000);
  });

  test('基本状态查询方法应该正常工作', () => {
    const { result } = renderHook(() => useProgressState());
    const [, actions] = result.current;

    expect(actions.isRunning()).toBe(false);
    expect(actions.isFinished()).toBe(false);
    // 初始状态不是暂停状态
    expect(actions.isPaused()).toBe(false);
  });

  test('数据获取方法应该正常工作', () => {
    const { result } = renderHook(() => useProgressState());
    const [, actions] = result.current;

    const currentState = actions.getCurrentState();
    expect(currentState.isActive).toBe(false);

    const stepInfo = actions.getStepInfo(0);
    expect(stepInfo).toBeDefined();
    expect(stepInfo?.title).toBe('查找相似案例');

    const allSteps = actions.getAllStepsInfo();
    expect(allSteps).toHaveLength(6);

    const stats = actions.getStepStatistics();
    expect(stats.total).toBe(6);
    expect(stats.pending).toBe(6);
  });

  test('错误处理方法应该正常工作', () => {
    const { result } = renderHook(() => useProgressState());
    const [, actions] = result.current;

    act(() => {
      actions.setError('测试错误');
    });

    const [state] = result.current;
    expect(state.hasError).toBe(true);
    expect(state.errorMessage).toBe('测试错误');

    act(() => {
      actions.clearError();
    });

    const [newState] = result.current;
    expect(newState.hasError).toBe(false);
  });

  test('步骤更新方法应该正常工作', () => {
    const { result } = renderHook(() => useProgressState());
    const [, actions] = result.current;

    act(() => {
      actions.updateStepMessage(0, '新的消息');
    });

    const [state] = result.current;
    expect(state.steps[0].message).toBe('新的消息');

    act(() => {
      actions.updateStepStatus(0, 'completed');
    });

    const [newState] = result.current;
    expect(newState.steps[0].status).toBe('completed');
  });

  test('控制方法应该存在且可调用', () => {
    const { result } = renderHook(() => useProgressState());
    const [, actions] = result.current;

    // 测试方法存在且可调用
    expect(typeof actions.start).toBe('function');
    expect(typeof actions.stop).toBe('function');
    expect(typeof actions.pause).toBe('function');
    expect(typeof actions.resume).toBe('function');
    expect(typeof actions.reset).toBe('function');
  });

  test('无效索引处理应该正常工作', () => {
    const { result } = renderHook(() => useProgressState());
    const [, actions] = result.current;

    act(() => {
      actions.updateStepMessage(10, '无效消息');
    });

    const [state] = result.current;
    // 不应该有任何变化
    expect(state.steps[0].message).toBe('正在分析历史申请案例...');

    act(() => {
      actions.updateStepStatus(10, 'completed');
    });

    const [newState] = result.current;
    // 不应该有任何变化
    expect(newState.steps[0].status).toBe('pending');
  });
});
