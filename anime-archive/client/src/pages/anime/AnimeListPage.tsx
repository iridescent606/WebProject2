import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Spin, Empty, Button, Space } from 'antd';
import { PlusOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { animeAPI } from '../../api';

const { Title } = Typography;

export default function AnimeListPage() {
  const navigate = useNavigate();
  const [anime, setAnime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const { data } = await animeAPI.list({ limit: 100 });
      setAnime(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}><VideoCameraOutlined /> 动漫系列</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/anime/new')}>
          添加系列
        </Button>
      </div>

      {anime.length === 0 ? (
        <Empty description="暂无动漫系列" />
      ) : (
        <Row gutter={[16, 16]}>
          {anime.map((a: any) => (
            <Col xs={24} sm={12} md={8} lg={6} key={a.id}>
              <Card
                className="character-card"
                hoverable
                cover={
                  a.coverImage ? (
                    <img alt={a.title} src={a.coverImage} style={{ height: 200, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: 200, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 48 }}>
                      {a.title[0]}
                    </div>
                  )
                }
                onClick={() => navigate(`/anime/${a.id}`)}
              >
                <Card.Meta
                  title={a.title}
                  description={
                    <>
                      {a.titleJp && <div style={{ fontSize: 13, color: '#999' }}>{a.titleJp}</div>}
                      <Space size={4} style={{ marginTop: 8 }}>
                        <Tag>{a.genre?.split('/')[0] || '未知'}</Tag>
                        <Tag>{a._count?.characters || 0} 个角色</Tag>
                      </Space>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
