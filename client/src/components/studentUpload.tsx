import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useStudentUpload } from '../hooks/useStudentUpload';
import { ALLOWED_EXT } from '../constants/student-upload.constants';

const { Dragger } = Upload;

type BaseStudent = {
  nombres: string;
  apellidos: string;
  codigo: number;
};

interface StudentUploadProps {
  onStudentsParsed: (
    students: (BaseStudent & Record<string, any>)[],
    info?: { fileName?: string }
  ) => void;
  disabled: boolean;
}

export const StudentUpload = ({ onStudentsParsed, disabled }: StudentUploadProps) => {
  const { uploadProps } = useStudentUpload({ onStudentsParsed });

  const props: UploadProps = {
    ...uploadProps,
    accept: ALLOWED_EXT,
    disabled,
  };

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        Arrastra tu archivo Excel/CSV aquí o haz clic para seleccionarlo
      </p>
      <p className="ant-upload-hint">
        Máx 1MB · Máx 100 filas · Mín: Nombre(s), Apellido(s), Código
      </p>
    </Dragger>
  );
};
