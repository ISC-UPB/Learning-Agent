import ExamTable from '../../../../../components/exams/ExamTable';

type Props = {
  data: any[];
  onEdit?: () => void; 
};

export default function ExamsTableWrapper({ data, onEdit }: Props) {
  return <ExamTable data={data} {...(onEdit ? { onEdit } : {})} />;
}
