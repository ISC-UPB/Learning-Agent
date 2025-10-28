import { Link } from "react-router-dom";
import { Button, Checkbox, Form, Input } from "antd";
import type { LoginValues } from "./LoginPage";

type LoginFormProps = {
  onFinish: (values: LoginValues) => Promise<void>;
  loading: boolean;
};

export default function LoginForm({ onFinish, loading }: LoginFormProps) {
  return (
    <Form
      name="login"
      layout="vertical"
      size="large"
      onFinish={onFinish}
      disabled={loading}
      requiredMark={false}
      className="w-80 px-5 [&_.ant-form-item-label>label]:!text-[var(--app-colorText)]"
    >
      <Form.Item
        label="Enter your email address"
        name="email"
        rules={[
          { required: true, message: "Ingresa tu email" },
          { type: "email", message: "Email inválido" },
        ]}
      >
        <Input
          placeholder="name@example.com"
          autoComplete="email"
          className="w-full"
        />
      </Form.Item>

      <Form.Item
        label="Enter your password"
        name="password"
        rules={[
          { required: true, message: "Ingresa tu contraseña" },
          { min: 8, message: "Al menos 8 caracteres" },
        ]}
      >
        <Input.Password
          placeholder="atleast 8 characters"
          autoComplete="current-password"
        />
      </Form.Item>

      <div className="flex items-center justify-between mt-1 mb-4">
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>Remember me</Checkbox>
        </Form.Item>
        <Link
          to="/forgot"
          className="text-[var(--app-colorLink)] hover:underline hover:text-[var(--app-colorLinkHover)]"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="primary"
        htmlType="submit"
        loading={loading}
        className="mb-4 !h-12 !w-full !text-base !font-semibold"
      >
        Log in
      </Button>

      <p className="mt-4 text-[var(--app-colorTextSecondary)]">
        Don't have an account?{" "}
        <Link
          to="/forgot"
          className="text-[var(--app-colorLink)] font-medium hover:text-[var(--app-colorLinkHover)]"
        >
          Register
        </Link>
      </p>
    </Form>
  );
}