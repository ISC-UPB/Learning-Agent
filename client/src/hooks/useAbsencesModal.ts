import { useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import { message, Typography } from "antd";
import dayjs from "dayjs";

import type { AbsenceRow } from "../interfaces/attendanceInterface";
import type { StudentInfo } from "../interfaces/studentInterface";
import type { TableProps } from "antd";
import useAttendance from "./useAttendance";

interface UseAbsencesModalParams {
  classId: string;
  student?: StudentInfo;
}

const getResponsiveWidth = (): string => {
  if (typeof window === "undefined") return "35%";
  return window.innerWidth < 600 ? "60%" : "35%";
};

function useAbsencesModal({ classId, student }: UseAbsencesModalParams) {
  const { actualAbsencesDates, getAbsencesByStudent } = useAttendance();
  const [loading, setLoading] = useState<boolean>(false);
  const [width, setWidth] = useState<string>(getResponsiveWidth());

  const getAbsencesByStudentRef = useRef(getAbsencesByStudent);
  useEffect(() => {
    getAbsencesByStudentRef.current = getAbsencesByStudent;
  }, [getAbsencesByStudent]);

  useEffect(() => {
    const onResize = () => setWidth(getResponsiveWidth());
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
      onResize();
      return () => window.removeEventListener("resize", onResize);
    }
    return;
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!student) {
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await getAbsencesByStudentRef.current(classId, student.userId);
        if (!mounted) return;
        if (res?.state === "error") {
          message.error(res.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [student, classId]);

  const columns: NonNullable<TableProps<AbsenceRow>["columns"]> = useMemo(
    () => [
      {
        title: "Fecha",
        dataIndex: "date",
        key: "date",
        render: (_: any, record: AbsenceRow) =>
          React.createElement(
            Typography.Text,
            null,
            dayjs(record.date).format("DD/MM/YYYY")
          ),
      },
    ],
    []
  );

  return {
    columns,
    width,
    loading,
    actualAbsencesDates,
  };
}

export default useAbsencesModal;