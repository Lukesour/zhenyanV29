import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, Tag, Row, Col } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import authService from '../services/authService';

const { Title, Text, Paragraph } = Typography;

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

const SystemTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: '认证服务初始化', status: 'pending' },
    { name: 'API连接测试', status: 'pending' },
    { name: '健康检查', status: 'pending' },
    { name: '邮箱验证服务', status: 'pending' },
    { name: '本地存储测试', status: 'pending' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0 });

  const updateTest = (index: number, status: 'success' | 'error', message?: string) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // 重置测试状态
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));

    try {
      // 测试1: 认证服务初始化
      try {
        const authState = authService.getAuthState();
        updateTest(0, 'success', `认证状态: ${authState.isAuthenticated ? '已登录' : '未登录'}`);
      } catch (error) {
        updateTest(0, 'error', `初始化失败: ${error}`);
      }

      // 测试2: API连接测试
      try {
        const response = await fetch('/api/auth/health');
        if (response.ok) {
          const data = await response.json();
          updateTest(1, 'success', `API状态: ${data.status}`);
        } else {
          updateTest(1, 'error', `API响应错误: ${response.status}`);
        }
      } catch (error) {
        updateTest(1, 'error', `API连接失败: ${error}`);
      }

      // 测试3: 健康检查
      try {
        const response = await fetch('/api/auth/health');
        if (response.ok) {
          const data = await response.json();
          const dbStatus = data.database === 'ok';
          const emailStatus = data.email_service === 'ok';
          const emailVerificationStatus = data.email_verification === 'ok';

          if (dbStatus && emailStatus && emailVerificationStatus) {
            updateTest(2, 'success', '所有服务正常');
          } else {
            updateTest(2, 'error', `数据库: ${data.database}, 邮件: ${data.email_service}, 邮箱验证: ${data.email_verification}`);
          }
        } else {
          updateTest(2, 'error', '健康检查失败');
        }
      } catch (error) {
        updateTest(2, 'error', `健康检查异常: ${error}`);
      }

      // 测试4: 邮箱验证服务
      try {
        const response = await fetch('/api/auth/health');
        if (response.ok) {
          const data = await response.json();
          const emailVerificationStatus = data.email_verification === 'ok';

          if (emailVerificationStatus) {
            updateTest(3, 'success', 'Hunter.io邮箱验证服务正常');
          } else {
            updateTest(3, 'error', 'Hunter.io邮箱验证服务异常');
          }
        } else {
          updateTest(3, 'error', '无法获取邮箱验证服务状态');
        }
      } catch (error) {
        updateTest(3, 'error', `邮箱验证服务测试异常: ${error}`);
      }

      // 测试5: 本地存储测试
      try {
        const testKey = 'system_test';
        const testValue = 'test_value';
        
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved === testValue) {
          updateTest(4, 'success', '本地存储功能正常');
        } else {
          updateTest(4, 'error', '本地存储读写失败');
        }
      } catch (error) {
        updateTest(4, 'error', `本地存储异常: ${error}`);
      }

    } finally {
      setIsRunning(false);
    }
  };

  // 计算测试总结
  useEffect(() => {
    const total = tests.length;
    const passed = tests.filter(test => test.status === 'success').length;
    const failed = tests.filter(test => test.status === 'error').length;
    setSummary({ total, passed, failed });
  }, [tests]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'pending':
        return isRunning ? <LoadingOutlined /> : null;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>🧪 系统功能测试</Title>
        <Paragraph>
          此页面用于测试箴言留学用户系统的各项功能是否正常工作。
        </Paragraph>

        <Space style={{ marginBottom: '24px' }}>
          <Button 
            type="primary" 
            onClick={runTests} 
            loading={isRunning}
            disabled={isRunning}
          >
            {isRunning ? '测试中...' : '开始测试'}
          </Button>
        </Space>

        <Divider />

        {/* 测试结果总览 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>{summary.total}</Title>
                <Text type="secondary">总测试数</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>{summary.passed}</Title>
                <Text type="secondary">通过</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>{summary.failed}</Title>
                <Text type="secondary">失败</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详细测试结果 */}
        <div>
          <Title level={4}>测试详情</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            {tests.map((test, index) => (
              <Card key={index} size="small">
                <Space align="start" style={{ width: '100%' }}>
                  <div style={{ minWidth: '24px' }}>
                    {getStatusIcon(test.status)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Space>
                      <Text strong>{test.name}</Text>
                      <Tag color={getStatusColor(test.status)}>
                        {test.status === 'pending' ? '等待中' : 
                         test.status === 'success' ? '通过' : '失败'}
                      </Tag>
                    </Space>
                    {test.message && (
                      <div style={{ marginTop: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {test.message}
                        </Text>
                      </div>
                    )}
                  </div>
                </Space>
              </Card>
            ))}
          </Space>
        </div>

        <Divider />

        {/* 测试结果总结 */}
        {summary.total > 0 && !isRunning && (
          <Alert
            type={summary.failed === 0 ? 'success' : 'warning'}
            message={
              summary.failed === 0 
                ? '🎉 所有测试通过！系统功能正常。'
                : `⚠️ ${summary.failed} 个测试失败，请检查系统配置。`
            }
            description={
              summary.failed === 0 
                ? '您的箴言留学用户系统已正确配置并可以正常使用。'
                : '部分功能可能无法正常工作，请参考错误信息进行修复。'
            }
            showIcon
          />
        )}

        <Divider />

        <div>
          <Title level={4}>系统信息</Title>
          <Space direction="vertical">
            <Text>
              <strong>当前时间:</strong> {new Date().toLocaleString()}
            </Text>
            <Text>
              <strong>用户代理:</strong> {navigator.userAgent.substring(0, 100)}...
            </Text>
            <Text>
              <strong>页面URL:</strong> {window.location.href}
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default SystemTest;
