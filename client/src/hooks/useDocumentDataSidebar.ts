import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { message } from 'antd';
import { useThemeStore } from '../store/themeStore';
import type { Document, DocumentExtractedData } from '../interfaces/documentInterface';
import { useDocuments } from './useDocuments';

const MIN_DRAWER_HEIGHT = 220;
const MAX_DRAWER_HEIGHT_RATIO = 0.98;
const INITIAL_DRAWER_HEIGHT_RATIO = 0.75;

export const useDocumentDataSidebar = (document: Document | null, visible: boolean) => {

  const { getDocumentExtractedData, getDocumentIndex, generateDocumentIndex, extractedDataLoading, extractedDataError } = useDocuments();

  const theme = useThemeStore((state: { theme: string }) => state.theme);
  const isDark = theme === 'dark';

  const initialHeight = Math.round(window.innerHeight * INITIAL_DRAWER_HEIGHT_RATIO);
  const [drawerHeight, setDrawerHeight] = useState<number>(initialHeight);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(drawerHeight);

  const [extractedData, setExtractedData] = useState<DocumentExtractedData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('metadata');
  const [retryCount, setRetryCount] = useState<number>(0);

  const [indexData, setIndexData] = useState<any>(null);
  const [indexLoading, setIndexLoading] = useState<boolean>(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  
  const indexCacheRef = useRef<Map<string, any>>(new Map());

  const documentId = document?.id;
  const isLoading = documentId ? extractedDataLoading[documentId] || false : false;
  const error = documentId ? extractedDataError[documentId] || null : null;

  // Función para obtener estado en español
  const getStatusInSpanish = useCallback((status: string): string => {
    switch (status) {
      case 'GENERATING': return 'Generando';
      case 'GENERATED': return 'Generado';
      case 'ERROR': return 'Error';
      default: return status;
    }
  }, []);

  // Cargar datos extraídos
  const loadExtractedData = useCallback(async () => {
    if (!document?.id) {
      setExtractedData(null);
      return;
    }
    try {
      const data = await getDocumentExtractedData(document.id);
      setExtractedData(data);
    } catch (err) {
      console.error('Error loading extracted data:', err);
    }
  }, [document?.id, getDocumentExtractedData]);

  // Cargar datos del índice
  const loadIndexData = useCallback(async () => {
    if (!document?.id) {
      setIndexData(null);
      return;
    }

    const cachedIndex = indexCacheRef.current.get(document.id);
    if (cachedIndex) {
      setIndexData(cachedIndex);
      return;
    }

    setIndexLoading(true);
    setIndexError(null);
    
    try {
      const data = await getDocumentIndex(document.id);
      
      if (!data.success) {
        throw new Error(data.message || 'Error desconocido al cargar el índice');
      }
      
      indexCacheRef.current.set(document.id, data);
      setIndexData(data);
      
    } catch (err: any) {
      let errorMessage = 'Error al cargar el índice';
      
      if (err?.response?.status === 404) {
        setIndexData(null);
        setIndexError(null);
        return;
      } else if (err?.response?.status === 400) {
        errorMessage = 'Documento no válido';
      } else if (err?.response?.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setIndexError(errorMessage);
    } finally {
      setIndexLoading(false);
    }
  }, [document?.id, getDocumentIndex]);

  // Generar índice
  const handleGenerateIndex = useCallback(async () => {
    if (!document?.id) {
      message.error('No se ha seleccionado un documento');
      return;
    }
    
    setIndexLoading(true);
    setIndexError(null);
    
    message.info('Generando índice del documento... Esto puede tomar unos minutos.');
    
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: La generación del índice está tomando demasiado tiempo')), 120000)
      );
      
      const generatePromise = generateDocumentIndex(document.id);
      const generateResult = await Promise.race([generatePromise, timeoutPromise]) as any;
      
      if (!generateResult?.success) {
        throw new Error(generateResult?.message || 'Error desconocido al generar el índice');
      }
      
      if (document?.id) {
        indexCacheRef.current.delete(document.id);
      }
      
      await loadIndexData();
      message.success('Índice generado exitosamente');
      
    } catch (err: any) {
      console.error('Error generating index:', err);
      
      let errorMessage = 'Error al generar el índice';
      
      if (err?.message?.includes('Timeout')) {
        errorMessage = 'La generación del índice está tomando demasiado tiempo. Inténtalo más tarde.';
      } else if (err?.response?.status === 400) {
        errorMessage = 'El documento no es válido para generar índice';
      } else if (err?.response?.status === 404) {
        errorMessage = 'Documento no encontrado';
      } else if (err?.response?.status === 409) {
        errorMessage = 'Ya hay una generación de índice en proceso';
      } else if (err?.response?.status === 422) {
        errorMessage = 'El documento no tiene suficiente contenido para generar un índice';
      } else if (err?.response?.status === 500) {
        errorMessage = 'Error interno del servidor al generar el índice';
      } else if (err?.response?.status === 503) {
        errorMessage = 'Servicio temporalmente no disponible';
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setIndexError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIndexLoading(false);
    }
  }, [document?.id, generateDocumentIndex, loadIndexData]);

  // Procesar índice plano
  const processFlatIndex = useCallback((chapters: any[]) => {
    const flatItems: any[] = [];
    
    chapters.forEach((chapter, chapterIndex) => {
      flatItems.push({
        id: `chapter-${chapterIndex}`,
        title: chapter.title,
        description: chapter.description,
        level: 1,
        type: 'chapter'
      });
      
      if (chapter.subtopics && chapter.subtopics.length > 0) {
        chapter.subtopics.forEach((subtopic: any, subtopicIndex: number) => {
          flatItems.push({
            id: `subtopic-${chapterIndex}-${subtopicIndex}`,
            title: subtopic.title,
            description: subtopic.description,
            level: 2,
            type: 'subtopic'
          });
        });
      }
      
      if (chapter.exercises && chapter.exercises.length > 0) {
        chapter.exercises.forEach((exercise: any, exerciseIndex: number) => {
          flatItems.push({
            id: `exercise-${chapterIndex}-${exerciseIndex}`,
            title: exercise.title,
            description: exercise.description,
            difficulty: exercise.difficulty,
            estimatedTime: exercise.estimatedTime,
            keywords: exercise.keywords,
            level: 3,
            type: exercise.type || 'exercise'
          });
        });
      }
    });
    
    return flatItems;
  }, []);

  // Items procesados del índice
  const processedIndexItems = useMemo(() => {
    if (!indexData?.data?.chapters || !Array.isArray(indexData.data.chapters)) {
      return [];
    }
    return processFlatIndex(indexData.data.chapters);
  }, [indexData?.data?.chapters, processFlatIndex]);

  // Estadísticas del índice
  const indexStats = useMemo(() => {
    if (!indexData?.data?.chapters) return { chapters: 0, subtopics: 0, exercises: 0 };
    
    const chapters = indexData.data.chapters.length;
    const subtopics = indexData.data.chapters.reduce((acc: number, chapter: any) => 
      acc + (chapter.subtopics ? chapter.subtopics.length : 0), 0);
    const exercises = indexData.data.chapters.reduce((acc: number, chapter: any) => {
      const chapterExercises = chapter.exercises ? chapter.exercises.length : 0;
      const subtopicExercises = chapter.subtopics ? 
        chapter.subtopics.reduce((subAcc: number, subtopic: any) => 
          subAcc + (subtopic.exercises ? subtopic.exercises.length : 0), 0) : 0;
      return acc + chapterExercises + subtopicExercises;
    }, 0);
    
    return { chapters, subtopics, exercises };
  }, [indexData?.data?.chapters]);

  // Copiar al portapapeles
  const copyToClipboard = useCallback(async (text: string, label = 'Texto') => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${label} copiado al portapapeles`);
    } catch {
      message.error('Error al copiar al portapapeles');
    }
  }, []);

  // Reintentar carga de datos
  const retryLoadData = useCallback(async () => {
    if (!document?.id) return;
    setRetryCount((p) => p + 1);
    try {
      const data = await getDocumentExtractedData(document.id);
      setExtractedData(data);
      message.success('Datos recargados exitosamente');
    } catch (err) {
      console.error('Error reloading data:', err);
      message.error('Error al recargar los datos');
    }
  }, [document?.id, getDocumentExtractedData]);

  // Efectos
  useEffect(() => {
    if (document?.id && visible) {
      loadExtractedData();
      if (activeTab === 'index') {
        loadIndexData();
      }
    } else {
      setExtractedData(null);
      setIndexData(null);
      setIndexError(null);
    }
  }, [document?.id, visible, activeTab, loadExtractedData, loadIndexData]);

  useEffect(() => {
    const onResize = () => {
      const newMax = Math.round(window.innerHeight * MAX_DRAWER_HEIGHT_RATIO);
      setDrawerHeight((h) => Math.max(MIN_DRAWER_HEIGHT, Math.min(newMax, h)));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Manejo del drag para móvil
  const onHandlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = drawerHeight;
    (e.target as Element).setPointerCapture?.(e.pointerId);

    const onPointerMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const delta = startYRef.current - ev.clientY; 
      const candidate = Math.round(startHeightRef.current + delta);
      const bounded = Math.max(MIN_DRAWER_HEIGHT, Math.min(Math.round(window.innerHeight * MAX_DRAWER_HEIGHT_RATIO), candidate));
      setDrawerHeight(bounded);
    };

    const onPointerUp = () => {
      draggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [drawerHeight]);

  return {
    // Estados
    extractedData,
    activeTab,
    setActiveTab,
    retryCount,
    indexData,
    indexLoading,
    indexError,
    isLoading,
    error,
    processedIndexItems,
    indexStats,
    drawerHeight,
    
    // Funciones
    loadExtractedData,
    loadIndexData,
    handleGenerateIndex,
    copyToClipboard,
    retryLoadData,
    onHandlePointerDown,
    getStatusInSpanish,
    
    // Variables de tema
    isDark,
    
    // Referencias
    draggingRef,
    startYRef,
    startHeightRef,
  };
};