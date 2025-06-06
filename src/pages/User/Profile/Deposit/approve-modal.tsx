import React, { useState } from 'react';
import { Modal, Form, Input, Typography, message, Descriptions, Row, Col, Tag } from 'antd';
//import { approveDepositContract } from '@/services/apis/depositContractController';
import { useCurrentUser } from '@/selectors/useCurrentUser';
import useStatus from '@/selectors/useStatus';
import useScale from '@/selectors/useScale';
import { approveDepositContract } from '@/services/apis/depositContractController';

const { TextArea } = Input;
const { Text } = Typography;

interface DepositApprovalModalProps {
  visible: boolean;
  isApprove: boolean;
  depositContract: API.DepositContractDTO | null;
  onClose: () => void;
  onSuccess: () => void; // Refresh data callback
}

const DepositApprovalModal: React.FC<DepositApprovalModalProps> = ({
  visible,
  isApprove,
  depositContract,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { depositStatusList } = useStatus();
  const { moneyScaleList } = useScale();
  const [loading, setLoading] = useState(false);
  const currentUser = useCurrentUser();

  const handleConfirm = () => {
    if (!depositContract) return;

    form.validateFields().then((values) => {
      setLoading(true);

      const statusId = depositStatusList.find(
        (d) => d.code === (isApprove ? 'CONFIRM' : 'REJECT'),
      )?.statusId;

      const body: API.DepositContractDTO = {
        depositContractId: depositContract.depositContractId,
        propertyId: depositContract.propertyId,
        buyer: depositContract.buyer,
        seller: depositContract.seller,
        approvalHistoryDTO: {
          statusId: statusId,
          approver: currentUser?.username,
          note: values.note,
        },
      };

      console.log('body', body);

      approveDepositContract(body)
        .then((res) => {
          if (res.success) {
            message.success(
              isApprove
                ? 'Đã phê duyệt hợp đồng đặt cọc thành công'
                : 'Đã từ chối hợp đồng đặt cọc thành công',
            );
            handleClose();
            onSuccess();
          } else {
            message.error(
              isApprove
                ? 'Có lỗi khi phê duyệt hợp đồng đặt cọc'
                : 'Có lỗi khi từ chối hợp đồng đặt cọc',
            );
          }
        })
        .catch((error) => {
          message.error(
            isApprove
              ? 'Có lỗi khi phê duyệt hợp đồng đặt cọc'
              : 'Có lỗi khi từ chối hợp đồng đặt cọc',
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
      title={isApprove ? 'Phê duyệt hợp đồng đặt cọc' : 'Từ chối hợp đồng đặt cọc'}
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
      width={600}
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
                ? 'Nhập lý do phê duyệt hợp đồng đặt cọc này...'
                : 'Nhập lý do từ chối hợp đồng đặt cọc này...'
            }
            maxLength={1000}
            showCount
            disabled={loading}
          />
        </Form.Item>

        {depositContract && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              marginTop: '16px',
            }}
          >
            <Text strong style={{ fontSize: '16px', marginBottom: '12px', display: 'block' }}>
              Thông tin hợp đồng đặt cọc
            </Text>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Mã hợp đồng: </Text>
                  <Text strong>{depositContract.depositContractId}</Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Bên bán: </Text>
                  <Text>{depositContract.seller}</Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Bên mua: </Text>
                  <Text>{depositContract.buyer}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Giá trị đặt cọc: </Text>
                  <Text strong>
                    {depositContract.depositDTO?.value} {moneyScaleList.find((s) => s.scaleId === depositContract.depositDTO?.scaleUnit)?.unit}
                  </Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Thời hạn: </Text>
                  <Text>{depositContract.depositDTO?.dueDate} ngày</Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Trạng thái hiện tại: </Text>
                  <Tag color="processing">
                    {depositStatusList.find((s) => s.statusId === depositContract.statusId)?.name ||
                      'Đang xử lý'}
                  </Tag>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default DepositApprovalModal;
