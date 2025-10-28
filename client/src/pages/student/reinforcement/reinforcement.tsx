import { Space, Button, theme } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import { ProgressCard } from "../../../components/reinforcement/ProgressCard";
import { CourseCards } from "../../../components/reinforcement/CourseCards";
import { ChatModal } from "../../../components/reinforcement/ChatModal";
import { useChatLogic } from "../../../hooks/useReinforcementData";
import { ChatFloatButton } from "../../../components/reinforcement/ChatFloatButton";
import PageTemplate from "../../../components/PageTemplate";
import { useNavigate, useParams } from "react-router-dom";

export function Reinforcement() {
  const { isChatOpen, handleChatClick, setIsChatOpen } = useChatLogic();
  const navigate = useNavigate();
  const { id: classId } = useParams<{ id: string }>();
  const { token } = theme.useToken();

  const goToSyllabus = () => {
    if (classId) {
      navigate(`/student/classes/${classId}/reinforcement/documents`);
    }
  };

  const studentActivities = {
    courses: [
      { id: "test", title: "Exams", description: "Preparation for exams and evaluations" },
      { id: "interview", title: "Interviews", description: "Preparation for job interviews" },
    ],
  };

  const headerActions = (
    <Space align="center" wrap>
      <Button
        icon={<ReadOutlined style={{ fontSize: 18 }} />}
        onClick={goToSyllabus}
        size="middle"
        style={{
          backgroundColor: token.colorPrimary,
          color: token.colorTextLightSolid,
          border: "none",
          height: 36,
          borderRadius: 8,
          fontWeight: 500,
          paddingInline: 16,
          boxShadow: token.boxShadow,
        }}
        className="transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1"
      >
        Syllabus
      </Button>
    </Space>
  );

  return (
    <PageTemplate
      title="Reinforcement"
      subtitle="Select a category to practice"
      actions={headerActions}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Classes", href: "/student/classes" },
        { label: "Reinforcement" }
      ]}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3">
          <div className="mb-2">
            <ProgressCard />
          </div>
          <div className="pt-2">
            <CourseCards courses={studentActivities.courses} />
          </div>
        </div>
      </div>
      <ChatFloatButton onClick={handleChatClick} />
      <ChatModal isChatOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </PageTemplate>
  );
}
