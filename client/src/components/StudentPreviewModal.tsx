import { Modal, Table, Alert, Typography, Descriptions } from 'antd';
import { useStudentPreview } from '../hooks/useStudentPreview';

const { Text } = Typography;

type RowIn = Record<string, any> & {
  nombres: string;
  apellidos: string;
  codigo: number | string;
};

type Props = {
  open: boolean;
  data: RowIn[];
  duplicates: string[];
  meta: { fileName: string; totalRows: number };
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function StudentPreviewModal({
  open, data, duplicates, meta, loading, onCancel, onConfirm,
}: Props) {
  const { columns } = useStudentPreview({data, duplicates});

  return (
    <Modal
      centered
      open={open}
      title="Previsualización de estudiantes"
      okText="Confirmar envío"
      cancelText="Cancelar"
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={loading}
      width={900}
    >
      <div className="space-y-4 px-1 sm:px-2">
        <Alert type="info" showIcon message={
          <Descriptions
            size="small"
            colon
            column={{ xs: 1, sm: 1, md: 2 }}
            items={[
              {
                key: 'summary',
                label: 'Resumen',
                children: (
                  <div className="space-y-1">
                    <div><b>Archivo:</b> {meta.fileName}</div>
                    <div><b>Filas detectadas:</b> {String(meta.totalRows)}</div>
                    {duplicates.length > 0 && (
                      <div><b>Duplicados:</b> <Text type="danger">{duplicates.join(', ')}</Text></div>
                    )}
                  </div>
                ),
              },
              {
                key: 'note',
                label: 'Nota',
                children: (
                  <span>
                    Al confirmar se inscribirán. Los duplicados por código se omiten.
                  </span>
                ),
              },
            ]}
          />
        }/>
        <Table
          className="mt-3"
          size="small"
          rowKey={(_, i) => String(i)}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 8 }}
          bordered
          scroll={{ x: 'max-content' }}
        />
      </div>
    </Modal>
  );
};