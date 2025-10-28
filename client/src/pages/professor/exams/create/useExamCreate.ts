import { useCallback, useRef, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import type { ExamFormHandle } from "../../../../components/exams/ExamForm";
import { useToast, type ToastKind } from "../../../../components/shared/Toast";
import { type GeneratedQuestion, generateQuestions, updateExamApprovedFull, createExamApproved } from "../../../../services/exams.service";
import { readJSON, saveJSON } from "../../../../services/storage/localStorage";
import { useExamsStore, type ExamSummary } from "../../../../store/examsStore";
import { isValidGeneratedQuestion } from "../../../../utils/aiValidation";
import { normalizeToQuestions, replaceQuestion, reorderQuestions, cloneQuestion } from "../../../exams/ai-utils";

async function repairInvalidQuestions(list : GeneratedQuestion[], 
    baseDto: any, 
    generateFn: (dto:any) => Promise<any>

): Promise<GeneratedQuestion[]> {
  const fixed = [...list];
  for (let i = 0; i < fixed.length; i++) {
    const q = fixed[i];
    if (isValidGeneratedQuestion(q)) continue;
    const distribution = {
      multiple_choice: q.type === 'multiple_choice' ? 1 : 0,
      true_false: q.type === 'true_false' ? 1 : 0,
      open_analysis: q.type === 'open_analysis' ? 1 : 0,
      open_exercise: q.type === 'open_exercise' ? 1 : 0,
    };
    const oneDto = { ...baseDto, totalQuestions: 1, distribution };

    let replacement: GeneratedQuestion | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await generateFn(oneDto);
      const [candidate] = normalizeToQuestions(res);
      if (candidate && isValidGeneratedQuestion(candidate)) {
        replacement = candidate;
        break;
      }
    }
     if (replacement) {
      fixed[i] = { ...replacement, id: q.id, include: q.include };
    }
  }
  return fixed;
}
export function useExamCreate(){
    const { toasts, pushToast, removeToast } = useToast();
    const formRef = useRef<ExamFormHandle>(null!);
    const [params] = useSearchParams();
    const classId = params.get('classId') || '';
    const courseId = params.get('courseId') || '';
    const navigate = useNavigate();
    
    const location = useLocation();
    const editData = location.state?.examData;
    
    const updateExam = useExamsStore(state => state.updateExam);
    const addFromQuestions = useExamsStore(state => state.addFromQuestions);

    const [aiOpen, setAiOpen] = useState(!!editData);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiQuestions, setAiQuestions] = useState<GeneratedQuestion[]>(
        (editData?.questions || []).map((q: GeneratedQuestion) => ({...q, include: true}))
    );
    const [aiMeta, setAiMeta] = useState<{ subject: string; difficulty: string; reference?: string }>({
        subject: editData?.subject || 'Tema general',
        difficulty: editData?.difficulty || 'medio',
        reference: editData?.reference || ''
    });
    const buildAiInputFromForm = useCallback((raw: Record<string, any>) => {
        const difficultyMap: Record<string, 'fácil' | 'medio' | 'difícil'> = {
            facil: 'fácil', 'fácil': 'fácil', easy: 'fácil',
            medio: 'medio', media: 'medio', medium: 'medio',
            dificil: 'difícil', 'difícil': 'difícil', hard: 'difícil',
        };
        const difficultyKey = String(raw.difficulty ?? 'medio').toLowerCase();
        const difficulty = difficultyMap[difficultyKey] ?? 'medio';
        const distribution = {
            multiple_choice: Number(raw.multipleChoice ?? 0) || 0,
            true_false: Number(raw.trueFalse ?? 0) || 0,
            open_analysis: Number(raw.analysis ?? 0) || 0,
            open_exercise: Number(raw.openEnded ?? 0) || 0,
        };
        const totalQuestions =
        distribution.multiple_choice +
        distribution.true_false +
        distribution.open_analysis +
        distribution.open_exercise;

        return {
            subject: raw.subject ?? raw.topic ?? 'Tema general',
            difficulty,
            totalQuestions,
            reference: raw.reference ?? '',
            distribution,
            language: 'es',
        };
    }, []);
    const handleAIPropose = useCallback( async () => {
        const snap = formRef.current?.getSnapshot?.();
        const draft = readJSON('exam:draft');
        const data = snap?.values?.subject ? snap.values : draft;
        if (!data) {
            pushToast('Completa y guarda el formulario primero.', 'warn');
            return;
        }
        setAiMeta({
            subject: data.subject ?? 'Tema general',
            difficulty: data.difficulty ?? 'medio',
            reference: data.reference ?? '',
        });
        const dto = buildAiInputFromForm(data);
        if (dto.totalQuestions <= 0) {
            setAiOpen(true);
            setAiQuestions([]);
            setAiError('La suma de la distribución debe ser al menos 1.');
            return;
        }
        setAiOpen(true);
        setAiLoading(true);
        setAiError(null);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
        try {
            const res = await generateQuestions(dto as any);
            const list = normalizeToQuestions(res);
            const fixed = await repairInvalidQuestions(list, dto, (p) => generateQuestions(p as any));
            setAiQuestions(fixed);
            if (!fixed.length) setAiError('No se generaron preguntas. Revisa el backend y/o el DTO.');
        } catch {
            setAiError('Error inesperado generando preguntas.');
        } finally {
            setAiLoading(false);
        }
    }, [buildAiInputFromForm, pushToast]);
    const onChangeQuestion = useCallback((q: GeneratedQuestion) => {
        setAiQuestions(prev => replaceQuestion(prev, q));
    }, []);

    const onReorderQuestion = useCallback((from: number, to: number) => {
        setAiQuestions(prev => reorderQuestions(prev, from, to));
    }, []);
    const onRegenerateAll = useCallback(async () => {
        const snap = formRef.current?.getSnapshot?.();
        const data = snap?.values ?? {};
        const dto = buildAiInputFromForm(data);
        setAiLoading(true);
        setAiError(null);
        try {
        const res = await generateQuestions(dto as any);
        const list = normalizeToQuestions(res);
        const fixed = await repairInvalidQuestions(list, dto, (p) => generateQuestions(p as any));
        setAiQuestions(fixed);
        } catch {
        setAiError('No se pudo regenerar el set completo.');
        } finally {
        setAiLoading(false);
        }
    },[buildAiInputFromForm]);
    const onRegenerateOne = useCallback(async (q: GeneratedQuestion) => {
    const snap = formRef.current?.getSnapshot?.();
    const data = snap?.values ?? {};
    const base = buildAiInputFromForm(data);
    const oneDto = {
      ...base,
      totalQuestions: 1,
      distribution: {
        multiple_choice: q.type === 'multiple_choice' ? 1 : 0,
        true_false: q.type === 'true_false' ? 1 : 0,
        open_analysis: q.type === 'open_analysis' ? 1 : 0,
        open_exercise: q.type === 'open_exercise' ? 1 : 0,
      },
    };
    try {
      let only: GeneratedQuestion | undefined;
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await generateQuestions(oneDto as any);
        const [candidate] = normalizeToQuestions(res);
        if (candidate && isValidGeneratedQuestion(candidate)) {
          only = candidate;
          break;
        }
      }
      if (only) {
        setAiQuestions((prev) =>
          prev.map((x) => (x.id === q.id ? { ...only, id: q.id, include: q.include } : x))
        );
      } else {
        setAiError('No se pudo regenerar esa pregunta (intentos agotados).');
      }
    } catch {
      setAiError('No se pudo regenerar esa pregunta.');
    }
  }, [buildAiInputFromForm]);
  const onAddManual = useCallback((type: string) => {
    const id = `manual_${Date.now()}`;
    let newQuestion: GeneratedQuestion;

    if (type === 'multiple_choice') {
        newQuestion = cloneQuestion({ 
        id, 
        type, 
        text: 'Escribe aquí tu pregunta de opción múltiple…', 
        options: ['Opción A','Opción B','Opción C','Opción D'], 
        include: true 
        } as GeneratedQuestion);
    } else if (type === 'true_false') {
        newQuestion = cloneQuestion({ 
        id, 
        type, 
        text: 'Enuncia aquí tu afirmación para Verdadero/Falso…', 
        include: true 
        } as GeneratedQuestion);
    } else if (type === 'open_exercise') {
        newQuestion = cloneQuestion({ 
        id, 
        type, 
        text: 'Describe aquí el enunciado del ejercicio abierto…', 
        include: true 
        } as GeneratedQuestion);
    } else {
        newQuestion = cloneQuestion({ 
        id, 
        type, 
        text: 'Escribe aquí tu consigna de análisis abierto…', 
        include: true 
        } as GeneratedQuestion);
    }

    setAiQuestions(prev => [...prev, newQuestion]);
    }, []);
    const showToast = useCallback((message: string, type?: ToastKind) => {
        pushToast(message, type);
    }, [pushToast]);
    const onSave = useCallback(async () => {
    // Validación inicial
        if (!classId) {
        pushToast('Abre el creador desde la materia (Crear examen) para asociarlo.', 'error');
        return;
        }

        const selected = aiQuestions.filter(q => q.include);
        if (!selected.length) {
        pushToast('Selecciona al menos una pregunta.', 'error');
        return;
        }

        // Preparar las preguntas
        const ts = Date.now();
        const used = new Set<string>();
        const questions: GeneratedQuestion[] = selected.map((q, i) => {
        const baseId = q.id || `q_${ts}_${q.type}_${i}`;
        let id = baseId;
        while (used.has(id)) id = `${id}_${Math.random().toString(36).slice(2,6)}`;
        used.add(id);
        return {
            id,
            type: q.type,
            text: (q as any).text,
            options: (q as any).options ?? undefined,
            include: true
        } as GeneratedQuestion;
        });

        const data = {
        title: aiMeta.subject || 'Examen',
        className: classId,
        questions,
        publish: false,
        id: editData?.id 
        };

    let summary: ExamSummary | undefined;
        const saveLocally = () => {
        if (!summary) return;
        const examKey = `exam:content:${summary.id}`;
        saveJSON(examKey, {
            examId: summary.id,
            title: summary.title,
            subject: data.title || summary.className || '—',
            teacher: '—',
            createdAt: summary.createdAt,
            questions: questions.map((q, i) => ({
            ...q,
            n: i + 1,
            source: q.id.startsWith('manual_') ? 'manual' : 'ai',
            include: true
            }))
        });
        const examIndex = readJSON<string[]>('exam:content:index') || [];
        if (!examIndex.includes(examKey)) {
            examIndex.push(examKey);
            saveJSON('exam:content:index', examIndex);
        }
        };
        const trySave = async () => {
        try {
            if (editData?.id) {
            localStorage.removeItem(`exam:content:${editData.id}`);
            const examIndex = readJSON<string[]>('exam:content:index') || [];
            const newIndex = examIndex.filter(id => !id.includes(editData.id));
            saveJSON('exam:content:index', newIndex);
            await updateExamApprovedFull({
                examId: editData.id,
                title: aiMeta.subject || 'Examen',
                questions, 
            });
            summary = updateExam(editData.id, { ...data, id: editData.id });
            } else {
            await createExamApproved({
                classId,
                title: data.title,
                questions,
            });
            summary = addFromQuestions(data);
            }
            saveLocally();
            pushToast('Examen guardado exitosamente.', 'success');
            navigate(courseId ? `/courses/${courseId}/periods/${classId}` : `/courses/${classId}`);
        } catch (error) {
            console.error('Error al guardar:', error);
            saveLocally();
            if (typeof pushToast === 'function' && pushToast.length > 0) {
            pushToast('Error al guardar el examen', 'error');
            }
        }
        };
        await trySave();
    },[aiQuestions, aiMeta, classId, courseId, editData, pushToast, navigate, updateExam, addFromQuestions]); 
    return {
    formRef,
    aiOpen,
    aiLoading,
    aiError,
    aiQuestions,
    aiMeta,
    toasts,
    handleAIPropose,
    onChangeQuestion,
    onReorderQuestion,
    onRegenerateAll,
    onRegenerateOne,
    onAddManual,
    showToast,
    onSave,
    removeToast,
    editData,
    classId,
    courseId,
  };  
}