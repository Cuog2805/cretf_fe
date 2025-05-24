import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  InputNumber,
  Select,
  Card,
  Space,
  Typography,
  Divider,
  Spin,
  Result,
} from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useLocation } from '@umijs/max';
import useLocations from '@/selectors/useLocation';
import CustomTreeSelect from '@/components/tree/treeSelectCustom';
import { predictPrice, PredictRequest, PredictResponse } from '@/servicesML/predictionService';
import {
  findIdAndNodeChildrenIds,
  findNodeById,
  findPathByValue,
} from '@/components/tree/treeUtil';
import useCategoryShareds from '@/selectors/useCategoryShareds';
import usePropertyType from '@/selectors/usePropertyType';

const { Title, Text } = Typography;
const { Option } = Select;

const RealEstatePrediction: React.FC = () => {
  const [form] = Form.useForm();
  const { locationTree, locationList } = useLocations();
  const { dmDirection } = useCategoryShareds();
  const { propertyTypeList } = usePropertyType()

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [locationIdsSelected, setLocationIdsSelected] = useState<any[] | null>([]);

  const propertyType = Form.useWatch('property_type', form);

  console.log('locationTree', locationTree);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const district: string = locationList.find((item) => item.locationId === locationIdsSelected[1])?.name ?? '';
      const province: string = locationList.find((item) => item.locationId === locationIdsSelected[0])?.name ?? '';
      const body: any = {
        district: district,
        province: province,
        area: values.area,
        frontage: values.frontage,
        access_road: values.access_road,
        direction: values.direction,
        property_type: values.property_type,
        floors: values.floors || 1,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
      };
      console.log('body', body);
      predictPrice(body).then((res: PredictResponse) => {
        console.log('Kết quả dự đoán:', res);
        setResult(res?.data);
      });
    } catch (error) {
      console.error('Lỗi dự đoán:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setResult(null);
  };

  const handlePropertyTypeChange = (value: string) => {
    if (value === 'Căn hộ') {
      form.setFieldValue('floors', undefined);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card
        title={
          <Space>
            <HomeOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Định giá bất động sản
            </Title>
          </Space>
        }
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Vị trí"
            name="locationIds"
            rules={[{ required: true, message: 'Vui lòng chọn vị trí!' }]}
          >
            <CustomTreeSelect
              showSearch
              treeData={locationTree}
              fieldNames={{ label: 'name', value: 'locationId', children: 'children' }}
              placeholder="Chọn khu vực"
              allowClear
              treeDefaultExpandAll={false}
              onChange={(value) => {
                setLocationIdsSelected(findPathByValue(locationTree, value));
              }}
            />
          </Form.Item>

          <Form.Item
            label="Loại bất động sản"
            name="property_type"
            rules={[{ required: true, message: 'Vui lòng chọn loại bất động sản!' }]}
          >
            <Select 
              placeholder="Chọn loại bất động sản"
              onChange={handlePropertyTypeChange}
            >
              {propertyTypeList.map((item) => {
                return <Option key={item.propertyTypeId} value={item.name} disabled={item.code === 'LAND'}>{item.name}</Option>
              })}
            </Select>
          </Form.Item>

          <Form.Item
            label="Diện tích (m²)"
            name="area"
            rules={[{ required: true, message: 'Vui lòng nhập diện tích!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="Nhập diện tích"
              addonAfter="m²"
            />
          </Form.Item>

          <Form.Item
            label="Mặt tiền (m)"
            name="frontage"
            rules={[{ required: true, message: 'Vui lòng nhập độ rộng mặt tiền!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="Nhập độ rộng mặt tiền"
              addonAfter="m"
            />
          </Form.Item>

          <Form.Item
            label="Hướng nhà"
            name="direction"
            rules={[{ required: true, message: 'Vui lòng chọn hướng nhà!' }]}
          >
            <Select placeholder="Chọn hướng nhà">
              {dmDirection.map((item) => (
                <Option key={item.categorySharedId} value={item.name}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Độ rộng đường vào nhà (m)"
            name="access_road"
            rules={[{ required: true, message: 'Vui lòng nhập độ rộng đường vào nhà!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="Nhập độ rộng đường vào nhà"
              addonAfter="m"
            />
          </Form.Item>

          {propertyType === 'Nhà' && (
            <Form.Item
              label="Số tầng"
              name="floors"
              rules={[{ required: true, message: 'Vui lòng nhập số tầng!' }]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={1} 
                placeholder="Nhập số tầng" 
              />
            </Form.Item>
          )}

          <Form.Item
            label="Số phòng ngủ"
            name="bedrooms"
            rules={[{ required: true, message: 'Vui lòng nhập số phòng ngủ!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="Nhập số phòng ngủ" />
          </Form.Item>

          <Form.Item
            label="Số phòng tắm"
            name="bathrooms"
            rules={[{ required: true, message: 'Vui lòng nhập số phòng tắm!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="Nhập số phòng tắm" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Dự đoán giá
              </Button>
              <Button onClick={resetForm}>Làm mới</Button>
            </Space>
          </Form.Item>
        </Form>

        {loading && (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '10px' }}>Đang phân tích dữ liệu...</div>
          </div>
        )}

        {result && !loading && (
          <>
            <Divider />
            <Result status="success" title="Kết quả dự đoán">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Title level={3} style={{ color: '#1890ff' }}>
                  {result} - Tỷ VND
                </Title>
              </div>
            </Result>
          </>
        )}
      </Card>
    </Space>
  );
};

export default RealEstatePrediction;