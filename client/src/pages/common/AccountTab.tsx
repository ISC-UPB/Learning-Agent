import { useEffect } from "react";
import { App, Button, Card, Form, Input, Typography } from "antd";
import { updateAccount, type UserSettings } from "../../services/settingsService";

const { Title } = Typography;

export default function AccountTab({
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
email: data.account.email,
username: data.account.username,
});
}, [data, form]);

const onFinish = async () => {
try {
await updateAccount();
message.success("Account updated");
} catch (e: any) {
message.error(e?.message ?? "Could not update account");
}
};

return ( <div className="space-y-6"> <Title level={4} className="!m-0">
Account </Title> <Card> <Form
       form={form}
       layout="vertical"
       onFinish={onFinish}
       disabled={loading}
       requiredMark={false}
     >
<Form.Item
label="Email"
name="email"
rules={[
{ required: true, message: "Email is required" },
{ type: "email", message: "Invalid email" },
]}
> <Input autoComplete="email" />
</Form.Item>
<Form.Item
label="Username"
name="username"
rules={[{ required: true, message: "Username is required" }]}
> <Input />
</Form.Item> <div className="flex items-center justify-end gap-2"> <Button htmlType="reset">Reset</Button> <Button type="primary" htmlType="submit">
Save changes </Button> </div> </Form> </Card> </div>
);
}
