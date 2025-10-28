import PageTemplate from '../../../components/PageTemplate';
import GlobalScrollbar from '../../../components/GlobalScrollbar';
import useExamManagement from './management/useExamManagement';
import StatsCards from './management/components/StatsCards';
import ExamsTableWrapper from './management/components/ExamsTable';

export default function ExamManagementPage() {
  const {
    exams,
    total,
    published,
    scheduled,
    breadcrumbs,
    onEdit,
  } = useExamManagement();

  return (
    <PageTemplate
      title="Exámenes"
      subtitle="Gestiona todos los exámenes que creaste"
      breadcrumbs={breadcrumbs}
    >
      <GlobalScrollbar />

      <StatsCards total={total} published={published} scheduled={scheduled} />

      <div id="tabla-examenes" style={{ marginTop: 24 }}>
        <ExamsTableWrapper data={exams} />
      </div>

      <div id="tabla-examenes">
        <ExamsTableWrapper data={exams} onEdit={onEdit} />
      </div>

      <div id="fin-examenes" />
    </PageTemplate>
  );
}
