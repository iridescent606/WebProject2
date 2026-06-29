import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Already logged in → redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: { login: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.login, values.password);
      message.success('登录成功！');
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || '登录失败，请检查网络连接';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 134px)', background: '#f0f2f5', padding: 24 }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 4 }}>🎬 欢迎回来</Title>
          <Text type="secondary">登录你的动漫档案账号</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="login" rules={[{ required: true, message: '请输入邮箱或用户名' }]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱或用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">还没有账号？</Text> <Link to="/register">去注册</Link>
        </div>
      </Card>
    </div>
  );
}
