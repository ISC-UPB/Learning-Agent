import { Card, Typography, theme } from 'antd';
const { Title, Text } = Typography;

type Props = {
  total: number;
  published: number;
  scheduled: number;
};

export default function StatsCards({ total, published, scheduled }: Props) {
  const { token } = theme.useToken();

  return (
    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card style={{ borderLeft: `4px solid ${token.colorPrimary}` }}>
        <Title level={4} style={{ margin: 0 }}>Total</Title>
        <Text type="secondary">{total} exámenes</Text>
      </Card>

      <Card style={{ borderLeft: `4px solid ${token.colorSuccess}` }}>
        <Title level={4} style={{ margin: 0 }}>Publicados</Title>
        <Text type="secondary">{published}</Text>
      </Card>

      <Card style={{ borderLeft: `4px solid ${token.colorInfo}` }}>
        <Title level={4} style={{ margin: 0 }}>Programados</Title>
        <Text type="secondary">{scheduled}</Text>
      </Card>
    </div>
  );
}
