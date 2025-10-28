import { Button } from "antd";
import { FolderOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

type Props = {
  onDocs: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function PeriodHeaderActions({ onDocs, onEdit, onDelete }: Props) {
  return (
    <>
      <Button type="primary" icon={<FolderOutlined />} onClick={onDocs}>
        Documentos
      </Button>
      <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
        Editar Período
      </Button>
      <Button danger type="primary" icon={<DeleteOutlined />} onClick={onDelete}>
        Eliminar Período
      </Button>
    </>
  );
}
