import React from "react";
import { Typography, Space, Row, Col, theme } from "antd";
import { LineChartOutlined } from "@ant-design/icons";
import { CustomCard } from "../../components/shared/CustomCard";
import { useProgressData } from "../../hooks/useReinforcementData";

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const effectiveWidth = 300;
  const effectiveHeight = 120;
  const padding = 20;
  const W = effectiveWidth - padding * 2;
  const H = effectiveHeight - padding * 2;
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * W;
    const y = padding + (1 - v / 100) * H;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => (i ? `L${x},${y}` : `M${x},${y}`)).join(" ");
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={path} fill="none" stroke={color} strokeWidth={3} />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill={color} />
      ))}
    </svg>
  );
};

export const ProgressCard: React.FC = () => {
  const { token } = theme.useToken();
  const { subjectName, lastExamDate, successRate, lastExamScore, trendData } = useProgressData();
  return (
    <div style={{ width: "100%", padding: token.padding }}>
      <CustomCard
        style={{
          width: "100%",
          maxWidth: "1038px",
          margin: "0 auto",
        }}
        className="transition-all duration-300 ease-in-out hover:transform hover:-translate-y-2 hover:shadow-2xl"
      >
        <CustomCard.Header
          icon={<LineChartOutlined style={{ color: token.colorPrimary }} />}
          title={
            <Typography.Text
              strong
              style={{
                color: token.colorPrimary,
                fontSize: token.fontSizeLG * 1.2,
              }}
            >
              {subjectName}
            </Typography.Text>
          }
        />
        <CustomCard.Description>
          <Typography.Text style={{ color: token.colorTextSecondary }}>
            Último examen: {lastExamDate}
          </Typography.Text>
        </CustomCard.Description>
        <CustomCard.Body>
          <Row gutter={[token.margin, token.margin]} align="middle">
            <Col
              xs={24}
              md={14}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Space direction="vertical" size="small">
                <Typography.Text
                  strong
                  style={{
                    color: token.colorPrimary,
                    fontSize: token.fontSizeLG * 1.2,
                  }}
                >
                  Tasa de éxito: {successRate}%
                </Typography.Text>
                <Typography.Text
                  style={{
                    color: token.colorPrimary,
                    fontSize: token.fontSizeLG * 1.2,
                  }}
                >
                  Nota último examen: {lastExamScore}
                </Typography.Text>
              </Space>
            </Col>
            <Col
              xs={24}
              md={10}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: "100%", maxWidth: 300, height: 120 }}>
                <Sparkline data={trendData} color={token.colorInfo} />
              </div>
            </Col>
          </Row>
        </CustomCard.Body>
      </CustomCard>
    </div>
  );
};
