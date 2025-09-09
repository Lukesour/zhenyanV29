import React, { useState } from 'react';
import { Form, Input, Button, Card, Row, Col, message, Typography, Space, Tabs, Divider } from 'antd';
import { MailOutlined, PhoneOutlined, SafetyOutlined, GiftOutlined } from '@ant-design/icons';
import CaptchaInput from './CaptchaInput';
import { UserBackground } from '../services/api';
import './AuthForm.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface AuthFormProps {
  onAuthSuccess: (userInfo: any) => void;
  onBackToForm: () => void;
  userBackground?: UserBackground | null; // 添加用户背景数据，用于注册时保存
}

interface UserInfo {
  id: number;
  phone: string;
  email: string;
  remaining_analyses: number;
  total_analyses_used: number;
  invitation_code: string;
  invited_count: number;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_info: UserInfo;
}

const AuthForm: React.FC<AuthFormProps> = ({
  onAuthSuccess,
  onBackToForm,
  userBackground
}) => {
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [captchaData, setCaptchaData] = useState<any>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // 发送验证码
  const sendVerificationCode = async (email: string, phone: string) => {
    try {
      // 检查CAPTCHA
      if (!captchaData || !captchaAnswer.trim()) {
        message.error('请完成验证码验证');
        return false;
      }

      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
          captcha_id: captchaData.captcha_id,
          captcha_answer: captchaAnswer,
          session_id: captchaData.session_id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('验证码已发送到您的邮箱，请查收');
        setIsCodeSent(true);
        startCountdown();
        // 重置CAPTCHA
        setCaptchaData(null);
        setCaptchaAnswer('');
        return true;
      } else {
        message.error(data.detail || '发送验证码失败');
        // 重置CAPTCHA
        setCaptchaData(null);
        setCaptchaAnswer('');
        return false;
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      // 重置CAPTCHA
      setCaptchaData(null);
      setCaptchaAnswer('');
      return false;
    }
  };

  // 倒计时
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCodeSent(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 用户注册
  const handleRegister = async (values: any) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: values.phone,
          email: values.email,
          verification_code: values.verification_code,
          invitation_code: values.invitation_code || null,
          profile_data: userBackground || null, // 添加个人信息数据
        }),
      });

      if (response.ok) {
        const data: LoginResponse = await response.json();
        message.success('注册成功！欢迎使用箴言留学');

        // 保存用户信息和令牌
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_info', JSON.stringify(data.user_info));

        onAuthSuccess(data.user_info);
      } else {
        const errorData = await response.json();
        message.error(errorData.detail || '注册失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 用户登录
  const handleLogin = async (values: any) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: values.phone,
          email: values.email,
          verification_code: values.verification_code,
        }),
      });

      if (response.ok) {
        const data: LoginResponse = await response.json();
        message.success('登录成功！');

        // 保存用户信息和令牌
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_info', JSON.stringify(data.user_info));

        onAuthSuccess(data.user_info);
      } else {
        const errorData = await response.json();
        message.error(errorData.detail || '登录失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // CAPTCHA变化处理
  const handleCaptchaChange = (data: any, answer: string) => {
    setCaptchaData(data);
    setCaptchaAnswer(answer);
  };

  // 发送验证码按钮点击
  const handleSendCode = async () => {
    try {
      if (activeTab === 'register') {
        const values = await registerForm.validateFields(['email', 'phone']);
        await sendVerificationCode(values.email, values.phone);
      } else {
        const values = await loginForm.validateFields(['email', 'phone']);
        await sendVerificationCode(values.email, values.phone);
      }
    } catch (error) {
      // 表单验证失败
    }
  };



  return (
    <div className="auth-container">
      <div className="auth-content">
        <Row gutter={[48, 24]} align="middle" justify="center">
          {/* 左侧：登录注册表单 */}
          <Col xs={24} lg={12}>
            <Card className="auth-card">
              <div className="auth-header">
                <Title level={2} className="auth-title">
                  箴言留学
                </Title>
                <Text type="secondary" className="auth-subtitle">
                  请登录或注册以开始您的留学申请分析
                </Text>
              </div>

              <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
                <TabPane tab="登录" key="login">
                  <Form
                    form={loginForm}
                    onFinish={handleLogin}
                    layout="vertical"
                    className="auth-form"
                  >
                    <Form.Item
                      name="phone"
                      label="手机号"
                      rules={[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="请输入手机号"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      label="邮箱"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="请输入注册时使用的邮箱"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item label="图形验证码">
                      <CaptchaInput
                        onCaptchaChange={handleCaptchaChange}
                        disabled={isLoading}
                      />
                    </Form.Item>

                    <Form.Item
                      name="verification_code"
                      label="邮箱验证码"
                      rules={[
                        { required: true, message: '请输入验证码' },
                        { len: 6, message: '验证码为6位数字' }
                      ]}
                    >
                      <Input
                        prefix={<SafetyOutlined />}
                        placeholder="请输入邮箱验证码"
                        size="large"
                        maxLength={6}
                        suffix={
                          <Button
                            type="link"
                            size="small"
                            onClick={handleSendCode}
                            disabled={isCodeSent}
                          >
                            {isCodeSent ? `${countdown}s后重发` : '发送验证码'}
                          </Button>
                        }
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={isLoading}
                        block
                      >
                        登录
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>

                <TabPane tab="注册" key="register">
                  <Form
                    form={registerForm}
                    onFinish={handleRegister}
                    layout="vertical"
                    className="auth-form"
                  >
                    <Form.Item
                      name="phone"
                      label="手机号"
                      rules={[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="请输入手机号"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      label="邮箱"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="请输入邮箱地址"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item label="图形验证码">
                      <CaptchaInput
                        onCaptchaChange={handleCaptchaChange}
                        disabled={isLoading}
                      />
                    </Form.Item>

                    <Form.Item
                      name="verification_code"
                      label="邮箱验证码"
                      rules={[
                        { required: true, message: '请输入验证码' },
                        { len: 6, message: '验证码为6位数字' }
                      ]}
                    >
                      <Input
                        prefix={<SafetyOutlined />}
                        placeholder="请输入邮箱验证码"
                        size="large"
                        maxLength={6}
                        suffix={
                          <Button
                            type="link"
                            size="small"
                            onClick={handleSendCode}
                            disabled={isCodeSent}
                          >
                            {isCodeSent ? `${countdown}s后重发` : '发送验证码'}
                          </Button>
                        }
                      />
                    </Form.Item>

                    <Form.Item
                      name="invitation_code"
                      label="邀请码（可选）"
                    >
                      <Input
                        prefix={<GiftOutlined />}
                        placeholder="输入邀请码可获得额外分析机会"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={isLoading}
                        block
                      >
                        注册
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>
              </Tabs>

              <Divider />

              <div className="auth-tips">
                <Text type="secondary">
                  <ul>
                    <li>注册即可获得3次免费分析机会</li>
                    <li>每邀请一位新用户注册，您将获得3次额外分析机会</li>
                    <li>如遇问题，请联系客服获取帮助</li>
                  </ul>
                </Text>
              </div>
            </Card>
          </Col>

          {/* 右侧：客服信息 */}
          <Col xs={24} lg={12}>
            <Card className="contact-card">
              <div className="contact-content">
                <div className="contact-header">
                  <Title level={4} className="contact-title">
                    需要帮助？
                  </Title>
                  <Text type="secondary" className="contact-subtitle">
                    联系我们的客服团队
                  </Text>
                </div>

                <div className="contact-image-container">
                  <div className="contact-qr-container">
                    <img 
                      src="/wechat-qr.jpg" 
                      alt="客服微信二维码" 
                      className="contact-qr-image"
                    />
                    <Text className="qr-caption">扫描二维码添加客服</Text>
                  </div>
                </div>

                <div className="contact-info">
                  <Space direction="vertical" size="small" className="contact-details">
                    <Text strong>客服微信号1：</Text>
                    <Text copyable className="contact-id">Godeternitys</Text>

                    <Text strong>客服微信号2：</Text>
                    <Text copyable className="contact-id">MalachiSuan</Text>

                    <Text strong>服务时间：</Text>
                    <Text>周一至周日 9:00-21:00</Text>
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AuthForm;
