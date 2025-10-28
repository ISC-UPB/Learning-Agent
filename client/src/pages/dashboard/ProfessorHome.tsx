import { useEffect, useState } from "react";
import { Card, Button, Statistic, Row, Col, Table, Tag, List, Skeleton, Space } from "antd";
import { PlusOutlined, FileAddOutlined, DatabaseOutlined, BarChartOutlined } from "@ant-design/icons";

type Snapshot = { courses: number; students: number; activeExams: number };
type GradeRow = { key: string; student: string; exam: string; submittedAtISO: string; status: "pending" | "in-review" };
type ScheduleItem = { id: string; whenISO: string; title: string };

export default function ProfessorHome() {
  const [loading, setLoading] = useState(true);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [queue, setQueue] = useState<GradeRow[]>([]);
  const [calendar, setCalendar] = useState<ScheduleItem[]>([]);
  const [bankStats, setBankStats] = useState<{ topics: number; questions: number; gaps: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSnap({ courses: 3, students: 92, activeExams: 2 });
      setQueue([
        { key: "1", student: "A. Mendoza", exam: "Graphs Quiz", submittedAtISO: new Date().toISOString(), status: "pending" },
        { key: "2", student: "J. Rojas", exam: "DP Practice", submittedAtISO: new Date(Date.now() - 3600e3).toISOString(), status: "in-review" },
      ]);
      setCalendar([
        { id: "a", whenISO: new Date(Date.now() + 86400e3).toISOString(), title: "Publish Midterm #2" },
        { id: "b", whenISO: new Date(Date.now() + 172800e3).toISOString(), title: "Grade Quiz #5" },
      ]);
      setBankStats({ topics: 18, questions: 432, gaps: 4 });
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const columns = [
    { title: "Student", dataIndex: "student" },
    { title: "Exam", dataIndex: "exam" },
    {
      title: "Submitted",
      dataIndex: "submittedAtISO",
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: GradeRow["status"]) =>
        s === "pending" ? <Tag color="red">Pending</Tag> : <Tag color="gold">In review</Tag>,
    },
    {
      title: "Action",
      render: () => <Button type="link">Grade</Button>,
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-end justify-end">
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />}>Create exam</Button>
          <Button icon={<FileAddOutlined />}>Generate questions</Button>
          <Button icon={<DatabaseOutlined />}>Open question bank</Button>
          <Button icon={<BarChartOutlined />}>Class analytics</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card data-testid="prof-summary-courses"><Skeleton loading={loading} active><Statistic title="Courses" value={snap?.courses ?? 0} /></Skeleton></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card data-testid="prof-summary-students"><Skeleton loading={loading} active><Statistic title="Students" value={snap?.students ?? 0} /></Skeleton></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card data-testid="prof-summary-active-exams"><Skeleton loading={loading} active><Statistic title="Active exams" value={snap?.activeExams ?? 0} /></Skeleton></Card>
        </Col>
      </Row>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        <Card title="To-grade queue" className="lg:col-span-7">
          <Skeleton loading={loading} active>
            <Table
              rowKey="key"
              size="middle"
              columns={columns}
              dataSource={queue}
              pagination={{ pageSize: 5 }}
            />
          </Skeleton>
        </Card>
        <div className="lg:col-span-5 grid grid-rows-2 gap-4">
          <Card title="Upcoming schedule" className="row-span-1" data-testid="prof-upcoming-schedule">
            <Skeleton loading={loading} active>
              <List
                dataSource={calendar}
                renderItem={(e) => (
                  <List.Item>
                    <List.Item.Meta
                      title={e.title}
                      description={new Date(e.whenISO).toLocaleString()}
                    />
                  </List.Item>
                )}
              />
            </Skeleton>
          </Card>

          <Card title="Question bank health" className="row-span-1" data-testid="prof-question-bank">
            <Skeleton loading={loading} active>
              <Row gutter={16}>
                <Col span={8}><Statistic title="Topics" value={bankStats?.topics ?? 0} /></Col>
                <Col span={8}><Statistic title="Questions" value={bankStats?.questions ?? 0} /></Col>
                <Col span={8}>
                  <Statistic title="Gaps" value={bankStats?.gaps ?? 0} />
                  <div className="mt-2">
                    {Array.from({ length: bankStats?.gaps ?? 0 }).map((_, i) => (
                      <Tag key={i} color="red">Gap {i + 1}</Tag>
                    ))}
                  </div>
                </Col>
              </Row>
              <div className="mt-4">
                <Button type="link">View coverage report</Button>
              </div>
            </Skeleton>
          </Card>
        </div>
      </div>
    </div>
  );
}
