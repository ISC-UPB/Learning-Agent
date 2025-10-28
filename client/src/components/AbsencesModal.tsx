import { Modal, Table, Empty, Button } from "antd";
import type { AbsenceRow } from "../interfaces/attendanceInterface";
import type { StudentInfo } from "../interfaces/studentInterface";
import useAbsencesModal from  "../hooks/useAbsencesModal";
import ModalHeader from "./tests/attendance/ModalHeader";

interface AbsencesModalProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  student?: StudentInfo;
}

function AbsencesModal({ open, onClose, classId, student }: AbsencesModalProps) {
  const { columns, width, loading, actualAbsencesDates } = useAbsencesModal({
    classId,
    student,
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<ModalHeader student={student} />}
      footer={[
        <Button key="accept" type="primary" onClick={onClose}>
          Aceptar
        </Button>,
      ]}
      width={width}
    >
      {actualAbsencesDates && actualAbsencesDates.length > 0 ? (
        <Table<AbsenceRow>
          columns={columns}
          dataSource={actualAbsencesDates}
          loading={loading}
          pagination={false}
        />
      ) : (
        <Empty description="No hay ausencias registradas" />
      )}
    </Modal>
  );
}

export default AbsencesModal;