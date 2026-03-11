import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Card,
  Space,
  Modal,
  message
} from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { request } from '../utils/apiService';
import useLocalStorageState from 'use-local-storage-state'
import './login.scss';

const { Title } = Typography;

interface LoginFormData {
  account: string;
  password: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({ account: '', password: '' });
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerForm] = Form.useForm();
  const [user, setUser] = useLocalStorageState('adminUser', {defaultValue: null});

  const handleSubmit = async () => {
    const res = await request('POST', '/auth/login', formData);
    if (res.success) {
      navigate('/users')
      setUser(res.data.userDetails)
    } else {
      message.error(res.message || '登入失敗');
    }

  };

  const handleRegister = async (values: RegisterFormData) => {
    const res = await request('POST', '/auth/register', values);
    if (res.success) {
      message.success('註冊成功，請登入');
      setIsRegisterModalOpen(false);
      registerForm.resetFields();
    } else {
      message.error(res.message || '註冊失敗');
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Space direction="vertical" className="login-space">
          <Title level={3} className="login-title">管理員登入</Title>
          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="電子郵件"
              name="account"
              rules={[{ required: true, message: '請輸入電子郵件' }]}
              initialValue={formData.account}
            >
              <Input
                prefix={<MailOutlined />}
                value={formData.account}
                onChange={e => setFormData({ ...formData, account: e.target.value })}
              />
            </Form.Item>

            <Form.Item
              label="密碼"
              name="password"
              rules={[{ required: true, message: '請輸入密碼' }]}
              initialValue={formData.password}
            >
              <Input.Password
                prefix={<LockOutlined />}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" block>
              登入
            </Button>
          </Form>

          <Button type="link" block onClick={() => setIsRegisterModalOpen(true)}>
            沒有帳號？註冊
          </Button>
        </Space>
      </Card>

      <Modal
        title="註冊新帳號"
        open={isRegisterModalOpen}
        onCancel={() => setIsRegisterModalOpen(false)}
        onOk={() => registerForm.submit()}
        okText="註冊"
        cancelText="取消"
      >
        <Form layout="vertical" form={registerForm} onFinish={handleRegister}>
          <Form.Item
            label="用戶名"
            name="username"
            rules={[{ required: true, message: '請輸入用戶名' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            label="電子郵件"
            name="email"
            rules={[{ required: true, message: '請輸入電子郵件' }]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item
            label="密碼"
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
