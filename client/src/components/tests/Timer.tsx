import { theme } from "antd";

type Props = {
  timeLeft: number;
  totalTime: number;
};

export default function TimerDisplay({ timeLeft, totalTime }: Props) {
  const { token } = theme.useToken();
  const isDanger = timeLeft <= 30 && timeLeft > 0; 
  const timeUsed = totalTime - timeLeft;
  const displayTime = timeLeft > 0 ? timeLeft : timeUsed;
  const minutes = String(Math.floor(displayTime / 60)).padStart(2, "0");
  const seconds = String(displayTime % 60).padStart(2, "0");

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "'Fira Code', monospace",
        fontSize: 22,
        fontWeight: 600,
        padding: "10px 18px",
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${isDanger ? token.colorWhite : token.colorBorderSecondary}`,
        background: isDanger ? `${token.colorError}cc` : `${token.colorBgElevated}cc`,
        backdropFilter: "blur(8px)",
        color: isDanger ? token.colorWhite : token.colorText,
        boxShadow: token.boxShadowSecondary,
        transition: "all 0.3s ease",
        animation: isDanger ? "pulse-red 1s infinite" : "none"
      }}
    >
      <span style={{ fontSize: 18 }}>⏱</span>
      {minutes}:{seconds}
      <style>
        {`
          @keyframes pulse-red {
            0% { box-shadow: 0 0 0px ${token.colorError}; }
            50% { box-shadow: 0 0 12px ${token.colorError}; }
            100% { box-shadow: 0 0 0px ${token.colorError}; }
          }
        `}
      </style>
    </div>
  );
}

