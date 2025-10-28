import React from "react";
import { Table, Checkbox } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { StudentInfo } from "../../interfaces/studentInterface";


interface AttendanceTableProps {
  students: StudentInfo[];
  tableScrollY: number;
  studentMap: Map<string, boolean>;
  onCheckboxChange: (studentId: string, checked: boolean) => void;
  isChecked: (studentId: string) => boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  tableScrollY,
  onCheckboxChange,
  isChecked,
}) => {
  const columns: ColumnsType<StudentInfo> = [
    {
      title: "Código",
      dataIndex: "code",
      key: "code",
      width: 100,
      ellipsis: true,
    },
    {
      title: "Nombres",
      dataIndex: "name",
      key: "name",
      width: 160,
      ellipsis: true,
    },
    {
      title: "Apellidos",
      dataIndex: "lastname",
      key: "lastname",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Asistencia",
      key: "attendance",
      width: 120,
      align: 'center' as const,
      render: (_, record) => (
        <Checkbox
          checked={isChecked(record.userId)}
          onChange={(e) => onCheckboxChange(record.userId, e.target.checked)}
        />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={students}
      rowKey={(record) => record.code}
      pagination={false}
      scroll={{ x: 'max-content', y: tableScrollY }}
    />
  );
};

export default AttendanceTable;