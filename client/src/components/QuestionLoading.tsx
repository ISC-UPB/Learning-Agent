import { theme } from 'antd';
import type { CSSProperties } from 'react';

interface QuestionLoadingProps {
  loadingMessage: string;
  token: ReturnType<typeof theme.useToken>['token'];
}

export default function QuestionLoading({ loadingMessage, token }: QuestionLoadingProps) {
  const loadingStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    padding: token.paddingXL,
    gap: token.marginXL,
  };

  const textStyle: CSSProperties = {
    fontSize: token.fontSizeHeading3,
    fontWeight: token.fontWeightStrong,
    color: token.colorPrimary,
    textAlign: "center",
    animation: "fadePulse 1.5s infinite ease-in-out",
  };

  const puzzleLoaderStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 48px)",
    gridTemplateRows: "repeat(2, 48px)",
    gap: "16px",
  };

  const pieceStyle: CSSProperties = {
    width: "48px",
    height: "48px",
    backgroundColor: token.colorPrimary,
    borderRadius: "10px",
    animation: "puzzleBounce 1.2s infinite ease-in-out",
  };

  return (
    <div style={loadingStyle}>
      <div style={puzzleLoaderStyle}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              ...pieceStyle,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <div style={textStyle}>
        {loadingMessage}
      </div>
      <style>
        {`
          @keyframes puzzleBounce {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.6; }
          }

          @keyframes fadePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}
