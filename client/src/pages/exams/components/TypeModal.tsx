import { Modal, Radio } from 'antd';
import type { GeneratedQuestion } from '../../../services/exams.service';

type Props = {
  open: boolean;
  typeChoice: GeneratedQuestion['type'];
  onChange: (type: GeneratedQuestion['type']) => void;
  onOk: () => void;
  onCancel: () => void;
};

export default function TypeModal({
  open,
  typeChoice,
  onChange,
  onOk,
  onCancel,
}: Props) {
  return (
    <Modal
      title="Añadir pregunta manual"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Añadir"
      cancelText="Cancelar"
    >
      <Radio.Group
        value={typeChoice}
        onChange={(e) => onChange(e.target.value)}
        className="flex flex-col gap-2"
      >
        <Radio value="multiple_choice">Selección múltiple</Radio>
        <Radio value="true_false">Verdadero/Falso</Radio>
        <Radio value="open_analysis">Análisis abierto</Radio>
        <Radio value="open_exercise">Ejercicio abierto</Radio>
      </Radio.Group>
    </Modal>
  );
}
