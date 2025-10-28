import { useMemo } from 'react';
import { useExamsStore } from '../../../store/examsStore';
import type { ExamSummary } from '../../../store/examsStore';

interface UseExamTablePageReturn {
  exams: ExamSummary[];
  metrics: {
    total: number;
    published: number;
    scheduled: number;
  };
}
export function useExamTablePage(): UseExamTablePageReturn {
  const exams = useExamsStore((s) => s.exams) ?? [];
  const metrics = useMemo(() => {
    const total = exams.length;
    const published = exams.filter((e) => e.status === 'published').length;
    const scheduled = exams.filter((e) => e.status === 'scheduled').length;

    return {
      total,
      published,
      scheduled,
    };
  }, [exams]);

  return {
    exams, 
    metrics,
  };
}