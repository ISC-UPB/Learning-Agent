import { useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Typography,
} from "antd";
import {
  updatePassword,
} from "../../services/settingsService";
const { Title} = Typography;

export default function SecurityTab() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (values.newPassword !== values.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      await updatePassword();
      form.resetFields();
      message.success("Password updated");
    } catch (e: any) {
      message.error(e?.message ?? "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Security
      </Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]}
          disabled={loading}
        >
          <Form.Item
            label="Current password"
            name="currentPassword"
            rules={[{ required: true, message: "Enter current password" }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label="New password"
            name="newPassword"
            rules={[
              { required: true, message: "Enter new password" },
              { min: 8, message: "At least 8 characters" },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Confirm password"
            name="confirmPassword"
            rules={[{ required: true, message: "Confirm your new password" }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <div className="flex items-center justify-end gap-2">
            <Button htmlType="reset">Reset</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update password
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}