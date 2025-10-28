import { Empty, Button } from "antd";
import { useNavigate } from "react-router-dom";
import GlobalScrollbar from "../../../../components/GlobalScrollbar";
import PageTemplate from "../../../../components/PageTemplate";

export function ErrorState() {
  const navigate = useNavigate();
  
  return (
    <PageTemplate
      title="Curso no encontrado"
      subtitle="No se pudo cargar la información del curso"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Materias", href: "/professor/courses" },
        { label: "Error" }
      ]}
    >
      <GlobalScrollbar />                
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Empty description="Curso no encontrado" />
        <Button type="primary" onClick={() => navigate(-1)}>
          Volver a Materias
        </Button>
      </div>
    </PageTemplate>
  );
}