import { useState } from "react";
import { App, Button, Form, Input } from "antd";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";

export type ForgotValues = {
  email: string;
};

type Props = {
  onSubmit?: (values: ForgotValues) => Promise<void> | void;
};

export default function ForgotPasswordPage({ onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleFinish = async (values: ForgotValues) => {
    setLoading(true);
    try {
      if (onSubmit) await onSubmit(values);
      else await forgotPassword(values);
      message.success("Revisa tu correo para resetear la contraseña");
    } catch (e: unknown) {
      message.error((e as Error)?.message ?? "No se pudo enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-12 bg-white/0">
        <section className="md:col-span-4 flex flex-col items-center justify-center px-5 sm:px-10 md:px-12 lg:px-20 py-10">
          <div className="mb-8 mx-8">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              Forgot password.
            </h1>
            <p className="text-slate-500 mt-2">
              Enter your email and we will send you a reset link
            </p>
          </div>

          <Form
            name="forgot"
            layout="vertical"
            size="large"
            onFinish={handleFinish}
            disabled={loading}
            requiredMark={false}
            className="w-80 px-5 [&_.ant-form-item-label>label]:!text-slate-700"
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

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="mb-4 !h-12 !w-full !text-base !font-semibold !bg-violet-700 hover:!bg-violet-600"
            >
              Send reset link
            </Button>

            <p className="mt-4 text-slate-500">
              Remember your password?{" "}
              <Link to="/login" className="text-violet-700 font-medium">
                Log in
              </Link>
            </p>
          </Form>
        </section>

        <div className="hidden md:block md:col-span-1">
          <div className="h-full w-px bg-slate-200 mx-auto" />
        </div>

        <section className="md:col-span-8 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-[#F3ECFF]" />
          <div className="relative w-full h-full flex flex-col items-center justify-center px-8 lg:px-16 py-10 text-center">
            <p className="text-slate-600 text-lg">
              We will help you recover your account
            </p>
            <h2 className="mt-1 text-5xl font-extrabold text-violet-700 tracking-tight">
              Reset password
            </h2>

            <img
              src="/src/assets/forgot.svg"
              alt="Forgot password illustration"
              className="mt-8 w-[80%] max-w-2xl h-auto"
            />

            <div className="pointer-events-none absolute inset-0">
              <span className="absolute right-10 top-20 h-6 w-6 rounded-full bg-white/50" />
              <span className="absolute right-24 top-48 h-3 w-3 rounded-full bg-white/50" />
              <span className="absolute right-40 top-28 h-4 w-4 rounded-full bg-white/50" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

