import CourseExamsPanel from "../../courses/CourseExamsPanel";

type Props = { courseId: string; classId: string };

export default function ExamsPanelProxy({ courseId, classId }: Props) {
  if (!courseId || !classId) return null;
  return <CourseExamsPanel courseId={courseId} classId={classId} />;
}
