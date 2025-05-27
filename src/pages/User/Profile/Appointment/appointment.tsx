import { Avatar, Form, Popconfirm, Table, Tabs, TimePicker, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import moment from 'moment';
import { Calendar, Badge, Button, Card, Space, Tag, Typography, message } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import {
  createAppointment,
  deleteAppointment,
  getAppointmentBySearch,
  updateAppointment,
} from '@/services/apis/appointmentController';
import dayjs from 'dayjs';
import { UNPAGED } from '@/core/constant';
import useStatus from '@/selectors/useStatus';
import { PageContainer } from '@ant-design/pro-components';
import TabPane from 'antd/es/tabs/TabPane';
import AppointmentModal from './appointment-modal';
import usePagination from '@/components/EditableTable/usePagination';
import { useCurrentUser } from '@/selectors/useCurrentUser';
import AppointmentApprovalModal from './approve-modal';
import ApprovalHistoryModal from '../../../../components/ApprovalHistory/approve-history-modal';

const { Title, Paragraph, Text } = Typography;

const Appointment: React.FC = () => {
  const currentUser = useCurrentUser();
  const { appointmentStatusList } = useStatus();

  const [appointments, setAppointments] = useState<API.AppointmentDTO[]>([]);
  const [appointmentsUpdate, setAppointmentsUpdate] = useState<API.AppointmentDTO | null>(null);
  const [isModalAppointmentVisible, setIsModalAppointmentVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const { tableProps } = usePagination();
  const { pagination } = tableProps(total);

  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [isApprove, setIsApprove] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<API.AppointmentDTO | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryAppointment, setSelectedHistoryAppointment] = useState<API.AppointmentDTO | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = () => {
    setLoading(true);
    getAppointmentBySearch(UNPAGED, {} as API.AppointmentDTO)
      .then((response) => {
        if (response.success) {
          setAppointments(response.data || []);
          setTotal(response.total || 0);
        } else {
          message.error('Failed to fetch appointments');
        }
      })
      .catch((error) => {
        message.error('Failed to fetch appointments');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Mở modal phê duyệt
  const handleApprove = (contract: API.AppointmentDTO) => {
    setSelectedAppointment(contract);
    setIsApprove(true);
    setApprovalModalVisible(true);
  };

  // Mở modal từ chối
  const handleReject = (contract: API.AppointmentDTO) => {
    setSelectedAppointment(contract);
    setIsApprove(false);
    setApprovalModalVisible(true);
  };

  const handleCancelAppointment = async (id: string) => {
    deleteAppointment({ id: id })
      .then((resp) => {
        if (resp.success) {
          message.success('Đã hủy cuộc hẹn thành công');
          fetchAppointments();
        } else {
          message.error('Hủy cuộc hẹn thất bại');
        }
      })
      .catch((error) => {
        message.error('Có lỗi xảy ra khi hủy cuộc hẹn');
      });
  };

  const showModal = (appointment: API.AppointmentDTO) => {
    console.log('appointment', appointment);
    setAppointmentsUpdate(appointment);
    setIsModalAppointmentVisible(true);
  };

  const handleCancelAppointmentModal = () => {
    setIsModalAppointmentVisible(false);
  };

  const getAppointmentsByDate = (date: dayjs.Dayjs) => {
    return appointments.filter((appointment) => {
      const appointmentDate = dayjs(appointment.date);
      return appointmentDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
    });
  };

  const dateCellRender = (date: dayjs.Dayjs) => {
    const appointments = getAppointmentsByDate(date);
    if (appointments.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {appointments.map((appointment) => (
          <li key={appointment.appointmentId}>
            <Badge
              style={{ width: '150px' }}
              color={appointmentStatusList.find((s) => s.statusId === appointment.statusId)?.color}
              text={`${moment(appointment.date).format('HH:mm')} - ${appointment.propertyAddress}`}
            />
          </li>
        ))}
      </ul>
    );
  };

  const handleCalendarSelect = (date: dayjs.Dayjs) => {
    const appointments = getAppointmentsByDate(date);
  };

  // Mở modal lịch sử
  const handleViewHistory = (appointment: API.AppointmentDTO) => {
    setSelectedHistoryAppointment(appointment);
    setHistoryModalVisible(true);
  };

  const columns = [
    {
      title: 'Bất động sản',
      dataIndex: 'propertyAddress',
      key: 'propertyAddress',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => moment(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Người mua',
      dataIndex: 'buyer',
      key: 'buyer',
      render: (buyer: string) => buyer || '___',
    },
    {
      title: 'Người bán',
      dataIndex: 'seller',
      key: 'seller',
      render: (seller: string) => seller || '___',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'statusId',
      key: 'status',
      render: (statusId: string, record: any) => {
        const status = appointmentStatusList.find((s) => s.statusId === statusId);
        return <Tag color={status?.color}>{status?.name}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Xem lịch sử">
            <Button
              icon={<HistoryOutlined />}
              onClick={() => handleViewHistory(record)}
              size="small"
            >
              Lịch sử
            </Button>
          </Tooltip>
          
          {record.buyer === currentUser?.username ? (
            <>
              <Button
                // disabled={
                //   !(
                //     appointmentStatusList.find((s) => s.statusId === record.statusId)?.code ===
                //     'PROCESS'
                //   )
                // }
                onClick={() => {
                  showModal(record);
                }}
                size="small"
              >
                Rời lịch
              </Button>
              <Tooltip title="Hủy">
                <Button
                  disabled={
                    !(
                      appointmentStatusList.find((s) => s.statusId === record.statusId)?.code ===
                      'PROCESS'
                    )
                  }
                  onClick={() => handleCancelAppointment(record.appointmentId)}
                  danger
                  size="small"
                >
                  Hủy hẹn
                </Button>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Xác nhận">
                <Button
                  type="primary"
                  disabled={
                    !(
                      appointmentStatusList.find((s) => s.statusId === record.statusId)?.code ===
                      'PROCESS'
                    )
                  }
                  onClick={() => handleApprove(record)}
                  size="small"
                >
                  Xác nhận
                </Button>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button
                  disabled={
                    !(
                      appointmentStatusList.find((s) => s.statusId === record.statusId)?.code ===
                      'PROCESS'
                    )
                  }
                  onClick={() => handleReject(record)}
                  danger
                  size="small"
                >
                  Từ chối
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Lịch hẹn">
      <Card>
        <Tabs defaultActiveKey="2">
          <TabPane tab="Lịch" key="1">
            <Calendar cellRender={dateCellRender} onSelect={handleCalendarSelect} />
          </TabPane>
          <TabPane tab="Danh sách cuộc hẹn" key="2">
            <Table
              rowKey="appointmentId"
              dataSource={appointments}
              columns={columns}
              loading={loading}
              {...tableProps(total ?? 0)}
              scroll={{ x: 800 }}
            />
          </TabPane>
        </Tabs>
      </Card>
      <AppointmentModal
        isModalAppointmentVisible={isModalAppointmentVisible}
        appointmentUpdate={appointmentsUpdate}
        onCancel={handleCancelAppointmentModal}
        type="update"
      />
      <AppointmentApprovalModal
        visible={approvalModalVisible}
        isApprove={isApprove}
        appointment={selectedAppointment}
        onClose={() => setApprovalModalVisible(false)}
        onSuccess={() => {
          fetchAppointments();
        }}
      />
      <ApprovalHistoryModal
        visible={historyModalVisible}
        entityTable={selectedHistoryAppointment}
        onClose={() => setHistoryModalVisible(false)}
        title="Lịch sử phê duyệt cuộc hẹn"
      />
    </PageContainer>
  );
};

export default Appointment;