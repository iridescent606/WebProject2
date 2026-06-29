import { useState, useEffect } from 'react';
import { Card, Typography, List, Button, Tag, Form, Input, ColorPicker, Space, Popconfirm, message, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, TagsOutlined } from '@ant-design/icons';
import { tagAPI } from '../../api';

const { Title } = Typography;

export default function TagManagePage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTags(); }, []);

  async function loadTags() {
    try {
      const { data } = await tagAPI.list();
      setTags(data);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function onFinish(values: any) {
    setSubmitting(true);
    try {
      const payload = { name: values.name, color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff' };
      if (editingId) {
        await tagAPI.update(editingId, payload);
        message.success('标签已更新！');
      } else {
        await tagAPI.create(payload);
        message.success('标签已创建！');
      }
      form.resetFields();
      setEditingId(null);
      loadTags();
    } catch (err: any) {
      message.error(err.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await tagAPI.delete(id);
      message.success('标签已删除');
      loadTags();
    } catch (err: any) {
      message.error(err.response?.data?.error || '删除失败');
    }
  }

  function startEdit(tag: any) {
    setEditingId(tag.id);
    form.setFieldsValue({ name: tag.name, color: tag.color });
  }

  return (
    <div className="page-container">
      <Title level={2}><TagsOutlined /> 标签管理</Title>

      <Card style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" onFinish={onFinish}>
          <Form.Item name="name" rules={[{ required: true, message: '请输入标签名' }]}>
            <Input placeholder="标签名（如：傲娇）" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="color" rules={[{ required: true, message: '请选择颜色' }]} initialValue="#1890ff">
            <ColorPicker format="hex" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={submitting}>
                {editingId ? '更新' : '创建'}
              </Button>
              {editingId && (
                <Button onClick={() => { form.resetFields(); setEditingId(null); }}>取消</Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        {tags.length === 0 ? (
          <Empty description="还没有标签" />
        ) : (
          <List
            dataSource={tags}
            renderItem={(tag: any) => (
              <List.Item
                actions={[
                  <Button icon={<EditOutlined />} type="link" onClick={() => startEdit(tag)}>编辑</Button>,
                  <Popconfirm title="确定删除此标签？" onConfirm={() => handleDelete(tag.id)} okText="确定" cancelText="取消">
                    <Button icon={<DeleteOutlined />} type="link" danger>删除</Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Tag color={tag.color} style={{ fontSize: 14, padding: '4px 12px' }}>{tag.name}</Tag>}
                  description={`${tag._count?.characters || 0} 个角色使用此标签`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
