import { FloatButton, theme } from "antd";
import { MessageOutlined } from "@ant-design/icons";

interface ChatFloatButtonProps {
  onClick: () => void;
}

export const ChatFloatButton: React.FC<ChatFloatButtonProps> = ({ onClick }) => {
  const { token } = theme.useToken();
  const size = token.controlHeightLG * 1.5;

  const wrapperStyle: React.CSSProperties = {
    position: "fixed",
    bottom: token.marginLG,
    right: token.marginLG,
    zIndex: 1000,
    overflow: "visible",
    animation: "fadeScaleIn 0.3s ease-out",
  };

  const buttonStyle: React.CSSProperties = {
    width: size,
    height: size,
    backgroundColor: token.colorPrimaryActive,
    color: token.colorWhite,
    border: "none",
    boxShadow: token.boxShadowSecondary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s ease, background-color 0.2s ease",
  };

  const iconStyle: React.CSSProperties = {
    fontSize: token.fontSizeHeading3,
    transform: "translateX(-3px)",
    lineHeight: 0,
    backgroundColor: "transparent",
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeScaleIn {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .chat-float-button {
            animation: bounce 2s ease-in-out infinite 0.5s;
          }
          .chat-float-button:hover {
            background-color: ${token.colorWhite} !important;
            color: ${token.colorPrimaryActive} !important;
            transform: scale(1.05);
          }
          .chat-float-button:hover svg {
            color: ${token.colorPrimaryActive} !important;
            background-color: transparent !important;
          }
        `}
      </style>
      <div style={wrapperStyle}>
        <FloatButton
          shape="circle"
          icon={<MessageOutlined style={iconStyle} />}
          onClick={onClick}
          style={buttonStyle}
          className="chat-float-button"
        />
      </div>
    </>
  );
};