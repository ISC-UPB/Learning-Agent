import React from 'react';
import { Table } from 'antd';
import { useDocumentTable } from '../../hooks/useDocumentTable';
import type { Document } from '../../interfaces/documentInterface';

interface DocumentTableProps {
  documents: Document[];
  loading: boolean;
  onDelete?: (documentId: string) => Promise<void>;
  onDownload?: (doc: Document) => Promise<void>;
  onPreview?: (doc: Document) => void;
  onViewData?: (doc: Document) => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
  isStudent?: boolean;
}

export const DocumentTable: React.FC<DocumentTableProps> = (props) => {
  const { documents, loading } = props;

  // Usamos el hook que contiene toda la lógica
  const { columns, tableConfig } = useDocumentTable(props);

  return (
    <Table
      columns={columns}
      dataSource={documents}
      loading={loading}
      rowKey="fileName"
      {...tableConfig}
      className="academic-table"
    />
  );
};
