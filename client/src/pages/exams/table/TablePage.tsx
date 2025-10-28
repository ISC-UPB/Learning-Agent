import { Card, Typography, theme } from 'antd';
import ExamTable from '../../../components/exams/ExamTable';
import { useExamTablePage } from './useExamTablePage';

const { Title, Text } = Typography;

export default function TablePage() {
  const { token } = theme.useToken();
  const { exams, metrics } = useExamTablePage();

  return (
    <div className="p-4 md:p-6" style={{ background: token.colorBgLayout, minHeight: '100%' }}>
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>Gestión de Exámenes</Title>
            <Text type="secondary">Administra tus exámenes generados y manuales</Text>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card style={{ borderLeft: `4px solid ${token.colorPrimary}` }}>
            <Title level={4} style={{ margin: 0 }}>Total</Title>
            <Text type="secondary">{metrics.total} exámenes</Text>
          </Card>
          <Card style={{ borderLeft: `4px solid ${token.colorSuccess}` }}>
            <Title level={4} style={{ margin: 0 }}>Publicados</Title>
            <Text type="secondary">{metrics.published}</Text>
          </Card>
          <Card style={{ borderLeft: `4px solid ${token.colorInfo}` }}>
            <Title level={4} style={{ margin: 0 }}>Programados</Title>
            <Text type="secondary">{metrics.scheduled}</Text>
          </Card>
        </div>

        <ExamTable
          data={exams}
        />
      </div>
    </div>
  );
}
