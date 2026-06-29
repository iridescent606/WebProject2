import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Select, DatePicker, Button, Typography, message, Spin, Upload, Row, Col,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { characterAPI, animeAPI, tagAPI } from '../../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CHARACTER_TYPES = [
  { label: '主角', value: 'PROTAGONIST' },
  { label: '反派', value: 'ANTAGONIST' },
  { label: '准主角', value: 'DEUTERAGONIST' },
  { label: '配角', value: 'SUPPORTING' },
  { label: '次要角色', value: 'MINOR' },
  { label: '其他', value: 'OTHER' },
];

const GENDERS = [
  { label: '男', value: 'MALE' },
  { label: '女', value: 'FEMALE' },
  { label: '未知', value: 'UNKNOWN' },
];

const BLOOD_TYPES = [
  { label: 'A型', value: 'A' },
  { label: 'B型', value: 'B' },
  { label: 'AB型', value: 'AB' },
  { label: 'O型', value: 'O' },
  { label: '未知', value: 'UNKNOWN' },
];

export default function CharacterFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<any[]>([]);

  useEffect(() => {
    loadOptions();
    if (isEdit) loadCharacter();
  }, [id]);

  async function loadOptions() {
    try {
      const [animeRes, tagsRes] = await Promise.all([
        animeAPI.list({ limit: 200 }),
        tagAPI.list(),
      ]);
      setAnimeList(animeRes.data.data);
      setTags(tagsRes.data);
    } catch {}
  }

  async function loadCharacter() {
    setLoading(true);
    try {
      const { data } = await characterAPI.get(id!);
      form.setFieldsValue({
        ...data,
        birthday: data.birthday ? dayjs(data.birthday) : undefined,
        tags: data.tags?.map((t: any) => t.tag.id) || [],
      });
    } catch (err) {
      message.error('加载角色数据失败');
      navigate('/characters');
    } finally {
      setLoading(false);
    }
  }

  async function onFinish(values: any) {
    setSubmitting(true);
    try {
      const { tags: selectedTags, ...data } = values;
      const payload = {
        ...data,
        birthday: data.birthday ? data.birthday.toISOString() : undefined,
        tags: selectedTags || [],
      };

      let characterId = id;
      if (isEdit) {
        await characterAPI.update(id!, payload);
        message.success('角色已更新！');
      } else {
        const { data: newChar } = await characterAPI.create(payload);
        characterId = newChar.id;
        message.success('角色创建成功！');
      }

      // Upload images if any
      if (imageFiles.length > 0 && characterId) {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append('images', file));
        await characterAPI.uploadImages(characterId, formData);
        message.success('图片上传成功！');
      }

      navigate(`/characters/${characterId}`);
    } catch (err: any) {
      message.error(err.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div className="page-container">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card>
        <Title level={3}>{isEdit ? '编辑角色' : '创建新角色'}</Title>

        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
                <Input placeholder="如：灶门炭治郎" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="nameJp" label="日文名">
                <Input placeholder="如：竈門 炭治郎" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="animeId" label="所属动漫">
                <Select placeholder="选择动漫系列" allowClear showSearch optionFilterProp="label">
                  {animeList.map((a: any) => (
                    <Option key={a.id} value={a.id} label={a.title}>{a.title}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="tags" label="标签">
                <Select mode="multiple" placeholder="选择角色标签" allowClear>
                  {tags.map((t: any) => (
                    <Option key={t.id} value={t.id}>
                      <span style={{ color: t.color }}>●</span> {t.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="characterType" label="角色类型" initialValue="OTHER">
                <Select options={CHARACTER_TYPES} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="gender" label="性别" initialValue="UNKNOWN">
                <Select options={GENDERS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="age" label="年龄">
                <Input type="number" placeholder="如：15" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="birthday" label="生日">
                <DatePicker style={{ width: '100%' }} placeholder="选择生日" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="height" label="身高">
                <Input placeholder="如：165cm" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="bloodType" label="血型" initialValue="UNKNOWN">
                <Select options={BLOOD_TYPES} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="voiceActor" label="声优（中文）">
                <Input placeholder="如：花江夏树" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="voiceActorJp" label="声优（日文）">
                <Input placeholder="如：花江 夏樹" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="personality" label="性格描述">
            <TextArea rows={3} placeholder="描述角色的性格特点..." />
          </Form.Item>

          <Form.Item name="background" label="背景故事">
            <TextArea rows={4} placeholder="角色的背景故事..." />
          </Form.Item>

          <Form.Item name="abilities" label="能力/技能">
            <TextArea rows={3} placeholder="角色的能力和技能..." />
          </Form.Item>

          <Form.Item label="角色图片">
            <Upload
              listType="picture-card"
              beforeUpload={(file) => {
                setImageFiles((prev) => [...prev, file]);
                return false;
              }}
              onRemove={(file) => {
                setImageFiles((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
              maxCount={10}
              accept="image/*"
            >
              <div><UploadOutlined /><div style={{ marginTop: 8 }}>上传</div></div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} size="large">
              {isEdit ? '保存修改' : '创建角色'}
            </Button>
            <Button style={{ marginLeft: 12 }} size="large" onClick={() => navigate(-1)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}


