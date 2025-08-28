import React, { PropsWithChildren } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { render } from '@testing-library/react';

export function renderWithProviders(ui: React.ReactElement) {
  const Wrapper: React.FC<PropsWithChildren> = ({ children }) => (
    <ConfigProvider locale={zhCN}>{children}</ConfigProvider>
  );
  return render(ui, { wrapper: Wrapper });
}







