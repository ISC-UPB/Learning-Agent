import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchQuestion, type QuestionData } from "../services/testService";

export function useStudentTest(context: string, onFinish?: () => void) {
  const navigate = useNavigate();
  const { id: classId } = useParams<{ id: string }>();

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examFinished, setExamFinished] = useState(false);

  const openTestModal = useCallback(() => setIsTestModalOpen(true), []);

  const handleModalClose = useCallback(() => {
    if (classId) {
      navigate(`/student/classes/${classId}/reinforcement`);
    } else {
      navigate("/student/classes");
    }
  }, [navigate, classId]);

  const loadQuestion = useCallback(async () => {
    if (examFinished) return;
    setLoading(true);
    setError(null);
    try {
      const q = await fetchQuestion(context);
      setQuestionData(q);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error requesting the question");
      setQuestionData(null);
    } finally {
      setLoading(false);
    }
  }, [examFinished, context]);

  const startExam = useCallback(
    (count: number) => {
      if (!count || count <= 0) {
        handleModalClose();
        return;
      }
      const total = count * 30;
      setQuestionCount(count);
      setCurrentQuestion(1);
      setAnswers([]);
      setStartTime(Date.now());
      setEndTime(null);
      setTotalTime(total);
      setTimeLeft(total);
      setExamFinished(false);
      setIsTestModalOpen(false);
      loadQuestion();
    },
    [loadQuestion, handleModalClose]
  );

  const recordAnswer = useCallback(
    (isCorrect: boolean) => {
      if (examFinished || timeLeft <= 0) return;
      setAnswers((prev) => [...prev, isCorrect]);
    },
    [examFinished, timeLeft]
  );

  const finishExam = useCallback(() => {
    if (examFinished) return;
    setExamFinished(true);
    setEndTime(Date.now());
    onFinish?.();
  }, [onFinish, examFinished]);

  const nextQuestion = useCallback(() => {
    if (examFinished || timeLeft <= 0) return;
    if (currentQuestion < questionCount) {
      setCurrentQuestion((prev) => prev + 1);
      loadQuestion();
    } else {
      finishExam();
    }
  }, [currentQuestion, questionCount, loadQuestion, finishExam, examFinished, timeLeft]);

  useEffect(() => {
    openTestModal();
  }, [openTestModal]);

  useEffect(() => {
    if (totalTime === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [totalTime, finishExam]);

  const getClampedTimeTaken = useCallback(() => {
    if (!startTime || !endTime) return null;
    const raw = endTime - startTime;
    const max = totalTime * 1000;
    return Math.min(raw, max);
  }, [startTime, endTime, totalTime]);

  return {
    isTestModalOpen,
    questionCount,
    currentQuestion,
    questionData,
    loading,
    error,
    answers,
    startTime,
    endTime,
    timeLeft,
    totalTime,
    examFinished,
    openTestModal,
    closeTestModal: handleModalClose,
    startExam,
    nextQuestion,
    recordAnswer,
    finishExam,
    reloadQuestion: loadQuestion,
    modalProps: {
      maskClosable: false,
      keyboard: false
    },
    getClampedTimeTaken
  };
}
