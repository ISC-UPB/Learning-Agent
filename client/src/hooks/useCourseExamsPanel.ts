import { useEffect, useState } from "react";
import type { ExamSummary } from '../store/examsStore';
import { listClassExams, type CourseExamRow } from "../services/exams.service";

function extractIdCandidates(r: any, courseId: string): string[] {
  const vals = new Set<string>();
  const push = (v: any) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    if (s === courseId) return; 
    vals.add(s);
  };

  [
    'id', 'uuid',
    'examId', 'exam_id', 'examUuid', 'exam_uuid',
    'approvedExamId', 'approved_exam_id',
    'approvedId', 'approved_id',
    'publicExamId', 'public_exam_id',
  ].forEach(k => push(r?.[k]));

  ['exam', 'approvedExam', 'approved', 'examen', 'aprobado'].forEach(k => {
    const o = r?.[k];
    if (o && typeof o === 'object') {
      ['id', 'uuid', 'examId', 'approvedExamId'].forEach(kk => push(o?.[kk]));
    }
  });

  Object.keys(r || {}).forEach(k => {
    if (/id$/i.test(k) || /_id$/i.test(k)) push(r[k]);
  });

  return Array.from(vals);
}

export const useCourseExamsPanel = (courseId: string, classId: string) => {
    const [tableData, setTableData] = useState<ExamSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const fetchList = () => {
        if (!classId) return;
        setLoading(true);
        listClassExams(classId)
            .then((rows: CourseExamRow[]) => {
                const mapped: ExamSummary[] = (rows || []).map((r) => {
                    const candidates = extractIdCandidates(r as any, courseId);
                    const primary = candidates[0] ?? String(r.id);

                    return {
                        id: primary,
                        title: r.title || 'Examen',
                        status: r.status === 'Publicado' ? 'published' : 'draft',
                        visibility: 'visible',
                        createdAt: r.createdAt ?? new Date().toISOString(),
                        publishedAt:
                            r.status === 'Publicado'
                                ? (r.updatedAt ?? r.createdAt ?? new Date().toISOString())
                                : undefined,
                        totalQuestions: Number((r as any)?.questionsCount ?? 0),
                        counts: { multiple_choice: 0, true_false: 0, open_analysis: 0, open_exercise: 0 },
                        __candidates: candidates,
                    } as any;
                });
                setTableData(mapped);
            })
            .finally(() => setLoading(false));
    };
    useEffect(() => { fetchList(); }, [classId, courseId]);
    return {
        tableData,
        loading,
        createOpen,
        setTableData,
        fetchList,
        setLoading,
        setCreateOpen,
    };
}
