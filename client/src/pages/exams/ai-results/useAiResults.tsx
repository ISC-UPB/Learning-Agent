import { useState, type DragEvent } from 'react';
import type { GeneratedQuestion } from '../../../services/exams.service';
import type { AiResultsProps } from './AiResults';

type UseAiResultsParams = AiResultsProps;

export function useAiResults(params: UseAiResultsParams) {
  const {
    questions,
    onRegenerateAll,
    onAddManual,
    onSave,
    onReorder,
  } = params;

  const [regenLoading, setRegenLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeChoice, setTypeChoice] =
    useState<GeneratedQuestion['type']>('multiple_choice');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showPromptViewer, setShowPromptViewer] = useState(false);

  const total = questions.length;
  const selected = questions.filter(q => q.include).length;
  const mc = questions.filter(q => q.type === 'multiple_choice').length;
  const tf = questions.filter(q => q.type === 'true_false').length;
  const an = questions.filter(q => q.type === 'open_analysis').length;
  const ej = questions.filter(q => q.type === 'open_exercise').length;

  const handleRegenerateAll = async () => {
    setRegenLoading(true);
    try {
      await onRegenerateAll();
    } finally {
      setRegenLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await onSave();
    } finally {
      setSaveLoading(false);
    }
  };

  const openTypeModal = () => {
    setTypeChoice('multiple_choice');
    setTypeModalOpen(true);
  };

  const confirmAddManual = () => {
    onAddManual(typeChoice);
    setTypeModalOpen(false);
  };

  const handleDragStart = (index: number) => () => setDragIndex(index);
  const handleDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    onReorder(dragIndex, index);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  return {
    regenLoading,
    saveLoading,
    typeModalOpen,
    typeChoice,
    showPromptViewer,

    setTypeChoice, setShowPromptViewer,setTypeModalOpen,

    total,
    selected,
    mc, tf, an, ej,

    openTypeModal, confirmAddManual, handleRegenerateAll, handleSave, handleDragStart,handleDragOver,handleDragEnd,
  };
}
