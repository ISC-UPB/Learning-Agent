import { Button, Divider, theme } from "antd";
import { BookOutlined } from "@ant-design/icons";
import CustomModal from "../reinforcement/CustomModal";

interface InterviewModalProps {
  open: boolean;
  onClose: () => void;
  onSelectDifficulty: (count: number) => void;
}

export default function InterviewModal({
  open,
  onClose,
  onSelectDifficulty,
}: InterviewModalProps) {
  const { token } = theme.useToken();

  const buttonStyle = {
    background: token.colorPrimary,
    color: token.colorTextLightSolid,
    border: "none",
    borderRadius: token.borderRadius,
    fontWeight: 600,
    minWidth: 140,
    height: 48,
    boxShadow: `0 2px 8px ${token.colorPrimary}40`,
    transition: "all 0.2s ease",
  } as const;

  return (
    <CustomModal
      visible={open}
      onClose={onClose}
      status="default"
      width={540}
      padding={32}
    >
      <CustomModal.Header
        icon={<BookOutlined />}
        title="Creación de Entrevista"
      />
      <CustomModal.Description>
        Selecciona la dificultad para comenzar tu entrevista
      </CustomModal.Description>
      <CustomModal.Body>
        <Divider style={{ margin: "16px 0", borderColor: token.colorBorder }} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: token.marginMD,
            flexWrap: "nowrap",
          }}
        >
          <Button
            size="large"
            icon={<BookOutlined />}
            style={buttonStyle}
            onClick={() => onSelectDifficulty(3)}
          >
            Junior — 3
          </Button>
          <Button
            size="large"
            icon={<BookOutlined />}
            style={buttonStyle}
            onClick={() => onSelectDifficulty(5)}
          >
            Senior — 5
          </Button>
          <Button
            size="large"
            icon={<BookOutlined />}
            style={buttonStyle}
            onClick={() => onSelectDifficulty(7)}
          >
            Master — 7
          </Button>
        </div>
      </CustomModal.Body>
    </CustomModal>
  );
}
