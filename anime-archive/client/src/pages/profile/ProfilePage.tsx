import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Tabs, List, Avatar, Tag, Button, Space, Empty, Spin } from 'antd';
import { HeartOutlined, StarOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { favoriteAPI, characterAPI } from '../../api';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      const [favRes, charRes] = await Promise.all([
        favoriteAPI.list({ limit: 50 }),
        characterAPI.list({ limit: 50, sort: 'createdAt' }),
      ]);
      setFavorites(favRes.data.data);
      // Filter to user's own characters (we'll use the API to show all for now)
      setMyCharacters(charRes.data.data.filter((c: any) => c.createdById === user?.id));
    } catch {} finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 24 }}>
        <Space size={24}>
          <Avatar size={64} icon={<UserOutlined />} src={user?.avatar} />
          <div>
            <Title level={3} style={{ margin: 0 }}>{user?.username}</Title>
            <p style={{ color: '#999', margin: 0 }}>{user?.email}</p>
            {user?.bio && <p>{user.bio}</p>}
          </div>
        </Space>
      </Card>

      <Tabs
        defaultActiveKey="favorites"
        items={[
          {
            key: 'favorites',
            label: <span><HeartOutlined /> 我的收藏</span>,
            children: (
              favorites.length === 0 ? (
                <Empty description="还没有收藏任何角色" />
              ) : (
                <List
                  dataSource={favorites}
                  renderItem={(fav: any) => (
                    <List.Item
                      key={fav.id}
                      actions={[
                        <Button type="link" onClick={() => navigate(`/characters/${fav.character?.id}`)}>查看</Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            shape="square"
                            size={48}
                            src={fav.character?.images?.[0]?.url}
                            icon={<UserOutlined />}
                          />
                        }
                        title={fav.character?.name}
                        description={
                          <Space size={4}>
                            {fav.character?.tags?.map((t: any) => (
                              <Tag key={t.tag.id} color={t.tag.color}>{t.tag.name}</Tag>
                            ))}
                            <span style={{ fontSize: 12, color: '#999' }}>收藏于 {dayjs(fav.createdAt).format('YYYY-MM-DD')}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            ),
          },
          {
            key: 'created',
            label: <span><UserOutlined /> 我创建的</span>,
            children: (
              myCharacters.length === 0 ? (
                <Empty description="还没有创建任何角色">
                  <Button type="primary" onClick={() => navigate('/characters/new')}>创建第一个角色</Button>
                </Empty>
              ) : (
                <List
                  dataSource={myCharacters}
                  renderItem={(char: any) => (
                    <List.Item
                      key={char.id}
                      actions={[
                        <Button type="link" onClick={() => navigate(`/characters/${char.id}`)}>查看</Button>,
                        <Button type="link" onClick={() => navigate(`/characters/${char.id}/edit`)}>编辑</Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            shape="square"
                            size={48}
                            src={char.images?.[0]?.url}
                            icon={<UserOutlined />}
                          />
                        }
                        title={char.name}
                        description={
                          <Space size={4}>
                            <StarOutlined style={{ color: '#fadb14' }} />
                            <span>{(char.avgRating || 0).toFixed(1)}</span>
                            <HeartOutlined /> <span>{char._count?.favorites || 0}</span>
                            <span style={{ fontSize: 12, color: '#999' }}>创建于 {dayjs(char.createdAt).format('YYYY-MM-DD')}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            ),
          },
        ]}
      />
    </div>
  );
}
