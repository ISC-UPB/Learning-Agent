import { Table, Button, Empty, message } from "antd";
import { BarChartOutlined, DeleteOutlined } from "@ant-design/icons";
import type { StudentInfo } from "../../../interfaces/studentInterface";

type Props = {
  hasStudents: boolean;
  students: StudentInfo[];
  columns: any[];
  onDeleteOne: (s: StudentInfo) => void;
};

export default function StudentsTable({ hasStudents, students, columns, onDeleteOne }: Props) {
  if (!hasStudents) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Empty description="No hay estudiantes inscritos en este curso" />
      </div>
    );
  }

  const finalCols = columns.map((c: any) =>
    c.key === "actions"
      ? {
          ...c,
          render: (_: any, record: StudentInfo) => (
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="primary"
                size="small"
                icon={<BarChartOutlined />}
                onClick={() => {
                  message.info("Funcionalidad en desarrollo");
                }}
              >
                Ver progreso
              </Button>
              <Button
                danger
                type="primary"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onDeleteOne(record)}
              >
                Eliminar
              </Button>
            </div>
          ),
        }
      : c
  );

  return (
    <Table
      columns={finalCols}
      dataSource={students}
      rowKey={(r) => r.code}
      pagination={{ position: ["bottomCenter"], showSizeChanger: false, pageSize: 10 }}
      size="middle"
      scroll={{ x: "max-content" }}
    />
  );
}
