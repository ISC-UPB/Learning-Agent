import React from 'react';
import {theme as antTheme } from 'antd';
import {
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Tag,
  Tooltip,
  Button,
  Skeleton,
  Alert,
  Empty,
  Progress,
  Typography
} from 'antd';
import {
  ReloadOutlined,
  SyncOutlined,
  CopyOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { palette } from '../../../theme';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface DataSidebarBodyProps {
  extractedData: any;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  indexData: any;
  indexLoading: boolean;
  indexError: string | null;
  processedIndexItems: any[];
  indexStats: any;
  isDark: boolean;
  isMobile?: boolean;
  onRetryLoadData: () => void;
  onLoadIndexData: () => void;
  onGenerateIndex: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
  getStatusInSpanish: (status: string) => string;
}

export const DataSidebarBody: React.FC<DataSidebarBodyProps> = ({
  extractedData,
  isLoading,
  error,
  retryCount,
  activeTab,
  setActiveTab,
  indexData,
  indexLoading,
  indexError,
  processedIndexItems,
  indexStats,
  isDark,
  isMobile = false,
  onRetryLoadData,
  onLoadIndexData,
  onGenerateIndex,
  onCopyToClipboard,
  getStatusInSpanish
}) => {
  const { token } = antTheme.useToken();

  const renderMetadataTab = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title={<Title level={5}>Información del Archivo</Title>}>
        <Row gutter={[16, 16]}>
          <Col span={12}><Text strong>Título: </Text><Text>{extractedData.metadata.title || 'No disponible'}</Text></Col>
          <Col span={12}><Text strong>Autor: </Text><Text>{extractedData.metadata.author || 'No disponible'}</Text></Col>
          <Col span={8}><Text strong>Tipo: </Text><Text>{extractedData.metadata.fileType || 'N/A'}</Text></Col>
          <Col span={8}><Text strong>Tamaño: </Text><Text>{extractedData.metadata.size ? `${(extractedData.metadata.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</Text></Col>
          <Col span={8}><Text strong>Fecha: </Text><Text>{extractedData.metadata.uploadDate || 'N/A'}</Text></Col>
        </Row>
      </Card>

      <Card title={<Title level={5}>Estadísticas de Procesamiento</Title>}>
        <Row gutter={16}>
          <Col span={12}><Statistic title="Total de Chunks" value={extractedData.statistics.chunkCount} /></Col>
          <Col span={12}><Statistic title="Contenido Total (caracteres)" value={extractedData.statistics.totalContentLength || 0} formatter={(v) => (v as number).toLocaleString()} /></Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={8}><Statistic title="Chunk Promedio" value={extractedData.statistics.averageChunkSize || 0} formatter={(v) => (v as number).toLocaleString()} suffix="chars" /></Col>
          <Col span={8}><Statistic title="Chunk Mínimo" value={extractedData.statistics.minChunkSize || 0} formatter={(v) => (v as number).toLocaleString()} suffix="chars" /></Col>
          <Col span={8}><Statistic title="Chunk Máximo" value={extractedData.statistics.maxChunkSize || 0} formatter={(v) => (v as number).toLocaleString()} suffix="chars" /></Col>
        </Row>

        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>Distribución de Tamaños</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 12, minWidth: 60 }}>Mínimo</Text>
            <Progress percent={extractedData.statistics.minChunkSize && extractedData.statistics.maxChunkSize ? Math.round((extractedData.statistics.minChunkSize / extractedData.statistics.maxChunkSize) * 100) : 0} size="small" strokeColor={palette.red} style={{ flex: 1 }} format={() => `${extractedData.statistics.minChunkSize || 0}`} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Text style={{ fontSize: 12, minWidth: 60 }}>Promedio</Text>
            <Progress percent={extractedData.statistics.averageChunkSize && extractedData.statistics.maxChunkSize ? Math.round((extractedData.statistics.averageChunkSize / extractedData.statistics.maxChunkSize) * 100) : 0} size="small" strokeColor={palette.blue} style={{ flex: 1 }} format={() => `${Math.round(extractedData.statistics.averageChunkSize || 0)}`} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Text style={{ fontSize: 12, minWidth: 60 }}>Máximo</Text>
            <Progress percent={100} size="small" strokeColor={palette.green} style={{ flex: 1 }} format={() => `${extractedData.statistics.maxChunkSize || 0}`} />
          </div>
        </div>
      </Card>
    </Space>
  );

  const renderIndexTab = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {indexLoading && (
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      )}

      {indexError && !indexLoading && (
        <Alert
          message="Error con el índice del documento"
          description={
            <div>
              <p>{indexError}</p>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  • Verifica que el documento esté completamente procesado<br/>
                  • Algunos tipos de documento pueden no ser compatibles<br/>
                  • Si el problema persiste, contacta al administrador
                </Text>
              </div>
            </div>
          }
          type="error"
          showIcon
          action={
            <Space direction="vertical" size="small">
              <Button size="small" icon={<ReloadOutlined />} onClick={onLoadIndexData} loading={indexLoading}>
                Reintentar Carga
              </Button>
              <Button size="small" icon={<SyncOutlined />} onClick={onGenerateIndex} loading={indexLoading}>
                Generar Índice
              </Button>
            </Space>
          }
        />
      )}

      {(!indexData?.data?.chapters || indexData?.data?.chapters?.length === 0) && !indexLoading && !indexError && (
        <Card>
          <Empty 
            description="No se ha generado el índice para este documento"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button 
              type="primary" 
              icon={<SyncOutlined />} 
              onClick={onGenerateIndex}
              loading={indexLoading}
              size="large"
            >
              Generar Índice
            </Button>
          </div>
        </Card>
      )}

      {indexData?.data?.chapters && indexData?.data?.chapters?.length > 0 && !indexLoading && (
        <>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>
                Estructura del Documento ({indexStats.chapters} capítulos, {indexStats.subtopics} subtemas, {indexStats.exercises} ejercicios)
              </Title>
              <Button 
                icon={<SyncOutlined />} 
                onClick={onGenerateIndex}
                loading={indexLoading}
                size="small"
              >
                Regenerar
              </Button>
            </div>
            
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="Capítulos" 
                  value={indexStats.chapters} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Subtemas" 
                  value={indexStats.subtopics} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Ejercicios" 
                  value={indexStats.exercises} 
                />
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic 
                  title="Generado" 
                  value={indexData.data.generatedAt ? new Date(indexData.data.generatedAt).toLocaleDateString() : 'N/A'} 
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Estado" 
                  value={getStatusInSpanish(indexData.data.status || 'GENERATED')}
                />
              </Col>
            </Row>
          </Card>

          <Card title={<Title level={5}>Índice de Contenidos</Title>}>
            <div style={{ maxHeight: isMobile ? 300 : 400, overflowY: 'auto', paddingRight: 8 }}>
              {processedIndexItems.map((item: any, index: number) => (
                <div 
                  key={item.id || index}
                  style={{
                    paddingLeft: (item.level - 1) * 20,
                    marginBottom: 8,
                    borderBottom: `1px solid ${palette.neutral300}`,
                    paddingBottom: 8,
                    cursor: 'pointer',
                    borderRadius: 4,
                    padding: '8px 12px',
                    backgroundColor: isDark ? token.colorBgElevated : palette.neutral50,
                    border: `1px solid ${isDark ? token.colorBorder : palette.neutral300}`,
                  }}
                  onClick={() => item.description && onCopyToClipboard(item.description, `Contenido de ${item.type}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color={
                      item.type === 'chapter' ? 'blue' : 
                      item.type === 'subtopic' ? 'green' : 
                      item.type === 'CONCEPTUAL' ? 'orange' :
                      item.type === 'ANALYSIS' ? 'purple' :
                      'default'
                    }>
                      {item.type === 'chapter' ? 'Capítulo' : 
                       item.type === 'subtopic' ? 'Subtema' : 
                       item.type === 'CONCEPTUAL' ? 'Conceptual' :
                       item.type === 'PRACTICAL' ? 'Práctico' :
                       item.type === 'ANALYSIS' ? 'Análisis' :
                       item.type === 'APPLICATION' ? 'Aplicación' :
                       item.type === 'PROBLEM_SOLVING' ? 'Resolución' :
                       item.type || 'Ejercicio'}
                    </Tag>
                    <Text strong style={{ fontSize: isMobile ? 13 : 14, flex: 1 }}>
                      {item.title}
                    </Text>
                    {item.difficulty && (
                      <Tag color={
                        item.difficulty === 'BASIC' ? 'green' :
                        item.difficulty === 'INTERMEDIATE' ? 'orange' : 
                        item.difficulty === 'ADVANCED' ? 'red' :
                        'default'
                      } style={{ fontSize: isMobile ? 11 : 12 }}>
                        {item.difficulty === 'BASIC' ? 'Básico' :
                         item.difficulty === 'INTERMEDIATE' ? 'Intermedio' :
                         item.difficulty === 'ADVANCED' ? 'Avanzado' :
                         item.difficulty}
                      </Tag>
                    )}
                    {item.estimatedTime && (
                      <Tag color="cyan" style={{ fontSize: isMobile ? 11 : 12 }}>
                        {item.estimatedTime}
                      </Tag>
                    )}
                    <Tooltip title="Copiar descripción">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<CopyOutlined />}
                      />
                    </Tooltip>
                  </div>
                  
                  {item.description && (
                    <Paragraph 
                      style={{ 
                        marginTop: 8, 
                        marginBottom: 0,
                        fontSize: isMobile ? 12 : 13,
                        color: isDark ? token.colorTextSecondary : palette.neutral600,
                      }}
                      ellipsis={{ 
                        rows: 2, 
                        expandable: true, 
                        symbol: 'ver más' 
                      }}
                    >
                      {item.description}
                    </Paragraph>
                  )}
                  
                  {item.keywords && item.keywords.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 12, color: isDark ? token.colorTextSecondary : palette.neutral500 }}>
                        Palabras clave:
                      </Text>
                      {item.keywords.map((keyword: string, kIndex: number) => (
                        <Tag key={kIndex} color="geekblue" style={{ fontSize: 11 }}>
                          {keyword}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </Space>
  );

  const renderEmptyState = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: palette.neutral500, padding: 20, textAlign: 'center' }}>
      <Space direction="vertical">
        <FileTextOutlined style={{ fontSize: 48, color: palette.neutral300 }} />
        <Text style={{ fontSize: 16 }}>Selecciona un documento para ver sus datos</Text>
        <Text type="secondary" style={{ fontSize: 14 }}>Usa el botón "Datos" en la tabla de documentos</Text>
      </Space>
    </div>
  );

  const renderLoadingState = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card><Skeleton active paragraph={{ rows: 3 }} /></Card>
      <Card><Skeleton active paragraph={{ rows: 2 }} /></Card>
      <Card>
        <Skeleton.Button active style={{ width: 200, height: 40 }} />
        <Skeleton active paragraph={{ rows: 4, style: { marginTop: 16 } }} />
      </Card>
    </Space>
  );

  const renderErrorState = () => (
    <Alert
      message="Error al cargar datos"
      description={<Space direction="vertical" style={{ width: '100%' }}><Text>{error}</Text>{retryCount > 0 && <Text type="secondary">Intentos de recarga: {retryCount}</Text>}</Space>}
      type="error"
      showIcon
      action={<Button size="small" icon={<ReloadOutlined />} onClick={onRetryLoadData} loading={isLoading}>Reintentar</Button>}
      style={{ marginBottom: 16 }}
    />
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 16, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {isLoading && renderLoadingState()}
        {error && renderErrorState()}
        
        {extractedData && !isLoading && !error && (
          <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarStyle={{ padding: 0, marginBottom: 8 }}>
            <TabPane tab="Metadatos" key="metadata">
              {renderMetadataTab()}
            </TabPane>
            <TabPane tab="Índice" key="index">
              {renderIndexTab()}
            </TabPane>
          </Tabs>
        )}

        {!extractedData && !isLoading && !error && renderEmptyState()}
      </div>
    </div>
  );
};