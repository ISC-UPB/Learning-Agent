import { useEffect, useState, useRef } from 'react';
import apiClient from '../api/apiClient';
import type { DoubleOptionResponse } from '../interfaces/interviewInt';

export const useMultipleQuestion = (
  onNext: () => void,
  selectedValues: DoubleOptionResponse[],
  setSelectedValues: React.Dispatch<React.SetStateAction<DoubleOptionResponse[]>>,
) => {
  const [doubleOption, setDoubleOption] = useState<DoubleOptionResponse>();
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
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchQuestion();
  }, [selectedValues]);

  const fetchQuestion = async () => {
    try {
      setDoubleOption(undefined);
      const response = await apiClient.get("/chatint/doubleOption?topico=programacion");
      const obj = response.data as DoubleOptionResponse;
      setDoubleOption(obj);
    } catch (error) {
      console.error("Failed to fetch clases", error);
    } finally {
      setLoading(false);
    }
  };

  const onClick = () => {
    setSelectedValues((sel) => [...sel, doubleOption!]);
    console.log(selectedValues);
    onNext();
  };

  const handleAnswerChange = (value: number) => {
    setDoubleOption((old) =>
      old != undefined ? { ...old, givenAnswer: value } : undefined
    );
  };

  return {
    doubleOption,
    loading,
    loadingMessageIndex,
    loadingMessages,
    onClick,
    handleAnswerChange,
  };
};
