import { Input, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";


interface SearchHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  showCreateButton?: boolean;
}

export function SearchHeader({
  searchTerm,
  onSearchChange,
  onCreateClick,
  showCreateButton = true,
}: SearchHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div>
        <Input
          placeholder="Buscar período"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          style={{
            minWidth: 120,
            maxWidth: 300,
            width: '100%',
            borderRadius: 8,
          }}
          className="placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>
      {showCreateButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreateClick}
          style={{
            borderRadius: 8,
            fontWeight: "500",
          }}
        >
          Crear Período
        </Button>
      )}
    </div>
  );
}
