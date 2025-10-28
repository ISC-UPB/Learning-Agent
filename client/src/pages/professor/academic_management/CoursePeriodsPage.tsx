import GlobalScrollbar from "../../../components/GlobalScrollbar";
import PageTemplate from "../../../components/PageTemplate";
import PeriodForm from "../../../components/PeriodForm";
import AccessDenied from "../../../components/shared/AccessDenied";
import { ErrorState } from "./course-periods/ErrorState";
import { LoadingState } from "./course-periods/LoadingState";
import { PeriodsGrid } from "./course-periods/PeriodsGrid";
import { SearchHeader } from "./course-periods/SearchHeader";
import { useCoursePeriods } from "./course-periods/useCoursePeriods";
import { useUserStore } from "../../../store/userStore";


export default function CoursePeriodsPage() {
  const user = useUserStore((s) => s.user);
  
  const {
    loading,
    error,
    modalOpen,
    creatingPeriod,
    searchTerm,
    filteredPeriods,
    actualCourse,
    setSearchTerm,

    handleCreatePeriod,
    goToPeriod,
    openCreateModal,
    closeCreateModal,
  } = useCoursePeriods();


  // Estado: Acceso denegado - No requiere reintento
  if (!user?.roles.includes("docente")) {
    return <AccessDenied />;
  }

  // Estado: Cargando - Muestra spinner de carga
  // Rol: Indicar al usuario que la información se está cargando
  if (loading) return <LoadingState />;
  // Estado: Error - Muestra pantalla de error estándar
  // Rol: Informar al usuario que ocurrió un error
  // Limitación: ErrorState no tiene botón de reintento, el usuario debe recargar manualmente
  if (error || !actualCourse) return <ErrorState />;

  return (
    <PageTemplate
      title={actualCourse.name}
      subtitle="Períodos en los que se dictó esta materia"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Materias", href: "/professor/courses" },
        { label: actualCourse.name }
      ]}
    >
      <GlobalScrollbar />        
      <div
        style={{
          maxWidth: '100%',
          width: '100%',
          margin: '0 auto',
          padding: '24px 16px',
          boxSizing: 'border-box',
        }}
      >
        <SearchHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateClick={openCreateModal}
          showCreateButton={true} 
        />
        {/* PeriodsGrid maneja automáticamente el estado vacío cuando filteredPeriods.length === 0
          Rol: Mostrar grid de períodos o mensaje "No hay períodos creados para esta materia" */}

        <PeriodsGrid
          periods={filteredPeriods}
          onPeriodClick={goToPeriod}
        />

        <PeriodForm
          open={modalOpen}
          onClose={closeCreateModal}
          onSubmit={handleCreatePeriod}
          course={actualCourse}
          loading={creatingPeriod}
        />
      </div>
    </PageTemplate>
  );
}