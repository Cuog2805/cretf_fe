import React, { useEffect, useState } from 'react';
import {
  Input,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Flex,
  Carousel,
  Tag,
  List,
  Form,
  TreeSelect,
  Tooltip,
  message,
} from 'antd';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  HeartFilled,
  HeartOutlined,
  LeftOutlined,
  LikeOutlined,
  RightOutlined,
} from '@ant-design/icons';
import {
  addToFavourite,
  getAllProperties,
  getOneDetailProperty,
  removeToFavourite,
} from '@/services/apis/propertyController';
import { UNPAGED } from '@/core/constant';
import useStatus from '@/selectors/useStatus';
import FileRenderer from '@/components/FIle/fileRender';
import { useLocation, useNavigate, useParams } from '@umijs/max';
import useCategoryShareds from '@/selectors/useCategoryShareds';
import FormItem from 'antd/es/form/FormItem';
import { useCurrentUser } from '@/selectors/useCurrentUser';
import usePropertyType from '@/selectors/usePropertyType';
import usePagination from '@/components/EditableTable/usePagination';
import { findIdAndNodeChildrenIds, findNodeById } from '@/components/tree/treeUtil';
import useLocations from '@/selectors/useLocation';
import CustomTreeSelect from '@/components/tree/treeSelectCustom';
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const BuyPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const { locationId } = useParams();

  const { propertySoldStatusList, propertyStatusList } = useStatus();
  const { propertyTypeList } = usePropertyType();
  const { locationList, locationTree } = useLocations();

  const [properties, setProperties] = useState<API.PropertyDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [propertyType, setPropertyType] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { tableProps, paginationQuery } = usePagination({
    sort: 'createdAt,desc',
  });
  const { pagination } = tableProps(total);

  useEffect(() => {
    if (locationId) {
      form.setFieldValue('locationIds', [locationId]);
    }
  }, [locationId]);

  useEffect(() => {
    if (propertyTypeList && propertyTypeList.length > 0 && propertySoldStatusList && propertySoldStatusList.length > 0) {
      handleSearch();
    }
  }, [paginationQuery, propertyTypeList, propertySoldStatusList]);

  const getPropertyTypeFromMenu = (): API.PropertyDTO => {
    const path = location.pathname;
    if (path.includes('/buy/houses-for-sale'))
      return {
        type: 'SOLD',
        propertyTypeId: propertyTypeList.find((d) => d.code === 'HOUSE')?.propertyTypeId,
      };
    if (path.includes('/buy/condos-for-sale'))
      return {
        type: 'SOLD',
        propertyTypeId: propertyTypeList.find((d) => d.code === 'CONDO')?.propertyTypeId,
      };
    if (path.includes('/buy/land-for-sale'))
      return {
        type: 'SOLD',
        propertyTypeId: propertyTypeList.find((d) => d.code === 'LAND')?.propertyTypeId,
      };
    if (path.includes('/rent/houses-for-rent'))
      return {
        type: 'RENT',
        propertyTypeId: propertyTypeList.find((d) => d.code === 'HOUSE')?.propertyTypeId,
      };
    if (path.includes('/rent/condos-for-rent'))
      return {
        type: 'RENT',
        propertyTypeId: propertyTypeList.find((d) => d.code === 'CONDO')?.propertyTypeId,
      };

    return {};
  };

  const handleSearch = () => {
    form.validateFields().then((formValue) => {
      const typeSearch = getPropertyTypeFromMenu();
      const body: API.PropertyDTO = {
        ...formValue,
        type: typeSearch.type,
        propertyTypeId: typeSearch.propertyTypeId,
        priceNewestScale: location.pathname.includes('/buy')
          ? 'SCALE_BILLION_VND'
          : null,
        //creator: currentUser?.username,
        statusIds: location.pathname.includes('/buy')
        ? [propertyStatusList.find((d) => d.code === 'FORSOLD')?.statusId]
        : [propertyStatusList.find((d) => d.code === 'FORRENT')?.statusId],
        usernameFav: currentUser?.username,
      };
      console.log('body', body);
      const page: any = {
        page: paginationQuery.page,
        size: paginationQuery.size,
        sort: formValue.sortBy + ',' + formValue.sortDirection,
      };
      getAllProperties(page, body).then((res) => {
        setProperties(res?.data);
        setTotal(res?.total);
      });
    });
  };

  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    form.setFieldsValue({ sortDirection: newDirection }); // cập nhật vào form
  };

  // Reset bộ lọc
  const resetFilters = () => {
    form.setFieldsValue({
      locationId: null,
      propertyTypeId: null,
      statusIds: null,
    });
  };

  const handleAddToFavourite = (id: string) => {
    addToFavourite({ propertyId: id, usernameFav: currentUser?.username })
      .then((res) => {
        if (res.success) {
          handleSearch();
          message.success('Đã lưu bất động sản thành công');
        } else {
          message.error('Có lỗi khi lưu bất động sản');
        }
      })
      .catch((error) => {
        message.error('Có lỗi khi lưu bất động sản');
      });
  };

  const handleRemoveToFavourite = (id: string) => {
    removeToFavourite({ propertyId: id, usernameFav: currentUser?.username })
      .then((res) => {
        if (res.success) {
          handleSearch();
          message.success('Đã xóa bất động sản khỏi danh sách đã lưu thành công');
        } else {
          message.error('Có lỗi khi xóa bất động sản khỏi danh sách đã lưu');
        }
      })
      .catch((error) => {
        message.error('Có lỗi khi xóa bất động sản khỏi danh sách đã lưu');
      })
  };

  return (
    <PageContainer
      header={{
        title: null,
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}></Space>
      <Flex vertical gap="small">
        <Card>
          <Row gutter={12}>
            <Col xs={24} sm={24} md={12}>
              <Title level={2} style={{ fontWeight: 700 }}>
                {getPropertyTypeFromMenu().type === 'SOLD'
                  ? 'Nhà đang bán gần bạn'
                  : 'Nhà cho thuê gần bạn'}
              </Title>
              <Paragraph style={{ fontSize: 16, marginBottom: 32 }}>
                Tìm nhà để bán gần bạn. Xem ảnh, thông tin nhà mở cửa và thông tin chi tiết về bất
                động sản gần đó.
              </Paragraph>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <img
                src="/image/banner-homes-for-sale.png"
                alt="House preview"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  borderRadius: 12,
                  objectFit: 'cover',
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* Bộ lọc và tìm kiếm */}
        <Form form={form} initialValues={{ sortBy: 'dateCreated', sortDirection: 'desc' }}>
          <Card style={{ marginBottom: 20 }}>
            <Row gutter={16}>
              <Col span={8}>
                <FormItem name="locationIds">
                  <CustomTreeSelect
                    showSearch
                    treeData={locationTree}
                    fieldNames={{ label: 'name', value: 'locationId', children: 'children' }}
                    placeholder="Chọn khu vực"
                    allowClear
                    treeDefaultExpandAll
                    onChange={(value) => {
                      const node = findNodeById(locationTree, value);
                      form.setFieldValue('locationIds', findIdAndNodeChildrenIds(node));
                    }}
                  />
                </FormItem>
              </Col>
              <Col span={4}>
                <FormItem name="priceFrom">
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Giá từ"
                    value={propertyType || undefined}
                    onChange={setPropertyType}
                    allowClear
                  >
                    {[0.5, 1, 2, 3, 4, 5, 10, 15, 20, 30, 50, 100].map((price) => (
                      <Option key={price} value={price}>
                        {price} {location.pathname.includes('/buy') ? 'Tỷ đồng' : 'Triệu đồng'}
                      </Option>
                    ))}
                  </Select>
                </FormItem>
              </Col>
              <Col span={4}>
                <FormItem name="priceTo">
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Giá đến"
                    value={propertyType || undefined}
                    onChange={setPropertyType}
                    allowClear
                  >
                    {[0.5, 1, 2, 3, 4, 5, 10, 15, 20, 30, 50, 100].map((price) => (
                      <Option
                        key={price}
                        value={price}
                        disabled={
                          form.getFieldValue('priceFrom')
                            ? form.getFieldValue('priceFrom') >= price
                            : false
                        }
                      >
                        {price} {location.pathname.includes('/buy') ? 'Tỷ đồng' : 'Triệu đồng'}
                      </Option>
                    ))}
                  </Select>
                </FormItem>
              </Col>
              <Col span={3}>
                <FormItem name="sortBy">
                  <Select placeholder="Sắp xếp theo">
                    <Option key="dateCreated" value="dateCreated">
                      Mới nhất
                    </Option>
                    <Option key="priceNewestValue" value="priceNewestValue">
                      Giá
                    </Option>
                  </Select>
                </FormItem>
              </Col>
              <Col span={1}>
                <Form form={form}>
                  <Form.Item name="sortDirection">
                    <Button
                      icon={sortDirection === 'asc' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      onClick={toggleSortDirection}
                    />
                  </Form.Item>
                </Form>
              </Col>
              <Col span={4}>
                <Space
                  direction="horizontal"
                  style={{ display: 'flex', justifyContent: 'space-evenly' }}
                >
                  <Button type="primary" ghost onClick={resetFilters}>
                    Đặt lại
                  </Button>
                  <Button type="primary" onClick={handleSearch}>
                    Tìm kiếm
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Form>

        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 2,
            lg: 3,
            xl: 3,
            xxl: 3,
          }}
          dataSource={properties}
          {...tableProps(total)}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}
                onClick={() => {
                  navigate(`/buy/houses-for-sale/detail/${item.propertyId}`);
                }}
                cover={
                  <div style={{ position: 'relative' }}>
                    <Carousel arrows dots={true} infinite={true} autoplay={true}>
                      {item.propertyFilesDTOs
                        ?.filter((file) => file.category === 'COMMON')
                        .flatMap((fileGroup) => fileGroup.fileIds || [])
                        .map((fileId) => (
                          <div
                            key={fileId}
                            style={{
                              height: 240,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <FileRenderer
                              fileId={fileId}
                              height={240}
                              width="100%"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        ))}
                    </Carousel>

                    {/* Tags section */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        zIndex: 1,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      {item.statusIds?.map((statusId) => {
                        const status = propertyStatusList.find((s) => s.statusId === statusId);
                        return (
                          <Tag
                            key={statusId}
                            color={status?.color}
                            style={{
                              fontWeight: 600,
                            }}
                          >
                            {status?.name?.toUpperCase()}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                }
              >
                <div style={{ position: 'relative', minHeight: '180px' }}>
                  <div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {item.propertyPriceNewest?.value}&ensp;{item.propertyPriceNewest?.scaleUnit}
                    </Title>
                    <Text>
                      {item.amenityDTOs?.find((item) => item.code === 'BED')?.valueDisplay}
                      &ensp;·&ensp;
                      {item.amenityDTOs?.find((item) => item.code === 'BATH')?.valueDisplay}
                      &ensp;·&ensp;
                      {item.amenityDTOs?.find((item) => item.code === 'AREA')?.valueDisplay}
                    </Text>
                    <br />
                    <Text type="secondary">
                      {item.addressSpecific},{' '}
                      {locationList.find((l) => l.locationId === item.locationId)?.fullname}
                    </Text>
                    <br />
                    <br />
                    <Space size="small" wrap>
                      {item.amenityDTOs
                        ?.filter((am) => am.amenityType === 'AMENITY_TYPE_02')
                        .map((am) => <Text type="secondary">{am.name}</Text>)}
                    </Space>
                  </div>

                  {/* Action section */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: '#fff',
                      padding: '8px 0 0 8px',
                    }}
                  >
                    <Space>
                      {item.isInFavourite === 1 ? (
                        <Tooltip title="Bỏ lưu">
                          <Button
                            type="text"
                            size="large"
                            icon={<HeartFilled style={{ color: '#ff4d4f' }}/>}
                            onClick={(e) => {
                              handleRemoveToFavourite(item.propertyId ?? '');
                              e.stopPropagation();
                            }}
                          ></Button>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Lưu">
                          <Button
                            type="text"
                            size="large"
                            icon={<HeartOutlined style={{ color: '#ff4d4f' }} />}
                            onClick={(e) => {
                              handleAddToFavourite(item.propertyId ?? '');
                              e.stopPropagation();
                            }}
                          ></Button>
                        </Tooltip>
                      )}
                    </Space>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Flex>
    </PageContainer>
  );
};

export default BuyPage;
