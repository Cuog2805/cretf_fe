import React, { useState } from 'react';
import { Modal, Form, Input, Typography, message, Row, Col, Tag, Divider } from 'antd';
import { CalendarOutlined, UserOutlined, HomeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { approveAppointment } from '@/services/apis/appointmentController';
import { useCurrentUser } from '@/selectors/useCurrentUser';
import useStatus from '@/selectors/useStatus';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

interface AppointmentApprovalModalProps {
  visible: boolean;
  isApprove: boolean;
  appointment: API.AppointmentDTO | null;
  onClose: () => void;
  onSuccess: () => void; // Refresh data callback
}

const AppointmentApprovalModal: React.FC<AppointmentApprovalModalProps> = ({
  visible,
  isApprove,
  appointment,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { appointmentStatusList } = useStatus();
  const [loading, setLoading] = useState(false);
  const currentUser = useCurrentUser();

  const handleConfirm = () => {
    if (!appointment) return;

    form.validateFields().then((values) => {
      setLoading(true);

      const statusId = appointmentStatusList.find(
        (d) => d.code === (isApprove ? 'CONFIRM' : 'REJECT'),
      )?.statusId;

      const body: API.AppointmentDTO = {
        appointmentId: appointment.appointmentId,
        approvalHistoryDTO: {
          statusId: statusId,
          approver: currentUser?.username,
          note: values.note,
        },
      };

      approveAppointment(body)
        .then((res) => {
          if (res.success) {
            message.success(
              isApprove
                ? 'Đã phê duyệt cuộc hẹn thành công'
                : 'Đã từ chối cuộc hẹn thành công',
            );
            handleClose();
            onSuccess();
          } else {
            message.error(
              isApprove
                ? 'Có lỗi khi phê duyệt cuộc hẹn'
                : 'Có lỗi khi từ chối cuộc hẹn',
            );
          }
        })
        .catch((error) => {
          message.error(
            isApprove
              ? 'Có lỗi khi phê duyệt cuộc hẹn'
              : 'Có lỗi khi từ chối cuộc hẹn',
          );
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={isApprove ? 'Phê duyệt lịch hẹn' : 'Từ chối lịch hẹn'}
      open={visible}
      onOk={handleConfirm}
      onCancel={handleClose}
      okText={isApprove ? 'Phê duyệt' : 'Từ chối'}
      cancelText="Hủy"
      okButtonProps={{
        type: isApprove ? 'primary' : 'default',
        danger: !isApprove,
        loading,
      }}
      cancelButtonProps={{ disabled: loading }}
      width={650}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="note"
          label={isApprove ? 'Lý do phê duyệt' : 'Lý do từ chối'}
          rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
        >
          <TextArea
            rows={4}
            placeholder={
              isApprove
                ? 'Nhập lý do phê duyệt lịch hẹn này...'
                : 'Nhập lý do từ chối lịch hẹn này...'
            }
            maxLength={1000}
            showCount
            disabled={loading}
          />
        </Form.Item>

        {appointment && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              marginTop: '16px',
            }}
          >
            <Text strong style={{ fontSize: '16px', marginBottom: '12px', display: 'block' }}>
              <CalendarOutlined /> Thông tin lịch hẹn
            </Text>

            <Row gutter={[16, 12]}>
              <Col span={24}>
                <div style={{ marginBottom: '8px' }}>
                  <HomeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <Text type="secondary">Địa chỉ: </Text>
                  <Text strong>{appointment.propertyAddress || 'Chưa có thông tin'}</Text>
                </div>
              </Col>

              <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Mã lịch hẹn: </Text>
                  <Text code>{appointment.appointmentId}</Text>
                </div>
              </Col>

              {/* <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Loại cuộc hẹn: </Text>
                  {getAppointmentTypeLabel(appointment.type)}
                </div>
              </Col> */}

              <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                  <Text type="secondary">Thời gian: </Text>
                  <Text strong>
                    {appointment.date ? dayjs(appointment.date).format('DD/MM/YYYY HH:mm') : 'Chưa xác định'}
                  </Text>
                </div>
              </Col>

              <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Trạng thái hiện tại: </Text>
                  <Tag color="processing">
                    {appointmentStatusList.find((s) => s.statusId === appointment.statusId)?.name ||
                      'N/A'}
                  </Tag>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 8]}>
              <Col span={8}>
                <div>
                  <UserOutlined style={{ marginRight: '4px' }} />
                  <Text type="secondary">Người mua: </Text>
                  <div>
                    <Text>{appointment.buyer || 'Không có thông tin'}</Text>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <UserOutlined style={{ marginRight: '4px' }} />
                  <Text type="secondary">Người bán: </Text>
                  <div>
                    <Text>{appointment.seller || 'Không có thông tin'}</Text>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <UserOutlined style={{ marginRight: '4px' }} />
                  <Text type="secondary">Môi giới: </Text>
                  <div>
                    <Text>{appointment.agent || 'Không có thông tin'}</Text>
                  </div>
                </div>
              </Col>
            </Row>

            {appointment.note && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <Text type="secondary">Ghi chú: </Text>
                  <Text>{appointment.note}</Text>
                </div>
              </>
            )}
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default AppointmentApprovalModal;