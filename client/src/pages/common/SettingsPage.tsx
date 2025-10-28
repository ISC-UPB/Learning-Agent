import { useEffect, useMemo, useState } from "react";
import {
  App,
  Card,
  Skeleton,
  Tabs,
} from "antd";
import { SettingOutlined } from "@ant-design/icons";
import PageTemplate from "../../components/PageTemplate";
import {
  getSettings,
  type UserSettings,
} from "../../services/settingsService";

import ProfileTab from "./ProfileTab";
import AccountTab from "./AccountTab";
import SecurityTab from "./SecurityTab";
import NotificationsTab from "./NotificationsTab";
import PreferencesTab from "./PreferencesTab";
import DangerTab from "./DangerTab";
export default function SettingsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserSettings | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getSettings();
        if (!mounted) return;
        setData(res);
        setAvatarPreview(res.profile.avatarUrl);
      } catch (e: any) {
        message.error(e?.message ?? "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [message]);

  const tabItems = useMemo(
    () => [
      {
        key: "profile",
        label: "Profile",
        children: (
          <ProfileTab
            loading={loading}
            data={data}
            avatarPreview={avatarPreview}
            setAvatarPreview={setAvatarPreview}
          />
        ),
      },
      {
        key: "account",
        label: "Account",
        children: <AccountTab loading={loading} data={data} />,
      },
      { key: "security", label: "Security", children: <SecurityTab /> },
      {
        key: "notifications",
        label: "Notifications",
        children: <NotificationsTab loading={loading} data={data} />,
      },
      {
        key: "preferences",
        label: "Preferences",
        children: <PreferencesTab loading={loading} data={data} />,
      },
      { key: "danger", label: "Danger zone", children: <DangerTab /> },
    ],
    [loading, data, avatarPreview]
  );

  return (
    <PageTemplate
      title={
        <span className="flex items-center gap-2">
          <SettingOutlined /> Settings
        </span>
      }
      subtitle="Manage your profile, security, notifications, and preferences."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]}
      actions={null}
      user={
        data
          ? {
              name: data.profile.fullName,
              role: data.profile.role,
              avatarUrl: data.profile.avatarUrl,
            }
          : undefined
      }
    >
      <Card className="max-w-5xl">
        {loading && <Skeleton active paragraph={{ rows: 6 }} />}
        {!loading && data && <Tabs items={tabItems} />}
      </Card>
    </PageTemplate>
  );
}









