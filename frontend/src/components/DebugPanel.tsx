import React, { useState } from 'react';
import { Button, Input, Card, Typography, Space, Alert, Divider } from 'antd';
import { ApiOutlined, BugOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getApiBaseUrl } from '../config';

const { Text, Paragraph } = Typography;

interface DebugPanelProps {
  visible?: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ visible = false }) => {
  const [email, setEmail] = useState('h133239238@gmail.com');
  const [phone, setPhone] = useState('13800138000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const testSendCode = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('🧪 开始测试发送验证码...');
      console.log('📧 邮箱:', email);
      console.log('📱 手机:', phone);

      const response = await fetch(`${getApiBaseUrl()}/api/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone }),
      });

      console.log('📡 响应状态:', response.status);
      
      const data = await response.json();
      console.log('📄 响应数据:', data);

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          expires_in: data.expires_in,
          status: response.status
        });
      } else {
        setError(`请求失败 (${response.status}): ${data.message || data.detail || '未知错误'}`);
      }
    } catch (err: any) {
      console.error('❌ 请求异常:', err);
      setError(`网络错误: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/health`);
      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          health: data,
          status: response.status
        });
      } else {
        setError(`健康检查失败 (${response.status})`);
      }
    } catch (err: any) {
      setError(`健康检查异常: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <Space>
          <BugOutlined />
          <span>调试面板</span>
        </Space>
      }
      style={{ 
        position: 'fixed', 
        top: 20, 
        right: 20, 
        width: 400, 
        zIndex: 1000,
        maxHeight: '80vh',
        overflow: 'auto'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message="调试模式"
          description="这个面板用于测试验证码发送功能"
          type="info"
          showIcon
        />

        <div>
          <Text strong>邮箱地址:</Text>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            style={{ marginTop: 4 }}
          />
        </div>

        <div>
          <Text strong>手机号:</Text>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            style={{ marginTop: 4 }}
          />
        </div>

        <Space>
          <Button
            type="primary"
            icon={<ApiOutlined />}
            onClick={testSendCode}
            loading={loading}
          >
            发送验证码
          </Button>
          <Button
            icon={<CheckCircleOutlined />}
            onClick={testHealth}
            loading={loading}
          >
            健康检查
          </Button>
        </Space>

        {result && (
          <Alert
            message={result.success ? "请求成功" : "请求失败"}
            description={
              <div>
                {result.message && <div>消息: {result.message}</div>}
                {result.expires_in && <div>有效期: {result.expires_in}秒</div>}
                {result.health && (
                  <div>
                    <div>数据库: {result.health.database}</div>
                    <div>邮件服务: {result.health.email_service}</div>
                  </div>
                )}
                <div>状态码: {result.status}</div>
              </div>
            }
            type="success"
            showIcon
          />
        )}

        {error && (
          <Alert
            message="请求失败"
            description={error}
            type="error"
            showIcon
          />
        )}

        <Divider />

        <div>
          <Text strong>使用说明:</Text>
          <Paragraph style={{ fontSize: 12, marginTop: 8 }}>
            1. 填写邮箱和手机号<br/>
            2. 点击"发送验证码"<br/>
            3. 查看后端控制台输出<br/>
            4. 验证码格式: 🔢 验证码: 123456
          </Paragraph>
        </div>

        <div>
          <Text strong>服务地址:</Text>
          <Paragraph style={{ fontSize: 12, marginTop: 8 }}>
            前端: <a href="http://localhost:3001" target="_blank" rel="noreferrer">localhost:3001</a><br/>
            后端: <a href="http://localhost:8000" target="_blank" rel="noreferrer">localhost:8000</a><br/>
            API文档: <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">API Docs</a>
          </Paragraph>
        </div>
      </Space>
    </Card>
  );
};

export default DebugPanel;
