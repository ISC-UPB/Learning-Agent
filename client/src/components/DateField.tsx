import { DatePicker, Form, Tooltip } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface Props {
  label: string;
  value?: string;
  onChange: (date: Dayjs | null) => void;
  disabledDate: (d: Dayjs) => boolean;
  disabled?: boolean;
  defaultPickerValue?: Dayjs;
  error?: string;
  tooltip?: string;
}

export default function DateField({
  label,
  value,
  onChange,
  disabledDate,
  disabled,
  defaultPickerValue,
  error,
  tooltip,
}: Props) {
  return (
    <Form.Item
      label={label}
      validateStatus={error ? "error" : ""}
      help={error || null}
    >
      <Tooltip title={tooltip || ""}>
        <DatePicker
          style={{ width: "100%" }}
          format="DD-MM-YYYY"
          disabledDate={disabledDate}
          value={value ? dayjs(value) : null}
          defaultPickerValue={defaultPickerValue}
          onChange={onChange}
          disabled={disabled}
        />
      </Tooltip>
    </Form.Item>
  );
}