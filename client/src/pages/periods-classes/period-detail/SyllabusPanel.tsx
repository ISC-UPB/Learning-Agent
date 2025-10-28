import { Button, Empty } from "antd";

export default function SyllabusPanel() {
  return (
    <div style={{ textAlign: "center", padding: "64px" }}>
      <Empty description="Sílabo no disponible">
        <Button type="primary" disabled style={{ marginTop: 16 }}>
          Subir Sílabo
        </Button>
      </Empty>
    </div>
  );
}
