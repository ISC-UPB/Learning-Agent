import { useCallback, useState, useEffect, useMemo } from "react";
import { message } from "antd";
import { useParams, useLocation } from "react-router-dom";
import { useDocuments } from "./useDocuments";
import { useChunkedDocumentUpload } from "./useChunkedDocumentUpload";
import { useUser } from "../context/UserContext";
import { useUserStore } from "../store/userStore";
import { useThemeStore } from "../store/themeStore";
import { Grid, theme as antTheme } from "antd";
import type { Document } from "../interfaces/documentInterface";
import useCourses from "./useCourses";
import useClasses from "./useClasses";

const { useBreakpoint: useGridBreakpoint } = Grid;

export const useUploadDocumentPage = () => {
  // Hooks de routing y contexto
  const { processDocumentComplete } = useChunkedDocumentUpload();
  const user = useUserStore((s) => s.user);
  const { id: _userId } = useUser();
  const { courseId, id } = useParams<{ courseId: string; id: string }>();
  const location = useLocation();
  const screens = useGridBreakpoint();
  
  // Hooks personalizados
  const documentsFilters = useMemo(() => ({
    courseId,
    classId: id
  }), [courseId, id]);
  
  const { documents, loading, downloadDocument, deleteDocument, loadDocuments } = useDocuments(documentsFilters);
  const { actualCourse, getCourseByID } = useCourses();
  const { actualClass, fetchClassById } = useClasses();

  // Estados
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [previewSidebarVisible, setPreviewSidebarVisible] = useState<boolean>(false);
  const [documentToPreview, setDocumentToPreview] = useState<Document | null>(null);
  const [dataSidebarVisible, setDataSidebarVisible] = useState<boolean>(false);
  const [documentToViewData, setDocumentToViewData] = useState<Document | null>(null);

  // Theme y breakpoints
  const theme = useThemeStore((state: { theme: string }) => state.theme);
  const isDark = theme === "dark";
  const { token } = antTheme.useToken();
  
  const isSmallScreen = !screens.lg;
  const isMobileScreen = !screens.md;
  const isInReinforcementContext = location.pathname.includes('/student/classes/') && location.pathname.includes('/reinforcement/documents');
  const isStudent = Boolean(user?.roles?.includes?.("estudiante"));

  // Efectos
  useEffect(() => {
    if (courseId && !actualCourse) {
      getCourseByID(courseId);
    }
    if (id && !actualClass) {
      fetchClassById(id);
    }
  }, [courseId, id, actualCourse, actualClass, getCourseByID, fetchClassById]);

  // Configuraciones
  const sidebarWidth = isSmallScreen ? '100%' : '50%';
  const contentMaxWidth = (previewSidebarVisible || dataSidebarVisible) && !isSmallScreen 
    ? '50%'
    : '100%';
  const pageTitle = isSmallScreen ? "Documentos" : "Documentos Académicos";
  const containerPadding = isSmallScreen ? "16px" : "24px";

  const fileConfig = {
    accept: ".pdf",
    maxSize: 100 * 1024 * 1024,
    chunkSize: 2 * 1024 * 1024,
    validationMessage: "Solo se permiten archivos PDF de hasta 100MB"
  };

  const processingConfig = {
    steps: [
      { key: "validate", title: "Validación", description: "Validando formato PDF..." },
      { key: "extract", title: "Extracción", description: "Extrayendo contenido..." },
      { key: "process", title: "Procesamiento", description: "Procesando documento..." },
      { key: "store", title: "Almacenamiento", description: "Guardando información..." }
    ],
    processingText: "Procesando documento PDF...",
    successText: "¡Documento procesado exitosamente!"
  };

  // Funciones de negocio
  const getBreadcrumbs = useCallback(() => {
    if (isInReinforcementContext && id) {
      return [
        { label: "Home", href: "/" },
        { label: "Classes", href: "/student/classes" },
        { label: "Reinforcement", href: `/student/classes/${id}/reinforcement` },
        { label: "Documents" }
      ];
    }
    
    if (courseId && id && actualCourse && actualClass) {
      return [
        { label: "Inicio", href: "/" },
        { label: "Materias", href: "/professor/courses" },
        { label: actualCourse.name, href: `/professor/courses/${courseId}/periods` },
        { label: actualClass.name, href: `/professor/courses/${courseId}/periods/${id}` },
        { label: "Documentos" }
      ];
    }
    
    if (courseId && !id && actualCourse) {
      return [
        { label: "Inicio", href: "/" },
        { label: "Materias", href: "/professor/courses" },
        { label: actualCourse.name, href: `/professor/courses/${courseId}/periods` },
        { label: "Documentos" }
      ];
    }
    
    return [{ label: "Inicio", href: "/" }, { label: "Documentos" }];
  }, [isInReinforcementContext, id, courseId, actualCourse, actualClass]);

  const handleUploadSuccess = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDocuments();
    } catch (error) {
      console.error("Error updating table:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadDocuments]);

  const handleDownload = useCallback(async (doc: Document) => {
    try {
      await downloadDocument(doc);
      message.success("File downloaded successfully");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Download error";
      message.error(errorMessage);
    }
  }, [downloadDocument]);

  const handleDeleteSuccess = useCallback(() => {
    message.success("Document deleted successfully");
    loadDocuments();
  }, [loadDocuments]);

  const handleDeleteError = useCallback((error: Error) => {
    message.error(error.message);
  }, []);

  const handleViewData = useCallback((doc: Document) => {
    if (previewSidebarVisible) {
      setPreviewSidebarVisible(false);
      setDocumentToPreview(null);
    }
    setDocumentToViewData(doc);
    setDataSidebarVisible(true);
  }, [previewSidebarVisible]);

  const handleCloseDataSidebar = useCallback(() => {
    setDataSidebarVisible(false);
    setDocumentToViewData(null);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setPreviewSidebarVisible(false);
    setDocumentToPreview(null);
  }, []);

  const handlePreview = useCallback(async (doc: Document) => {
    if (dataSidebarVisible) {
      setDataSidebarVisible(false);
      setDocumentToViewData(null);
    }
    setDocumentToPreview(doc);
    setPreviewSidebarVisible(true);
  }, [dataSidebarVisible]);

  return {
    // Estados
    refreshing,
    previewSidebarVisible,
    documentToPreview,
    dataSidebarVisible,
    documentToViewData,
    
    // Datos
    documents,
    loading,
    
    // Configuraciones y variables derivadas
    isStudent,
    isDark,
    isSmallScreen,
    isMobileScreen,
    sidebarWidth,
    contentMaxWidth,
    pageTitle,
    containerPadding,
    fileConfig,
    processingConfig,
    
    // Funciones
    getBreadcrumbs,
    handleUploadSuccess,
    handleDownload,
    handleDeleteSuccess,
    handleDeleteError,
    handleViewData,
    handleCloseDataSidebar,
    handleCloseSidebar,
    handlePreview,
    deleteDocument,
    
    // Otros
    processDocumentComplete,
    courseId,
    id,
    token
  };
};