import { Button, Empty, Space, Input } from "antd";
import { PlusOutlined, SolutionOutlined } from "@ant-design/icons";

import { CreateCourseForm } from "./CreateCourseForm";
import AccessDenied from "../../components/shared/AccessDenied";
import CustomCard from "../../components/shared/CustomCard";
import PageTemplate from "../../components/PageTemplate";
import { useCoursesPage } from "../../hooks/useCoursesPage";
import GlobalScrollbar from "../../components/GlobalScrollbar";

export default function CoursesPage() {

  const {
    user,
    modalOpen,
    setModalOpen,
    searchTerm,
    setSearchTerm,
    filteredCourses,
    handleAddCourse,
    goToCourse,
    goToExams,
    goToMaterials,
  } = useCoursesPage();


  return (
    <>
      {user?.roles.includes("docente") ? (
        <PageTemplate
          title="Materias"
          subtitle="Revisa a detalle las materias que dictaste en algún momento."
          breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Materias" }]}
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
            <CreateCourseForm
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onSubmit={handleAddCourse}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <Space>
                <Input
                  placeholder="Buscar materia"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  style={{ minWidth: 120, maxWidth: 300, width: '100%' }}
                />
              </Space>
              {user?.roles.includes("docente") && (
                <Button type="primary" onClick={() => setModalOpen(true)}>
                  <PlusOutlined />
                  Registrar materia
                </Button>
              )}
            </div>

            {filteredCourses.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {filteredCourses.map((course) => (
                  <CustomCard
                    status="default"
                    style={{ marginBottom: "16px" }}
                    onClick={() => goToCourse(course.id)}
                    key={course.id}
                  >
                    <CustomCard.Header
                      icon={<SolutionOutlined />}
                      title={course.name}
                    />
                    <CustomCard.Description>
                      {`Vea a detalle los períodos que ha dictado en ${course.name}`}
                    </CustomCard.Description>
                    <CustomCard.Actions>
                      <Button
                        type="primary"
                        onClick={(e) => goToExams(course.id, e)}
                      >
                        Exámenes
                      </Button>
                      <Button
                        onClick={(e) => goToMaterials(course.id, e)}
                      >
                        Materiales
                      </Button>
                    </CustomCard.Actions>
                  </CustomCard>
                ))}
              </div>
            ) : (
              <Empty description="No hay materías todavía." />
            )}
          </div>
        </PageTemplate>
      ) : (
        <AccessDenied />
      )}
    </>
  );
}