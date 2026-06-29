import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Tag, Spin, Descriptions, Space, Button, Image, Rate,
  Tabs, List, Avatar, Form, Input, message, Empty, Modal, Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, HeartOutlined, HeartFilled,
  StarFilled, UploadOutlined, PlusOutlined, ExportOutlined, UserOutlined,
} from '@ant-design/icons';
import { characterAPI, favoriteAPI, ratingAPI, commentAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

const CHARACTER_TYPE_LABELS: Record<string, string> = {
  PROTAGONIST: '主角', ANTAGONIST: '反派', DEUTERAGONIST: '准主角',
  SUPPORTING: '配角', MINOR: '次要角色', OTHER: '其他',
};
const GENDER_LABELS: Record<string, string> = { MALE: '男', FEMALE: '女', UNKNOWN: '未知' };
const BLOOD_LABELS: Record<string, string> = { A: 'A型', B: 'B型', AB: 'AB型', O: 'O型', UNKNOWN: '未知' };
const RELATIONSHIP_LABELS: Record<string, string> = {
  FRIEND: '朋友', ENEMY: '敌人', RIVAL: '对手', LOVER: '恋人',
  FAMILY: '家人', MENTOR: '导师', STUDENT: '学生', COLLEAGUE: '同伴', OTHER: '其他',
};

export default function CharacterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (id) loadCharacter();
  }, [id]);

  useEffect(() => {
    if (id) loadComments();
  }, [id]);

  async function loadCharacter() {
    try {
      const { data } = await characterAPI.get(id!);
      setCharacter(data);
      setIsFavorited(data.isFavorited);
      setUserRating(data.userRating);
    } catch (err) {
      message.error('角色未找到');
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    try {
      const { data } = await commentAPI.list(id!);
      setComments(data.data);
    } catch {}
  }

  async function handleFavorite() {
    if (!isAuthenticated) { message.info('请先登录'); return; }
    try {
      const { data } = await favoriteAPI.toggle(id!);
      setIsFavorited(data.favorited);
      message.success(data.favorited ? '已收藏' : '已取消收藏');
      loadCharacter();
    } catch (err: any) {
      message.error(err.response?.data?.error || '操作失败');
    }
  }

  async function handleRate(score: number) {
    if (!isAuthenticated) { message.info('请先登录'); return; }
    try {
      await ratingAPI.rate(id!, score);
      setUserRating(score);
      message.success('评分成功！');
      loadCharacter();
    } catch (err: any) {
      message.error(err.response?.data?.error || '评分失败');
    }
  }

  async function handleComment() {
    if (!isAuthenticated) { message.info('请先登录'); return; }
    if (!commentContent.trim()) return;
    setCommentLoading(true);
    try {
      await commentAPI.create(id!, { content: commentContent, parentId: replyTo || undefined });
      setCommentContent('');
      setReplyTo(null);
      message.success('评论成功！');
      loadComments();
    } catch (err: any) {
      message.error(err.response?.data?.error || '评论失败');
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleDelete() {
    Modal.confirm({
      title: '确认删除',
      content: '删除后角色及其所有数据将永久消失，确定要删除吗？',
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await characterAPI.delete(id!);
        message.success('角色已删除');
        navigate('/characters');
      },
    });
  }

  async function handleExport() {
    try {
      const { data } = await characterAPI.export(id!);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${character.name}-archive.json`;
      a.click(); URL.revokeObjectURL(url);
      message.success('导出成功！');
    } catch { message.error('导出失败'); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!character) return <Empty description="角色未找到" />;

  const isOwner = user?.id === character.createdById;

  const relationList = [
    ...(character.relationships || []).map((r: any) => ({
      ...r,
      label: 'from',
      relatedChar: r.toCharacter,
    })),
    ...(character.relatedTo || []).map((r: any) => ({
      ...r,
      label: 'to',
      relatedChar: r.fromCharacter,
    })),
  ];

  return (
    <div className="page-container">
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        {isOwner && (
          <>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/characters/${id}/edit`)}>编辑</Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
          </>
        )}
        <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
      </Space>

      <Row gutter={[24, 24]}>
        {/* Left: Images */}
        <Col xs={24} md={8}>
          <Card>
            {character.images?.length > 0 ? (
              <Image.PreviewGroup>
                <Image
                  src={character.images[character.mainImageIndex || 0]?.url}
                  alt={character.name}
                  style={{ width: '100%', borderRadius: 8 }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iNDgiPvCfjq08L3RleHQ+PC9zdmc+"
                />
              </Image.PreviewGroup>
            ) : (
              <div style={{ width: '100%', height: 300, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                🎭
              </div>
            )}

            {character.images?.length > 1 && (
              <Row gutter={8} style={{ marginTop: 12 }}>
                {character.images.map((img: any, i: number) => (
                  <Col span={6} key={img.id}>
                    <Image
                      src={img.url}
                      alt={`${i + 1}`}
                      style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                      preview={{ mask: null }}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Card>

          {/* Quick stats */}
          <Card style={{ marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ marginBottom: 4 }}>
                {(character.avgRating || 0).toFixed(1)} <StarFilled style={{ color: '#fadb14', fontSize: 20 }} />
              </Title>
              <Text type="secondary">{character._count?.ratings || 0} 人评分</Text>
              <div style={{ marginTop: 8 }}>
                <Rate
                  allowHalf
                  value={Number(character.avgRating || 0)}
                  disabled
                  style={{ fontSize: 16 }}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">你的评分：</Text>
                <Rate value={userRating} onChange={handleRate} style={{ fontSize: 16 }} />
              </div>
              <div style={{ marginTop: 12 }}>
                <Button
                  type={isFavorited ? 'primary' : 'default'}
                  icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
                  onClick={handleFavorite}
                  danger={isFavorited}
                  block
                >
                  {isFavorited ? '已收藏' : '收藏'} ({character._count?.favorites || 0})
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* Right: Details */}
        <Col xs={24} md={16}>
          <Card>
            <Title level={2} style={{ marginBottom: 0 }}>{character.name}</Title>
            {character.nameJp && <Title level={4} type="secondary">{character.nameJp}</Title>}

            <Space size={4} wrap style={{ marginBottom: 16 }}>
              {character.tags?.map((t: any) => (
                <Tag key={t.tag.id} color={t.tag.color}>{t.tag.name}</Tag>
              ))}
            </Space>

            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="角色类型">{CHARACTER_TYPE_LABELS[character.characterType]}</Descriptions.Item>
              <Descriptions.Item label="性别">{GENDER_LABELS[character.gender]}</Descriptions.Item>
              <Descriptions.Item label="年龄">{character.age || '未知'}</Descriptions.Item>
              <Descriptions.Item label="生日">{character.birthday ? dayjs(character.birthday).format('MM月DD日') : '未知'}</Descriptions.Item>
              <Descriptions.Item label="身高">{character.height || '未知'}</Descriptions.Item>
              <Descriptions.Item label="血型">{BLOOD_LABELS[character.bloodType]}</Descriptions.Item>
              <Descriptions.Item label="声优（中文）">{character.voiceActor || '未知'}</Descriptions.Item>
              <Descriptions.Item label="声优（日文）">{character.voiceActorJp || '未知'}</Descriptions.Item>
              <Descriptions.Item label="所属动漫">
                {character.anime ? (
                  <a onClick={() => navigate(`/anime/${character.anime.id}`)}>{character.anime.title}</a>
                ) : '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="创建者">{character.createdBy?.username}</Descriptions.Item>
            </Descriptions>

            {character.personality && (
              <div style={{ marginTop: 20 }}>
                <Title level={5}>性格</Title>
                <Paragraph>{character.personality}</Paragraph>
              </div>
            )}
            {character.background && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>背景故事</Title>
                <Paragraph>{character.background}</Paragraph>
              </div>
            )}
            {character.abilities && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>能力/技能</Title>
                <Paragraph>{character.abilities}</Paragraph>
              </div>
            )}
          </Card>

          {/* Relationships */}
          {relationList.length > 0 && (
            <Card title="角色关系" style={{ marginTop: 16 }}>
              <Space wrap>
                {relationList.map((r: any, i: number) => (
                  <Tag
                    key={i}
                    style={{ cursor: 'pointer', padding: '4px 8px', fontSize: 14 }}
                    onClick={() => navigate(`/characters/${r.relatedChar?.id}`)}
                  >
                    {r.relatedChar?.name} — {RELATIONSHIP_LABELS[r.relationshipType] || r.relationshipType}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* Comments */}
          <Card title={`评论 (${character._count?.comments || 0})`} style={{ marginTop: 16 }}>
            {isAuthenticated && (
              <div style={{ marginBottom: 16 }}>
                {replyTo && (
                  <Tag closable onClose={() => setReplyTo(null)}>回复中</Tag>
                )}
                <Input.TextArea
                  rows={3}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="写下你的评论..."
                />
                <Button
                  type="primary"
                  onClick={handleComment}
                  loading={commentLoading}
                  style={{ marginTop: 8 }}
                >
                  发表评论
                </Button>
              </div>
            )}

            {comments.length === 0 ? (
              <Empty description="暂无评论" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={comments}
                renderItem={(comment: any) => (
                  <List.Item
                    actions={[
                      isAuthenticated && <Button type="link" size="small" onClick={() => setReplyTo(comment.id)}>回复</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} src={comment.user?.avatar} />}
                      title={
                        <Space>
                          <Text strong>{comment.user?.username}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                        </Space>
                      }
                      description={
                        <>
                          <p>{comment.content}</p>
                          {comment.replies?.map((reply: any) => (
                            <div key={reply.id} style={{ marginTop: 8, paddingLeft: 16, borderLeft: '2px solid #f0f0f0' }}>
                              <Text strong>{reply.user?.username}</Text>
                              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{dayjs(reply.createdAt).format('MM-DD HH:mm')}</Text>
                              <p>{reply.content}</p>
                            </div>
                          ))}
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}


