import { useEffect, useState } from "react";
import { Card, Button, List, Tag, Progress, Skeleton, Empty } from "antd";
import { CalendarOutlined, PlayCircleOutlined, ReadOutlined } from "@ant-design/icons";

type WeakTopic = { id: string; name: string; mastery: number }; // 0-100
type Recommendation = { id: string; title: string; cta: string };
type NextExam = { course: string; title: string; dateISO: string };


export default function StudentHome() {
  const [loading, setLoading] = useState(true);
  const [nextExam, setNextExam] = useState<NextExam | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setNextExam({
        course: "Algorithms I",
        title: "Midterm #2",
        dateISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
      });
      setWeakTopics([
        { id: "t1", name: "Dynamic Programming", mastery: 42 },
        { id: "t2", name: "Graphs - Shortest Path", mastery: 55 },
        { id: "t3", name: "Probability Basics", mastery: 48 },
      ]);
      setRecs([
        { id: "r1", title: "Practice set: DP (20 Qs)", cta: "Practice now" },
        { id: "r2", title: "Flashcards: Graph patterns", cta: "Review" },
      ]);
      setProgress(68);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Próximo examen */}
        <Card className="lg:col-span-5">
          <Skeleton loading={loading} active>
            {nextExam ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-slate-500 text-sm">Next exam</div>
                  <div className="font-semibold text-lg">{nextExam.title}</div>
                  <div className="text-slate-600">{nextExam.course}</div>
                  <div className="mt-1 flex items-center gap-2 text-slate-500">
                    <CalendarOutlined />
                    {new Date(nextExam.dateISO).toLocaleString()}
                  </div>
                </div>
                <Button type="primary" icon={<PlayCircleOutlined />}>Start practice</Button>
              </div>
            ) : (
              <Empty description="No upcoming exams" />
            )}
          </Skeleton>
        </Card>

        {/* Progreso general */}
        <Card className="lg:col-span-3">
          <Skeleton loading={loading} active>
            <div className="text-slate-500 text-sm">Course progress</div>
            <div className="mt-3">
              <Progress type="circle" percent={progress} />
            </div>
          </Skeleton>
        </Card>

        {/* Continuar aprendiendo */}
        <Card className="lg:col-span-4">
          <Skeleton loading={loading} active>
            <div className="text-slate-500 text-sm">Continue learning</div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="font-medium">Chapter 4 — Graph Traversal</div>
                <div className="text-slate-500 text-sm">Last opened 2h ago</div>
              </div>
              <Button icon={<ReadOutlined />}>Open material</Button>
            </div>
          </Skeleton>
        </Card>

        {/* Temas débiles */}
        <Card title="Weak topics to improve" className="lg:col-span-6">
          <Skeleton loading={loading} active>
            <List
              dataSource={weakTopics}
              renderItem={(t) => (
                <List.Item
                  actions={[
                    <Button key="practice" type="link" className="p-0">Practice</Button>,
                  ]}
                >
                  <div className="w-full flex items-center justify-between gap-4">
                    <div className="font-medium">{t.name}</div>
                    <div className="flex items-center gap-2">
                      <Tag color={t.mastery < 50 ? "red" : "orange"}>{t.mastery}%</Tag>
                      <Progress percent={t.mastery} className="min-w-[160px]" />
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Skeleton>
        </Card>

        {/* Recomendaciones personalizadas */}
        <Card title="Recommended practice" className="lg:col-span-6">
          <Skeleton loading={loading} active>
            <List
              dataSource={recs}
              renderItem={(r) => (
                <List.Item
                  actions={[
                    <Button key="go" type="primary" size="small">{r.cta}</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={<span className="font-medium">{r.title}</span>}
                    description="Suggested by your learning agent"
                  />
                </List.Item>
              )}
            />
          </Skeleton>
        </Card>

        {/* Anuncios */}
        <Card title="Announcements" className="lg:col-span-12">
          <Skeleton loading={loading} active paragraph={{ rows: 2 }}>
            <List
              dataSource={[
                { id: 1, text: "Exam window opens next Monday 9am." },
                { id: 2, text: "New practice set on Dynamic Programming added." },
              ]}
              renderItem={(a) => <List.Item>{a.text}</List.Item>}
            />
          </Skeleton>
        </Card>
      </div>
    </div>
  );
}
