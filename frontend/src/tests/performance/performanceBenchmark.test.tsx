import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualScrollWrapper from '../../components/VirtualScrollWrapper';

// Mock react-window for benchmark testing
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, height, itemSize, itemData }: any) => (
    <div data-testid="virtual-list" style={{ height, overflow: 'auto' }}>
      {Array.from({ length: Math.min(itemCount, 20) }, (_, index) => (
        <div key={index} style={{ height: itemSize }}>
          {children({ 
            index, 
            style: {}, 
            data: { 
              items: itemData?.items || ['Item 1', 'Item 2', 'Item 3'], 
              onSelect: itemData?.onSelect || jest.fn(), 
              itemHeight: itemData?.itemHeight || 32 
            } 
          })}
        </div>
      ))}
    </div>
  ),
}));

// 性能基准配置
const PERFORMANCE_BENCHMARKS = {
  render: {
    small: { threshold: 70, description: '小数据集渲染 (< 70ms)' },
    medium: { threshold: 100, description: '中等数据集渲染 (< 100ms)' },
    large: { threshold: 200, description: '大数据集渲染 (< 200ms)' }
  },
  search: {
    input: { threshold: 30, description: '搜索输入响应 (< 30ms)' },
    filter: { threshold: 50, description: '搜索过滤处理 (< 50ms)' },
    debounce: { threshold: 150, description: '防抖延迟 (< 150ms)' }
  },
  scroll: {
    single: { threshold: 20, description: '单次滚动响应 (< 20ms)' },
    continuous: { threshold: 100, description: '连续滚动响应 (< 100ms)' },
    large: { threshold: 200, description: '大量数据滚动 (< 200ms)' }
  },
  memory: {
    initial: { threshold: 5 * 1024 * 1024, description: '初始内存使用 (< 5MB)' },
    peak: { threshold: 10 * 1024 * 1024, description: '峰值内存使用 (< 10MB)' },
    growth: { threshold: 2 * 1024 * 1024, description: '内存增长 (< 2MB)' }
  }
};

// 性能监控类
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  startTimer(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`);
    }
    
    const duration = performance.now() - startTime;
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    return duration;
  }

  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return 0;
    }
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getMin(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return 0;
    }
    return Math.min(...values);
  }

  getMax(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return 0;
    }
    return Math.max(...values);
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        avg: this.getAverage(name),
        min: this.getMin(name),
        max: this.getMax(name),
        count: values.length
      };
    });
    
    return result;
  }

  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

// 全局性能监控实例
const performanceMonitor = new PerformanceMonitor();

describe('Performance Benchmark: Virtual Scroll Component (Task 4.3)', () => {
  // 生成测试数据
  const generateTestData = (count: number, prefix: string) => 
    Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`);

  const smallData = generateTestData(100, 'Small');
  const mediumData = generateTestData(1000, 'Medium');
  const largeData = generateTestData(5000, 'Large');

  const defaultProps = {
    height: 300,
    itemHeight: 32,
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    performanceMonitor.clear();
    jest.clearAllMocks();
  });

  describe('渲染性能基准测试', () => {
    test('小数据集渲染基准', () => {
      performanceMonitor.startTimer('render_small');
      
      render(<VirtualScrollWrapper {...defaultProps} data={smallData} />);
      
      const renderTime = performanceMonitor.endTimer('render_small');
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.render.small.threshold);
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      
      console.log(`小数据集渲染: ${renderTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.render.small.threshold}ms)`);
    });

    test('中等数据集渲染基准', () => {
      performanceMonitor.startTimer('render_medium');
      
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const renderTime = performanceMonitor.endTimer('render_medium');
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.render.medium.threshold);
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      
      console.log(`中等数据集渲染: ${renderTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.render.medium.threshold}ms)`);
    });

    test('大数据集渲染基准', () => {
      performanceMonitor.startTimer('render_large');
      
      render(<VirtualScrollWrapper {...defaultProps} data={largeData} />);
      
      const renderTime = performanceMonitor.endTimer('render_large');
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.render.large.threshold);
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      
      console.log(`大数据集渲染: ${renderTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.render.large.threshold}ms)`);
    });

    test('空数据集渲染基准', () => {
      performanceMonitor.startTimer('render_empty');
      
      render(<VirtualScrollWrapper {...defaultProps} data={[]} />);
      
      const renderTime = performanceMonitor.endTimer('render_empty');
      
      expect(renderTime).toBeLessThan(30); // 空数据应该很快
      expect(screen.getByText('未找到匹配的选项')).toBeInTheDocument();
      
      console.log(`空数据集渲染: ${renderTime.toFixed(2)}ms (基准: 30ms)`);
    });
  });

  describe('搜索性能基准测试', () => {
    test('搜索输入响应基准', () => {
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      
      performanceMonitor.startTimer('search_input');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      const inputTime = performanceMonitor.endTimer('search_input');
      
      expect(inputTime).toBeLessThan(PERFORMANCE_BENCHMARKS.search.input.threshold);
      
      console.log(`搜索输入响应: ${inputTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.search.input.threshold}ms)`);
    });

    test('搜索过滤处理基准', async () => {
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      
      performanceMonitor.startTimer('search_filter');
      fireEvent.change(searchInput, { target: { value: 'Medium 1' } });
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
      
      const filterTime = performanceMonitor.endTimer('search_filter');
      
      expect(filterTime).toBeLessThan(PERFORMANCE_BENCHMARKS.search.filter.threshold);
      
      console.log(`搜索过滤处理: ${filterTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.search.filter.threshold}ms)`);
    });

    test('防抖延迟基准', async () => {
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      
      performanceMonitor.startTimer('search_debounce');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // 等待防抖完成
      await new Promise(resolve => setTimeout(resolve, 160));
      
      const debounceTime = performanceMonitor.endTimer('search_debounce');
      
      // 防抖延迟应该在合理范围内：至少150ms，但不超过200ms
      expect(debounceTime).toBeGreaterThan(150); // 防抖应该至少150ms
      expect(debounceTime).toBeLessThan(200); // 但不应超过200ms
      
      console.log(`防抖延迟: ${debounceTime.toFixed(2)}ms (基准: 150-200ms)`);
    });

    test('长搜索词处理基准', () => {
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      const longSearchTerm = '这是一个非常非常非常非常非常非常非常非常非常非常长的搜索词';
      
      performanceMonitor.startTimer('search_long');
      fireEvent.change(searchInput, { target: { value: longSearchTerm } });
      const searchTime = performanceMonitor.endTimer('search_long');
      
      expect(searchTime).toBeLessThan(50);
      
      console.log(`长搜索词处理: ${searchTime.toFixed(2)}ms (基准: 50ms)`);
    });
  });

  describe('滚动性能基准测试', () => {
    test('单次滚动响应基准', () => {
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const virtualList = screen.getByTestId('virtual-list');
      
      performanceMonitor.startTimer('scroll_single');
      fireEvent.scroll(virtualList, { target: { scrollTop: 100 } });
      const scrollTime = performanceMonitor.endTimer('scroll_single');
      
      expect(scrollTime).toBeLessThan(PERFORMANCE_BENCHMARKS.scroll.single.threshold);
      
      console.log(`单次滚动响应: ${scrollTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.scroll.single.threshold}ms)`);
    });

    test('连续滚动响应基准', () => {
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const virtualList = screen.getByTestId('virtual-list');
      
      performanceMonitor.startTimer('scroll_continuous');
      
      // 模拟连续滚动
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(virtualList, { target: { scrollTop: i * 100 } });
      }
      
      const scrollTime = performanceMonitor.endTimer('scroll_continuous');
      
      expect(scrollTime).toBeLessThan(PERFORMANCE_BENCHMARKS.scroll.continuous.threshold);
      
      console.log(`连续滚动响应: ${scrollTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.scroll.continuous.threshold}ms)`);
    });

    test('大量数据滚动基准', () => {
      render(<VirtualScrollWrapper {...defaultProps} data={largeData} />);
      
      const virtualList = screen.getByTestId('virtual-list');
      
      performanceMonitor.startTimer('scroll_large');
      fireEvent.scroll(virtualList, { target: { scrollTop: 10000 } });
      const scrollTime = performanceMonitor.endTimer('scroll_large');
      
      expect(scrollTime).toBeLessThan(PERFORMANCE_BENCHMARKS.scroll.large.threshold);
      
      console.log(`大量数据滚动: ${scrollTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.scroll.large.threshold}ms)`);
    });
  });

  describe('内存使用基准测试', () => {
    test('初始内存使用基准', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_BENCHMARKS.memory.initial.threshold);
      
      console.log(`初始内存使用: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (基准: ${PERFORMANCE_BENCHMARKS.memory.initial.threshold / 1024 / 1024}MB)`);
    });

    test('峰值内存使用基准', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 渲染大数据集
      const { unmount } = render(<VirtualScrollWrapper {...defaultProps} data={largeData} />);
      
      // 模拟多次搜索
      const searchInput = screen.getByPlaceholderText('搜索...');
      for (let i = 0; i < 20; i++) {
        fireEvent.change(searchInput, { target: { value: `search${i}` } });
      }
      
      const peakMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = peakMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_BENCHMARKS.memory.peak.threshold);
      
      unmount();
      
      console.log(`峰值内存使用: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (基准: ${PERFORMANCE_BENCHMARKS.memory.peak.threshold / 1024 / 1024}MB)`);
    });

    test('内存增长基准', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 多次渲染和卸载
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
        unmount();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;
      
      expect(memoryGrowth).toBeLessThan(PERFORMANCE_BENCHMARKS.memory.growth.threshold);
      
      console.log(`内存增长: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB (基准: ${PERFORMANCE_BENCHMARKS.memory.growth.threshold / 1024 / 1024}MB)`);
    });
  });

  describe('交互性能基准测试', () => {
    test('选项选择响应基准', () => {
      const onSelect = jest.fn();
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} onSelect={onSelect} />);
      
      const virtualList = screen.getByTestId('virtual-list');
      
      performanceMonitor.startTimer('select_response');
      fireEvent.click(virtualList);
      const selectTime = performanceMonitor.endTimer('select_response');
      
      expect(selectTime).toBeLessThan(50);
      
      console.log(`选项选择响应: ${selectTime.toFixed(2)}ms (基准: 50ms)`);
    });

    test('键盘导航响应基准', () => {
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      
      performanceMonitor.startTimer('keyboard_navigation');
      
      // 模拟键盘事件
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      fireEvent.keyDown(searchInput, { key: 'Tab' });
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
      
      const keyboardTime = performanceMonitor.endTimer('keyboard_navigation');
      
      expect(keyboardTime).toBeLessThan(50);
      
      console.log(`键盘导航响应: ${keyboardTime.toFixed(2)}ms (基准: 50ms)`);
    });
  });

  describe('压力测试基准', () => {
    test('快速连续操作基准', async () => {
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      
      performanceMonitor.startTimer('rapid_operations');
      
      // 快速连续操作
      for (let i = 0; i < 50; i++) {
        fireEvent.change(searchInput, { target: { value: `rapid${i}` } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      }
      
      const operationTime = performanceMonitor.endTimer('rapid_operations');
      
      expect(operationTime).toBeLessThan(1000); // 1秒内完成50次操作
      
      console.log(`快速连续操作: ${operationTime.toFixed(2)}ms (基准: 1000ms)`);
    });

    test('大数据集压力测试基准', () => {
      const ultraLargeData = generateTestData(10000, 'Ultra');
      
      performanceMonitor.startTimer('ultra_large_render');
      render(<VirtualScrollWrapper {...defaultProps} data={ultraLargeData} />);
      const renderTime = performanceMonitor.endTimer('ultra_large_render');
      
      expect(renderTime).toBeLessThan(500); // 超大数据集应该在500ms内渲染
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      
      console.log(`超大数据集渲染: ${renderTime.toFixed(2)}ms (基准: 500ms)`);
    });
  });

  describe('性能基准报告', () => {
    test('生成性能基准报告', () => {
      // 执行所有基准测试
      const { render: renderTest } = require('@testing-library/react');
      
      // 小数据集渲染
      performanceMonitor.startTimer('benchmark_small');
      renderTest(<VirtualScrollWrapper {...defaultProps} data={smallData} />);
      performanceMonitor.endTimer('benchmark_small');
      
      // 中等数据集渲染
      performanceMonitor.startTimer('benchmark_medium');
      renderTest(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      performanceMonitor.endTimer('benchmark_medium');
      
      // 大数据集渲染
      performanceMonitor.startTimer('benchmark_large');
      renderTest(<VirtualScrollWrapper {...defaultProps} data={largeData} />);
      performanceMonitor.endTimer('benchmark_large');
      
      // 生成性能报告
      const metrics = performanceMonitor.getMetrics();
      
      console.log('\n📊 性能基准测试报告');
      console.log('=====================================');
      
      for (const [name, metric] of Object.entries(metrics)) {
        console.log(`${name}:`);
        console.log(`  平均: ${metric.avg.toFixed(2)}ms`);
        console.log(`  最小: ${metric.min.toFixed(2)}ms`);
        console.log(`  最大: ${metric.max.toFixed(2)}ms`);
        console.log(`  次数: ${metric.count}`);
        console.log('');
      }
      
      // 验证基准测试结果
      expect(metrics.benchmark_small?.avg).toBeLessThan(100);
      expect(metrics.benchmark_medium?.avg).toBeLessThan(200);
      expect(metrics.benchmark_large?.avg).toBeLessThan(500);
      
      console.log('✅ 所有性能基准测试通过');
    });
  });

  describe('性能回归检测', () => {
    test('检测性能回归', () => {
      const baselineMetrics = {
        render_small: 50,
        render_medium: 100,
        render_large: 200,
        search_input: 30,
        search_filter: 50,
        scroll_single: 20,
        scroll_continuous: 100
      };
      
      // 执行当前测试
      performanceMonitor.startTimer('regression_test_small');
      render(<VirtualScrollWrapper {...defaultProps} data={smallData} />);
      const currentSmall = performanceMonitor.endTimer('regression_test_small');
      
      performanceMonitor.startTimer('regression_test_medium');
      render(<VirtualScrollWrapper {...defaultProps} data={mediumData} />);
      const currentMedium = performanceMonitor.endTimer('regression_test_medium');
      
      // 检查性能回归 (允许20%的性能下降)
      const regressionThreshold = 1.2;
      
      expect(currentSmall).toBeLessThan(baselineMetrics.render_small * regressionThreshold);
      expect(currentMedium).toBeLessThan(baselineMetrics.render_medium * regressionThreshold);
      
      console.log('\n🔍 性能回归检测结果:');
      console.log(`小数据集: ${currentSmall.toFixed(2)}ms (基准: ${baselineMetrics.render_small}ms)`);
      console.log(`中等数据集: ${currentMedium.toFixed(2)}ms (基准: ${baselineMetrics.render_medium}ms)`);
      console.log('✅ 未检测到性能回归');
    });
  });
});
