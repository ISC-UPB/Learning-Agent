import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Button as AntButton } from "antd";
import dayjs from "dayjs";

import useAttendance from "../../../hooks/useAttendance";
import useClasses from "../../../hooks/useClasses";
import useCourses from "../../../hooks/useCourses";
import useEnrollment from "../../../hooks/useEnrollment";
import useStudents from "../../../hooks/useStudents";
import useTeacher from "../../../hooks/useTeacher";

import type { createEnrollmentInterface, EnrollGroupRow } from "../../../interfaces/enrollmentInterface";
import type { Clase } from "../../../interfaces/claseInterface";
import type { StudentInfo } from "../../../interfaces/studentInterface";

import { processFile } from "../../../utils/enrollGroupByFile";
import { useUserStore } from "../../../store/userStore";

export function usePeriodDetail() {
  const { id } = useParams<{ id: string }>();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const { fetchClassById, actualClass, updateClass, softDeleteClass } = useClasses();
  const { students, fetchStudentsByClass } = useStudents();
  const { enrollSingleStudent, enrollGroupStudents, softDeleteSingleEnrollment } = useEnrollment();
  const { actualCourse, getCourseByID } = useCourses();
  const { teacherInfo, fetchTeacherInfoById } = useTeacher();
  const { absencesMap, getStudentAbsencesByClass } = useAttendance();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [singleStudentFormOpen, setSingleStudentFormOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [absencesModalOpen, setAbsencesModalOpen] = useState(false);

  const [safetyModalConfig, setSafetyModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [parsedStudents, setParsedStudents] = useState<Array<Record<string, any> & {
    nombres: string; apellidos: string; codigo: number;
  }>>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("archivo.xlsx");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo>();

  const fetchPeriod = async () => {
    if (!id) return;
    const res = await fetchClassById(id);
    if (res.state == "error") message.error(res.message);
  };

  const fetchCourse = async () => {
    if (!actualClass?.courseId) return;
    const res = await getCourseByID(actualClass.courseId);
    if (res.state == "error") message.error(res.message);
  };

  const fetchTeacher = async () => {
    if (!actualCourse?.teacherId) return;
    const res = await fetchTeacherInfoById(actualCourse.teacherId);
    if (res.state == "error") message.error(res.message);
  };

  const fetchStudents = useCallback(async () => {
    if (!id) return;
    const studentRes = await fetchStudentsByClass(id);
    if (studentRes.state === "error") message.error(studentRes.message);
  }, [id, fetchStudentsByClass]);

  const fetchAbsences = useCallback(async () => {
    if (!id) return;
    const absencesRes = await getStudentAbsencesByClass(id);
    if (absencesRes.state === "error") message.error(absencesRes.message);
  }, [id, getStudentAbsencesByClass]);

  useEffect(() => {
    const prepare = async () => {
      if (!id) return;
      setLoading(true);
      await fetchPeriod();
    };
    prepare();
  }, [id]);

  useEffect(() => {
    const prepareCourse = async () => {
      if (!actualClass?.courseId) return;
      await fetchCourse();
    };
    prepareCourse();
  }, [actualClass]);

  useEffect(() => {
    const prepareTeacher = async () => {
      if (!actualCourse?.teacherId) return;
      await fetchTeacher();
      setLoading(false);
    };
    prepareTeacher();
  }, [actualCourse]);

  useEffect(() => {
    fetchStudents();
    fetchAbsences();
  }, [fetchStudents]);

  const handleEditClass = async (values: Clase) => {
    const data = await updateClass(values as Clase);
    if (data.state == "success") message.success(data.message);
    else if (data.state == "info") message.info(data.message);
    else message.error(data.message);
    setEditModalOpen(false);
  };

  const handleDeletePeriod = () => {
    setSafetyModalConfig({
      title: "¿Eliminar período?",
      message: `¿Estás seguro de que quieres eliminar el período ${actualClass?.name}? Esta acción no se puede deshacer.`,
      onConfirm: confirmDeletePeriod,
    });
    setSafetyModalOpen(true);
  };

  const confirmDeletePeriod = async () => {
    try {
      if (!id) {
        message.error("ID del curso no encontrado");
        return;
      }
      const res = await softDeleteClass(id);
      if (res.state == "error") { message.error(res.message); return; }
      if (res.state == "info") { message.info(res.message); return; }

      message.success(res.message);
      setTimeout(() => {
        if (user?.roles.includes("docente")) {
          navigate(`/professor/courses/${courseId}/periods`);
        } else {
          navigate("/");
        }
      }, 2000);
    } catch {
      message.error("Error al eliminar el curso");
    } finally {
      setSafetyModalOpen(false);
    }
  };

  const handleEnrollStudent = async (values: createEnrollmentInterface) => {
    try {
      await enrollSingleStudent(values);
      message.success("Estudiante inscrito correctamente");
      if (id) fetchClassById(id);
      await fetchStudents();
      setSingleStudentFormOpen(false);
    } catch {
      message.error("Error al inscribir al estudiante");
    }
  };

  const handleGroupEnrollment = async () => {
    if (!id) return;

    const seen = new Set<string>();
    const filtered = parsedStudents.filter((r) => {
      const k = String(r.codigo || "").trim().toLowerCase();
      if (!k) return false;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const payloadRows: EnrollGroupRow[] = filtered.map((r) => ({
      studentName: r.nombres,
      studentLastname: r.apellidos,
      studentCode: String(r.codigo),
      email: r.correo || undefined,
      career: r.career || undefined,
      campus: r.campus || undefined,
      admissionYear: r.admissionYear || undefined,
      residence: r.residence || undefined,
    }));

    setSending(true);

    const result = await enrollGroupStudents({
      classId: id,
      studentRows: payloadRows,
    });
    if (result.state == "success") {
      const { totalRows, successRows, existingRows, errorRows } = result.data;
      message.success(`Procesadas ${totalRows} filas`);
      message.info(`Éxito: ${successRows} · Ya inscritos: ${existingRows} · Errores: ${errorRows}`);

      setPreviewModalOpen(false);
      setParsedStudents([]);
      setDuplicates([]);
      fetchClassById(id);
      await fetchStudents();
    } else {
      message.error(result.message);
    }

    setSending(false);
  };

  const handleSingleEnrollmentDeleteWarning = (record: StudentInfo) => {
    setSafetyModalConfig({
      title: "¿Eliminar estudiante?",
      message: `¿Estás seguro que quieres eliminar a ${record.name} ${record.lastname} de este periodo?`,
      onConfirm: () => handleDeleteSingleEnrollment(record),
    });
    setSafetyModalOpen(true);
  };

  const handleDeleteSingleEnrollment = async (record: StudentInfo) => {
    if (!id || !record) {
      message.error("Ha ocurrido un error");
      setSafetyModalOpen(false);
      return;
    }
    const classData = { studentId: record.userId, classId: id };
    const res = await softDeleteSingleEnrollment(classData);
    if (res.state == "error") {
      message.error(res.message);
      setSafetyModalOpen(false);
      return;
    }
    message.success(res.message);
    await fetchStudents();
    setSafetyModalOpen(false);
  };

  const studentsColumns = [
    { title: "Código", dataIndex: "code", key: "code" },
    { title: "Nombres", dataIndex: "name", key: "name" },
    { title: "Apellidos", dataIndex: "lastname", key: "lastname" },
    {
      title: "Ausencias",
      dataIndex: "absences",
      key: "absences",
      render: (_: any, record: StudentInfo) => (
        React.createElement(
          AntButton as any,
          { type: "link", onClick: () => { setSelectedStudent(record); setAbsencesModalOpen(true); } },
          absencesMap.get(record.userId) || "-"
        )
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: StudentInfo) => ({ record }),
    },
  ] as any[];

  const hasStudents = Array.isArray(students) && students.length > 0;
  const todayLabel = useMemo(() => dayjs().format("DD [de] MMMM [de] YYYY"), []);

  return {
    id, courseId, navigate,
    actualClass, actualCourse, teacherInfo, students, absencesMap,
   
    loading, hasStudents, todayLabel,
    editModalOpen, setEditModalOpen,
    safetyModalOpen, setSafetyModalOpen, safetyModalConfig, setSafetyModalConfig,
    singleStudentFormOpen, setSingleStudentFormOpen,
    previewModalOpen, setPreviewModalOpen,
    attendanceModalOpen, setAttendanceModalOpen,
    absencesModalOpen, setAbsencesModalOpen,
    selectedStudent, setSelectedStudent,
    parsedStudents, setParsedStudents,
    duplicates, setDuplicates,
    fileName, setFileName,
    sending,
    studentsColumns, processFile,

    
    handleEditClass,handleDeletePeriod,confirmDeletePeriod, handleEnrollStudent, handleGroupEnrollment, 
    handleSingleEnrollmentDeleteWarning,handleDeleteSingleEnrollment,fetchAbsences,
  };
}
