import { Tabs, Typography, Empty, Button } from "antd";
import { FileTextOutlined, UserOutlined, BookOutlined } from "@ant-design/icons";
import GlobalScrollbar from "../../components/GlobalScrollbar";
import PageTemplate from "../../components/PageTemplate";

import { usePeriodDetail } from "./period-detail/usePeriodDetail";
import PeriodHeaderActions from "./period-detail/PeriodHeaderActions";
import GeneralInfoPanel from "./period-detail/GeneralInfoPanel";
import StudentsTable from "./period-detail/StudentsTable";
import StudentsActionsBar from "./period-detail/StudentsActionsBar";
import ExamsPanelProxy from "./period-detail/ExamsPanelProxy";
import SyllabusPanel from "./period-detail/SyllabusPanel";
import ModalsContainer from "./period-detail/ModalsContainer";
import UploadButton from "../../components/shared/UploadButton";

const { Text } = Typography;
const { TabPane } = Tabs;

export default function PeriodDetailPage() {
  const h = usePeriodDetail();

  if (h.loading) {
    return (
      <PageTemplate
        title="Cargando..."
        subtitle="Cargando información del curso"
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Materias", href: "/professor/courses" },
          { label: "Cargando..." },
        ]}
      >
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Text>Cargando datos del curso...</Text>
        </div>
      </PageTemplate>
    );
  }

  if (!h.actualClass) {
    return (
      <PageTemplate
        title="Curso no encontrado"
        subtitle="El curso solicitado no existe"
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Materias", href: "/professor/courses" },
          { label: "Curso no encontrado" },
        ]}
      >
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Empty description="Curso no encontrado" />
          <Button type="primary" onClick={() => h.navigate("/professor/courses")}>
            Volver a Materias
          </Button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={h.actualClass.name}
      subtitle={h.todayLabel}
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Materias", href: "/professor/courses" },
        { label: h.actualCourse?.name || "Materia", href: `/professor/courses/${h.courseId}/periods` },
        { label: h.actualClass.name },
      ]}
      actions={
        <PeriodHeaderActions
          onDocs={() => h.navigate(`documents`)}
          onEdit={() => h.setEditModalOpen(true)}
          onDelete={h.handleDeletePeriod}
        />
      }
    >
      <GlobalScrollbar />
      <div style={{ padding: "1rem" }}>
        <div style={{ height: 1, marginBottom: 8 }} />
        <div style={{ borderRadius: 12, overflow: "hidden" }}>
          <Tabs defaultActiveKey="general" size="large" style={{ paddingLeft: 16 }}>
            <TabPane
              tab={
                <span style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                  <FileTextOutlined style={{ marginRight: 6, fontSize: 14 }} />
                  <span>Información General</span>
                </span>
              }
              key="general"
            >
              <GeneralInfoPanel
                name={h.actualClass.name}
                semester={h.actualClass.semester}
                dateBegin={h.actualClass.dateBegin}
                dateEnd={h.actualClass.dateEnd}
                teacherLabel={
                  h.teacherInfo
                    ? `${h.teacherInfo.name} ${h.teacherInfo.lastname}`
                    : h.actualClass.teacherId
                    ? "Cargando..."
                    : "No asignado"
                }
              />
            </TabPane>

            <TabPane
              tab={
                <span style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                  <UserOutlined style={{ marginRight: 6, fontSize: 14 }} />
                  <span>Estudiantes</span>
                </span>
              }
              key="students"
            >
              <div style={{ padding: 32 }}>
                {h.hasStudents ? (
                  <>
                    <StudentsTable
                      hasStudents={h.hasStudents}
                      students={h.students || []}
                      columns={h.studentsColumns}
                      onDeleteOne={h.handleSingleEnrollmentDeleteWarning}
                    />
                    <StudentsActionsBar
                      onAddOne={() => h.setSingleStudentFormOpen(true)}
                      onOpenAttendance={() => h.setAttendanceModalOpen(true)}
                      processFile={
                        h.processFile as unknown as (
                          file: File,
                          onProgress: (p: number) => void
                        ) => Promise<any[]>
                      }
                      onUploadSuccess={(students) => {
                        if (Array.isArray(students)) {
                          h.setParsedStudents(students);
                          h.setFileName("archivo.xlsx");
                          const seen = new Set<string>();
                          const dupSet = new Set<string>();
                          for (const s of students) {
                            const k = String((s as any).codigo || "").trim().toLowerCase();
                            if (!k) continue;
                            if (seen.has(k)) dupSet.add(String((s as any).codigo));
                            else seen.add(k);
                          }
                          h.setDuplicates(Array.from(dupSet));
                          h.setPreviewModalOpen(true);
                        }
                      }}
                    />
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem" }}>
                    <Empty description="No hay estudiantes inscritos en este curso">
                      <div style={{ marginTop: 24 }}>
                        <UploadButton
                          buttonConfig={{ variant: "fill", className: "color: white ", size: "large" }}
                          onUpload={async (file, onProgress) => h.processFile(file as any, onProgress)}
                          fileConfig={{
                            accept: ".csv,.xlsx,.xls",
                            maxSize: 1 * 1024 * 1024,
                            validationMessage: "Solo se permiten archivos .xlsx o .csv de hasta 1MB",
                          }}
                          processingConfig={{
                            steps: [
                              { key: "upload", title: "Subir archivo", description: "Subiendo archivo" },
                              { key: "parse", title: "Parsear datos", description: "Procesando información" },
                            ],
                            processingText: "Procesando tabla...",
                            successText: "Tabla procesada correctamente",
                          }}
                          onUploadSuccess={(students) => {
                            if (Array.isArray(students)) {
                              h.setParsedStudents(students);
                              h.setFileName("archivo.xlsx");
                              const seen = new Set<string>();
                              const dupSet = new Set<string>();
                              for (const s of students) {
                                const k = String((s as any).codigo || "").trim().toLowerCase();
                                if (!k) continue;
                                if (seen.has(k)) dupSet.add(String((s as any).codigo));
                                else seen.add(k);
                              }
                              h.setDuplicates(Array.from(dupSet));
                              h.setPreviewModalOpen(true);
                            }
                          }}
                        />
                      </div>
                    </Empty>
                  </div>
                )}
              </div>
            </TabPane>

            <TabPane
              tab={
                <span style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                  <BookOutlined style={{ marginRight: 6, fontSize: 14 }} />
                  <span>Gestión de Exámenes</span>
                </span>
              }
              key="exams"
            >
              <div style={{ padding: 32 }}>
                {h.courseId && h.id && <ExamsPanelProxy courseId={h.courseId} classId={h.id} />}
              </div>
            </TabPane>

            <TabPane
              tab={
                <span style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                  <FileTextOutlined style={{ marginRight: 6, fontSize: 14 }} />
                  <span>Sílabo</span>
                </span>
              }
              key="syllabus"
            >
              <SyllabusPanel />
            </TabPane>
          </Tabs>
        </div>
      </div>

      <ModalsContainer
        period={h.actualClass}
        course={h.actualCourse}
        students={h.students as any[]}
        classId={h.id || ""}
        selectedStudent={h.selectedStudent}
        editModalOpen={h.editModalOpen}
        onCloseEdit={() => h.setEditModalOpen(false)}
        onSubmitEdit={h.handleEditClass}
        safetyModalOpen={h.safetyModalOpen}
        onCancelSafety={() => h.setSafetyModalOpen(false)}
        onConfirmSafety={h.safetyModalConfig.onConfirm}
        safetyTitle={h.safetyModalConfig.title}
        safetyMessage={h.safetyModalConfig.message}
        singleStudentFormOpen={h.singleStudentFormOpen}
        onCloseSingle={() => h.setSingleStudentFormOpen(false)}
        onSubmitSingle={async (values) => {
          if (!h.id) return;
          const data = { ...values, classId: h.id };
          await h.handleEnrollStudent(data);
        }}
        previewModalOpen={h.previewModalOpen}
        onCancelPreview={() => h.setPreviewModalOpen(false)}
        onConfirmGroup={h.handleGroupEnrollment}
        parsedStudents={h.parsedStudents}
        duplicates={h.duplicates}
        meta={{ fileName: h.fileName, totalRows: h.parsedStudents.length }}
        sending={h.sending}
        attendanceModalOpen={h.attendanceModalOpen}
        onCloseAttendance={() => h.setAttendanceModalOpen(false)}
        onSubmitAttendance={() => h.fetchAbsences()}
        absencesModalOpen={h.absencesModalOpen}
        onCloseAbsences={() => h.setAbsencesModalOpen(false)}
      />
    </PageTemplate>
  );
}
