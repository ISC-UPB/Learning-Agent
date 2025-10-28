import React from "react";
import { Card, Row, Col } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import PageTemplate from "../../components/PageTemplate";
import ChunkedUploadButton from "../../components/shared/ChunkedUploadButton";
import { DocumentTable } from "../../components/documents/DocumentTable";
import { PdfPreviewSidebar } from "../../components/documents/PdfPreviewSidebar";
import { DocumentDataSidebar } from "../../components/documents/DocumentDataSidebar";
import { useUploadDocumentPage } from "../../hooks/useUploadDocumentPage";
import { palette } from "../../theme";

const UploadDocumentPage: React.FC = () => {
  const {
    // Estados
    refreshing,
    previewSidebarVisible,
    documentToPreview,
    dataSidebarVisible,
    documentToViewData,
    
    // Datos
    documents,
    loading,
    
    // Configuraciones y variables derivadas
    isStudent,
    isDark,
    isSmallScreen,
    isMobileScreen,
    sidebarWidth,
    contentMaxWidth,
    pageTitle,
    containerPadding,
    fileConfig,
    processingConfig,
    
    // Funciones
    getBreadcrumbs,
    handleUploadSuccess,
    handleDownload,
    handleDeleteSuccess,
    handleDeleteError,
    handleViewData,
    handleCloseDataSidebar,
    handleCloseSidebar,
    handlePreview,
    deleteDocument,
    
    // Otros
    processDocumentComplete,
    courseId,
    id,
    token
  } = useUploadDocumentPage();

  return (
    <div style={{ 
      position: "relative", 
      width: "100%", 
      height: "100vh", 
      display: "flex",
      overflow: "hidden" 
    }}>
      <div style={{ 
        width: contentMaxWidth,
        transition: "width 0.3s ease-in-out",
        minWidth: 0,
        overflow: "auto",
        height: "100%",
        flex: "0 0 auto" 
      }}>
      <PageTemplate
        title={pageTitle}
        subtitle="Sistema de carga y gestión de material educativo PDF"
        breadcrumbs={getBreadcrumbs()}>
        <div style={{
          padding: containerPadding,
          width: "100%",
          margin: "0",
          maxWidth: "none" 
        }}>
          {/* Documents Table Section */}
          <Row>
            <Col xs={24}>
              <Card
                title={
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: isDark ? token.colorText : palette.P0,
                    width: "100%",
                    minWidth: 0,
                    gap: isSmallScreen ? "12px" : "16px",
                    flexWrap: isSmallScreen ? "nowrap" : "nowrap"
                  }}>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center",
                      minWidth: 0,
                      flex: "1 1 auto",
                      overflow: "hidden"
                    }}>
                      <FileTextOutlined style={{ 
                        marginRight: "8px", 
                        fontSize: isSmallScreen ? "14px" : "20px",
                        flexShrink: 0 
                      }} />
                      <span style={{ 
                        fontSize: isSmallScreen ? "14px" : "18px", 
                        fontWeight: "500",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {isSmallScreen ? "Repositorio" : "Repositorio de Documentos"}
                      </span>
                      <div style={{
                        marginLeft: "12px",
                        backgroundColor: documents.length > 0 
                          ? (isDark ? token.colorPrimaryBg : palette.lightBlue) 
                          : (isDark ? token.colorBgTextHover : palette.neutral100),
                        color: documents.length > 0 
                          ? (isDark ? token.colorPrimary : palette.purple) 
                          : (isDark ? token.colorTextSecondary : palette.neutral600),
                        padding: isSmallScreen ? "2px 8px" : "4px 10px",
                        borderRadius: isSmallScreen ? "10px" : "16px",
                        fontSize: isSmallScreen ? "10px" : "12px",
                        fontWeight: "500",
                        transition: "all 0.3s ease",
                        flexShrink: 0,
                        whiteSpace: "nowrap"
                      }}>
                        {loading || refreshing ? (isSmallScreen ? "..." : "Actualizando...") : (isSmallScreen ? `${documents.length}` : `${documents.length} documento${documents.length !== 1 ? 's' : ''}`)}
                      </div>
                    </div>

                    {!isStudent && (
                      <div style={{ 
                        flexShrink: 0,
                        minWidth: "fit-content",
                        paddingTop: isSmallScreen ? '6px' : '4px'
                      }}>
                        <ChunkedUploadButton
                          fileConfig={fileConfig}
                          processingConfig={processingConfig}
                          buttonConfig={{
                            showText: !isMobileScreen,
                            variant: "fill",
                            size: isMobileScreen ? "small" : "middle",
                            shape: "default"
                          }}
                          modalConfig={{
                            title: "Subir Nuevo Documento",
                            width: isMobileScreen ? (typeof window !== 'undefined' ? window.innerWidth * 0.9 : 600) : 600
                          }}
                          onPostUploadProcess={processDocumentComplete}
                          onUploadSuccess={handleUploadSuccess}
                          courseId={courseId}
                          classId={id}
                        />
                      </div>
                    )}
                  </div>
                }
                style={{
                  borderRadius: "12px",
                  boxShadow: isDark 
                    ? "0 4px 16px rgba(91, 110, 240, 0.1)" 
                    : "0 4px 16px rgba(26, 42, 128, 0.1)",
                  border: `1px solid ${isDark ? token.colorBorder : palette.neutral200}`,
                  backgroundColor: isDark ? token.colorBgContainer : palette.white,
                  width: "100%",
                  minWidth: 0,
                  overflow: "hidden"
                }}
              >
                <DocumentTable
                  key={`documents-table-${documents.length}`}
                  documents={documents}
                  loading={loading || refreshing}
                  onDownload={handleDownload}
                  onDelete={deleteDocument}
                  onPreview={handlePreview}
                  onViewData={handleViewData}
                  onDeleteSuccess={handleDeleteSuccess}
                  onDeleteError={handleDeleteError}
                  isStudent={isStudent}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </PageTemplate>
      </div>

      {/* PDF preview sidebar */}
      <PdfPreviewSidebar
        document={documentToPreview}
        visible={previewSidebarVisible}
        onClose={handleCloseSidebar}
        sidebarWidth={sidebarWidth}
      />

      {/* Document data sidebar */}
      <DocumentDataSidebar
        document={documentToViewData}
        visible={dataSidebarVisible}
        onClose={handleCloseDataSidebar}
      />
    </div>
  );
};

export default UploadDocumentPage;