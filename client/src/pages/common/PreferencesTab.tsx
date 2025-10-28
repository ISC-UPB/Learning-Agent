import { useEffect } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Row,
  Select,
  Typography,
} from "antd";
import {
  updatePreferences,
  type UserSettings,
} from "../../services/settingsService";
import { useThemeStore } from "../../store/themeStore";
const { Title } = Typography;

export default function PreferencesTab({
  loading,
  data,
}: {
  loading: boolean;
  data: UserSettings | null;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      theme: data.preferences.theme,
      language: data.preferences.language,
      timezone: data.preferences.timezone,
      dateFormat: data.preferences.dateFormat,
    });
    setTheme(data.preferences.theme);
  }, [data, form, setTheme]);

  const onFinish = async (values: any) => {
    try {
      await updatePreferences();
      setTheme(values.theme);
      message.success("Preferences updated");
    } catch (e: any) {
      message.error(e?.message ?? "Could not update preferences");
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Preferences
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
              <Form.Item label="Theme" name="theme">
                <Select
                  options={[
                    { label: "System", value: "system" },
                    { label: "Light", value: "light" },
                    { label: "Dark", value: "dark" },
                  ]}
                  onChange={setTheme}
                />
              </Form.Item>
              <Form.Item label="Language" name="language">
                <Select
                  options={[
                    { label: "English", value: "en" },
                    { label: "Español", value: "es" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Time zone" name="timezone">
                <Select
                  showSearch
                  options={[
                    {
                      label: "America/La_Paz (UTC-4)",
                      value: "America/La_Paz",
                    },
                    { label: "UTC", value: "UTC" },
                    {
                      label: "America/New_York (UTC-5/−4)",
                      value: "America/New_York",
                    },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Date format" name="dateFormat">
                <Select
                  options={[
                    { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
                    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
                    { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
                  ]}
                />
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