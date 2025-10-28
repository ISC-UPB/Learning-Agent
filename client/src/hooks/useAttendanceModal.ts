import { message } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AttendanceRow, CreateAttendanceInterface } from "../interfaces/attendanceInterface";
import type { StudentInfo } from "../interfaces/studentInterface";
import useAttendance from "./useAttendance";


interface UseAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  students: StudentInfo[];
  classId: string;
}
interface UseAttendanceModalReturn {
  studentMap: Map<string, boolean>;
  attendanceData: AttendanceRow[];
  absentData: AttendanceRow[];
  showConfirmModal: boolean;
  
  handleCheckboxChange: (userId: string, isChecked: boolean) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  handleConfirmation:() =>Promise <void>;
  handleConfirmationCancel: () => void;

  studentInfoMap: Map<string, StudentInfo>;
  tableScrollY: number;
  modalTitle: string;
  isChecked: (studentId: string) => boolean;
}

export const useAttendanceModal = ({
  open,
  onClose,
  onSubmit,
  students = [],
  classId,
}: UseAttendanceModalProps): UseAttendanceModalReturn => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentMap, setStudentMap] = useState<Map<string, boolean>>(new Map());
  const [attendanceData, setAttendanceData] = useState<AttendanceRow[]>([]);
  const [absentData, setAbsentData] = useState<AttendanceRow[]>([]);
  const { saveAttendanceList } = useAttendance();

  const prepareData = useCallback(() => {
    const dataMap: Map<string, boolean> = new Map();
    students.forEach((student: StudentInfo) => {
      dataMap.set(student.userId, false)
    })
    setStudentMap(dataMap)
  }, [students]);

  useEffect(() => {
    if (open) {
      prepareData();
    }
  }, [students, open, prepareData]); 

  const resetStudentMap = useCallback(() => {
    const newMap = new Map<string, boolean>();
    students.forEach(student => {
      newMap.set(student.userId, false);
    });
    setStudentMap(newMap);
  }, [students]);

  const studentInfoMap = useMemo(() => {
    const map = new Map<string, StudentInfo>();
    students.forEach(student => {
      map.set(student.userId, student);
    });
    return map;
  }, [students]);
  const isChecked = useCallback((studentId: string):boolean => {
    return studentMap.get(studentId) || false;
  }, [studentMap]);

  const handleCheckboxChange = useCallback((studentId: string, checked: boolean) => {
    const newMap = new Map(studentMap);
    newMap.set(studentId, checked);
    setStudentMap(newMap);
  }, [studentMap]);

  const handleSubmit = useCallback(() => {
    const attendanceRows = Array.from(studentMap.entries()).map(
      ([studentId, isPresent]) => ({
        studentId,
        isPresent,
      }));

    setAttendanceData(attendanceRows);

    const absences = attendanceRows.filter((a) => !a.isPresent)
    setAbsentData(absences)

    setShowConfirmModal(true)
  }, [studentMap]);

   const handleCancel = useCallback(() => {
    resetStudentMap()
    onClose();
  }, [resetStudentMap, onClose]);

  const handleConfirmation = useCallback(async () => {
    setShowConfirmModal(false)

    const attendanceInfo: Omit<CreateAttendanceInterface, "teacherId"> = {
      classId,
      date: dayjs().startOf('day').toDate(),
      studentRows: attendanceData
    };  

    const res = await saveAttendanceList(attendanceInfo)
    if (res?.state === "success") {
      message.success(res.message)
    } else if (res?.state === "error"){
      message.error(res.message)
    } else if (res?.state === "info") {
      message.info(res.message)
    }
    resetStudentMap();
    onSubmit();
    onClose();
  }, [classId, attendanceData, resetStudentMap, onSubmit, onClose, saveAttendanceList]);

   const handleConfirmationCancel = useCallback(() => {
    setShowConfirmModal(false)
  }, []);

  const tableScrollY = useMemo(()=>
    Math.max(260, Math.floor(window.innerHeight * 0.45)), 
  []);

  const modalTitle = useMemo(() => 
    `Tomar asistencia - ${dayjs().format("DD/MM/YYYY")}`,
  []);
  return {
    studentMap,
    attendanceData,
    absentData,
    showConfirmModal,
    
    handleCheckboxChange,
    handleSubmit,
    handleCancel,
    handleConfirmation,
    handleConfirmationCancel,
    
    studentInfoMap,
    tableScrollY,
    modalTitle,
    isChecked,
  };
};
