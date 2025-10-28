import { useEffect} from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Row,
  Switch,
  Typography,
} from "antd";
import {
  updateNotifications,
  type UserSettings,
} from "../../services/settingsService";
const { Title} = Typography;

export default function NotificationsTab({
  loading,
  data,
}: {
  loading: boolean;
  data: UserSettings | null;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      emailAnnouncements: data.notifications.emailAnnouncements,
      emailReminders: data.notifications.emailReminders,
      pushMentions: data.notifications.pushMentions,
      pushGrades: data.notifications.pushGrades,
    });
  }, [data, form]);

  const onFinish = async () => {
    try {
      await updateNotifications();
      message.success("Notification preferences saved");
    } catch (e: any) {
      message.error(e?.message ?? "Could not update notifications");
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Notifications
      </Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
          requiredMark={false}
        >
          <Row gutter={[24, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email: Announcements"
                name="emailAnnouncements"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Email: Exam reminders"
                name="emailReminders"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Push: Mentions & replies"
                name="pushMentions"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Push: Grades published"
                name="pushGrades"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex items-center justify-end gap-2">
            <Button htmlType="reset">Reset</Button>
            <Button type="primary" htmlType="submit">
              Save changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}