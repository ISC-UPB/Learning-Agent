import type { StudentInfo } from "./studentInterface";

export interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  students: StudentInfo[];
  classId: string;
}

export interface CreateAttendanceInterface {
    classId: string,
    teacherId: string,
    date: Date,
    studentRows: AttendanceRow[]
}

export interface AttendanceRow {
    studentId: string,
    isPresent?: boolean,
}

export interface StudentAbsenceInfo {
    userId: string,
    code: string,
    name: string,
    lastname: string,
    totalAbsences: number,
}

export interface AbsenceRow {
    date: Date,
}