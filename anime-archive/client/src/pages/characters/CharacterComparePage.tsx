import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Select, Empty, Button, Descriptions, Tag, Space, Image, Input, Spin } from 'antd';
import { PlusOutlined, SwapOutlined, DeleteOutlined } from '@ant-design/icons';
import { characterAPI } from '../../api';

const { Title } = Typography;

export default function CharacterComparePage() {
  const navigate = useNavigate();
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [charOptions, setCharOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      const { data } = await characterAPI.list({ limit: 200 });
      setCharOptions(data.data.map((c: any) => ({ label: c.name, value: c.id })));
    } catch {}
  }

  useEffect(() => {
    if (characterIds.length >= 2) loadComparison();
    else setCharacters([]);
  }, [characterIds]);

  async function loadComparison() {
    setLoading(true);
    try {
      const { data } = await characterAPI.compare(characterIds);
      setCharacters(data);
    } catch {
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <Title level={2}><SwapOutlined /> 角色对比</Title>

      <Card style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%' }}>
          <Select
            mode="multiple"
            maxCount={4}
            value={characterIds}
            onChange={(vals) => setCharacterIds(vals)}
            options={charOptions}
            style={{ minWidth: 400 }}
            placeholder="选择 2-4 个角色进行对比..."
            showSearch
            optionFilterProp="label"
          />
          {characterIds.length >= 2 && (
            <Button onClick={() => setCharacterIds([])}>清除</Button>
          )}
        </Space>
      </Card>

      {characters.length < 2 ? (
        <Empty description="请选择至少 2 个角色开始对比" />
      ) : loading ? (
        <Spin />
      ) : (
        <Row gutter={16}>
          {characters.map((char: any) => (
            <Col flex={1} key={char.id} style={{ minWidth: 250 }}>
              <Card
                hoverable
                onClick={() => navigate(`/characters/${char.id}`)}
                cover={
                  char.images?.[0] ? (
                    <img alt={char.name} src={char.images[0].url} style={{ height: 280, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: 280, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                      🎭
                    </div>
                  )
                }
              >
                <Card.Meta
                  title={char.name}
                  description={char.nameJp}
                />
                <Descriptions column={1} size="small" style={{ marginTop: 12 }}>
                  <Descriptions.Item label="类型">{char.characterType}</Descriptions.Item>
                  <Descriptions.Item label="性别">{char.gender}</Descriptions.Item>
                  <Descriptions.Item label="年龄">{char.age || '未知'}</Descriptions.Item>
                  <Descriptions.Item label="身高">{char.height || '未知'}</Descriptions.Item>
                  <Descriptions.Item label="血型">{char.bloodType}</Descriptions.Item>
                  <Descriptions.Item label="声优">{char.voiceActor || '未知'}</Descriptions.Item>
                  <Descriptions.Item label="评分">{(char.avgRating || 0).toFixed(1)}</Descriptions.Item>
                  <Descriptions.Item label="收藏">{char._count?.favorites || 0}</Descriptions.Item>
                </Descriptions>
                <Space size={4} wrap style={{ marginTop: 8 }}>
                  {char.tags?.map((t: any) => (
                    <Tag key={t.tag.id} color={t.tag.color}>{t.tag.name}</Tag>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}


