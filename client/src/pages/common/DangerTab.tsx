import {
  App,
  Button,
  Card,
  Typography,
  Divider,
  Popconfirm,
} from "antd";
import {
  deleteAccount,
} from "../../services/settingsService";
const { Title, Text } = Typography;

export default function DangerTab() {
  const { message } = App.useApp();

  const onDelete = async () => {
    try {
      await deleteAccount();
      message.success("Account scheduled for deletion");
    } catch (e: any) {
      message.error(e?.message ?? "Could not delete account");
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Danger zone
      </Title>
      <Card>
        <Text type="secondary">
          Deleting your account removes personal data and access. This action
          may be irreversible.
        </Text>
        <Divider />
        <Popconfirm
          title="Delete account?"
          description="This cannot be undone."
          okType="danger"
          okText="Delete"
          onConfirm={onDelete}
        >
          <Button danger>Delete my account</Button>
        </Popconfirm>
      </Card>
    </div>
  );
}