import React from 'react';
import { Grid, theme as antTheme } from 'antd';
import { useDocumentDataSidebar } from '../../hooks/useDocumentDataSidebar';
import { DataSidebarHeader } from './dataSidebar/DataSidebarHeader';
import { DataSidebarBody } from './dataSidebar/DataSidebarBody';
import { DataSidebarMobile } from './dataSidebar/DataSidebarMobile';
import { palette } from '../../theme';

const { useBreakpoint } = Grid;
const { useToken } = antTheme;

interface DocumentDataSidebarProps {
  document: any;
  onClose: () => void;
  visible: boolean;
}

export const DocumentDataSidebar: React.FC<DocumentDataSidebarProps> = ({ 
  document, 
  onClose, 
  visible 
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { token } = useToken();

  // Usar el custom hook para toda la lógica
  const {
    extractedData,
    activeTab,
    setActiveTab,
    retryCount,
    indexData,
    indexLoading,
    indexError,
    isLoading,
    error,
    processedIndexItems,
    indexStats,
    drawerHeight,
    loadIndexData,
    handleGenerateIndex,
    copyToClipboard,
    retryLoadData,
    onHandlePointerDown,
    getStatusInSpanish,
    isDark
  } = useDocumentDataSidebar(document, visible);

  // Versión móvil
  if (isMobile) {
    return (
      <DataSidebarMobile
        visible={visible}
        onClose={onClose}
        drawerHeight={drawerHeight}
        onHandlePointerDown={onHandlePointerDown}
        document={document}
        extractedData={extractedData}
        isLoading={isLoading}
        error={error}
        retryCount={retryCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        indexData={indexData}
        indexLoading={indexLoading}
        indexError={indexError}
        processedIndexItems={processedIndexItems}
        indexStats={indexStats}
        isDark={isDark}
        onRetryLoadData={retryLoadData}
        onLoadIndexData={loadIndexData}
        onGenerateIndex={handleGenerateIndex}
        onCopyToClipboard={copyToClipboard}
        getStatusInSpanish={getStatusInSpanish}
      />
    );
  }

  // Versión desktop
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        height: '100vh',
        backgroundColor: isDark ? token.colorBgContainer : palette.white,
        boxShadow: isDark ? '-4px 0 20px rgba(91, 110, 240, 0.1)' : '-4px 0 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${isDark ? token.colorBorder : palette.neutral200}`,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        transition: 'transform 0.28s ease-in-out, opacity 0.28s ease-in-out, visibility 0.28s ease-in-out',
      }}
    >
      <DataSidebarHeader document={document} onClose={onClose} />
      
      <DataSidebarBody
        extractedData={extractedData}
        isLoading={isLoading}
        error={error}
        retryCount={retryCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        indexData={indexData}
        indexLoading={indexLoading}
        indexError={indexError}
        processedIndexItems={processedIndexItems}
        indexStats={indexStats}
        isDark={isDark}
        onRetryLoadData={retryLoadData}
        onLoadIndexData={loadIndexData}
        onGenerateIndex={handleGenerateIndex}
        onCopyToClipboard={copyToClipboard}
        getStatusInSpanish={getStatusInSpanish}
      />
    </div>
  );
};