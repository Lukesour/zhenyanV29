import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UserForm from '../UserForm';
import { message } from 'antd';

// Mock DataLoaderService used by UserForm
jest.mock('../../services/DataLoaderService', () => {
  const loads = {
    loadUniversities: jest.fn(),
    loadMajors: jest.fn(),
    loadCountries: jest.fn(),
    loadTargetMajors: jest.fn(),
  };
  return { __esModule: true, default: loads };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dataLoaderService = require('../../services/DataLoaderService').default as {
  loadUniversities: jest.Mock;
  loadMajors: jest.Mock;
  loadCountries: jest.Mock;
  loadTargetMajors: jest.Mock;
};

const mockUniversities = ['清华大学', '北京大学', 'MIT', 'Stanford'];
const mockMajors = ['计算机科学', '经济学', '法学'];
const mockCountries = ['中国', '美国', '英国'];
const mockTargetMajors = ['人工智能', '数据科学', '金融工程'];

const setupSuccessfulLoads = () => {
  dataLoaderService.loadUniversities.mockResolvedValue(mockUniversities);
  dataLoaderService.loadMajors.mockResolvedValue(mockMajors);
  dataLoaderService.loadCountries.mockResolvedValue(mockCountries);
  dataLoaderService.loadTargetMajors.mockResolvedValue(mockTargetMajors);
};

describe('UserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // silence antd message to avoid React 19 compat noise
    // and to avoid async portal operations during tests
    (message as any).error = jest.fn();
    (message as any).success = jest.fn();
    (message as any).warning = jest.fn();
  });

  // Some antd interactions and dropdown renders can be slow in JSDOM
  jest.setTimeout(20000);

  test('应该成功加载数据', async () => {
    setupSuccessfulLoads();
    await act(async () => {
      render(<UserForm onSubmit={jest.fn()} />);
    });

    // 数据加载成功，不显示错误
    expect(screen.queryByText('数据加载失败')).not.toBeInTheDocument();
  });

  test('数据加载失败时显示错误并可重试成功', async () => {
    // 第一次失败，第二次成功
    dataLoaderService.loadUniversities.mockRejectedValueOnce(new Error('Load fail'));
    dataLoaderService.loadMajors.mockRejectedValueOnce(new Error('Load fail'));
    dataLoaderService.loadCountries.mockRejectedValueOnce(new Error('Load fail'));
    dataLoaderService.loadTargetMajors.mockRejectedValueOnce(new Error('Load fail'));

    await act(async () => {
      render(<UserForm onSubmit={jest.fn()} />);
    });

    // 错误卡片
    expect(await screen.findByText('数据加载失败')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: '重新加载数据' });

    // 设置后续为成功
    setupSuccessfulLoads();

    await act(async () => {
      fireEvent.click(retryButton);
    });

    // 重试成功后不显示错误
    expect(screen.queryByText('数据加载失败')).not.toBeInTheDocument();
  });

  test('未填写必填项时应显示校验错误', async () => {
    setupSuccessfulLoads();
    await act(async () => {
      render(<UserForm onSubmit={jest.fn()} />);
    });

    // 等待数据加载完成
    await new Promise(resolve => setTimeout(resolve, 100));

    const submit = screen.getByRole('button', { name: /完成并开始分析/ });
    await act(async () => {
      fireEvent.click(submit);
    });

    // 基本必填错误
    expect(await screen.findByText('请输入本科院校')).toBeInTheDocument();
    expect(await screen.findByText('请输入本科专业')).toBeInTheDocument();
    expect(await screen.findByText('请输入GPA或均分')).toBeInTheDocument();
    expect(await screen.findByText('请选择GPA制式')).toBeInTheDocument();
    expect((await screen.findAllByText('请选择毕业年份')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('请选择目标国家/地区')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('请选择目标专业方向')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('请选择目标学位类型')).length).toBeGreaterThan(0);
  });

  test('切换语言/GRE/GMAT后，条件字段触发校验', async () => {
    setupSuccessfulLoads();
    await act(async () => {
      render(<UserForm onSubmit={jest.fn()} />);
    });
    // 等待数据加载完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 打开语言成绩
    fireEvent.click(screen.getByRole('button', { name: '添加语言成绩' }));
    // 提交应提示语言类型与总分
    const submit = screen.getByRole('button', { name: /完成并开始分析/ });
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(await screen.findByText('请选择语言考试类型')).toBeInTheDocument();
    expect(await screen.findByText('请输入语言考试总分')).toBeInTheDocument();

    // 打开GRE
    fireEvent.click(screen.getByRole('button', { name: '添加GRE成绩' }));
    await act(async () => {
      fireEvent.click(submit);
    });
    // 提示GRE总分
    expect(await screen.findByText('请输入GRE总分')).toBeInTheDocument();

    // 打开GMAT
    fireEvent.click(screen.getByRole('button', { name: '添加GMAT成绩' }));
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(await screen.findByText('请输入GMAT总分')).toBeInTheDocument();
  });

  test('填写有效数据后点击提交不应出现校验错误', async () => {
    setupSuccessfulLoads();
    const onSubmit = jest.fn();
    let containerEl: HTMLElement;
    await act(async () => {
      const { container } = render(<UserForm onSubmit={onSubmit} />);
      containerEl = container;
    });

    // 本科院校/专业（直接输入并blur）
    const uniInput = screen.getByRole('combobox', { name: '本科院校' });
    await userEvent.clear(uniInput);
    await userEvent.type(uniInput, mockUniversities[0]);
    await userEvent.keyboard('{enter}');
    const majorInput = screen.getByRole('combobox', { name: '本科专业' });
    await userEvent.clear(majorInput);
    await userEvent.type(majorInput, mockMajors[0]);
    await userEvent.keyboard('{enter}');

    // GPA
    const gpaInput = screen.getByRole('spinbutton', { name: 'GPA/均分' });
    await userEvent.clear(gpaInput);
    await userEvent.type(gpaInput, '3.8');

    // 选择GPA制式
    const gpaScale = screen.getByRole('combobox', { name: 'GPA制式' });
    await userEvent.click(gpaScale);
    const gpaOption = await screen.findByRole('option', { name: '4.0制' });
    await userEvent.click(gpaOption);

    // 选择毕业年份（选择第一个选项即可）
    const gradYear = screen.getByRole('combobox', { name: '毕业年份' });
    await userEvent.click(gradYear);
    const firstYear = new Date().getFullYear() - 5;
    const yearOption = await screen.findByRole('option', { name: String(firstYear) });
    await userEvent.click(yearOption);

    // 选择目标国家（至少一个）
    const countries = screen.getByRole('combobox', { name: '目标国家/地区 (可多选)' });
    await userEvent.click(countries);
    const countryOption = await screen.findByRole('option', { name: mockCountries[0] });
    await userEvent.click(countryOption);

    // 选择目标专业方向（至少一个）
    const targetMajors = screen.getByRole('combobox', { name: '目标专业方向 (可多选)' });
    await userEvent.click(targetMajors);
    const targetOption = await screen.findByRole('option', { name: mockTargetMajors[0] });
    await userEvent.click(targetOption);

    // 选择学位类型
    const degreeType = screen.getByRole('combobox', { name: '目标学位类型' });
    await userEvent.click(degreeType);
    const degreeOption = await screen.findByRole('option', { name: '硕士 (Master)' });
    await userEvent.click(degreeOption);

    // 提交
    const submit = screen.getByRole('button', { name: /完成并开始分析/ });
    await userEvent.click(submit);
    const form = containerEl!.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);
    await waitFor(() => {
      const errors = containerEl!.querySelectorAll('.ant-form-item-has-error');
      expect(errors.length).toBe(0);
    }, { timeout: 5000 });
  });
});


