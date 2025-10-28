import * as yup from "yup";
import { SEMESTER_REGEX } from "../constants/period.constants";

export const periodValidationSchema = yup.object({
  semester: yup
    .string()
    .required("El semestre es obligatorio")
    .matches(SEMESTER_REGEX, "Semestre inválido"),
  dateBegin: yup.string().required("La fecha de inicio es obligatoria"),
  dateEnd: yup.string().required("La fecha de fin es obligatoria"),
});