import { useState } from "react";
import { useNavigate, useParams, generatePath } from "react-router-dom";
import { Button, theme } from "antd";
import PageTemplate from "../../../components/PageTemplate";
import InterviewModal from "../../../components/interview/InterviewModal";
import InterviewSummaryModal from "../../../components/interview/InterviewFeedbackModal";
import OpenQuestion from "../../../components/interview/openQuestion/OpenQuestion";
import TeoricQuestion from "../../../components/interview/TeoricQuestion";
import MultipleQuestion from "../../../components/interview/MultipleQuestion";
import useInterview from "../../../hooks/useInterview";
import type { DoubleOptionResponse, MultipleSelectionResponse } from '../../../interfaces/interviewInt';
import { usePdfGenerator } from '../../../hooks/usePdfGenerator';
export default function InterviewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = theme.useToken();

  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedValues, setSelectedValues] = useState<DoubleOptionResponse[]>([]);
   const [mulSelectedValues, setMulSelectedValues] = useState<MultipleSelectionResponse[]>([]);
  const {
    isModalOpen,
    questionCount,
    currentQuestion,
    currentType,
    startExam,
    nextQuestion,
  } = useInterview(["multiple", "teoric", "open"], () => setShowSummary(true));

  const goToReinforcement = () => {
    if (!id) return;
    navigate(generatePath("/student/classes/:id/reinforcement", { id }));
  };
  const { generatePDF } = usePdfGenerator();
  const handleStartInterview = (count: number) => {
    startExam(count);
    setIsInterviewStarted(true);
  };

  const handleDownloadFeedback = async () => {
    try {
      console.log("Descargando feedback...");
      // Combinar ambos tipos de datos
      const allData = [...mulSelectedValues, ...selectedValues];
      await generatePDF(allData);
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
    }
  }
  const handleNextQuestion = () => {
    if (currentQuestion < questionCount) nextQuestion();
    else setShowSummary(true);
  };

  const renderQuestion = () => {
    switch (currentType) {
      case "multiple":
        return <MultipleQuestion onNext={nextQuestion} selectedValues={selectedValues} setSelectedValues={setSelectedValues}  />;
      case "teoric":
        return <TeoricQuestion onNext={nextQuestion}selectedValues={mulSelectedValues} setSelectedValues={setMulSelectedValues}/>;
      case "open":
      default:
        return <OpenQuestion onNext={handleNextQuestion} />;
    }
  };

  return (
    <PageTemplate
      title="Interview"
      subtitle={
        isInterviewStarted && questionCount
          ? `Question ${currentQuestion} of ${questionCount}`
          : "Soon you will find interview practice"
      }
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Classes", href: "/student/classes" },
        { label: "Reinforcement", href: id ? generatePath("/student/classes/:id/reinforcement", { id }) : "#" },
        { label: "Interview" },
      ]}
      actions={
        isInterviewStarted && (
          <Button
            style={{ backgroundColor: token.colorPrimary, color: token.colorTextLightSolid }}
            onClick={() => setShowSummary(true)}
          >
            Finalizar
          </Button>
        )
      }
    >
      {!isInterviewStarted && (
        <InterviewModal
          open={isModalOpen}
          onClose={goToReinforcement}
          onSelectDifficulty={handleStartInterview}
        />
      )}

      {isInterviewStarted && renderQuestion()}

      <InterviewSummaryModal
        open={showSummary}
        onClose={goToReinforcement}
        onDownload={handleDownloadFeedback}
        multipleSelectionData={mulSelectedValues} // Tus preguntas teóricas
        doubleOptionData={selectedValues}
      />
    </PageTemplate>
  );
}
