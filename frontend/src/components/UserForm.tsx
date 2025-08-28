import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Space,
  Divider,
  message,
  Spin,
  Alert,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, SendOutlined } from '@ant-design/icons';
import { UserBackground } from '../services/api';
import dataLoaderService from '../services/DataLoaderService';
import errorHandler from '../services/ErrorHandler';


const { Option } = Select;
const { TextArea } = Input;

interface UserFormProps {
  onSubmit: (data: UserBackground) => void;
  loading?: boolean;
}

// 使用从 DataLoaderService 加载的JSON数据

const UserForm: React.FC<UserFormProps> = ({ onSubmit, loading = false }) => {
  const [form] = Form.useForm();
  const [hasLanguageScore, setHasLanguageScore] = useState(false);
  const [hasGRE, setHasGRE] = useState(false);
  const [hasGMAT, setHasGMAT] = useState(false);
  
  // 数据状态管理
  const [universities, setUniversities] = useState<string[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [targetMajors, setTargetMajors] = useState<string[]>([]);
  // const [majorsByCategory] = useState<Record<string, string[]>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);



  // 数据加载逻辑
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        setDataError(null);
        
        // 并行加载所有数据
        const [universitiesData, majorsData, countriesData, targetMajorsData] = await Promise.all([
          dataLoaderService.loadUniversities(),
          dataLoaderService.loadMajors(),
          dataLoaderService.loadCountries(),
          dataLoaderService.loadTargetMajors(),
        ]);

        setUniversities(universitiesData);
        setMajors(majorsData);
        setCountries(countriesData);
        setTargetMajors(targetMajorsData);
        

      } catch (error) {
        const { userMessage } = errorHandler.buildUserFacingError(error, {
          component: 'UserForm',
          action: 'initialDataLoad'
        });
        console.error('数据加载失败:', userMessage.title);
        setDataError(userMessage.description);
        message.error(userMessage.title);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  // 当可选分数开关变化时，触发相关字段的重新校验
  useEffect(() => {
    form.validateFields(['language_test_type', 'language_total_score']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLanguageScore]);

  useEffect(() => {
    form.validateFields(['gre_total']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGRE]);

  useEffect(() => {
    form.validateFields(['gmat_total']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGMAT]);











  // 数据重试功能
  const retryDataLoad = useCallback(async () => {
    setDataError(null);
    setDataLoading(true);
    
    try {
      const [universitiesData, majorsData, countriesData, targetMajorsData] = await Promise.all([
        dataLoaderService.loadUniversities(),
        dataLoaderService.loadMajors(),
        dataLoaderService.loadCountries(),
        dataLoaderService.loadTargetMajors(),
      ]);

      setUniversities(universitiesData);
      setMajors(majorsData);
      setCountries(countriesData);
      setTargetMajors(targetMajorsData);
      
      message.success('数据重新加载成功');
    } catch (error) {
      const { userMessage } = errorHandler.buildUserFacingError(error, {
        component: 'UserForm',
        action: 'retryDataLoad'
      });
      console.error('数据重新加载失败:', userMessage.title);
      setDataError(userMessage.description);
      message.error(userMessage.title);
    } finally {
      setDataLoading(false);
    }
  }, []);

  const handleSubmit = (values: any) => {
    try {
      // 处理目标专业方向数据 - 现在支持多选
      const target_majors: string[] = values.target_majors || [];
      
      // 验证是否选择了专业
      if (target_majors.length === 0) {
        message.error('请选择至少一个目标专业方向');
        return;
      }
      
      // 提交前数据完整性检查（不阻断提交，仅提示）
      if (values.undergraduate_university && universities.length > 0 && !universities.includes(values.undergraduate_university)) {
        message.warning('提示：您填写的本科院校不在标准列表中，如有拼写差异请确认');
      }
      if (values.undergraduate_major && majors.length > 0 && !majors.includes(values.undergraduate_major)) {
        message.warning('提示：您填写的本科专业不在标准列表中，如有拼写差异请确认');
      }

      // 处理表单数据
      const formData: UserBackground = {
        undergraduate_university: values.undergraduate_university,
        undergraduate_major: values.undergraduate_major,
        gpa: values.gpa,
        gpa_scale: values.gpa_scale,
        graduation_year: values.graduation_year,
        target_countries: values.target_countries,
        target_majors: target_majors,
        target_degree_type: values.target_degree_type,
        research_experiences: values.research_experiences || [],
        internship_experiences: values.internship_experiences || [],
        other_experiences: values.other_experiences || [],
      };

      // 添加语言成绩
      if (hasLanguageScore && values.language_test_type && values.language_total_score) {
        formData.language_test_type = values.language_test_type;
        formData.language_total_score = values.language_total_score;
        formData.language_reading = values.language_reading;
        formData.language_listening = values.language_listening;
        formData.language_speaking = values.language_speaking;
        formData.language_writing = values.language_writing;
      }

      // 添加GRE成绩
      if (hasGRE && values.gre_total) {
        formData.gre_total = values.gre_total;
        formData.gre_verbal = values.gre_verbal;
        formData.gre_quantitative = values.gre_quantitative;
        formData.gre_writing = values.gre_writing;
      }

      // 添加GMAT成绩
      if (hasGMAT && values.gmat_total) {
        formData.gmat_total = values.gmat_total;
      }

      console.log('Form data:', formData);
      onSubmit(formData);
    } catch (error) {
      message.error('表单数据处理失败，请检查输入');
      console.error('Form submission error:', error);
    }
  };

  // 数据加载错误处理
  if (dataError) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <Card title="数据加载错误">
          <Alert
            message="数据加载失败"
            description={`错误详情：${dataError}`}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Space size="middle">
              <Button 
                type="primary" 
                onClick={retryDataLoad}
                loading={dataLoading}
              >
                重新加载数据
              </Button>
              <Button 
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      {/* 数据加载状态提示 */}
      {dataLoading && (
        <Alert
          message="正在加载数据..."
          description="正在加载院校、专业等基础数据，请稍候..."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}
      


      <Spin spinning={dataLoading} tip="正在加载数据...">
        <Card title="留学定位与选校规划 - 个人信息填写">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          scrollToFirstError
        >
          {/* 第一部分：学术背景 */}
          <Card type="inner" title="第一部分：学术背景" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="本科院校"
                  name="undergraduate_university"
                  rules={[{ required: true, message: '请输入本科院校' }]}
                >
                  <Select
                    placeholder="请输入或选择本科院校"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    disabled={dataLoading}
                    loading={dataLoading}
                    notFoundContent={dataLoading ? <Spin size="small" /> : '未找到匹配的院校'}
                    allowClear
                  >
                    {universities.map(uni => (
                      <Option key={uni} value={uni}>{uni}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="本科专业"
                  name="undergraduate_major"
                  rules={[{ required: true, message: '请输入本科专业' }]}
                >
                  <Select
                    placeholder="请输入或选择本科专业"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    disabled={dataLoading}
                    loading={dataLoading}
                    notFoundContent={dataLoading ? <Spin size="small" /> : '未找到匹配的专业'}
                    allowClear
                  >
                    {majors.map(major => (
                      <Option key={major} value={major}>{major}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="GPA/均分"
                  name="gpa"
                  dependencies={['gpa_scale']}
                  rules={[
                    { required: true, message: '请输入GPA或均分' },
                    {
                      validator: async (_, value) => {
                        if (value === undefined || value === null || value === '') return Promise.resolve();
                        const scale = form.getFieldValue('gpa_scale');
                        if (!scale) return Promise.resolve();
                        const num = Number(value);
                        if (Number.isNaN(num) || num < 0) return Promise.reject(new Error('GPA需为非负数'));
                        if (scale === '4.0' && num > 4.0) return Promise.reject(new Error('GPA与4.0制不匹配，最大为4.0'));
                        if (scale === '5.0' && num > 5.0) return Promise.reject(new Error('GPA与5.0制不匹配，最大为5.0'));
                        if (scale === '100' && num > 100) return Promise.reject(new Error('百分制成绩最大为100'));
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="如：3.8 或 88"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="GPA制式"
                  name="gpa_scale"
                  rules={[{ required: true, message: '请选择GPA制式' }]}
                >
                  <Select placeholder="请选择制式">
                    <Option value="4.0">4.0制</Option>
                    <Option value="5.0">5.0制</Option>
                    <Option value="100">100分制</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="毕业年份"
                  name="graduation_year"
                  rules={[{ required: true, message: '请选择毕业年份' }]}
                >
                  <Select placeholder="请选择毕业年份">
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i - 5;
                      return <Option key={year} value={year}>{year}</Option>;
                    })}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 第二部分：语言和标准化考试成绩 */}
          <Card type="inner" title="第二部分：语言和标准化考试成绩（选填）" style={{ marginBottom: 24 }}>
            <Form.Item label="语言考试成绩">
              <Button
                type={hasLanguageScore ? 'primary' : 'default'}
                onClick={() => setHasLanguageScore(!hasLanguageScore)}
              >
                {hasLanguageScore ? '已添加语言成绩' : '添加语言成绩'}
              </Button>
            </Form.Item>

            {hasLanguageScore && (
              <Row gutter={16}>
                <Col xs={24} sm={6}>
                  <Form.Item 
                    label="考试类型" 
                    name="language_test_type"
                    rules={[{
                      validator: async () => {
                        if (!hasLanguageScore) return Promise.resolve();
                        const v = form.getFieldValue('language_test_type');
                        if (!v) return Promise.reject(new Error('请选择语言考试类型'));
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <Select placeholder="选择考试类型">
                      <Option value="TOEFL">TOEFL</Option>
                      <Option value="IELTS">IELTS</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item 
                    label="总分" 
                    name="language_total_score"
                    rules={[{
                      validator: async () => {
                        if (!hasLanguageScore) return Promise.resolve();
                        const v = form.getFieldValue('language_total_score');
                        if (v === undefined || v === null || v === '') return Promise.reject(new Error('请输入语言考试总分'));
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <InputNumber min={0} max={120} placeholder="总分" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={3}>
                  <Form.Item label="阅读" name="language_reading">
                    <InputNumber min={0} max={30} placeholder="阅读" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={3}>
                  <Form.Item label="听力" name="language_listening">
                    <InputNumber min={0} max={30} placeholder="听力" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={3}>
                  <Form.Item label="口语" name="language_speaking">
                    <InputNumber min={0} max={30} placeholder="口语" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={3}>
                  <Form.Item label="写作" name="language_writing">
                    <InputNumber min={0} max={30} placeholder="写作" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="GRE成绩">
                  <Button
                    type={hasGRE ? 'primary' : 'default'}
                    onClick={() => setHasGRE(!hasGRE)}
                  >
                    {hasGRE ? '已添加GRE成绩' : '添加GRE成绩'}
                  </Button>
                </Form.Item>
                {hasGRE && (
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item 
                        label="总分" 
                        name="gre_total"
                        rules={[{
                          validator: async () => {
                            if (!hasGRE) return Promise.resolve();
                            const v = form.getFieldValue('gre_total');
                            if (v === undefined || v === null || v === '') return Promise.reject(new Error('请输入GRE总分'));
                            if (v < 260 || v > 340) return Promise.reject(new Error('GRE总分范围应在260-340'));
                            return Promise.resolve();
                          }
                        }]}
                      >
                        <InputNumber min={260} max={340} placeholder="总分" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item 
                        label="写作" 
                        name="gre_writing"
                        rules={[{
                          validator: async () => {
                            const v = form.getFieldValue('gre_writing');
                            if (v === undefined || v === null || v === '') return Promise.resolve();
                            if (v < 0 || v > 6) return Promise.reject(new Error('GRE写作范围应在0-6'));
                            return Promise.resolve();
                          }
                        }]}
                      >
                        <InputNumber min={0} max={6} step={0.5} placeholder="写作" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="GMAT成绩">
                  <Button
                    type={hasGMAT ? 'primary' : 'default'}
                    onClick={() => setHasGMAT(!hasGMAT)}
                  >
                    {hasGMAT ? '已添加GMAT成绩' : '添加GMAT成绩'}
                  </Button>
                </Form.Item>
                {hasGMAT && (
                  <Form.Item 
                    label="总分" 
                    name="gmat_total"
                    rules={[{
                      validator: async () => {
                        if (!hasGMAT) return Promise.resolve();
                        const v = form.getFieldValue('gmat_total');
                        if (v === undefined || v === null || v === '') return Promise.reject(new Error('请输入GMAT总分'));
                        if (v < 200 || v > 800) return Promise.reject(new Error('GMAT总分范围应在200-800'));
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <InputNumber min={200} max={800} placeholder="GMAT总分" style={{ width: '100%' }} />
                  </Form.Item>
                )}
              </Col>
            </Row>
          </Card>

          {/* 第三部分：申请意向 */}
          <Card type="inner" title="第三部分：申请意向" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="目标国家/地区 (可多选)"
                  name="target_countries"
                  rules={[{ required: true, message: '请选择目标国家/地区' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择目标国家/地区"
                    options={countries.map(country => ({ label: country, value: country }))}
                    disabled={dataLoading}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().indexOf(input.toLowerCase()) !== -1
                    }
                    allowClear
                    maxTagCount="responsive"
                    notFoundContent={dataLoading ? <Spin size="small" /> : '未找到匹配的国家/地区'}
                    loading={dataLoading}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="目标专业方向 (可多选)"
                  name="target_majors"
                  rules={[{ required: true, message: '请选择目标专业方向' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择目标专业方向"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().indexOf(input.toLowerCase()) !== -1
                    }
                    options={targetMajors.map(major => ({
                      label: major,
                      value: major
                    }))}
                    disabled={dataLoading}
                    allowClear
                    maxTagCount="responsive"
                    notFoundContent={dataLoading ? <Spin size="small" /> : '未找到匹配的专业方向'}
                    loading={dataLoading}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="目标学位类型"
              name="target_degree_type"
              rules={[{ required: true, message: '请选择目标学位类型' }]}
            >
              <Select placeholder="请选择学位类型">
                <Option value="Master">硕士 (Master)</Option>
                <Option value="PhD">博士 (PhD)</Option>
              </Select>
            </Form.Item>
          </Card>

          {/* 第四部分：实践背景 */}
          <Card type="inner" title="第四部分：实践背景（选填）" style={{ marginBottom: 24 }}>
            {/* 科研经历 */}
            <Form.Item label="科研经历">
              <Form.List name="research_experiences">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" style={{ marginBottom: 8 }}>
                        <Row gutter={16}>
                          <Col xs={24} sm={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'name']}
                              label="项目名称"
                            >
                              <Input placeholder="项目名称" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'role']}
                              label="担任角色"
                            >
                              <Input placeholder="如：核心成员、负责人" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'description']}
                              label="项目描述"
                            >
                              <TextArea rows={2} placeholder="简要描述项目内容和成果" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={2}>
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加科研经历
                    </Button>
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Divider />

            {/* 实习经历 */}
            <Form.Item label="实习/工作经历">
              <Form.List name="internship_experiences">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" style={{ marginBottom: 8 }}>
                        <Row gutter={16}>
                          <Col xs={24} sm={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'company']}
                              label="公司名称"
                            >
                              <Input placeholder="公司名称" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'position']}
                              label="职位"
                            >
                              <Input placeholder="实习/工作职位" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'description']}
                              label="工作描述"
                            >
                              <TextArea rows={2} placeholder="简要描述工作内容和成果" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={2}>
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加实习/工作经历
                    </Button>
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Divider />

            {/* 其他经历 */}
            <Form.Item label="其他经历（竞赛、活动等）">
              <Form.List name="other_experiences">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" style={{ marginBottom: 8 }}>
                        <Row gutter={16}>
                          <Col xs={24} sm={10}>
                            <Form.Item
                              {...restField}
                              name={[name, 'name']}
                              label="活动名称"
                            >
                              <Input placeholder="竞赛、活动名称" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'description']}
                              label="描述"
                            >
                              <TextArea rows={2} placeholder="简要描述活动内容和收获" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={2}>
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加其他经历
                    </Button>
                  </>
                )}
              </Form.List>
            </Form.Item>
          </Card>

          {/* 提交按钮 */}
          <Form.Item>
            <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SendOutlined />}
                loading={loading}
                disabled={loading || dataLoading}
              >
                {loading ? '正在分析中...' : '完成并开始分析'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      </Spin>
    </div>
  );
};

export default UserForm;