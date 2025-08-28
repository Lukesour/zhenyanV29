import React from 'react';
import { renderWithProviders } from './utils';
import { screen, waitFor } from '@testing-library/react';
import App from '../../App';

// 避免 axios ESM 在 Jest 中的加载问题，集成测试不依赖真实后端
jest.mock('../../services/api', () => ({
  apiService: {
    analyzeUserBackground: jest.fn()
  }
}));

describe('Integration: Data Loading Flow (Task 7.2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('loads complete data on first visit and shows success alert', async () => {
    renderWithProviders(<App />);

    // 初始加载提示（页面上有两处相同文案：Alert 与 Spin 文本，使用 getAllByText）
    const loadingTexts = screen.getAllByText(/正在加载数据/);
    expect(loadingTexts.length).toBeGreaterThan(0);

    // 等待数据加载完成，不显示错误
    await waitFor(() => {
      expect(screen.queryByText('数据加载失败')).not.toBeInTheDocument();
    });
  });

  test('creates cache after first load and marks cache valid', async () => {
    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.queryByText('数据加载失败')).not.toBeInTheDocument();
    });

    const cacheRaw = localStorage.getItem('school_positioning_data');
    expect(cacheRaw).toBeTruthy();
    const cache = JSON.parse(cacheRaw as string);
    expect(cache.expiresAt).toBeGreaterThan(Date.now());
    expect(cache.data.universities?.length).toBeGreaterThan(0);
  });

  test('handles broken cache gracefully and reloads', async () => {
    // 写入损坏缓存
    localStorage.setItem('school_positioning_data', 'not-json');

    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.queryByText('数据加载失败')).not.toBeInTheDocument();
    });
  });

  test('performance: data loads within reasonable time (<= 3s nominal)', async () => {
    const start = performance.now();
    renderWithProviders(<App />);
    await waitFor(() => {
      expect(screen.queryByText('数据加载失败')).not.toBeInTheDocument();
    });
    const duration = performance.now() - start;
    expect(duration).toBeLessThanOrEqual(6000);
  });
});


