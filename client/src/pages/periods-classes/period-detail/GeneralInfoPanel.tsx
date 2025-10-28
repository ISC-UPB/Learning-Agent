import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

type Props = {
  name: string;
  semester: string;
  dateBegin: string | Date;
  dateEnd: string | Date;
  teacherLabel: string;
};

export default function GeneralInfoPanel({ name, semester, dateBegin, dateEnd, teacherLabel }: Props) {
  return (
    <div style={{ padding: "32px" }}>
      <div className="grid grid-cols-1 min-[1000px]:grid-cols-2 gap-6">
        <div>
          <Text strong style={{ fontSize: 14 }}>Nombre del curso:</Text>
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 16 }}>{name}</Text>
          </div>
        </div>
        <div>
          <Text strong style={{ fontSize: 14 }}>Gestión (semestre):</Text>
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 16 }}>{semester}</Text>
          </div>
        </div>
        <div>
          <Text strong style={{ fontSize: 14 }}>Fecha de inicio:</Text>
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 16 }}>{dayjs(dateBegin).format("DD/MM/YYYY")}</Text>
          </div>
        </div>
        <div>
          <Text strong style={{ fontSize: 14 }}>Fecha final:</Text>
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 16 }}>{dayjs(dateEnd).format("DD/MM/YYYY")}</Text>
          </div>
        </div>
        <div>
          <Text strong style={{ fontSize: 14 }}>Docente asignado:</Text>
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 16 }}>{teacherLabel}</Text>
          </div>
        </div>
        <div>
          <Text strong style={{ fontSize: 14 }}>Horarios:</Text>
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 16 }}>Por definir</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
