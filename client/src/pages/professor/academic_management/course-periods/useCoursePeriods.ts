import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Clase, CreateClassDTO } from "../../../../interfaces/claseInterface";
import useClasses from "../../../../hooks/useClasses";
import useCourses from "../../../../hooks/useCourses";

export function useCoursePeriods() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");


  const { classes, createClass, fetchClassesByCourse } = useClasses();
  const { actualCourse, getCourseByID } = useCourses();

  const functionsRef = useRef({
    getCourseByID,
    fetchClassesByCourse
  });

  useEffect(() => {
    functionsRef.current = {
      getCourseByID,
      fetchClassesByCourse
    };
  });

  useEffect(() => {
    let isMounted = true;

    const fetchCoursePeriods = async () => {
      if (!courseId) {
        if (isMounted) {
          setError("ID del curso no proporcionado");
          setLoading(false);
        }
        return;
      }
      
      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const { getCourseByID: getCourse, fetchClassesByCourse: fetchClasses } = functionsRef.current;
        
        const courseRes = await getCourse(courseId);
        
        if (!isMounted) return;
        
        if (courseRes.state === "error") {
          setError(courseRes.message || "Error al cargar el curso");
          setLoading(false);
          return;
        }

        const periodsRes = await fetchClasses(courseId);
        
        if (!isMounted) return;
        
        if (periodsRes.state === "error") {
          setError(periodsRes.message || "Error al cargar los períodos");
          setLoading(false);
          return;
        }

        setLoading(false);
        
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : "Error al cargar los datos del curso";
        setError(errorMessage);
        setLoading(false);
      }
    };
    if (courseId) {
      fetchCoursePeriods();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId]); 

  const retry = useCallback(() => {
    if (courseId) {
      setLoading(true);
      setError(null);
      
      const reloadData = async () => {
        try {
          await getCourseByID(courseId);
          await fetchClassesByCourse(courseId);
          setLoading(false);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Error al recargar los datos";
          setError(errorMessage);
          setLoading(false);
        }
      };
      
      reloadData();
    }
  }, [courseId, getCourseByID, fetchClassesByCourse]);

  const filteredPeriods = useMemo((): Clase[] => {
    if (!searchTerm.trim()) {
      return classes;
    }

    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    return classes.filter(
      (period: Clase) =>
        period.semester.toLowerCase().includes(lowerSearchTerm) ||
        period.name.toLowerCase().includes(lowerSearchTerm)
    );
    
  }, [searchTerm, classes]);

  const handleCreatePeriod = useCallback(async (periodData: Clase | CreateClassDTO): Promise<void> => {
    if (!courseId) {
      setError("ID del curso no proporcionado");
      return;
    }

    setCreatingPeriod(true);

    try {
      let createData: CreateClassDTO;
      
      if ("courseId" in periodData && typeof periodData.courseId === "string") {
        createData = periodData as CreateClassDTO;
      } else {
        createData = {
          semester: periodData.semester,
          dateBegin: periodData.dateBegin,
          dateEnd: periodData.dateEnd,
          courseId: courseId,
          teacherId: periodData.teacherId,
        };
      }

      const res = await createClass(createData);

      if (res.state === "error") {
        setError(res.message);
        return;
      }

      await fetchClassesByCourse(courseId);
      setModalOpen(false);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear el período";
      setError(errorMessage);
    } finally {
      setCreatingPeriod(false);
    }
  }, [courseId, createClass, fetchClassesByCourse]);

  const goToPeriod = useCallback((periodId: string): void => {
    navigate(`${periodId}`);
  }, [navigate]);

  const openCreateModal = useCallback((): void => {
    setModalOpen(true);
  }, []);

  const closeCreateModal = useCallback((): void => {
    setModalOpen(false);
  }, []);

  return {
    loading,
    error,
    modalOpen,
    creatingPeriod,
    searchTerm,
    filteredPeriods,
    actualCourse,
    
    setSearchTerm,
    retry,
    handleCreatePeriod,
    goToPeriod,
    openCreateModal,
    closeCreateModal,
  };
}