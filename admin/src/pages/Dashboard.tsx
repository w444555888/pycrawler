import React from 'react';
import { Layout, Menu } from 'antd';
import {
  UserOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  ScheduleOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useLocalStorageState from 'use-local-storage-state'
import { logout } from '../utils/auth';
import './dashboard.scss';

const { Header, Sider, Content } = Layout;

const Dashboard: React.FC = () => {
  interface AdminUser {
    _id: string;
    username: string;
    email: string;
    isAdmin: boolean;
    createdAt?: string;
    updatedAt?: string;
  }

  const navigate = useNavigate();
  const location = useLocation();
  const [adminUser] = useLocalStorageState<AdminUser | null>('adminUser', { defaultValue: null, });

  const menuItems = [
    { key: 'users', icon: <UserOutlined />, label: '用戶管理' },
    { key: 'hotels', icon: <HomeOutlined />, label: '飯店管理' },
    { key: 'hotel-flash-sale', icon: <FileDoneOutlined />, label: '飯店限時搶購' },
    { key: 'flash-sale-orders', icon: <ShoppingCartOutlined />, label: '搶購訂單' },
    { key: 'subscribe', icon: <MailOutlined />, label: '訂閱管理' }, 
    { key: 'flights', icon: <ScheduleOutlined />, label: '航班管理' },
    { key: 'orders', icon: <ShoppingCartOutlined />, label: '訂單管理' },
    { key: 'flight-orders', icon: <FileDoneOutlined />, label: '機票訂單' }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/${key}`);
  };

  return (
    <Layout className="dashboard">
      <Sider width={200} theme="dark" collapsible>
        <div className="dashboard__logo">
          <DashboardOutlined className="dashboard__icon" />
          訂房後台
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[menuItems.find(item => location.pathname.startsWith(item.key))?.key || '']}
          onClick={handleMenuClick}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="dashboard__header">
          <div className="dashboard__header-content">
            <span className="dashboard__welcome">
              <UserOutlined
                className={`dashboard__icon ${adminUser?.isAdmin ? 'dashboard__icon--admin' : ''}`}
              />
              {adminUser?.username}
            </span>
            <button
              className="dashboard__logout"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              登出
            </button>
          </div>
        </Header>
        <Content className="dashboard__content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
