import React from 'react';
import { render } from '@testing-library/react';
// 避免引入 jsPDF/canvas 依赖导致 JSDOM 错误，需在导入 App 前进行 mock
jest.mock('../../components/AnalysisReport', () => {
  return function MockAnalysisReport() {
    return null;
  };
});
// 避免 axios ESM 在 Jest 中的加载问题
jest.mock('../../services/api', () => ({
  apiService: {
    analyzeUserBackground: jest.fn()
  }
}));
import App from '../../App';

describe('Performance: Rendering (Task 8.3)', () => {
  test('App initial render within 2s', () => {
    const t0 = performance.now();
    const { unmount } = render(React.createElement(App));
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(2000);
    unmount();
  });
});


