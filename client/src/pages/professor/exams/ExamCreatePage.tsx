import type { CSSProperties } from 'react'
import '../../../components/exams/ExamForm.css';
import '../../../components/shared/Toast.css';
import { ExamForm } from '../../../components/exams/ExamForm';
import { Toast} from '../../../components/shared/Toast';
import PageTemplate from '../../../components/PageTemplate';
import GlobalScrollbar from '../../../components/GlobalScrollbar';
import './ExamCreatePage.css';
import AiResults from '../../exams/ai-results/AiResults';
import { useExamCreate } from './create/useExamCreate';


const layoutStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};
export default function ExamsCreatePage() {
  const {
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
    onSave,
    removeToast,
    showToast,
    editData,
  } = useExamCreate();
  return (
    <PageTemplate
      title="Exámenes"
      subtitle="Creación de exámenes"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Gestión de Exámenes', href: '/exams' },
        { label: 'Crear examen' },
      ]}
    >
      <GlobalScrollbar />
      <div>
        <section
          className="card subtle readable-card"
          style={{ display: aiOpen ? 'none' : 'block' }}
        >
          <div style={layoutStyle}>
            <ExamForm
              ref={formRef}
              onToast={showToast}
              onGenerateAI={handleAIPropose}
              initialData={editData}
            />
          </div>
        </section>

        {aiOpen && (
          <section className="card subtle readable-card">
            <AiResults
              subject={aiMeta.subject}
              difficulty={aiMeta.difficulty}
              createdAt={new Date().toLocaleDateString('es-ES')}
              questions={aiQuestions}
              loading={aiLoading}
              error={aiError}
              onChange={onChangeQuestion}
              onRegenerateAll={onRegenerateAll}
              onRegenerateOne={onRegenerateOne}
              onAddManual={onAddManual}
              onSave={onSave}
              onReorder={onReorderQuestion}
            />
          </section>
        )}

        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </PageTemplate>
  );
}