import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './utils';
import App from '../../App';

// 避免引入真实 axios 模块（esm 导致的 transform 问题），在此直接 mock 掉 api 模块
jest.mock('../../services/api', () => ({
  apiService: {
    analyzeUserBackground: jest.fn()
  }
}));

describe('Integration Setup (Task 7.1)', () => {
  test('renders App and shows form header', async () => {
    renderWithProviders(<App />);

    // 基础表单控件应可见
    expect(screen.getByText('留学定位与选校规划 - 个人信息填写')).toBeInTheDocument();
  });
});


