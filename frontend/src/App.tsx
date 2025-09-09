import React, { useState, useCallback, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import UserForm from './components/UserForm';
import AnalysisReport from './components/AnalysisReport';
import ProgressDisplay from './components/ProgressDisplay';
import ErrorDisplay from './components/ErrorDisplay';
import AuthForm from './components/AuthForm';
import UserDashboard from './components/UserDashboard';
import SystemTest from './components/SystemTest';
import EmailVerificationDemo from './components/EmailVerificationDemo';
import DebugPanel from './components/DebugPanel';
import authService, { UserInfo, AuthState } from './services/authService';
import { UserBackground, AnalysisReport as AnalysisReportType } from './services/api';
import './App.css';

// 应用状态枚举
type AppState = 'auth' | 'form' | 'progress' | 'report' | 'error';

// 统一的状态接口
interface AppStateData {
  currentStep: AppState;
  analysisReport: AnalysisReportType | null;
  isLoading: boolean;
  isProgressActive: boolean;
  errorMessage: string;
  userBackground: UserBackground | null;
  authState: AuthState;
}

function App() {
  // 统一的状态管理
  const [appState, setAppState] = useState<AppStateData>({
    currentStep: 'form', // 默认显示表单
    analysisReport: null,
    isLoading: false,
    isProgressActive: false,
    errorMessage: '',
    userBackground: null,
    authState: authService.getAuthState()
  });

  // 状态更新函数
  const updateAppState = useCallback((updates: Partial<AppStateData>) => {
    console.log('updateAppState called with:', updates);
    setAppState(prev => {
      const newState = { ...prev, ...updates };
      console.log('App state updated from:', prev.currentStep, 'to:', newState.currentStep);
      return newState;
    });
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    const handleAuthStateChange = (newAuthState: AuthState) => {
      console.log('Auth state changed:', newAuthState);

      // 使用 setAppState 的函数形式来获取最新的状态
      setAppState(prevState => {
        console.log('Current step when auth changed:', prevState.currentStep);

        // 如果当前在进度页面或报告页面，不要重置状态
        if (prevState.currentStep === 'progress' || prevState.currentStep === 'report') {
          console.log('Skipping state change because user is in progress/report');
          return {
            ...prevState,
            authState: newAuthState
          };
        }

        // 只更新认证状态，不强制改变当前步骤
        return {
          ...prevState,
          authState: newAuthState
        };
      });
    };

    authService.addListener(handleAuthStateChange);

    // 初始化时检查认证状态
    const initialAuthState = authService.getAuthState();
    console.log('Initial auth state:', initialAuthState);
    updateAppState({
      authState: initialAuthState,
      currentStep: 'form' // 始终显示表单，让用户点击分析时再检查认证
    });

    return () => {
      authService.removeListener(handleAuthStateChange);
    };
  }, [updateAppState]);

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

  // 认证成功处理
  const handleAuthSuccess = async (userInfo: UserInfo, passedUserBackground?: UserBackground | null) => {
    console.log('User authenticated:', userInfo);
    console.log('Passed userBackground:', passedUserBackground);
    console.log('Current appState userBackground:', appState.userBackground);

    // 更新认证状态
    const newAuthState = authService.getAuthState();

    // 优先使用传递的userBackground，然后是appState中的userBackground
    const currentUserBackground = passedUserBackground || appState.userBackground;

    // 如果有保存的用户背景数据，登录后直接开始分析
    if (currentUserBackground) {
      console.log('有用户背景数据，跳转到进度页面:', currentUserBackground);

      // 使用 setTimeout 确保状态更新不会被其他逻辑覆盖
      setTimeout(() => {
        console.log('Delayed state update to progress page');
        updateAppState({
          currentStep: 'progress',
          isProgressActive: true,
          isLoading: true,
          authState: newAuthState,
          userBackground: currentUserBackground // 确保userBackground不会丢失
        });
      }, 100);
      // ProgressDisplay 组件会自动开始分析
    } else {
      console.log('没有用户背景数据，回到表单页面');
      // 否则回到表单页面，如果用户有个人信息，会自动填入表单
      updateAppState({
        currentStep: 'form',
        authState: newAuthState
      });
    }
  };

  // 注意：分析逻辑现在由 ProgressDisplay 组件处理

  // 退出登录处理
  const handleLogout = async () => {
    console.log('App.tsx: handleLogout 被调用'); // 调试日志

    try {
      console.log('App.tsx: 开始调用 authService.logout()'); // 调试日志
      // 先调用authService.logout()清除认证状态
      await authService.logout();
      console.log('App.tsx: authService.logout() 完成'); // 调试日志

      console.log('App.tsx: 开始更新应用状态'); // 调试日志
      // 然后更新应用状态
      updateAppState({
        currentStep: 'auth',
        authState: authService.getAuthState(), // 现在获取的是已清除的状态
        analysisReport: null,
        userBackground: null,
        errorMessage: ''
      });
      console.log('App.tsx: 应用状态更新完成'); // 调试日志
    } catch (error) {
      console.error('App.tsx: 退出登录失败:', error);
      // 即使出错也要清除本地状态
      updateAppState({
        currentStep: 'auth',
        authState: authService.getAuthState(),
        analysisReport: null,
        userBackground: null,
        errorMessage: ''
      });
    }
  };

  const handleFormSubmit = async (userBackground: UserBackground) => {
    console.log('handleFormSubmit called with:', userBackground);
    console.log('Current auth state:', appState.authState.isAuthenticated);

    // 检查用户是否已认证
    if (!appState.authState.isAuthenticated) {
      console.log('User not authenticated, saving userBackground and redirecting to auth');
      // 保存用户背景数据，登录后继续分析
      updateAppState({
        currentStep: 'auth',
        userBackground: userBackground,
        errorMessage: ''
      });
      return;
    }

    // 开始加载状态
    updateAppState({
      userBackground,
      isLoading: true,
      currentStep: 'progress',
      isProgressActive: true
    });

    // ProgressDisplay 组件会自动开始分析
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
      handleFormSubmit(appState.userBackground);
    }
  };

  // 渲染当前状态对应的组件
  const renderCurrentStep = () => {
    switch (appState.currentStep) {
      case 'auth':
        return (
          <AuthForm
            onAuthSuccess={handleAuthSuccess}
            onBackToForm={handleBackToForm}
            userBackground={appState.userBackground}
          />
        );

      case 'form':
        return (
          <div>
            {appState.authState.isAuthenticated && (
              <UserDashboard />
            )}
            <UserForm onSubmit={handleFormSubmit} />
          </div>
        );

      case 'progress':
        // 确保有用户背景数据才显示进度页面
        if (!appState.userBackground) {
          console.error('Progress page accessed without userBackground, redirecting to form');
          updateAppState({ currentStep: 'form' });
          return (
            <div>
              {appState.authState.isAuthenticated && (
                <UserDashboard />
              )}
              <UserForm onSubmit={handleFormSubmit} />
            </div>
          );
        }

        return (
          <div>
            <UserDashboard />
            <ProgressDisplay
              isActive={appState.isProgressActive}
              userBackground={appState.userBackground}
              onComplete={(result) => {
                // 进度完成后自动转换到报告状态
                updateAppState({
                  currentStep: 'report',
                  analysisReport: result,
                  isLoading: false,
                  isProgressActive: false
                });
              }}
              onError={(error) => {
                // 处理分析错误
                console.error('ProgressDisplay error:', error);
                updateAppState({
                  currentStep: 'error',
                  errorMessage: error,
                  isLoading: false,
                  isProgressActive: false
                });
              }}
            />
          </div>
        );

      case 'report':
        return (
          <div>
            <UserDashboard />
            <AnalysisReport
              report={appState.analysisReport!}
              onBackToForm={handleBackToForm}
            />
          </div>
        );

      case 'error':
        return (
          <div>
            <UserDashboard />
            <ErrorDisplay
              errorMessage={appState.errorMessage}
              onRetry={handleRetry}
              onBackToForm={handleBackToForm}
            />
          </div>
        );

      default:
        return (
          <AuthForm
            onAuthSuccess={handleAuthSuccess}
            onBackToForm={handleBackToForm}
            userBackground={appState.userBackground}
          />
        );
    }
  };

  // 检查URL参数决定显示哪个页面
  const urlParams = new URLSearchParams(window.location.search);
  const showTestPage = urlParams.get('test') === 'true';
  const showEmailDemo = urlParams.get('email-demo') === 'true';
  const showDebug = urlParams.get('debug') === 'true';

  return (
    <ConfigProvider locale={zhCN}>
      <div className="App">
        {showTestPage ? <SystemTest /> :
         showEmailDemo ? <EmailVerificationDemo /> :
         renderCurrentStep()}

        {/* 调试面板 */}
        <DebugPanel visible={showDebug} />
      </div>
    </ConfigProvider>
  );
}

export default App;
