import { useEffect, useRef, useState } from 'react';
import apiClient from '../api/apiClient';
import type { MultipleSelectionResponse } from '../interfaces/interviewInt';

interface UseTeoricQuestionParams {
  selectedValues: MultipleSelectionResponse[];
  setSelectedValues: React.Dispatch<React.SetStateAction<MultipleSelectionResponse[]>>;
  onNext: () => void;
}

interface UseTeoricQuestionReturn {
  mulOption: MultipleSelectionResponse | undefined;
  loading: boolean;
  loadingMessageIndex: number;
  loadingMessages: string[];
  handleOptionChange: (value: number) => void;
  handleNextClick: () => void;
}

export function useTeoricQuestion({
  selectedValues,
  setSelectedValues,
  onNext,
}: UseTeoricQuestionParams): UseTeoricQuestionReturn {
  const [mulOption, setMulOption] = useState<MultipleSelectionResponse>();
  const [loading, setLoading] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const hasFetched = useRef(false);

  const loadingMessages = [
    "Accediendo a la base de datos...",
    "Cargando pregunta...",
    "Preparando interfaz...",
    "Inicializando lógica...",
    "Verificando dificultad..."
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchQuestion();
  }, [selectedValues]);

  async function fetchQuestion() {
    try {
      setMulOption(undefined);
      const response = await apiClient.get("/chatint/multipleSelection?topico=fisica");
      const obj = response.data as MultipleSelectionResponse;
      setMulOption(obj);
    } catch (error) {
      console.error("Failed to fetch question", error);
    } finally {
      setLoading(false);
    }
  }

  const handleOptionChange = (value: number) => {
    setMulOption(old => old !== undefined ? { ...old, givenAnswer: value } : undefined);
  };

  const handleNextClick = () => {
    setSelectedValues(sel => [...sel, mulOption!]);
    console.log(selectedValues);
    onNext();
  };

  return {
    mulOption,
    loading,
    loadingMessageIndex,
    loadingMessages,
    handleOptionChange,
    handleNextClick,
  };
}
