import { CalendarOutlined } from "@ant-design/icons";
import type { StudentInfo } from "../../../interfaces/studentInterface";

interface ModalHeaderProps {
  student?: StudentInfo;
}

function ModalHeader({ student }: ModalHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: "16px",
        marginBottom: "16px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
      }}
    >
      <CalendarOutlined style={{ marginRight: "8px", fontSize: "20px" }} />
      {`Ausencias de ${student?.name} ${student?.lastname}`}
    </div>
  );
}

export default ModalHeader;
