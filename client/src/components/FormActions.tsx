import { Button, Form, Space } from "antd";

interface Props {
  loading?: boolean;
  onCancel: () => void;
  submitText: string;
}

export default function FormActions({ loading, onCancel, submitText }: Props) {
  return (
    <Form.Item style={{ marginTop: "24px", marginBottom: 0 }}>
      <Space style={{ width: "100%", justifyContent: "flex-end" }}>
        <Button onClick={onCancel} danger type="primary" disabled={!!loading}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit" loading={!!loading}>
          {submitText}
        </Button>
      </Space>
    </Form.Item>
  );
}