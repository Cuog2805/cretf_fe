// pages/RealEstateList.tsx - Trang hiển thị danh sách bất động sản
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Space,
  Table,
  message,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  getFavouriteProperties,
  removeToFavourite,
} from '@/services/apis/propertyController';
import useStatus from '@/selectors/useStatus';
import { useCurrentUser } from '@/selectors/useCurrentUser';
import usePagination from '@/components/EditableTable/usePagination';
import usePropertyType from '@/selectors/usePropertyType';
import { PageContainer } from '@ant-design/pro-components';
import useLocations from '@/selectors/useLocation';

const { Title } = Typography;

const MyPropertyFavouriteList = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { propertyTypeList } = usePropertyType();

  const [properties, setProperties] = useState<API.PropertyDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const { tableProps, paginationQuery } = usePagination({
    sort: 'dateCreated,desc',
  });

  useEffect(() => {
    handleSearch();
  }, [paginationQuery]);

  const handleSearch = () => {
    setLoading(true);
    const body: API.PropertyDTO = {
      usernameFav: currentUser?.username,
    };
    const page: any = {
      page: paginationQuery.page,
      size: paginationQuery.size,
      sort: paginationQuery.sort,
    };
    
    getFavouriteProperties(page, body)
      .then((res) => {
        setProperties(res?.data || []);
        setTotal(res?.total || 0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = (id: string) => {
    // Thêm id vào danh sách đang xóa để hiển thị trạng thái loading
    setDeletingIds((prev) => [...prev, id]);
    
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
      .finally(() => {
        // Xóa id khỏi danh sách đang xóa khi hoàn thành
        setDeletingIds((prev) => prev.filter((item) => item !== id));
      });
  };

  // Lấy tên loại bất động sản dựa vào propertyTypeId
  const getPropertyTypeName = (propertyTypeId?: string) => {
    const propertyType = propertyTypeList.find((type) => type.propertyTypeId === propertyTypeId);
    return propertyType?.name || 'Không xác định';
  };

  // Cấu hình các cột cho bảng
  const columns = [
    {
      title: 'Tên bất động sản',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: API.PropertyDTO) => (
        <a onClick={() => navigate(`/buy/houses-for-sale/detail/${record.propertyId}`)}>
          {text || 'Không có tên'}
        </a>
      ),
    },
    {
      title: 'Loại bất động sản',
      dataIndex: 'propertyTypeId',
      key: 'propertyTypeName',
      render: (propertyTypeId: string) => getPropertyTypeName(propertyTypeId),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: any, record: API.PropertyDTO) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/buy/houses-for-sale/detail/${record.propertyId}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa khỏi mục đã lưu">
            <Popconfirm
              title="Bạn chắc chắn muốn xóa bất động sản này khỏi danh sách đã lưu?"
              onConfirm={() => handleDelete(record.propertyId || '')}
              okText="Có"
              cancelText="Không"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deletingIds.includes(record.propertyId || '')}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Bất động sản đã lưu">
      <Table
        columns={columns}
        dataSource={properties}
        rowKey="propertyId"
        loading={loading}
        pagination={{
          ...tableProps(total).pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bất động sản`,
        }}
      />
    </PageContainer>
  );
};

export default MyPropertyFavouriteList;