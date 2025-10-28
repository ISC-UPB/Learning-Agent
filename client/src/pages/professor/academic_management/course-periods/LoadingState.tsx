import GlobalScrollbar from "../../../../components/GlobalScrollbar";
import PageTemplate from "../../../../components/PageTemplate";

export function LoadingState() {
  return (
    <PageTemplate
      title="Períodos"
      subtitle="Cargando información..."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Materias", href: "/professor/courses" },
        { label: "Cargando..." }
      ]}
    >
      <GlobalScrollbar />        
      <div style={{ textAlign: "center", padding: "50px" }}>
        <div>Cargando curso y períodos...</div>
      </div>
    </PageTemplate>
  );
}