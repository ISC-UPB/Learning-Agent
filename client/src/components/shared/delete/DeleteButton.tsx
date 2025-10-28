import React from "react";
import { Button } from "antd";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import type { 
  ResourceInfo,
  ButtonConfig,
  ModalConfig 
} from "../../../hooks/useDeleteConfirm";

interface DeleteButtonProps {
  onDelete: () => Promise<void> | void;
  resourceInfo: ResourceInfo;
  buttonConfig?: ButtonConfig;
  modalConfig?: ModalConfig;
  onDeleteStart?: () => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const DeleteButton: React.FC<DeleteButtonProps> = (props) => {
  const {
    getButtonProps,
    handleButtonClick
  } = useDeleteConfirm(props);

  return (
    <Button {...getButtonProps()} onClick={handleButtonClick}>
      {props.buttonConfig?.showText !== false && "Eliminar"}
    </Button>
  );
};

// Re-exportar tipos
export type { ResourceInfo, ButtonConfig, ModalConfig };
export default DeleteButton;