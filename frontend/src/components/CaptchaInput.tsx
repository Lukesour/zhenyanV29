import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, Space, message, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../config';

interface CaptchaData {
  captcha_id: string;
  question: string;
  session_id: string;
}

interface CaptchaInputProps {
  onCaptchaChange: (captchaData: CaptchaData | null, answer: string) => void;
  disabled?: boolean;
}

const CaptchaInput: React.FC<CaptchaInputProps> = ({ onCaptchaChange, disabled = false }) => {
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取CAPTCHA
  const fetchCaptcha = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/captcha`);

      if (response.ok) {
        const data = await response.json();
        const newCaptchaData: CaptchaData = {
          captcha_id: data.captcha_id,
          question: data.question,
          session_id: data.session_id
        };
        setCaptchaData(newCaptchaData);
        setAnswer('');
        onCaptchaChange(newCaptchaData, '');
      } else {
        message.error('获取验证码失败');
        setCaptchaData(null);
        onCaptchaChange(null, '');
      }
    } catch (error) {
      console.error('获取CAPTCHA失败:', error);
      message.error('网络错误，请稍后重试');
      setCaptchaData(null);
      onCaptchaChange(null, '');
    } finally {
      setLoading(false);
    }
  }, [onCaptchaChange]);

  // 处理答案输入
  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    onCaptchaChange(captchaData, value);
  };

  // 组件挂载时获取CAPTCHA
  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold' }}>验证码：</span>
        {loading ? (
          <Spin size="small" style={{ marginLeft: '8px' }} />
        ) : (
          captchaData && (
            <span style={{ 
              marginLeft: '8px', 
              padding: '4px 8px', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '16px'
            }}>
              {captchaData.question}
            </span>
          )
        )}
      </div>
      
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="请输入计算结果"
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          disabled={disabled || loading || !captchaData}
          style={{ flex: 1 }}
          onPressEnter={(e) => e.preventDefault()}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchCaptcha}
          disabled={disabled || loading}
          title="刷新验证码"
        >
          刷新
        </Button>
      </Space.Compact>
      
      <div style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginTop: '4px' 
      }}>
        请计算上面的数学题并输入结果
      </div>
    </div>
  );
};

export default CaptchaInput;
