import { useFormik } from "formik";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { message } from "antd";

import type { Course } from "../interfaces/courseInterface";
import type { Clase, CreateClassDTO } from "../interfaces/claseInterface";
import {
  MIN_BUSINESS_DAYS,
  buildAllPeriods,
  type SemesterRange,
} from "../constants/period.constants";
import { periodValidationSchema } from "../validation/period.schema";

dayjs.locale("es");
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

export interface UsePeriodFormParams {
  course: Course;
  period?: Clase;
  onSubmit: (periodData: Clase | CreateClassDTO) => void;
  onClose: () => void;
}

export function countBusinessDays(start: Dayjs, end: Dayjs) {
  let days = 0;
  let current = start.clone();
  while (current.isBefore(end, "day")) {
    const d = current.day();
    if (d !== 0 && d !== 6) days++;
    current = current.add(1, "day");
  }
  return days;
}

export function computeMinEndDate(
  dateBegin: Dayjs,
  endLimit: Dayjs,
  type: "NORMAL" | "SPECIAL"
) {
  const minDays =
    type === "SPECIAL" ? MIN_BUSINESS_DAYS - 5 : MIN_BUSINESS_DAYS;
  let temp = dateBegin.clone();
  let days = 0;
  while (days < minDays && temp.isBefore(endLimit)) {
    temp = temp.add(1, "day");
    if (temp.day() !== 0 && temp.day() !== 6) days++;
  }
  return temp.isAfter(endLimit) ? endLimit : temp;
}

export function usePeriodForm({
  course,
  period,
  onSubmit,
  onClose,
}: UsePeriodFormParams) {
  const today = dayjs();
  const currentYear = today.year();

  const allPeriods = buildAllPeriods(currentYear);
  const availableSemesters = allPeriods;

  const ranges: Record<string, SemesterRange> = availableSemesters.reduce(
    (acc, sem) => {
      acc[sem.name] = {
        start: dayjs(sem.start),
        end: dayjs(sem.end),
        type: sem.type,
      };
      return acc;
    },
    {} as Record<string, SemesterRange>
  );

  const formik = useFormik({
    enableReinitialize: true,
    validateOnBlur: false,
    validateOnChange: false,
    initialValues: {
      semester: period?.semester || "",
      dateBegin: period?.dateBegin || "",
      dateEnd: period?.dateEnd || "",
    },
    validationSchema: periodValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const start = dayjs(values.dateBegin);
        const end = dayjs(values.dateEnd);

        const isSpecial =
          values.semester.startsWith("VERANO") ||
          values.semester.startsWith("INVIERNO");

        const minDays = isSpecial ? MIN_BUSINESS_DAYS - 5 : MIN_BUSINESS_DAYS;
        const businessDays = countBusinessDays(start, end);

        if (businessDays < minDays) {
          message.error(`El período debe tener mínimo ${minDays} días hábiles`);
          return;
        }

        if (period) {
          const periodData: Clase = {
            ...period,
            semester: values.semester,
            teacherId: course.teacherId,
            courseId: course.id,
            dateBegin: values.dateBegin,
            dateEnd: values.dateEnd,
          };
          await onSubmit(periodData);
        } else {
          const newPeriod: CreateClassDTO = {
            teacherId: course.teacherId,
            courseId: course.id,
            semester: values.semester,
            dateBegin: values.dateBegin,
            dateEnd: values.dateEnd,
          };
          await onSubmit(newPeriod);
        }

        resetForm();
        onClose();
      } catch (error) {
        console.error(error);
      }
    },
  });

  const handleCancel = () => {
    onClose();
    formik.resetForm();
  };

  const disabledDateBegin = (current: Dayjs) => {
    const { semester } = formik.values;
    if (!semester || !ranges[semester]) return true;
    const { start, end } = ranges[semester];
    return (
      current.isBefore(start, "day") ||
      current.isAfter(end, "day") ||
      current.day() === 0 ||
      current.day() === 6
    );
  };

  const disabledDateEnd = (current: Dayjs) => {
    const { semester } = formik.values;
    if (!semester || !ranges[semester]) return true;
    const { start, end } = ranges[semester];
    return (
      current.isBefore(start, "day") ||
      current.isAfter(end, "day") ||
      current.day() === 0 ||
      current.day() === 6
    );
  };

  const handleDateChange = (
    field: "dateBegin" | "dateEnd",
    value: Dayjs | null
  ) => {
    const { semester } = formik.values;
    if (!semester || !ranges[semester]) return;

    const { end, type } = ranges[semester];

    if (value) {
      const isoDate = value.format("YYYY-MM-DD");
      formik.setFieldValue(field, isoDate);

      if (field === "dateBegin") {
        const nextEnd = computeMinEndDate(value, end, type);
        formik.setFieldValue("dateEnd", nextEnd.format("YYYY-MM-DD"));
      }
    } else {
      formik.setFieldValue(field, "");
      if (field === "dateBegin") formik.setFieldValue("dateEnd", "");
    }
  };

  return {
    state: {
      availableSemesters,
      ranges,
      formik,
    },
    actions: {
      handleCancel,
      handleDateChange,
      disabledDateBegin,
      disabledDateEnd,
    },
  };
}

export type { SemesterRange };