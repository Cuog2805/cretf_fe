import React from 'react';
import { Modal, Table, Empty, Tag, Typography, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HistoryOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import useStatus from '@/selectors/useStatus';
import ApprovalHistory from '@/components/ApprovalHistory/approve-history';

const { Text, Title } = Typography;

interface ApprovalHistoryModalProps {
  visible: boolean;
  entityTable: any | null;
  onClose: () => void;
  title?: string;
}

const ApprovalHistoryModal: React.FC<ApprovalHistoryModalProps> = ({
  visible,
  entityTable,
  onClose,
  title = 'Lịch sử phê duyệt'
}) => {
  const { appointmentStatusList } = useStatus();

  const approvalHistories = entityTable?.approvalHistoryDTOs || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>{title}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      {approvalHistories.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử phê duyệt" />
      ) : (
        <>
          <ApprovalHistory entityTable={entityTable} />
        </>
      )}
    </Modal>
  );
};

export default ApprovalHistoryModal;