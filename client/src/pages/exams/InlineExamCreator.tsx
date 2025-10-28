import { useRef } from 'react';
import { Card, Divider } from 'antd';
import AiResults from './ai-results/AiResults';
import { useInlineExamCreator } from './inline-creator/useInlineExamCreator';
import { ExamForm } from '../../components/exams/ExamForm';


type ExamFormHandle = any;

type Props = {
  classId: string;
  courseId?: string;
  onClose?: () => void;
  onCreated?: (examId: string) => void;
};

export default function InlineExamCreator({ classId, courseId, onClose, onCreated }: Props) {
  const formRef = useRef<ExamFormHandle>(null);
  const {
    aiOpen,
    aiLoading,
    aiError,
    aiMeta,
    aiQuestions,
    onGenerateAI,
    onChangeQuestion,
    onRegenerateAll,
    onRegenerateOne,
    onReorder,
    onSave,
    onAddManual,
    toast,
  } = useInlineExamCreator({ classId, courseId, onClose, onCreated });
   const handleGenerateAI = async () => {
    const values = formRef.current?.getSnapshot?.()?.values ?? {};
    await onGenerateAI(values);
  };

  const handleSave = async () => {
    const values = formRef.current?.getSnapshot?.()?.values ?? {};
    await onSave(values);
  };

  return (
    <Card className="inline-exam-creator" bordered size="small" style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
      <ExamForm
        ref={formRef}
        onGenerateAI={handleGenerateAI}
        onToast={toast}
        initialData={{}}
      />

      {aiOpen && (
        <>
          <Divider />
          <AiResults
            subject={aiMeta.subject}
            difficulty={aiMeta.difficulty}
            createdAt={new Date().toLocaleDateString('es-BO')}
            questions={aiQuestions}
            loading={aiLoading}
            error={aiError}
            onChange={onChangeQuestion}
            onRegenerateAll={onRegenerateAll}
            onRegenerateOne={onRegenerateOne}
            onAddManual={onAddManual}
            onSave={handleSave}
            onReorder={onReorder}
          />
        </>
      )}
    </Card>
  );
}
