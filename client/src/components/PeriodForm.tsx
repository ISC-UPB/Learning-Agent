import { Modal, Form, ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import "dayjs/locale/es";

import type { Course } from "../interfaces/courseInterface";
import type { Clase, CreateClassDTO } from "../interfaces/claseInterface";

import SemesterSelect from "./SemesterSelect";
import DateField from "./DateField";
import FormActions from "./FormActions";
import { usePeriodForm } from "../hooks/usePeriodForm";

interface PeriodFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (periodData: Clase | CreateClassDTO) => void;
  course: Course;
  period?: Clase;
  loading?: boolean;
}

function PeriodForm({
  open,
  onClose,
  onSubmit,
  course,
  period,
  loading = false,
}: PeriodFormProps) {
  const {
    state: { formik, availableSemesters, ranges },
    actions: {
      handleCancel,
      handleDateChange,
      disabledDateBegin,
      disabledDateEnd,
    },
  } = usePeriodForm({ course, period, onSubmit, onClose });

  const semester = formik.values.semester;
  const currentRange = semester ? ranges[semester] : undefined;

  return (
    <ConfigProvider locale={esES}>
      <Modal
        title={`${period ? "Editar" : "Crear"} Período`}
        open={open}
        onCancel={handleCancel}
        footer={null}
        centered
        width={500}
      >
        <Form
          layout="vertical"
          onFinish={formik.handleSubmit}
          style={{ marginTop: "20px" }}
        >
          <SemesterSelect
            value={formik.values.semester}
            onChange={(value) => {
              formik.setFieldValue("semester", value);
              formik.setFieldTouched("semester", true);
              formik.setFieldValue("dateBegin", "");
              formik.setFieldValue("dateEnd", "");
            }}
            options={availableSemesters}
            disabled={!!period}
            error={formik.errors.semester as string | undefined}
          />

          <DateField
            label="Fecha de inicio"
            value={formik.values.dateBegin}
            onChange={(date) => {
              handleDateChange("dateBegin", date);
              formik.setFieldTouched("dateBegin", true);
            }}
            disabledDate={disabledDateBegin}
            disabled={!semester}
            defaultPickerValue={semester ? currentRange?.start : undefined}
            error={formik.errors.dateBegin as string | undefined}
            tooltip={!semester ? "Selecciona un semestre para habilitar" : ""}
          />

          <DateField
            label="Fecha de fin"
            value={formik.values.dateEnd}
            onChange={(date) => {
              handleDateChange("dateEnd", date);
              formik.setFieldTouched("dateEnd", true);
            }}
            disabledDate={disabledDateEnd}
            disabled={!formik.values.dateBegin}
            defaultPickerValue={semester ? currentRange?.start : undefined}
            error={formik.errors.dateEnd as string | undefined}
            tooltip={
              !semester
                ? "Selecciona un semestre para habilitar"
                : !formik.values.dateBegin
                ? "Selecciona la fecha de inicio para habilitar"
                : ""
            }
          />

          <FormActions
            loading={loading || formik.isSubmitting}
            onCancel={handleCancel}
            submitText={period ? "Actualizar Período" : "Crear Período"}
          />
        </Form>
      </Modal>
    </ConfigProvider>
  );
}

export default PeriodForm;