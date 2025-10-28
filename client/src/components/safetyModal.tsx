import { Modal, Button } from "antd";
import DeleteButton from "./shared/delete/DeleteButton";
import DeleteConfirmModal from "./shared/delete/DeleteConfirmModal";

// SafetyModal original (componente genérico)
interface SafetyModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}



export const SafetyModal = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
}: SafetyModalProps) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      centered
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        <Button key="confirm" danger={danger} type="primary" onClick={onConfirm}>
          {confirmText}
        </Button>,
      ]}
      title={title}
    >
      <p style={{ fontSize: "16px" }}>{message}</p>
    </Modal>
  );
};

// Re-exportar todos los componentes y tipos
export { DeleteButton, DeleteConfirmModal };
export type { 
  ResourceInfo, 
  ButtonConfig, 
  ModalConfig 
} from "../hooks/useDeleteConfirm";

export default DeleteButton;

