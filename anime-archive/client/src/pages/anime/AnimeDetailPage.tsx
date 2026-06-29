import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Row, Col, Tag, Spin, Descriptions, Space, Button, Empty } from 'antd';
import { ArrowLeftOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { animeAPI } from '../../api';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

export default function AnimeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadAnime();
  }, [id]);

  async function loadAnime() {
    try {
      const { data } = await animeAPI.get(id!);
      setAnime(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!anime) return <Empty description="动漫系列未找到" />;

  return (
    <div className="page-container">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            {anime.coverImage ? (
              <img alt={anime.title} src={anime.coverImage} style={{ width: '100%', borderRadius: 8 }} />
            ) : (
              <div style={{ width: '100%', height: 300, borderRadius: 8, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 64 }}>
                {anime.title[0]}
              </div>
            )}
          </Col>
          <Col xs={24} md={16}>
            <Title level={2}>{anime.title}</Title>
            {anime.titleJp && <Title level={4} type="secondary">{anime.titleJp}</Title>}

            <Descriptions column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="类型">{anime.genre || '未知'}</Descriptions.Item>
              <Descriptions.Item label="集数">{anime.episodeCount || '未知'}</Descriptions.Item>
              <Descriptions.Item label="制作公司">{anime.studio || '未知'}</Descriptions.Item>
              <Descriptions.Item label="首播日期">
                {anime.releaseDate ? dayjs(anime.releaseDate).format('YYYY年MM月DD日') : '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="角色数量"><Tag color="purple">{anime._count?.characters || 0}</Tag></Descriptions.Item>
            </Descriptions>

            {anime.description && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>简介</Title>
                <Paragraph>{anime.description}</Paragraph>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Characters in this anime */}
      <Title level={3} style={{ marginTop: 32 }}><TeamOutlined /> 角色列表</Title>
      {anime.characters?.length === 0 ? (
        <Empty description="暂无角色" />
      ) : (
        <Row gutter={[16, 16]}>
          {anime.characters?.map((char: any) => (
            <Col xs={12} sm={8} md={6} lg={4} key={char.id}>
              <Card
                className="character-card"
                hoverable
                cover={
                  char.images?.[0] ? (
                    <img alt={char.name} src={char.images[0].url} style={{ height: 180, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: 180, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                      🎭
                    </div>
                  )
                }
                onClick={() => navigate(`/characters/${char.id}`)}
              >
                <Card.Meta title={char.name} description={char.nameJp} />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
