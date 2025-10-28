import { Input, Space, Empty } from "antd";
import { SolutionOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import AccessDenied from "../../../components/shared/AccessDenied";
import CustomCard from "../../../components/shared/CustomCard";
import PageTemplate from "../../../components/PageTemplate";
import { useStudentClasses } from "../../../hooks/useStudentClasses";

export default function StudentClasses() {
  const {
    searchTerm,
    setSearchTerm,
    filteredClasses,
    user,
    goToReinforcement,
  } = useStudentClasses();

  return (
    <>
      {user?.roles.includes("estudiante") ? (
        <PageTemplate
          title="Clases"
          subtitle="Consulta a detalle información acerca de las clases en las que te inscribiste"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Clases" }]}
        >
          <div
            className="w-full lg:max-w-6xl lg:mx-auto space-y-4 sm:space-y-6"
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "24px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <Space>
                <Input
                  placeholder="Search course"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  style={{ width: 240 }}
                />
              </Space>
            </div>

            {filteredClasses.length > 0 ? (
              <>{filteredClasses.map((objClass) => (
                <CustomCard
                  status="default"
                  style={{ marginBottom: "16px" }}
                  onClick={() => goToReinforcement(objClass.id)}
                  key={objClass.id}
                >
                  <CustomCard.Header
                    icon={<SolutionOutlined />}
                    title={objClass.name}
                  />
                  <CustomCard.Description>
                    {`Consulta y mejora tu progreso en ${objClass.name} empleando recursos interactivos.`}
                  </CustomCard.Description>
                  <CustomCard.Body>
                    <div style={{ marginBottom: "2px" }}>
                      Inicio: {dayjs(objClass.dateBegin).format("DD/MM/YYYY")}
                    </div>
                    <div>
                      Fin: {dayjs(objClass.dateEnd).format("DD/MM/YYYY")}
                    </div>
                  </CustomCard.Body>
                </CustomCard>
              ))}</>
            ) : (
              <Empty description="Todavía no te encuentras inscrito en ninguna clase." />
            )}
          </div>
        </PageTemplate>
      ) : (
        <AccessDenied />
      )}
    </>
  );
}
