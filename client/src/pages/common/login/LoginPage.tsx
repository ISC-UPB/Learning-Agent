import { useState } from "react";
import { App } from "antd";
import { useNavigate } from "react-router-dom";
import { login } from "../../../services/authService";
import LoginForm from "./LoginForm";
import WelcomeSection from "./WelcomeSection";

export type LoginValues = {
  email: string;
  password: string;
  remember?: boolean;
};

type Props = {
  onSubmit?: (values: LoginValues) => Promise<void> | void;
};

export default function LoginPage({ onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const handleFinish = async (values: LoginValues) => {
    setLoading(true);
    try {
      if (onSubmit) await onSubmit(values);
      else {
        await login(values);
      }
      navigate("/", { replace: true });
    } catch (e: unknown) {
      message.error((e as Error)?.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--app-colorBgBase)] flex items-center justify-center">
      <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-12 bg-transparent">
        <section className="md:col-span-5 flex flex-col items-center justify-center px-5 sm:px-10 md:px-12 lg:px-20 py-10">
          <div className="mb-8 mx-8">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[var(--app-colorText)]">
              Log in.
            </h1>
            <p className="mt-2 text-[var(--app-colorTextSecondary)]">
              Log in with your data that you entered during your registration
            </p>
          </div>

          <LoginForm onFinish={handleFinish} loading={loading} />
        </section>

        <div className="hidden md:block md:col-span-1">
          <div className="h-full w-px bg-[var(--app-colorBorder)] mx-auto" />
        </div>

        <WelcomeSection />
      </div>
    </div>
  );
}