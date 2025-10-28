import React from "react";
import { Modal, Typography, theme } from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useDeleteStyles, BASE_STYLES } from "../../../styles/deleteStyles";
import { DELETE_CONSTANTS } from "../../../constants/delete.constants";
import type { ResourceInfo } from "../../../hooks/useDeleteConfirm";

const { Text } = Typography;

interface DeleteConfirmModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  confirmLoading: boolean;
  okText?: string;
  cancelText?: string;
  message?: string;
  resourceInfo: ResourceInfo;
}

/**
 * Componente presentacional del modal de confirmación
 * No contiene lógica de estado, solo recibe props
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  okText = DELETE_CONSTANTS.TEXTS.CONFIRM_TEXT,
  cancelText = DELETE_CONSTANTS.TEXTS.CANCEL_TEXT,
  message = DELETE_CONSTANTS.TEXTS.DEFAULT_MESSAGE,
  resourceInfo,
}) => {
  const { token } = theme.useToken();
  const styles = useDeleteStyles();

  return (
    <Modal
      title={
        <div style={styles.modalHeader}>
          <ExclamationCircleOutlined style={{ marginRight: token.marginXS, fontSize: '20px' }} />
          <span style={{ fontWeight: '600' }}>{DELETE_CONSTANTS.TEXTS.CONFIRM_TITLE}</span>
        </div>
      }
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      centered
      width={DELETE_CONSTANTS.SIZES.MODAL_WIDTH}
      styles={{
        body: styles.modal.body
      }}
      okButtonProps={{
        danger: true,
        size: "large",
        style: {
          backgroundColor: token.colorErrorActive,
          borderColor: token.colorErrorBorder,
          fontWeight: '500'
        }
      }}
      cancelButtonProps={{
        size: "large",
        style: {
          borderColor: token.colorBorder,
          color: token.colorText,
          fontWeight: '500'
        }
      }}
    >
      <div style={BASE_STYLES.textAlignCenter}>
        {/* Ícono principal de eliminación */}
        <div style={styles.mainIcon}>
          <DeleteOutlined style={{ fontSize: `${DELETE_CONSTANTS.SIZES.ICON_SIZE}px` }} />
        </div>

        {/* Mensaje de confirmación */}
        <p style={styles.message}>
          {message}
        </p>

        {/* Información del recurso */}
        <div style={styles.resourceContainer}>
          <div style={styles.resourceHeader}>
            <div style={styles.resourceIcon}>
              {resourceInfo.icon || <FileTextOutlined />}
            </div>
            <Text strong style={styles.resourceName}>
              {resourceInfo.name}
            </Text>
            {resourceInfo.type && (
              <Text style={styles.resourceType}>
                ({resourceInfo.type})
              </Text>
            )}
          </div>

          {/* Información adicional */}
          {resourceInfo.additionalInfo && (
            <div style={styles.additionalInfo}>
              {resourceInfo.additionalInfo}
            </div>
          )}

          {/* Mensaje de advertencia */}
          <div style={styles.warningMessage}>
            <ExclamationCircleOutlined style={styles.warningIcon} />
            <Text style={styles.warningText}>
              {DELETE_CONSTANTS.TEXTS.CANNOT_UNDO}
            </Text>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;