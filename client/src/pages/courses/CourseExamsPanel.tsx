import { Button, Typography, Empty } from 'antd';
import { deleteExamAny} from '../../services/exams.service';
import ExamTable from '../../components/exams/ExamTable';
import InlineExamCreator from '../exams/InlineExamCreator.tsx';
import { useCourseExamsPanel } from '../../hooks/useCourseExamsPanel.ts';
const { Title, Text } = Typography;

type Props = {
  courseId: string; 
  classId: string;  
};



export default function CourseExamsPanel({ courseId, classId }: Props) {
  const { tableData,
        loading,
        createOpen,
        fetchList,
        setCreateOpen, } = useCourseExamsPanel(courseId, classId);
  
  const Header = (
    <div className="flex items-center justify-between mb-2">
      <Title level={4} style={{ margin: 0 }}>Exámenes de esta materia</Title>
      <Button type="primary" onClick={() => setCreateOpen(true)}>
        Crear examen
      </Button>
    </div>
  );

  if (loading && tableData.length === 0) return <div className="mt-4">{Header}</div>;

  return (
    <div className="mt-4">
      {Header}
      {createOpen && (
        <div style={{ marginBottom: 16 }}>
          <InlineExamCreator
            classId={classId}
            courseId={courseId}
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              fetchList();
            }}
          />
        </div>
      )}

      {tableData.length > 0 ? (
        <div id="tabla-examenes-curso">
          <ExamTable
            data={tableData}
            disableStatusControls
            onEdit={() => setCreateOpen(true)}
            onDelete={async (id) => {
              await deleteExamAny(id);
              fetchList();
            }}
          />
        </div>
      ) : (
        !createOpen && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Empty description="Aún no hay exámenes para este curso">
            <Text style={{ fontSize: 14 }}>Los exámenes creados aparecerán aquí para su gestión.</Text>
            </Empty>
          </div>
        )
      )}
    </div>
  );
}