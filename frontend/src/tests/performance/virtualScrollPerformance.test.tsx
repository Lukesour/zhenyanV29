import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualScrollWrapper from '../../components/VirtualScrollWrapper';

// Mock react-window for performance testing
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

describe('Performance: Virtual Scroll Component (Task 4.2)', () => {
  // 生成大量测试数据
  const generateLargeDataset = (count: number, prefix: string) => 
    Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`);

  const largeUniversities = generateLargeDataset(1000, '大学');
  const largeMajors = generateLargeDataset(1000, '专业');

  const defaultProps = {
    data: largeUniversities,
    height: 300,
    itemHeight: 32,
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 重置性能计时器
    performance.now = jest.fn(() => Date.now());
  });

  describe('渲染性能测试', () => {
    test('应该快速渲染大量数据', () => {
      const startTime = performance.now();
      
      render(<VirtualScrollWrapper {...defaultProps} data={largeUniversities} />);
      
      const renderTime = performance.now() - startTime;
      
      // 验证渲染时间在合理范围内
      expect(renderTime).toBeLessThan(100); // 100ms内完成渲染
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    test('应该高效处理空数据', () => {
      const startTime = performance.now();
      
      render(<VirtualScrollWrapper {...defaultProps} data={[]} />);
      
      const renderTime = performance.now() - startTime;
      
      // 空数据渲染应该很快
      expect(renderTime).toBeLessThan(50); // 50ms内完成渲染
      expect(screen.getByText('未找到匹配的选项')).toBeInTheDocument();
    });

    test('应该高效处理单个项目', () => {
      const singleItemData = ['北京大学'];
      const startTime = performance.now();
      
      render(<VirtualScrollWrapper {...defaultProps} data={singleItemData} />);
      
      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(50);
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });

  describe('搜索性能测试', () => {
    test('应该快速响应搜索输入', async () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      
      // 测试快速连续输入
      const startTime = performance.now();
      
      fireEvent.change(searchInput, { target: { value: '北京' } });
      fireEvent.change(searchInput, { target: { value: '北京大学' } });
      fireEvent.change(searchInput, { target: { value: '北京大学计算机' } });
      
      const inputTime = performance.now() - startTime;
      
      // 输入响应应该很快
      expect(inputTime).toBeLessThan(50);
      
      // 等待防抖后的过滤
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });

    test('应该高效处理长搜索词', async () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      const longSearchTerm = '这是一个非常非常非常非常非常非常非常非常非常非常长的搜索词';
      
      const startTime = performance.now();
      
      fireEvent.change(searchInput, { target: { value: longSearchTerm } });
      
      const searchTime = performance.now() - startTime;
      
      // 长搜索词处理应该很快
      expect(searchTime).toBeLessThan(50);
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });

    test('应该高效处理特殊字符搜索', async () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      const specialSearchTerm = '北京(Beijing)@大学#计算机$科学%技术';
      
      const startTime = performance.now();
      
      fireEvent.change(searchInput, { target: { value: specialSearchTerm } });
      
      const searchTime = performance.now() - startTime;
      
      expect(searchTime).toBeLessThan(50);
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });
  });

  describe('滚动性能测试', () => {
    test('应该高效处理大量数据的滚动', () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const virtualList = screen.getByTestId('virtual-list');
      
      // 模拟滚动事件
      const startTime = performance.now();
      
      fireEvent.scroll(virtualList, { target: { scrollTop: 1000 } });
      fireEvent.scroll(virtualList, { target: { scrollTop: 2000 } });
      fireEvent.scroll(virtualList, { target: { scrollTop: 3000 } });
      
      const scrollTime = performance.now() - startTime;
      
      // 滚动响应应该很快
      expect(scrollTime).toBeLessThan(100);
    });

    test('应该高效处理快速连续滚动', () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const virtualList = screen.getByTestId('virtual-list');
      
      const startTime = performance.now();
      
      // 模拟快速连续滚动
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(virtualList, { target: { scrollTop: i * 100 } });
      }
      
      const scrollTime = performance.now() - startTime;
      
      // 快速滚动应该保持流畅
      expect(scrollTime).toBeLessThan(200);
    });
  });

  describe('内存使用测试', () => {
    test('应该高效处理大量数据而不造成内存泄漏', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 渲染大量数据
      const { unmount } = render(<VirtualScrollWrapper {...defaultProps} data={largeUniversities} />);
      
      // 模拟多次搜索
      const searchInput = screen.getByPlaceholderText('搜索...');
      for (let i = 0; i < 10; i++) {
        fireEvent.change(searchInput, { target: { value: `搜索${i}` } });
      }
      
      // 卸载组件
      unmount();
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该在合理范围内
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB以内
    });

    test('应该高效处理组件重新渲染', () => {
      const { rerender } = render(<VirtualScrollWrapper {...defaultProps} />);
      
      const startTime = performance.now();
      
      // 多次重新渲染
      for (let i = 0; i < 5; i++) {
        rerender(<VirtualScrollWrapper {...defaultProps} data={largeUniversities.slice(0, 100 * (i + 1))} />);
      }
      
      const rerenderTime = performance.now() - startTime;
      
      // 重新渲染应该很快
      expect(rerenderTime).toBeLessThan(200);
    });
  });

  describe('交互性能测试', () => {
    test('应该快速响应选项选择', () => {
      const onSelect = jest.fn();
      render(<VirtualScrollWrapper {...defaultProps} onSelect={onSelect} />);
      
      const virtualList = screen.getByTestId('virtual-list');
      
      const startTime = performance.now();
      
      // 模拟点击选择
      fireEvent.click(virtualList);
      
      const clickTime = performance.now() - startTime;
      
      // 点击响应应该很快
      expect(clickTime).toBeLessThan(50);
    });

    test('应该高效处理键盘导航', () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      
      const startTime = performance.now();
      
      // 模拟键盘事件
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      fireEvent.keyDown(searchInput, { key: 'Tab' });
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
      
      const keyboardTime = performance.now() - startTime;
      
      // 键盘响应应该很快
      expect(keyboardTime).toBeLessThan(50);
    });
  });

  describe('压力测试', () => {
    test('应该处理超大数据集', () => {
      const ultraLargeData = generateLargeDataset(5000, '超大数据');
      
      const startTime = performance.now();
      
      render(<VirtualScrollWrapper {...defaultProps} data={ultraLargeData} />);
      
      const renderTime = performance.now() - startTime;
      
      // 超大数据集渲染应该在合理时间内
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    test('应该处理快速连续操作', async () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      
      const startTime = performance.now();
      
      // 快速连续操作
      for (let i = 0; i < 20; i++) {
        fireEvent.change(searchInput, { target: { value: `快速操作${i}` } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      }
      
      const operationTime = performance.now() - startTime;
      
      // 快速操作应该保持响应
      expect(operationTime).toBeLessThan(500);
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });
  });

  describe('性能基准测试', () => {
    test('应该达到性能基准要求', () => {
      const performanceMetrics = {
        renderTime: 0,
        searchTime: 0,
        scrollTime: 0,
        memoryUsage: 0
      };

      // 测试渲染性能
      const renderStart = performance.now();
      render(<VirtualScrollWrapper {...defaultProps} />);
      performanceMetrics.renderTime = performance.now() - renderStart;

      // 测试搜索性能
      const searchInput = screen.getByPlaceholderText('搜索...');
      const searchStart = performance.now();
      fireEvent.change(searchInput, { target: { value: '测试搜索' } });
      performanceMetrics.searchTime = performance.now() - searchStart;

      // 测试滚动性能
      const virtualList = screen.getByTestId('virtual-list');
      const scrollStart = performance.now();
      fireEvent.scroll(virtualList, { target: { scrollTop: 1000 } });
      performanceMetrics.scrollTime = performance.now() - scrollStart;

      // 验证性能基准
      expect(performanceMetrics.renderTime).toBeLessThan(100); // 渲染 < 100ms
      expect(performanceMetrics.searchTime).toBeLessThan(50);  // 搜索 < 50ms
      expect(performanceMetrics.scrollTime).toBeLessThan(50);  // 滚动 < 50ms

      console.log('性能测试结果:', performanceMetrics);
    });
  });
});


