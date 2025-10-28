import React from "react";
import { Modal, Button } from "antd";
import { CalendarOutlined } from "@ant-design/icons";

import AttendanceTable from "./attendance/AttendanceTable";
import ConfirmAttendanceModal from "./attendance/ConfirmAttendanceModal";
import { useAttendanceModal } from "../hooks/useAttendanceModal";
import type { AttendanceModalProps } from "../interfaces/attendanceInterface";

const AttendanceModal: React.FC<AttendanceModalProps> = (props) => {
  const {
    showConfirmModal,
    
    handleSubmit,
    handleCancel,
    handleConfirmation,
    handleConfirmationCancel,
    handleCheckboxChange,
    
    studentMap,
    tableScrollY,
    modalTitle,
    studentInfoMap,
    absentData,
    isChecked,
  } = useAttendanceModal(props);

  return (
    <>
      {/* Modal principal de asistencia */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '16px', marginBottom: '16px' }}>
            <CalendarOutlined style={{ marginRight: '8px', fontSize: '20px' }} />
            {modalTitle}
          </div>
        }
        open={props.open}
        onCancel={handleCancel}
        maskClosable={false}
        centered
        footer={[
          <Button key="cancel" danger type="primary" onClick={handleCancel}>
            Cancelar
          </Button>,
          <Button type="primary" onClick={handleSubmit}>
            Guardar
          </Button>
        ]}
        width={window.innerWidth < 600 ? '90%' : '70%'}
        style={{ maxWidth: '90vw' }}
        styles={{
          body: {
            maxHeight: 'calc(100vh - 220px)',
            overflowY: 'auto',
          },
        }}
      >
        <AttendanceTable
          students={props.students}
          tableScrollY={tableScrollY}
          studentMap={studentMap}
          onCheckboxChange={handleCheckboxChange}
          isChecked={isChecked}
        />
      </Modal>

      {/* Modal de confirmación */}
      <ConfirmAttendanceModal
        open={showConfirmModal}
        onConfirm={handleConfirmation}
        onCancel={handleConfirmationCancel}
        absentData={absentData}
        studentInfoMap={studentInfoMap}
      />
    </>
  );
};

export default AttendanceModal;

