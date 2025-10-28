import { useState, useCallback } from "react";
import type { ButtonProps } from "antd";
import { DELETE_CONSTANTS } from "../constants/delete.constants";
import { DeleteOutlined } from "@ant-design/icons";
import React from "react";

export interface ResourceInfo {
  name: string;
  type?: string;
  icon?: React.ReactNode;
  additionalInfo?: string | React.ReactNode;
}

export interface ButtonConfig {
  showText?: boolean;
  width?: number;
  height?: number;
  variant?: "fill" | "ghost" | "text" | "link";
  size?: "small" | "middle" | "large";
  shape?: "default" | "circle" | "round";
  disabled?: boolean;
  className?: string;
}

export interface ModalConfig {
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

interface UseDeleteConfirmProps {
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

interface UseDeleteConfirmReturn {
  modalOpen: boolean;
  deleting: boolean;
  
  handleButtonClick: () => void;
  handleConfirmDelete: () => Promise<void>;
  handleCancel: () => void;
  
  getButtonProps: () => ButtonProps;
  getModalProps: () => {
    open: boolean;
    onOk: () => Promise<void>;
    onCancel: () => void;
    confirmLoading: boolean;
    okText: string;
    cancelText: string;
    message: string;
  };
  
  resourceInfo: ResourceInfo;
}

/**
 * Hook para manejar la confirmación de eliminación
 * Extrae toda la lógica de estado y handlers del componente UI
 */
export const useDeleteConfirm = ({
  onDelete,
  resourceInfo,
  buttonConfig = {},
  modalConfig = {},
  onDeleteStart,
  onDeleteSuccess,
  onDeleteError,
  onCancel,
  disabled = false,
}: UseDeleteConfirmProps): UseDeleteConfirmReturn => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const {
    showText = true,
    width,
    height,
    variant = "fill",
    size = "middle",
    shape = "default",
    disabled: buttonDisabled = false,
    className = "",
  } = buttonConfig;

  const {
    message: modalMessage = DELETE_CONSTANTS.TEXTS.DEFAULT_MESSAGE,
    confirmText = DELETE_CONSTANTS.TEXTS.CONFIRM_TEXT,
    cancelText = DELETE_CONSTANTS.TEXTS.CANCEL_TEXT,
  } = modalConfig;

  const handleButtonClick = useCallback(() => {
    onDeleteStart?.();
    setModalOpen(true);
  }, [onDeleteStart]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      setDeleting(true);
      await onDelete();
      setModalOpen(false);
      onDeleteSuccess?.();
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error("Error desconocido");
      onDeleteError?.(errorInstance);
    } finally {
      setDeleting(false);
    }
  }, [onDelete, onDeleteSuccess, onDeleteError]);

  const handleCancel = useCallback(() => {
    setModalOpen(false);
    onCancel?.();
  }, [onCancel]);

  const getButtonProps = useCallback((): ButtonProps => {
    const baseProps: ButtonProps = {
      icon: React.createElement(DeleteOutlined),
      size,
      shape,
      disabled: disabled || buttonDisabled || deleting,
      className,
      style: {
        width,
        height,
        color: variant === "fill" ? "#ffffff" : DELETE_CONSTANTS.FIXED_COLOR,
        backgroundColor: variant === "fill" ? DELETE_CONSTANTS.FIXED_COLOR : "transparent",
        borderColor: DELETE_CONSTANTS.FIXED_COLOR,
        ...(["ghost", "text", "link"].includes(variant) && {
          backgroundColor: "transparent",
        }),
      },
    };

    switch (variant) {
      case "fill":
        return { ...baseProps, type: "primary" };
      case "ghost":
        return { ...baseProps, ghost: true };
      case "text":
        return { ...baseProps, type: "text" };
      case "link":
        return { ...baseProps, type: "link" };
      default:
        return { ...baseProps, type: "default" };
    }
  }, [showText, width, height, variant, size, shape, buttonDisabled, className, disabled, deleting]);

  // Props para el modal
  const getModalProps = useCallback(() => ({
    open: modalOpen,
    onOk: handleConfirmDelete,
    onCancel: handleCancel,
    confirmLoading: deleting,
    okText: confirmText,
    cancelText: cancelText,
    message: modalMessage,
  }), [modalOpen, handleConfirmDelete, handleCancel, deleting, confirmText, cancelText, modalMessage]);

  return {

    modalOpen,
    deleting,
    
    handleButtonClick,
    handleConfirmDelete,
    handleCancel,
    
    getButtonProps,
    getModalProps,
    
    resourceInfo,
  };
};