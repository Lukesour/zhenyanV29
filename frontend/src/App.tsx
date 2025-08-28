import React, { useState, useCallback } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import UserForm from './components/UserForm';
import AnalysisReport from './components/AnalysisReport';
import ProgressDisplay from './components/ProgressDisplay';
import ErrorDisplay from './components/ErrorDisplay';
import VerificationForm from './components/VerificationForm'; // 添加验证码表单组件
import { apiService, UserBackground, AnalysisReport as AnalysisReportType } from './services/api';
import './App.css';

// 应用状态枚举
type AppState = 'form' | 'verification' | 'progress' | 'report' | 'error';

// 统一的状态接口
interface AppStateData {
  currentStep: AppState;
  analysisReport: AnalysisReportType | null;
  isLoading: boolean;
  isProgressActive: boolean;
  errorMessage: string;
  userBackground: UserBackground | null; // 添加用户背景数据存储
}

function App() {
  // 统一的状态管理
  const [appState, setAppState] = useState<AppStateData>({
    currentStep: 'form',
    analysisReport: null,
    isLoading: false,
    isProgressActive: false,
    errorMessage: '',
    userBackground: null
  });

  // 状态验证函数（保留以备将来使用）
  // const validateStateTransition = useCallback((fromState: AppState, toState: AppState): boolean => {
  //   const validTransitions: Record<AppState, AppState[]> = {
  //     form: ['verification', 'error'],
  //     verification: ['progress', 'error', 'form'],
  //     progress: ['report', 'error', 'form'],
  //     report: ['form'],
  //     error: ['form']
  //   };
  //   
  //   return validTransitions[fromState]?.includes(toState) || false;
  // }, []);

  // 状态更新函数
  const updateAppState = useCallback((updates: Partial<AppStateData>) => {
    setAppState(prevState => {
      const newState = { ...prevState, ...updates };
      
      // 状态一致性验证
      if (newState.currentStep === 'progress' && !newState.isProgressActive) {
        console.warn('Progress step should have isProgressActive = true');
      }
      
      if (newState.currentStep === 'form' && newState.isProgressActive) {
        console.warn('Form step should not have isProgressActive = true');
      }
      
      if (newState.currentStep === 'error' && !newState.errorMessage) {
        console.warn('Error step should have errorMessage');
      }
      
      return newState;
    });
  }, []);

  // 状态转换函数（保留以备将来使用）
  // const transitionToState = useCallback((newStep: AppState, additionalUpdates?: Partial<AppStateData>) => {
  //   if (!validateStateTransition(appState.currentStep, newStep)) {
  //     console.error(`Invalid state transition from ${appState.currentStep} to ${newStep}`);
  //     return;
  //     }
  //   
  //   const updates: Partial<AppStateData> = {
  //     currentStep: newStep,
  //     ...additionalUpdates
  //   };
  //   
  //   updateAppState(updates);
  // }, [appState.currentStep, validateStateTransition, updateAppState]);

  const handleFormSubmit = async (userBackground: UserBackground) => {
    // 存储用户背景数据并转换到验证状态
    updateAppState({ 
      userBackground,
      currentStep: 'verification'
    });
  };

  const handleVerificationSuccess = async () => {
    if (!appState.userBackground) {
      console.error('No user background data available');
      return;
    }

    // 开始加载状态
    updateAppState({ isLoading: true });
    
    try {
      console.log('Starting analysis with verified user background:', appState.userBackground);
      
      // 转换到进度状态
      updateAppState({ 
        currentStep: 'progress',
        isProgressActive: true 
      });
      
      // 开始分析
      const report = await apiService.analyzeUserBackground(appState.userBackground);
      
      console.log('Analysis report received:', report);
      
      // 分析完成，转换到报告状态
      updateAppState({
        currentStep: 'report',
        analysisReport: report,
        isLoading: false,
        isProgressActive: false
      });
      
    } catch (error) {
      console.error('Analysis failed:', error);
      
      // 转换到错误状态
      updateAppState({
        currentStep: 'error',
        errorMessage: error instanceof Error ? error.message : '分析失败，请稍后重试',
        isLoading: false,
        isProgressActive: false
      });
    }
  };

  const handleBackToForm = () => {
    // 重置所有状态，回到表单
    updateAppState({
      currentStep: 'form',
      analysisReport: null,
      isLoading: false,
      isProgressActive: false,
      errorMessage: '',
      userBackground: null
    });
  };

  const handleRetry = () => {
    // 重试分析
    if (appState.userBackground) {
      handleVerificationSuccess();
    }
  };

  // 渲染当前状态对应的组件
  const renderCurrentStep = () => {
    switch (appState.currentStep) {
      case 'form':
        return <UserForm onSubmit={handleFormSubmit} />;
      
      case 'verification':
        return (
          <VerificationForm 
            onVerificationSuccess={handleVerificationSuccess}
            onBackToForm={handleBackToForm}
          />
        );
      
      case 'progress':
        return (
          <ProgressDisplay 
            isActive={appState.isProgressActive}
            onComplete={() => {
              // 进度完成后自动转换到报告状态
              if (appState.analysisReport) {
                updateAppState({ currentStep: 'report' });
              }
            }}
          />
        );
      
      case 'report':
        return (
          <AnalysisReport 
            report={appState.analysisReport!}
            onBackToForm={handleBackToForm}
          />
        );
      
      case 'error':
        return (
          <ErrorDisplay 
            errorMessage={appState.errorMessage}
            onRetry={handleRetry}
            onBackToForm={handleBackToForm}
          />
        );
      
      default:
        return <UserForm onSubmit={handleFormSubmit} />;
    }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div className="App">
        {renderCurrentStep()}
      </div>
    </ConfigProvider>
  );
}

export default App;
