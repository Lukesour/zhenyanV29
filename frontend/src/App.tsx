import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import UserForm from './components/UserForm';
import AnalysisReport from './components/AnalysisReport';
import ProgressDisplay from './components/ProgressDisplay';
import ErrorDisplay from './components/ErrorDisplay';
import VerificationForm from './components/VerificationForm'; // 添加验证码表单组件
import { apiService, UserBackground, AnalysisReport as AnalysisReportType, AnalysisTask } from './services/api';
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
  currentTaskId: string | null; // 当前任务ID
}

function App() {
  // 统一的状态管理
  const [appState, setAppState] = useState<AppStateData>({
    currentStep: 'form',
    analysisReport: null,
    isLoading: false,
    isProgressActive: false,
    errorMessage: '',
    userBackground: null,
    currentTaskId: null
  });

  // 轮询定时器引用
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 清理轮询定时器
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // 状态更新函数
  const updateAppState = useCallback((updates: Partial<AppStateData>) => {
    setAppState((prevState: AppStateData) => {
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

  // 启动轮询任务状态
  const startPolling = useCallback((taskId: string) => {
    // 清理之前的轮询
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // 启动新的轮询，每5秒检查一次
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const taskStatus = await apiService.getAnalysisStatus(taskId);
        
        if (taskStatus.status === 'completed') {
          // 任务完成，停止轮询并显示结果
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          updateAppState({
            currentStep: 'report',
            analysisReport: taskStatus.result!,
            isLoading: false,
            isProgressActive: false,
            currentTaskId: null
          });
        } else if (taskStatus.status === 'failed') {
          // 任务失败，停止轮询并显示错误
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          updateAppState({
            currentStep: 'error',
            errorMessage: taskStatus.error || '分析任务执行失败',
            isLoading: false,
            isProgressActive: false,
            currentTaskId: null
          });
        }
        // 如果任务仍在进行中，继续轮询
      } catch (error) {
        console.error('Error polling task status:', error);
        // 轮询出错时，继续尝试，不中断流程
      }
    }, 5000);
  }, [updateAppState]);

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
      
      // 启动异步分析任务
      const task = await apiService.startAnalysisTask(appState.userBackground);
      
      console.log('Analysis task started:', task);
      
      // 保存任务ID并开始轮询
      updateAppState({ currentTaskId: task.task_id });
      startPolling(task.task_id);
      
    } catch (error) {
      console.error('Failed to start analysis task:', error);
      
      // 转换到错误状态
      updateAppState({
        currentStep: 'error',
        errorMessage: error instanceof Error ? error.message : '启动分析任务失败，请稍后重试',
        isLoading: false,
        isProgressActive: false
      });
    }
  };

  const handleBackToForm = () => {
    // 清理轮询定时器
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // 重置所有状态，回到表单
    updateAppState({
      currentStep: 'form',
      analysisReport: null,
      isLoading: false,
      isProgressActive: false,
      errorMessage: '',
      userBackground: null,
      currentTaskId: null
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
            taskId={appState.currentTaskId || undefined}
            onComplete={() => {
              // 进度完成后自动转换到报告状态
              if (appState.analysisReport) {
                updateAppState({ currentStep: 'report' });
              }
            }}
            onError={(errorMessage: string) => {
              updateAppState({
                currentStep: 'error',
                errorMessage,
                isLoading: false,
                isProgressActive: false
              });
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
