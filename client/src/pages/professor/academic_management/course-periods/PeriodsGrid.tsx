import { ReadOutlined } from "@ant-design/icons";
import { Empty } from "antd";
import dayjs from "dayjs";
import type { Clase } from "../../../../interfaces/claseInterface";
import CustomCard from "../../../../components/shared/CustomCard";

interface PeriodsGridProps {
  periods: Clase[];
  onPeriodClick: (periodId: string) => void;
}

export function PeriodsGrid({ periods, onPeriodClick }: PeriodsGridProps) {
  if (periods.length === 0) {
    return (
      <Empty
        description="No hay períodos creados para esta materia"
        style={{
          margin: "40px 0",
          padding: "20px",
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 min-[1000px]:grid-cols-2 min-[1367px]:grid-cols-3 gap-4 md:gap-6">
      {periods.map((period) => (
        <div key={period.id}>
          <CustomCard
            status="default"
            onClick={() => onPeriodClick(period.id)}
            style={{ width: '100%' }}
          >
            <CustomCard.Header
              icon={<ReadOutlined />}
              title={period.semester}
            />
            <CustomCard.Description>
              {`Consulte la información de ${period.name}`}
            </CustomCard.Description>
            <CustomCard.Body>
              <div style={{ marginBottom: "2px" }}>
                Inicio: {dayjs(period.dateBegin).format("DD/MM/YYYY")}
              </div>
              <div>
                Fin: {dayjs(period.dateEnd).format("DD/MM/YYYY")}
              </div>
            </CustomCard.Body>
          </CustomCard>
        </div>
      ))}
    </div>
  );
}