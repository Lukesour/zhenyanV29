import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Progress, Card, List, Typography, Space, Button, Alert } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, ClockCircleOutlined, PlayCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import useProgressState from '../hooks/useProgressState';
import errorHandler from '../services/ErrorHandler';
import { apiService, AnalysisTask } from '../services/api';

const { Title, Text } = Typography;

interface ProgressDisplayProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
  isActive?: boolean; // 控制进度是否激活
  onStart?: () => void; // 开始进度的回调
  onCancel?: () => void; // 取消分析回调
  onRetry?: () => void; // 重试回调
  taskId?: string; // 异步任务ID
}

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ 
  onComplete, 
  onError, 
  isActive = false, 
  onStart,
  onCancel,
  onRetry,
  taskId
}) => {
  const [progressState, actions] = useProgressState();
  const [taskStatus, setTaskStatus] = useState<AnalysisTask | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);

  // 轮询任务状态
  useEffect(() => {
    if (!taskId || !isActive) return;

    const pollTaskStatus = async () => {
      try {
        const status = await apiService.getAnalysisStatus(taskId);
        setTaskStatus(status);
        setPollingError(null);
        
        // 如果任务完成或失败，通知父组件
        if (status.status === 'completed') {
          onComplete?.();
        } else if (status.status === 'failed') {
          onError?.(status.error || '分析任务执行失败');
        }
      } catch (error) {
        console.error('Error polling task status:', error);
        setPollingError('无法获取任务状态，请稍后重试');
      }
    };

    // 立即获取一次状态
    pollTaskStatus();
    
    // 每5秒轮询一次
    const interval = setInterval(pollTaskStatus, 5000);
    
    return () => clearInterval(interval);
  }, [taskId, isActive, onComplete, onError]);

  const handleStart = useCallback(() => {
    actions.start();
    onStart?.();
  }, [actions, onStart]);

  const handleCancel = useCallback(() => {
    actions.stop();
    onCancel?.();
  }, [actions, onCancel]);

  const handleRetry = useCallback(() => {
    actions.clearError();
    actions.reset();
    actions.start();
    onRetry?.();
  }, [actions, onRetry]);

  // 外部 isActive 控制开始/停止
  useEffect(() => {
    if (isActive && !progressState.isActive && !progressState.isCompleted) {
      actions.start();
    } else if (!isActive && progressState.isActive) {
      actions.stop();
    }
  }, [isActive, progressState.isActive, progressState.isCompleted, actions]);

  // 完成/错误回调
  useEffect(() => {
    if (progressState.isCompleted) {
      onComplete?.();
    }
  }, [progressState.isCompleted, onComplete]);

  useEffect(() => {
    if (progressState.hasError && progressState.errorMessage) {
      const { userMessage } = errorHandler.buildUserFacingError(progressState.errorMessage, {
        component: 'ProgressDisplay',
        action: 'progress'
      });
      onError?.(userMessage.title);
    }
  }, [progressState.hasError, progressState.errorMessage, onError]);

  const currentMessage = useMemo(() => {
    // 优先显示任务状态信息
    if (taskStatus) {
      switch (taskStatus.status) {
        case 'pending':
          return '分析任务已启动，正在等待处理...';
        case 'processing':
          return 'AI正在分析您的背景信息，这可能需要几分钟时间...';
        case 'completed':
          return '分析完成！';
        case 'failed':
          return `分析失败: ${taskStatus.error}`;
        default:
          return '正在分析...';
      }
    }
    
    // 回退到原有的进度状态
    const step = progressState.steps[progressState.currentStep];
    return progressState.stepTitle || step?.message || '正在分析...';
  }, [taskStatus, progressState.stepTitle, progressState.steps, progressState.currentStep]);

  // 计算实际进度
  const actualProgress = useMemo(() => {
    if (taskStatus?.progress !== undefined) {
      return taskStatus.progress;
    }
    return progressState.percentage;
  }, [taskStatus?.progress, progressState.percentage]);

  const getStepIcon = (step: { status: StepStatus }) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'in_progress':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStepDescription = (step: { message?: string; title: string }) => {
    return step.message || step.title;
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>AI 分析进行中</Title>
            <Text type="secondary">{currentMessage}</Text>
          </div>

          {/* 显示轮询错误 */}
          {pollingError && (
            <Alert
              message="状态更新失败"
              description={pollingError}
              type="warning"
              showIcon
              icon={<SyncOutlined />}
            />
          )}

          {/* 进度条 */}
          <Progress 
            percent={actualProgress} 
            status={taskStatus?.status === 'failed' ? 'exception' : undefined}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />

          {/* 任务状态信息 */}
          {taskStatus && (
            <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>任务状态: {taskStatus.status}</Text>
                {taskStatus.task_id && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    任务ID: {taskStatus.task_id}
                  </Text>
                )}
                {taskStatus.message && (
                  <Text type="secondary">{taskStatus.message}</Text>
                )}
              </Space>
            </Card>
          )}

          {/* 原有的步骤列表 */}
          <List
            size="small"
            dataSource={progressState.steps}
            renderItem={(step, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getStepIcon(step)}
                  title={step.title}
                  description={getStepDescription(step)}
                />
              </List.Item>
            )}
          />

          {/* 操作按钮 */}
          <Space style={{ width: '100%', justifyContent: 'center' }}>
            {!progressState.isActive && !progressState.isCompleted && (
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                onClick={handleStart}
                disabled={!isActive}
              >
                开始分析
              </Button>
            )}
            
            {progressState.isActive && !progressState.isCompleted && (
              <Button 
                icon={<CloseCircleOutlined />} 
                onClick={handleCancel}
              >
                取消分析
              </Button>
            )}
            
            {progressState.hasError && (
              <Button 
                type="primary" 
                icon={<SyncOutlined />} 
                onClick={handleRetry}
              >
                重试
              </Button>
            )}
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default ProgressDisplay;
