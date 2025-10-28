import { useEffect, useState } from "react";
import { Button, Tag } from "antd";

export type Snapshot = { 
  courses: number; 
  students: number; 
  activeExams: number; 
};

export type GradeRow = { 
  key: string; 
  student: string; 
  exam: string; 
  submittedAtISO: string; 
  status: "pending" | "in-review"; 
};

export type ScheduleItem = { 
  id: string; 
  whenISO: string; 
  title: string; 
};

export type BankStats = { 
  topics: number; 
  questions: number; 
  gaps: number; 
};

export const useProfessorHome = () => {
  const [loading, setLoading] = useState(true);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [queue, setQueue] = useState<GradeRow[]>([]);
  const [calendar, setCalendar] = useState<ScheduleItem[]>([]);
  const [bankStats, setBankStats] = useState<BankStats | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSnap({ courses: 3, students: 92, activeExams: 2 });
      setQueue([
        { 
          key: "1", 
          student: "A. Mendoza", 
          exam: "Graphs Quiz", 
          submittedAtISO: new Date().toISOString(), 
          status: "pending" 
        },
        { 
          key: "2", 
          student: "J. Rojas", 
          exam: "DP Practice", 
          submittedAtISO: new Date(Date.now() - 3600e3).toISOString(), 
          status: "in-review" 
        },
      ]);
      setCalendar([
        { 
          id: "a", 
          whenISO: new Date(Date.now() + 86400e3).toISOString(), 
          title: "Publish Midterm #2" 
        },
        { 
          id: "b", 
          whenISO: new Date(Date.now() + 172800e3).toISOString(), 
          title: "Grade Quiz #5" 
        },
      ]);
      setBankStats({ topics: 18, questions: 432, gaps: 4 });
      setLoading(false);
    }, 600);
    
    return () => clearTimeout(t);
  }, []);

  const columns = [
    { 
      title: "Student", 
      dataIndex: "student" 
    },
    { 
      title: "Exam", 
      dataIndex: "exam" 
    },
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

  return {
    loading,
    snap,
    queue,
    calendar,
    bankStats,
    columns,
  };
};