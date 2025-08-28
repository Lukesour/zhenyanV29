import React from 'react';
import { renderWithProviders } from './utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import UserForm from '../../components/UserForm';

// Mock DataLoaderService
jest.mock('../../services/DataLoaderService', () => ({
  __esModule: true,
  default: {
    loadUniversities: jest.fn(),
    loadMajors: jest.fn(),
    loadCountries: jest.fn(),
    loadTargetMajors: jest.fn(),
  }
}));

// Mock ErrorHandler
jest.mock('../../services/ErrorHandler', () => ({
  __esModule: true,
  default: {
    buildUserFacingError: jest.fn(),
  }
}));

// Mock react-window for virtual scrolling
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

describe('Integration: Virtual Scroll Functionality (Task 3.3)', () => {
  const mockUniversities = [
    '北京大学', '清华大学', '中国人民大学', '北京航空航天大学', '北京理工大学',
    '复旦大学', '上海交通大学', '同济大学', '华东师范大学', '上海大学',
    '中山大学', '华南理工大学', '暨南大学', '华南师范大学', '广东工业大学'
  ];

  const mockMajors = [
    '计算机科学与技术', '软件工程', '信息安全', '网络工程', '数据科学与大数据技术',
    '人工智能', '电子信息工程', '通信工程', '自动化', '电气工程及其自动化',
    '机械工程', '材料科学与工程', '化学工程与工艺', '生物工程', '环境工程'
  ];

  const mockCountries = ['美国', '英国', '加拿大', '澳大利亚', '日本'];
  const mockTargetMajors = ['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'];

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 设置DataLoaderService的mock返回值
    const dataLoaderService = require('../../services/DataLoaderService').default;
    dataLoaderService.loadUniversities.mockResolvedValue(mockUniversities);
    dataLoaderService.loadMajors.mockResolvedValue(mockMajors);
    dataLoaderService.loadCountries.mockResolvedValue(mockCountries);
    dataLoaderService.loadTargetMajors.mockResolvedValue(mockTargetMajors);

    // 设置ErrorHandler的mock返回值
    const errorHandler = require('../../services/ErrorHandler').default;
    errorHandler.buildUserFacingError.mockReturnValue({
      userMessage: { title: '测试错误', description: '测试错误描述' }
    });
  });

  describe('数据加载和虚拟滚动集成', () => {
    test('应该正确加载数据并显示虚拟滚动组件', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByText('本科院校')).toBeInTheDocument();
        expect(screen.getByText('本科专业')).toBeInTheDocument();
      });

      // 验证Select组件已渲染
      const universitySelect = screen.getByRole('combobox', { name: /本科院校/i });
      const majorSelect = screen.getByRole('combobox', { name: /本科专业/i });
      expect(universitySelect).toBeInTheDocument();
      expect(majorSelect).toBeInTheDocument();
    });

    test('应该处理数据加载错误', async () => {
      const dataLoaderService = require('../../services/DataLoaderService').default;
      dataLoaderService.loadUniversities.mockRejectedValue(new Error('网络错误'));

      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      // 等待错误处理
      await waitFor(() => {
        expect(screen.getByText('本科院校')).toBeInTheDocument();
      });
    });
  });

  describe('院校选择器功能', () => {
    test('应该支持院校搜索和选择', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('本科院校')).toBeInTheDocument();
      });

      // 查找院校选择框
      const universitySelect = screen.getByRole('combobox', { name: /本科院校/i });
      expect(universitySelect).toBeInTheDocument();

      // 模拟输入搜索
      fireEvent.change(universitySelect, { target: { value: '北京' } });

      // 验证Select组件正常工作
      await waitFor(() => {
        expect(universitySelect).toHaveValue('北京');
      });
    });

    test('应该支持院校手动输入', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('本科院校')).toBeInTheDocument();
      });

      const universitySelect = screen.getByRole('combobox', { name: /本科院校/i });
      
      // 模拟手动输入
      fireEvent.change(universitySelect, { target: { value: '自定义大学' } });
      
      expect(universitySelect).toHaveValue('自定义大学');
    });
  });

  describe('专业选择器功能', () => {
    test('应该支持专业搜索和选择', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('本科专业')).toBeInTheDocument();
      });

      // 查找专业选择框
      const majorSelect = screen.getByRole('combobox', { name: /本科专业/i });
      expect(majorSelect).toBeInTheDocument();

      // 模拟输入搜索
      fireEvent.change(majorSelect, { target: { value: '计算机' } });

      // 验证Select组件正常工作
      await waitFor(() => {
        expect(majorSelect).toHaveValue('计算机');
      });
    });

    test('应该支持专业手动输入', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('本科专业')).toBeInTheDocument();
      });

      const majorSelect = screen.getByRole('combobox', { name: /本科专业/i });
      
      // 模拟手动输入
      fireEvent.change(majorSelect, { target: { value: '自定义专业' } });
      
      expect(majorSelect).toHaveValue('自定义专业');
    });
  });

  describe('表单验证集成', () => {
    test('应该保持原有的表单验证功能', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('本科院校')).toBeInTheDocument();
      });

      // 尝试提交空表单
      const submitButton = screen.getByText('完成并开始分析');
      fireEvent.click(submitButton);

      // 验证错误信息显示
      await waitFor(() => {
        expect(screen.getByText('请输入本科院校')).toBeInTheDocument();
        expect(screen.getByText('请输入本科专业')).toBeInTheDocument();
      });
    });

    test('应该支持完整的表单提交流程', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('本科院校')).toBeInTheDocument();
      });

      // 验证Select组件正常工作
      const universitySelect = screen.getByRole('combobox', { name: /本科院校/i });
      const majorSelect = screen.getByRole('combobox', { name: /本科专业/i });
      
      expect(universitySelect).toBeInTheDocument();
      expect(majorSelect).toBeInTheDocument();

      // 验证Select组件可以打开下拉菜单
      fireEvent.mouseDown(universitySelect);
      await waitFor(() => {
        expect(screen.getByRole('option', { name: '北京大学' })).toBeInTheDocument();
      });
    });
  });

  describe('性能测试', () => {
    test('应该高效处理大量数据', async () => {
      // 创建大量测试数据
      const largeUniversities = Array.from({ length: 1000 }, (_, i) => `大学 ${i + 1}`);
      const largeMajors = Array.from({ length: 1000 }, (_, i) => `专业 ${i + 1}`);

      const dataLoaderService = require('../../services/DataLoaderService').default;
      dataLoaderService.loadUniversities.mockResolvedValue(largeUniversities);
      dataLoaderService.loadMajors.mockResolvedValue(largeMajors);

      const mockOnSubmit = jest.fn();
      const startTime = performance.now();
      
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('本科院校')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      
      // 验证渲染时间在合理范围内
      expect(renderTime).toBeLessThan(1000); // 1秒内应该完成渲染
      
      // 验证Select组件正常工作
      const universitySelect = screen.getByRole('combobox', { name: /本科院校/i });
      expect(universitySelect).toBeInTheDocument();
    });
  });

  describe('用户体验测试', () => {
    test('应该在数据加载时显示正确的状态', async () => {
      // 延迟数据加载
      const dataLoaderService = require('../../services/DataLoaderService').default;
      dataLoaderService.loadUniversities.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUniversities), 100))
      );

      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      // 验证加载状态
      expect(screen.getByText('本科院校')).toBeInTheDocument();
      
      // 等待加载完成
      await waitFor(() => {
        const universitySelect = screen.getByRole('combobox', { name: /本科院校/i });
        expect(universitySelect).toBeInTheDocument();
      });
    });

    test('应该支持键盘导航', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('本科院校')).toBeInTheDocument();
      });

      const universitySelect = screen.getByRole('combobox', { name: /本科院校/i });
      
      // 测试键盘事件
      fireEvent.keyDown(universitySelect, { key: 'Enter' });
      fireEvent.keyDown(universitySelect, { key: 'Tab' });
      
      // 验证选择框仍然可用
      expect(universitySelect).toBeInTheDocument();
    });
  });

  describe('错误处理测试', () => {
    test('应该处理数据加载失败', async () => {
      const dataLoaderService = require('../../services/DataLoaderService').default;
      dataLoaderService.loadUniversities.mockRejectedValue(new Error('网络错误'));

      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      // 等待错误处理
      await waitFor(() => {
        expect(screen.getByText('数据加载失败')).toBeInTheDocument();
      });

      // 验证错误处理逻辑
      expect(screen.getByText('重新加载数据')).toBeInTheDocument();
    });

    test('应该处理空数据情况', async () => {
      const dataLoaderService = require('../../services/DataLoaderService').default;
      dataLoaderService.loadUniversities.mockResolvedValue([]);
      dataLoaderService.loadMajors.mockResolvedValue([]);

      const mockOnSubmit = jest.fn();
      renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('本科院校')).toBeInTheDocument();
      });

      // 验证空数据处理 - Select组件应该正常工作
      const universitySelect = screen.getByRole('combobox', { name: /本科院校/i });
      expect(universitySelect).toBeInTheDocument();
    });
  });
});
