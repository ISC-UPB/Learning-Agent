import { Typography } from 'antd';
import type { CSSProperties } from 'react';
import '../../components/exams/ExamForm.css';
import '../../components/shared/Toast.css';
import { ExamForm } from '../../components/exams/ExamForm';
import { Toast } from '../../components/shared/Toast';
import PageTemplate from '../../components/PageTemplate';
import './ExamCreatePage.css';
import AiResults from './ai-results/AiResults';
import { useAiQuestionsPage } from '../../hooks/useAiQuestionsPage';

const { Title } = Typography;

const layoutStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 30,
  alignItems: 'center',
  padding: 'clamp(24px, 3.2vw, 40px) 16px',
};

export default function ExamsCreatePage() {
  const {
    aiOpen,
    aiLoading,
    aiError,
    aiQuestions,
    aiMeta,
    token,
    toasts,
    pushToast,
    removeToast,
    formRef,
    handleAIPropose,
    onChangeQuestion,
    onRegenerateAll,
    onRegenerateOne,
    onAddManual,
    onSave,
    onReorder,
  } = useAiQuestionsPage();

  return (
    <PageTemplate
      title="Exámenes"
      subtitle="Creador de exámenes"
      breadcrumbs={[
        { label: 'Inicio', href: '/' },
        { label: 'Exámenes', href: '/exams' },
        { label: 'Crear', href: '/exams/create' },
        { label: 'Gestión de Exámenes', href: '/exams' },
      ]}
    >
      <div
        className="pantalla-scroll w-full lg:max-w-6xl lg:mx-auto space-y-4 sm:space-y-6"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 30px', background: token.colorBgLayout, color: token.colorText }}
      >
        <section
          className="card"
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowSecondary,
            maxWidth: 'clamp(720px, 92vw, 1000px)',
            margin: '0 auto',
          }}
        >
          <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>Crear nuevo examen</Title>
          <div style={layoutStyle}>
            <ExamForm ref={formRef} onToast={pushToast} onGenerateAI={handleAIPropose} />
          </div>
        </section>

        {aiOpen && (
          <section
            className="card"
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: token.boxShadowSecondary,
              width: '100%',
              maxWidth: 1000,
              margin: '0 auto',
            }}
          >
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
              onReorder={onReorder}
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
