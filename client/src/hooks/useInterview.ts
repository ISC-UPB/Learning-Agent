import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

export type InterviewType = "open" | "teoric" | "multiple";

interface UseInterviewResult {
  isModalOpen: boolean;
  questionCount: number;
  currentQuestion: number;
  currentType: InterviewType | undefined;
  openModal: () => void;
  closeModal: () => void;
  startExam: (count: number) => void;
  nextQuestion: () => void;
  finish: () => void;
  confirmFinish: () => boolean;
  handleClickOutside: () => void;
}

export default function useInterview(initialQuestions: InterviewType[] = [], onFinish?: () => void): UseInterviewResult {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order] = useState<InterviewType[]>(() => {
    if (initialQuestions.length === 0) return [];
    const arr = [...initialQuestions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [index, setIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const [questionType, setQuestionType] = useState<InterviewType>("multiple");

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (id) navigate(`/classes/${id}/reinforcement`);
  }, [navigate, id]);

  const randomizeType = useCallback(() => {
    const types: InterviewType[] = ["multiple", "open", "teoric"];
    setQuestionType(types[Math.floor(Math.random() * types.length)]);
  }, []);

  const startExam = useCallback(
    (count: number) => {
      setQuestionCount(count);
      setCurrentQuestion(1);
      randomizeType();
      setIsModalOpen(false);
    },
    [randomizeType]
  );

  const nextQuestion = useCallback(() => {
    if (currentQuestion < questionCount) {
      setCurrentQuestion((prev) => prev + 1);
      randomizeType();
      setIndex((prev) => (prev + 1) % order.length);
    } else {
      if (onFinish) onFinish();
    }
  }, [currentQuestion, questionCount, randomizeType, order.length, onFinish]);

  const finish = useCallback(() => {
    if (onFinish) onFinish();
    else if (id) navigate(`/classes/${id}/reinforcement`);
  }, [onFinish, navigate, id]);

  const confirmFinish = useCallback(() => {
    setIsModalOpen(false);
    if (id) navigate(`/classes/${id}/reinforcement`);
    return true;
  }, [navigate, id]);

  const handleClickOutside = useCallback(() => {
    if (id) navigate(`/classes/${id}/reinforcement`);
  }, [navigate, id]);

  useEffect(() => {
    openModal();
  }, [openModal]);

  return {
    isModalOpen,
    questionCount,
    currentQuestion,
    currentType: order[index] ?? questionType,
    openModal,
    closeModal,
    startExam,
    nextQuestion,
    finish,
    confirmFinish,
    handleClickOutside,
  };
}
