import React from "react";
import { Modal, Button } from "antd";
import { CheckCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import type { AttendanceRow } from "../../interfaces/attendanceInterface";
import type { StudentInfo } from "../../interfaces/studentInterface";

interface ConfirmAttendanceModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  absentData: AttendanceRow[];
  studentInfoMap: Map<string, StudentInfo>;
}

export const ConfirmAttendanceModal: React.FC<ConfirmAttendanceModalProps> = ({
  open,
  onConfirm,
  onCancel,
  absentData,
  studentInfoMap,
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircleOutlined
            style={{ marginRight: '8px', fontSize: '20px', color: '#52c41a' }}
          />
          Confirmar asistencia
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" danger onClick={onCancel}>
          Cancelar
        </Button>,
        <Button type="primary" onClick={onConfirm}>
          Guardar asistencia
        </Button>
      ]}
      width={'35%'}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <CalendarOutlined style={{ fontSize: '48px' }} />
        </div>

        <p style={{
          marginBottom: '16px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Confirme la información antes de guardarla:
        </p>

        <div style={{
          backgroundColor: '#fff2e8',
          border: '1px solid #ffcc7a',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px',
          textAlign: 'left'
        }}>
          {absentData && absentData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ color: '#d46b08' }}>
                Los siguientes estudiantes se encuentran Ausentes:
                {absentData.map((a) => (
                  <div key={a.studentId}>
                    - {studentInfoMap.get(a.studentId)?.name} {studentInfoMap.get(a.studentId)?.lastname}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ color: '#d46b08' }}>
                Todos los estudiantes asistieron
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmAttendanceModal;