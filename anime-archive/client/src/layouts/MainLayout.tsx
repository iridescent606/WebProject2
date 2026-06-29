import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Space, theme as antdTheme } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  TagsOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  PlusOutlined,
  SwapOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Header, Content, Footer } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark', !darkMode);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/anime', icon: <VideoCameraOutlined />, label: '动漫系列' },
    { key: '/characters', icon: <TeamOutlined />, label: '角色档案' },
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'compare', icon: <SwapOutlined />, label: '角色对比' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: darkMode ? '#141414' : '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div
            style={{ fontSize: 20, fontWeight: 700, cursor: 'pointer', color: '#722ed1' }}
            onClick={() => navigate('/')}
          >
            🎬 动漫档案
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname === '/' ? '/' : '/' + location.pathname.split('/')[1]]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ border: 'none', background: 'transparent', flex: 1 }}
          />
        </div>

        <Space size="middle">
          <Button
            type="text"
            icon={darkMode ? <BulbFilled /> : <BulbOutlined />}
            onClick={toggleDark}
          />
          {isAuthenticated ? (
            <>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/characters/new')}>
                创建角色
              </Button>
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: ({ key }) => {
                    if (key === 'logout') handleLogout();
                    else if (key === 'compare') navigate('/characters/compare');
                    else navigate(`/${key}`);
                  },
                }}
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} src={user?.avatar} />
                  <span>{user?.username}</span>
                </Space>
              </Dropdown>
            </>
          ) : (
            <Space>
              <Button icon={<LoginOutlined />} onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                注册
              </Button>
            </Space>
          )}
        </Space>
      </Header>

      <Content>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', background: darkMode ? '#141414' : '#fafafa' }}>
        <div>🎬 动漫人物档案 © 2026 · Built with React + Node.js + Ant Design</div>
      </Footer>
    </Layout>
  );
}
