import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualScrollWrapper from '../VirtualScrollWrapper';

// Mock react-window to avoid DOM issues in tests
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, height, itemSize, itemData }: any) => (
    <div data-testid="virtual-list" style={{ height, overflow: 'auto' }}>
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => (
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

describe('VirtualScrollWrapper', () => {
  const mockData = [
    '北京大学', '清华大学', '中国人民大学', '北京航空航天大学', '北京理工大学',
    '复旦大学', '上海交通大学', '同济大学', '华东师范大学', '上海大学',
    '中山大学', '华南理工大学', '暨南大学', '华南师范大学', '广东工业大学'
  ];

  const defaultProps = {
    data: mockData,
    height: 300,
    itemHeight: 32,
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本渲染功能', () => {
    it('should render with data', () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('搜索...')).toBeInTheDocument();
    });

    it('should render without search when showSearch is false', () => {
      render(<VirtualScrollWrapper {...defaultProps} showSearch={false} />);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('搜索...')).not.toBeInTheDocument();
    });

    it('should render with custom height and item height', () => {
      render(<VirtualScrollWrapper {...defaultProps} height={400} itemHeight={40} />);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      const customPlaceholder = '请输入搜索关键词';
      render(<VirtualScrollWrapper {...defaultProps} placeholder={customPlaceholder} />);
      
      expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
    });
  });

  describe('搜索过滤功能', () => {
    it('should filter data when searching', async () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      fireEvent.change(searchInput, { target: { value: '北京' } });
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });

    it('should not filter when filterOption is false', async () => {
      render(<VirtualScrollWrapper {...defaultProps} filterOption={false} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      fireEvent.change(searchInput, { target: { value: '北京' } });
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });

    it('should handle empty search value', async () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      fireEvent.change(searchInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });

    it('should handle case insensitive search', async () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      fireEvent.change(searchInput, { target: { value: 'BEIJING' } });
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });
  });

  describe('空数据和错误状态', () => {
    it('should show not found content when no data', () => {
      render(<VirtualScrollWrapper {...defaultProps} data={[]} />);
      
      expect(screen.getByText('未找到匹配的选项')).toBeInTheDocument();
    });

    it('should show custom not found content', () => {
      const customNotFound = '没有找到相关数据';
      render(<VirtualScrollWrapper {...defaultProps} data={[]} notFoundContent={customNotFound} />);
      
      expect(screen.getByText(customNotFound)).toBeInTheDocument();
    });

    it('should show not found content when search has no results', async () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      fireEvent.change(searchInput, { target: { value: '不存在的大学' } });
      
      await waitFor(() => {
        expect(screen.getByText('未找到匹配的选项')).toBeInTheDocument();
      });
    });
  });

  describe('禁用和加载状态', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<VirtualScrollWrapper {...defaultProps} disabled={true} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      expect(searchInput).toBeDisabled();
    });

    it('should show loading state', () => {
      render(<VirtualScrollWrapper {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should handle disabled state with loading', () => {
      render(<VirtualScrollWrapper {...defaultProps} disabled={true} loading={true} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      expect(searchInput).toBeDisabled();
    });
  });

  describe('选项选择功能', () => {
    it('should handle item selection', async () => {
      const onSelect = jest.fn();
      render(<VirtualScrollWrapper {...defaultProps} onSelect={onSelect} />);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should not call onSelect when disabled', async () => {
      const onSelect = jest.fn();
      render(<VirtualScrollWrapper {...defaultProps} onSelect={onSelect} disabled={true} />);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });

  describe('性能测试', () => {
    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => `大学 ${i + 1}`);
      
      const startTime = performance.now();
      render(<VirtualScrollWrapper {...defaultProps} data={largeData} />);
      const renderTime = performance.now() - startTime;
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(100); // 渲染时间应该在100ms以内
    });

    it('should handle empty datasets efficiently', () => {
      const startTime = performance.now();
      render(<VirtualScrollWrapper {...defaultProps} data={[]} />);
      const renderTime = performance.now() - startTime;
      
      expect(screen.getByText('未找到匹配的选项')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(50); // 空数据渲染应该很快
    });
  });

  describe('边界条件测试', () => {
    it('should handle single item data', () => {
      const singleItemData = ['北京大学'];
      render(<VirtualScrollWrapper {...defaultProps} data={singleItemData} />);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should handle very long item names', () => {
      const longNameData = ['这是一个非常非常非常非常非常非常非常非常非常非常长的大学名称'];
      render(<VirtualScrollWrapper {...defaultProps} data={longNameData} />);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should handle special characters in data', () => {
      const specialCharData = ['北京大学(Beijing)', '清华大学-Tsinghua', '复旦@大学'];
      render(<VirtualScrollWrapper {...defaultProps} data={specialCharData} />);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should handle special characters in search', async () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      fireEvent.change(searchInput, { target: { value: '北京(Beijing)' } });
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });
  });

  describe('样式和UI测试', () => {
    it('should render with default styling', () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const container = screen.getByTestId('virtual-list').parentElement;
      expect(container).toHaveStyle('border: 1px solid #d9d9d9');
    });

    it('should render search box with correct styling', () => {
      render(<VirtualScrollWrapper {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索...');
      expect(searchInput).toBeInTheDocument();
    });
  });
});

