import { useEffect } from "react";
import {
    App,
    Avatar,
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Upload,
    Typography,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { updateProfile, type UserSettings } from "../../services/settingsService";

const { Title, Text } = Typography;

export default function ProfileTab({
    loading,
    data,
    avatarPreview,
    setAvatarPreview,
}: {
    loading: boolean;
    data: UserSettings | null;
    avatarPreview?: string;
    setAvatarPreview: (v?: string) => void;
}) {
    const { message } = App.useApp();
    const [form] = Form.useForm();

    useEffect(() => {
        if (!data) return;
        form.setFieldsValue({
            fullName: data.profile.fullName,
            headline: data.profile.headline,
            role: data.profile.role,
        });
    }, [data, form]);

    const beforeUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(String(reader.result || ""));
        reader.readAsDataURL(file);
        return false;
    };

    const onFinish = async () => {
        try {
            await updateProfile();
            message.success("Profile updated");
        } catch (e: any) {
            message.error(e?.message ?? "Could not update profile");
        }
    };

    return (<div className="space-y-6"> <Title level={4} className="!m-0">
        Profile </Title>
        <Row gutter={[24, 24]}> <Col xs={24} md={8}> <Card> <div className="flex flex-col items-center gap-4"> <Avatar
            size={96}
            src={avatarPreview}
            className="ring-2 ring-white shadow"
        /> <Upload
            accept="image/*"
            maxCount={1}
            showUploadList={false}
            beforeUpload={beforeUpload}
        >
                <Button icon={<UploadOutlined />}>Change avatar</Button> </Upload> <Text type="secondary" className="text-center">
                PNG/JPG/SVG. Recommended 256×256. </Text> </div> </Card> </Col> <Col xs={24} md={16}> <Card> <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    disabled={loading}
                    requiredMark={false}
                >
                    <Form.Item
                        label="Full name"
                        name="fullName"
                        rules={[{ required: true, message: "Please enter your name" }]}
                    > <Input className="w-full" />
                    </Form.Item>
                    <Form.Item label="Headline / Title" name="headline"> <Input placeholder="e.g., Senior Lecturer / Student" />
                    </Form.Item>
                    <Form.Item label="Role" name="role"> <Input disabled />
                    </Form.Item> <div className="flex items-center justify-end gap-2"> <Button htmlType="reset">Reset</Button> <Button type="primary" htmlType="submit">
                        Save changes </Button> </div> </Form> </Card> </Col> </Row> </div>
    );
}
