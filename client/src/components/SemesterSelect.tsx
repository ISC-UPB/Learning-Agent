import { Select, Form } from "antd";
const { Option } = Select;

interface Props {
  value?: string;
  onChange: (value: string) => void;
  options: { name: string }[];
  disabled?: boolean;
  error?: string;
}

export default function SemesterSelect({
  value,
  onChange,
  options,
  disabled,
  error,
}: Props) {
  return (
    <Form.Item
      label="Semestre"
      validateStatus={error ? "error" : ""}
      help={error || null}
    >
      <Select
        placeholder="Selecciona un semestre"
        value={value || undefined}
        onChange={onChange}
        disabled={disabled}
      >
        {options.map((sem) => (
          <Option key={sem.name} value={sem.name}>
            {sem.name}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );
}