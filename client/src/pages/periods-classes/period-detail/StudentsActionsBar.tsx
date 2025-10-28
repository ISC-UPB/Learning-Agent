import { Button } from "antd";
import { UserAddOutlined, CheckSquareOutlined } from "@ant-design/icons";
import UploadButton from "../../../components/shared/UploadButton";

type Props = {
  onAddOne: () => void;
  onOpenAttendance: () => void;

  onUploadSuccess: (students: any[]) => void;
  processFile: (file: File, onProgress: (p: number) => void) => Promise<any[]>;
};

export default function StudentsActionsBar({
  onAddOne,
  onOpenAttendance,
  onUploadSuccess,
  processFile,
}: Props) {
  return (
    <div className="flex gap-3" style={{ marginTop: 24 }}>
      <Button type="primary" size="large" onClick={onAddOne} icon={<UserAddOutlined />}>
        Añadir Estudiante
      </Button>

      <UploadButton
        buttonConfig={{ size: "large" }}
        onUpload={async (file, onProgress) =>
          processFile(file as File, onProgress as unknown as (p: number) => void)
        }
        fileConfig={{
          accept: ".csv,.xlsx,.xls",
          maxSize: 1 * 1024 * 1024,
          validationMessage: "Solo se permiten archivos .xlsx o .csv de hasta 1MB",
        }}
        processingConfig={{
          steps: [
            { key: "upload", title: "Subir archivo", description: "Subiendo archivo" },
            { key: "parse", title: "Parsear datos", description: "Procesando información" },
          ],
          processingText: "Procesando tabla...",
          successText: "Tabla procesada correctamente",
        }}
        onUploadSuccess={onUploadSuccess as unknown as (r: unknown) => void}
      />

      <Button type="primary" size="large" onClick={onOpenAttendance} icon={<CheckSquareOutlined />}>
        Tomar asistencia
      </Button>
    </div>
  );
}
