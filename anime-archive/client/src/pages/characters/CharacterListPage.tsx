import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card, Row, Col, Typography, Tag, Spin, Empty, Input, Select, Space, Button, Pagination,
} from 'antd';
import { SearchOutlined, FilterOutlined, StarOutlined, HeartOutlined, PlusOutlined } from '@ant-design/icons';
import { characterAPI, tagAPI } from '../../api';

const { Title } = Typography;

const CHARACTER_TYPES = [
  { label: '全部', value: '' },
  { label: '主角', value: 'PROTAGONIST' },
  { label: '反派', value: 'ANTAGONIST' },
  { label: '准主角', value: 'DEUTERAGONIST' },
  { label: '配角', value: 'SUPPORTING' },
  { label: '次要角色', value: 'MINOR' },
  { label: '其他', value: 'OTHER' },
];

const GENDERS = [
  { label: '全部', value: '' },
  { label: '男', value: 'MALE' },
  { label: '女', value: 'FEMALE' },
  { label: '未知', value: 'UNKNOWN' },
];

const SORT_OPTIONS = [
  { label: '最新更新', value: 'updatedAt' },
  { label: '最新创建', value: 'createdAt' },
  { label: '最高评分', value: 'avgRating' },
  { label: '最多收藏', value: 'favorites' },
];

export default function CharacterListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [characters, setCharacters] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const page = Number(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const gender = searchParams.get('gender') || '';
  const sort = searchParams.get('sort') || 'updatedAt';
  const tagFilter = searchParams.get('tags') || '';

  useEffect(() => {
    loadCharacters();
    loadTags();
  }, [page, search, type, gender, sort, tagFilter]);

  async function loadCharacters() {
    setLoading(true);
    try {
      const { data } = await characterAPI.list({ page, limit: 20, search, type, gender, sort, tags: tagFilter });
      setCharacters(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setCharacters([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function loadTags() {
    try {
      const { data } = await tagAPI.list();
      setTags(data);
    } catch {}
  }

  function updateParam(key: string, value: string) {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') newParams.set('page', '1');
    setSearchParams(newParams);
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Title level={2} style={{ margin: 0 }}>🎭 角色档案</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/characters/new')}>
          创建角色
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle" style={{ width: '100%' }}>
          <Input.Search
            placeholder="搜索角色名称、声优..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            onSearch={(val) => updateParam('search', val)}
            style={{ width: 240 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            value={type || undefined}
            onChange={(val) => updateParam('type', val || '')}
            options={CHARACTER_TYPES}
            style={{ width: 120 }}
            placeholder="角色类型"
            allowClear
          />
          <Select
            value={gender || undefined}
            onChange={(val) => updateParam('gender', val || '')}
            options={GENDERS}
            style={{ width: 100 }}
            placeholder="性别"
            allowClear
          />
          <Select
            value={sort}
            onChange={(val) => updateParam('sort', val)}
            options={SORT_OPTIONS}
            style={{ width: 130 }}
          />
          <Select
            mode="multiple"
            value={tagFilter ? tagFilter.split(',') : []}
            onChange={(vals) => updateParam('tags', vals.join(','))}
            options={tags.map((t: any) => ({ label: t.name, value: t.name }))}
            style={{ minWidth: 160 }}
            placeholder="按标签筛选"
            allowClear
            maxTagCount={3}
          />
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : characters.length === 0 ? (
        <Empty description="没有找到角色" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {characters.map((char: any) => (
              <Col xs={12} sm={8} md={6} lg={6} key={char.id}>
                <Card
                  className="character-card"
                  hoverable
                  cover={
                    char.images?.[0] ? (
                      <img alt={char.name} src={char.images[0].url} style={{ height: 240, objectFit: 'cover' }} />
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
                        {char.nameJp && <div style={{ fontSize: 12, color: '#999' }}>{char.nameJp}</div>}
                        <Space size={4} wrap style={{ marginTop: 8 }}>
                          {char.anime && <Tag color="purple">{char.anime.title}</Tag>}
                          {char.tags?.slice(0, 2).map((t: any) => (
                            <Tag key={t.tag.id} color={t.tag.color}>{t.tag.name}</Tag>
                          ))}
                        </Space>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                          <StarOutlined style={{ color: '#fadb14' }} /> {(char.avgRating || 0).toFixed(1)} ·{' '}
                          <HeartOutlined /> {char._count?.favorites || 0}
                        </div>
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={20}
              onChange={(p) => updateParam('page', String(p))}
              showTotal={(t) => `共 ${t} 个角色`}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
