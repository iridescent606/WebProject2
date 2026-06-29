import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, Tag, Spin, Empty, Space } from 'antd';
import { FireOutlined, ClockCircleOutlined, StarOutlined, HeartOutlined, TeamOutlined, VideoCameraOutlined, TagsOutlined } from '@ant-design/icons';
import { characterAPI, animeAPI } from '../api';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const [hotCharacters, setHotCharacters] = useState<any[]>([]);
  const [recentCharacters, setRecentCharacters] = useState<any[]>([]);
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ characters: 0, anime: 0, tags: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [hotRes, recentRes, animeRes] = await Promise.all([
        characterAPI.list({ limit: 8, sort: 'avgRating', page: 1 }),
        characterAPI.list({ limit: 8, sort: 'createdAt', page: 1 }),
        animeAPI.list({ limit: 6 }),
      ] as any);
      setHotCharacters(hotRes?.data?.data || []);
      setRecentCharacters(recentRes?.data?.data || []);
      setAnimeList(animeRes?.data?.data || []);
      setStats({
        characters: hotRes?.data?.total || 0,
        anime: animeRes?.data?.total || 0,
        tags: 12,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div className="hero-banner" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Title level={1} style={{ color: 'white', marginBottom: 8 }}>🎬 动漫人物档案</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
          探索、创建、收藏你喜爱的动漫角色。与同好交流讨论，构建属于你的二次元角色图鉴。
        </Paragraph>

        <Row gutter={24} style={{ marginTop: 32, maxWidth: 800, margin: '32px auto 0' }}>
          <Col span={8}>
            <Card style={{ background: 'rgba(255,255,255,0.15)', border: 'none' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>角色总数</span>} value={stats.characters} valueStyle={{ color: 'white' }} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ background: 'rgba(255,255,255,0.15)', border: 'none' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>动漫系列</span>} value={stats.anime} valueStyle={{ color: 'white' }} prefix={<VideoCameraOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ background: 'rgba(255,255,255,0.15)', border: 'none' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>标签数量</span>} value={stats.tags || 12} valueStyle={{ color: 'white' }} prefix={<TagsOutlined />} />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="page-container">
        {/* Hot Characters */}
        <div style={{ marginBottom: 40 }}>
          <Title level={3}><FireOutlined style={{ color: '#f5222d' }} /> 热门角色</Title>
          {hotCharacters.length === 0 ? (
            <Empty description="暂无角色数据" />
          ) : (
            <Row gutter={[16, 16]}>
              {hotCharacters.map((char: any) => (
                <Col xs={12} sm={8} md={6} lg={6} key={char.id}>
                  <Card
                    className="character-card"
                    hoverable
                    cover={
                      char.images?.[0] ? (
                        <img alt={char.name} src={char.images[0].url} />
                      ) : (
                        <div style={{ height: 240, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                          🎭
                        </div>
                      )
                    }
                    onClick={() => navigate(`/characters/${char.id}`)}
                  >
                    <Card.Meta
                      title={char.name}
                      description={
                        <Space size={4} wrap>
                          {char.anime && <Tag color="purple">{char.anime.title}</Tag>}
                          {char.tags?.slice(0, 3).map((t: any) => (
                            <Tag key={t.tag.id} color={t.tag.color}>{t.tag.name}</Tag>
                          ))}
                        </Space>
                      }
                    />
                    <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                      <StarOutlined style={{ color: '#fadb14' }} /> {(char.avgRating || 0).toFixed(1)} · <HeartOutlined /> {char._count?.favorites || 0} 收藏
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* Recent Characters */}
        <div style={{ marginBottom: 40 }}>
          <Title level={3}><ClockCircleOutlined /> 最新添加</Title>
          {recentCharacters.length === 0 ? (
            <Empty description="暂无最新角色" />
          ) : (
            <Row gutter={[16, 16]}>
              {recentCharacters.map((char: any) => (
                <Col xs={12} sm={8} md={6} lg={6} key={char.id}>
                  <Card
                    className="character-card"
                    hoverable
                    cover={
                      char.images?.[0] ? (
                        <img alt={char.name} src={char.images[0].url} />
                      ) : (
                        <div style={{ height: 240, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                          🎭
                        </div>
                      )
                    }
                    onClick={() => navigate(`/characters/${char.id}`)}
                  >
                    <Card.Meta
                      title={char.name}
                      description={
                        <>
                          {char.anime && <Tag color="purple">{char.anime.title}</Tag>}
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{dayjs(char.createdAt).format('YYYY-MM-DD')}</div>
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* Anime Series */}
        <div style={{ marginBottom: 40 }}>
          <Title level={3}><VideoCameraOutlined /> 动漫系列</Title>
          {animeList.length === 0 ? (
            <Empty description="暂无动漫系列" />
          ) : (
            <Row gutter={[16, 16]}>
              {animeList.map((anime: any) => (
                <Col xs={12} sm={8} md={6} lg={6} key={anime.id}>
                  <Card
                    className="character-card"
                    hoverable
                    cover={
                      anime.coverImage ? (
                        <img alt={anime.title} src={anime.coverImage} />
                      ) : (
                        <div style={{ height: 240, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'white' }}>
                          {anime.title[0]}
                        </div>
                      )
                    }
                    onClick={() => navigate(`/anime/${anime.id}`)}
                  >
                    <Card.Meta
                      title={anime.title}
                      description={
                        <>
                          <div>{anime.titleJp}</div>
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{anime._count?.characters || 0} 个角色 · {anime.episodeCount || '?'} 集</div>
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </div>
  );
}


