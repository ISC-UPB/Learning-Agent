import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useExamsStore } from '../../../../store/examsStore';
import useCourses from '../../../../hooks/useCourses';

export type Breadcrumb = { label: string; href?: string };

export default function useExamManagement() {
  const exams = useExamsStore((s) => s.exams);
  const { courseId } = useParams<{ courseId: string }>();

  const { actualCourse, getCourseByID } = useCourses();

  useEffect(() => {
    if (courseId && !actualCourse) {
      getCourseByID(courseId);
    }
  }, [courseId, actualCourse, getCourseByID]);

  const { total, published, scheduled } = useMemo(() => {
    const total = exams.length;
    const published = exams.filter((e: any) => e.status === 'published').length;
    const scheduled = exams.filter((e: any) => e.status === 'scheduled').length;
    return { total, published, scheduled };
  }, [exams]);

  const breadcrumbs: Breadcrumb[] = useMemo(() => {
    return courseId
      ? [
          { label: 'Inicio', href: '/' },
          { label: 'Materias', href: '/professor/courses' },
          { label: actualCourse?.name || 'Curso', href: `/professor/courses/${courseId}/periods` },
          { label: 'Exámenes' },
        ]
      : [
          { label: 'Inicio', href: '/' },
          { label: 'Materias', href: '/professor/courses' },
          { label: 'Gestión de Exámenes' },
        ];
  }, [courseId, actualCourse?.name]);

  const onEdit = () => {
    window.location.href = '/professor/exams/create';
  };

  return {
    exams,
    total,
    published,
    scheduled,
    breadcrumbs,
    onEdit,
  };
}
