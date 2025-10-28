import { theme } from "antd";

interface Props {
  loading: boolean;
}

export default function InterviewRunner({ loading }: Props) {
  const { token } = theme.useToken();

  if (!loading) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        padding: 32,
        color: token.colorText,
        background: "transparent",
      }}
    >
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        Generando pregunta...
      </h2>
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          height: 10,
          background: token.colorBorderSecondary,
          borderRadius: 5,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "40%",
            background: token.colorPrimary,
            position: "absolute",
            animation: "loadingBar 1.5s infinite linear",
          }}
        />
      </div>
      <style>
        {`
          @keyframes loadingBar {
            0% { left: -40%; }
            50% { left: 30%; }
            100% { left: 100%; }
          }
        `}
      </style>
    </div>
  );
}
