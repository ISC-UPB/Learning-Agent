import PeriodForm from "../../../components/PeriodForm";
import { SafetyModal } from "../../../components/safetyModal";
import { SingleStudentForm } from "../../../components/singleStudentForm";
import StudentPreviewModal from "../../../components/StudentPreviewModal";
import AttendanceModal from "../../../components/AttendanceModal";
import AbsencesModal from "../../../components/AbsencesModal";
import type { StudentInfo } from "../../../interfaces/studentInterface";
import type { createEnrollmentInterface } from "../../../interfaces/enrollmentInterface";
import type { Clase } from "../../../interfaces/claseInterface";

type Props = {
  period: any;
  course: any;
  students: any[];
  classId: string;
  selectedStudent?: StudentInfo;
  editModalOpen: boolean; onCloseEdit: () => void;
  safetyModalOpen: boolean; onCancelSafety: () => void; onConfirmSafety: () => void; safetyTitle: string; safetyMessage: string;
  singleStudentFormOpen: boolean; onCloseSingle: () => void;
  previewModalOpen: boolean; onCancelPreview: () => void; onConfirmGroup: () => Promise<void>;
  parsedStudents: any[]; duplicates: string[]; meta: { fileName: string; totalRows: number }; sending: boolean;
  attendanceModalOpen: boolean; onCloseAttendance: () => void; onSubmitAttendance: () => void;
  absencesModalOpen: boolean; onCloseAbsences: () => void;
  onSubmitEdit: (v: any) => Promise<void>;
  onSubmitSingle: (v: any) => Promise<void>;
};

export default function ModalsContainer(props: Props) {
  const {
    period, course, students, classId, selectedStudent,
    editModalOpen, onCloseEdit,
    safetyModalOpen, onCancelSafety, onConfirmSafety, safetyTitle, safetyMessage,
    singleStudentFormOpen, onCloseSingle,
    previewModalOpen, onCancelPreview, onConfirmGroup, parsedStudents, duplicates, meta, sending,
    attendanceModalOpen, onCloseAttendance, onSubmitAttendance,
    absencesModalOpen, onCloseAbsences,
    onSubmitEdit, onSubmitSingle,
  } = props;

  return (
    <>
      <PeriodForm
        open={editModalOpen}
        onClose={onCloseEdit}
        onSubmit={(values) => onSubmitEdit(values as Clase)}
        period={period}
        course={course}
      />

      <SafetyModal
        open={safetyModalOpen}
        onCancel={onCancelSafety}
        onConfirm={onConfirmSafety}
        title={safetyTitle}
        message={safetyMessage}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        danger
      />

      <SingleStudentForm
        open={singleStudentFormOpen}
        onClose={onCloseSingle}
        onSubmit={(values) => onSubmitSingle(values as createEnrollmentInterface)}
      />

      <StudentPreviewModal
        open={previewModalOpen}
        data={parsedStudents}
        duplicates={duplicates}
        meta={meta}
        loading={sending}
        onCancel={onCancelPreview}
        onConfirm={onConfirmGroup}
      />

      <AttendanceModal
        open={attendanceModalOpen}
        onClose={onCloseAttendance}
        onSubmit={onSubmitAttendance}
        students={students || []}
        classId={classId || ""}
      />

      <AbsencesModal
        open={absencesModalOpen}
        onClose={onCloseAbsences}
        student={selectedStudent}
        classId={classId || ""}
      />
    </>
  );
}
