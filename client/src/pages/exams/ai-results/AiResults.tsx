import { Alert, Button, Card, Skeleton, Space, Typography, theme } from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  SaveOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { PromptViewer } from '../../../components/exams/PromptViewer';
import QuestionCard from '../../../components/ai/QuestionCard';
import type { GeneratedQuestion } from '../../../services/exams.service';
import { useAiResults } from './useAiResults';
import TypeModal from '../components/TypeModal';

const { Title, Text } = Typography;

export type AiResultsProps = {
  subject: string;
  difficulty: string;
  createdAt?: string;
  questions: GeneratedQuestion[];
  loading?: boolean;
  error?: string | null;
  onChange: (q: GeneratedQuestion) => void;
  onRegenerateAll: () => Promise<void> | void;
  onRegenerateOne?: (q: GeneratedQuestion) => Promise<void> | void;
  onAddManual: (type: GeneratedQuestion['type']) => void;
  onSave: () => Promise<void> | void;
  onReorder: (from: number, to: number) => void;
};

export default function AiResults(props: AiResultsProps) {
  const { token } = theme.useToken();

  const {
    total, selected, mc, tf, an, ej,
    regenLoading, saveLoading, typeModalOpen, typeChoice, showPromptViewer,
    setTypeChoice, setShowPromptViewer, setTypeModalOpen,
    openTypeModal, confirmAddManual,
    handleRegenerateAll, handleSave,
    handleDragStart, handleDragOver, handleDragEnd,
  } = useAiResults(props);

  const {
    subject,
    difficulty,
    createdAt,
    questions,
    loading,
    error,
    onChange,
    onRegenerateOne,
  } = props;

  const examInfoStyle = {
    background: token.colorFillTertiary,
    borderLeft: `4px solid ${token.colorPrimary}`,
  } as const;

  return (
    <div
      className="ai-results-wrap"
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        color: token.colorText,
      }}
    >
      <div
        className="ai-results card-like"
        style={{ background: token.colorBgContainer }}
      >
        <Title level={3} className="!mb-4 -full text-center">
          Revisar Examen:{' '}
          <span style={{ color: token.colorText }}>{subject}</span>
        </Title>

        <div
          className="flex flex-wrap justify-center items-center gap-4 p-5 rounded-md my-2 text-center"
          style={examInfoStyle}
        >
          <div className="flex flex-col">
            <Text type="secondary">Materia</Text>
            <Text strong>{subject}</Text>
          </div>
          <div className="flex flex-col">
            <Text type="secondary">Total</Text>
            <Text strong>{total}</Text>
          </div>
          <div className="flex flex-col">
            <Text type="secondary">Dificultad</Text>
            <Text strong>{difficulty}</Text>
          </div>
          <div className="flex flex-col">
            <Text type="secondary">Seleccionadas</Text>
            <Text strong>{selected}</Text>
          </div>
          {createdAt && (
            <div className="flex flex-col">
              <Text type="secondary">Fecha de Creación</Text>
              <Text strong>{createdAt}</Text>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Card size="small"><Text strong>MC:</Text> <Text>{mc}</Text></Card>
          <Card size="small"><Text strong>VF:</Text> <Text>{tf}</Text></Card>
          <Card size="small"><Text strong>AN:</Text> <Text>{an}</Text></Card>
          <Card size="small"><Text strong>EJ:</Text> <Text>{ej}</Text></Card>
        </div>

        {error && <Alert type="error" showIcon className="mb-4" message={error} />}

        {loading ? (
          <Card><Skeleton active paragraph={{ rows: 4 }} /></Card>
        ) : (
          <Space direction="vertical" className="w-full" size={0}>
            {questions.map((q, i) => (
              <div
                key={q.id}
                draggable
                onDragStart={handleDragStart(i)}
                onDragOver={handleDragOver(i)}
                onDragEnd={handleDragEnd}
                style={{ cursor: 'move' }}
              >
                <QuestionCard
                  index={i}
                  question={q}
                  onChange={onChange}
                  onRegenerate={!q.id?.startsWith('manual_') ? onRegenerateOne : undefined}
                  disabled={q.type === 'multiple_choice' || q.type === 'true_false'}
                />
              </div>
            ))}
          </Space>
        )}

        <div className="flex flex-col md:flex-row justify-between gap-1 mt-3">
          <div className="flex gap-1">
            <Button icon={<ReloadOutlined />} loading={regenLoading} onClick={handleRegenerateAll}>
              Regenerar
            </Button>
            <Button icon={<PlusOutlined />} onClick={openTypeModal}>
              Añadir manual
            </Button>
          </div>
          <div className="flex gap-1 justify-end">
            <Button
              icon={<QuestionCircleOutlined />}
              onClick={() => setShowPromptViewer(true)}
              aria-label="Ver Prompt"
            />
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saveLoading}
              disabled={loading || !!error || questions.length === 0 || selected === 0}
              onClick={handleSave}
              aria-label="Guardar y Finalizar"
              title={
                loading ? 'Espera mientras se genera el examen' :
                error ? 'Hay errores que necesitan ser corregidos' :
                questions.length === 0 ? 'No hay preguntas generadas' :
                selected === 0 ? 'Selecciona al menos una pregunta' :
                'Guardar y finalizar el examen'
              }
            >
              Guardar y Finalizar
            </Button>
          </div>
        </div>

        <TypeModal
          open={typeModalOpen}
          typeChoice={typeChoice}
          onChange={setTypeChoice}
          onOk={confirmAddManual}
          onCancel={() => setTypeModalOpen(false)}
        />

        <PromptViewer open={showPromptViewer} onClose={() => setShowPromptViewer(false)} />
      </div>
    </div>
  );
}