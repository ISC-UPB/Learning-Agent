import { Table, Modal, DatePicker, Radio } from 'antd';


import { type Props , useExamTable } from '../../hooks/useExamTable';


export default function ExamTable({ data, onDelete, disableStatusControls = true }: Props) {
  const {
    columns,
    handleConfirmPublish,
    publishOpen,
    publishMode,
    setPublishMode,
    setPublishOpen,
    scheduleAt,
    setScheduleAt,
    token,
  } = useExamTable({ onDelete, disableStatusControls });

  return (
    <>
      <Table
        rowKey="id"
        className="shadow-sm rounded-lg"
        style={{ background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}` ,padding:10 }}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        locale={{
          emptyText: 'Sin datos',
          triggerDesc: 'Ordenar descendente',
          triggerAsc: 'Ordenar ascendente',
          cancelSort: 'Quitar orden',
          sortTitle: 'Ordenar',
        }}
      />
      <Modal
        title="Publicación del examen"
        open={publishOpen}
        onOk={handleConfirmPublish}
        onCancel={() => setPublishOpen(false)}
        okText={publishMode === 'now' ? 'Publicar' : publishMode === 'schedule' ? 'Programar' : 'Guardar como borrador'}
        cancelText="Cancelar"
      >
        <Radio.Group value={publishMode} onChange={(e) => setPublishMode(e.target.value)} className="flex flex-col gap-2">
          <Radio value="now">Publicar ahora</Radio>
          <Radio value="schedule">Programar</Radio>
          <Radio value="draft">Borrador</Radio>
        </Radio.Group>
        {publishMode === 'schedule' && (
          <div className="mt-3">
            <DatePicker showTime style={{ width: '100%' }} value={scheduleAt as any} onChange={(d) => setScheduleAt(d)} />
          </div>
        )}
      </Modal>
    </>
  );
}