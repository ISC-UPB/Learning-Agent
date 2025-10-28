import React from 'react';
import { Drawer } from 'antd';
import { palette } from '../../../theme';
import { DataSidebarHeader } from './DataSidebarHeader';
import { DataSidebarBody } from './DataSidebarBody';

interface DataSidebarMobileProps {
  visible: boolean;
  onClose: () => void;
  drawerHeight: number;
  onHandlePointerDown: (e: React.PointerEvent) => void;
  document: any;
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
  onRetryLoadData: () => void;
  onLoadIndexData: () => void;
  onGenerateIndex: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
  getStatusInSpanish: (status: string) => string;
}

export const DataSidebarMobile: React.FC<DataSidebarMobileProps> = ({
  visible,
  onClose,
  drawerHeight,
  onHandlePointerDown,
  document,
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
  onRetryLoadData,
  onLoadIndexData,
  onGenerateIndex,
  onCopyToClipboard,
  getStatusInSpanish
}) => {
  return (
    <Drawer
      open={visible}
      onClose={onClose}
      placement="bottom"
      height={drawerHeight}
      bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
      drawerStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '100vh' }}
      maskClosable
      closeIcon={null}
      headerStyle={{ display: 'none' }}
    >
      <div
        onPointerDown={onHandlePointerDown}
        style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 6, touchAction: 'none', cursor: 'ns-resize', userSelect: 'none' }}
      >
        <div style={{ width: 40, height: 6, borderRadius: 4, background: palette.neutral300 }} />
      </div>

      <DataSidebarHeader document={document} onClose={onClose} isMobile={true} />
      
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
        isMobile={true}
        onRetryLoadData={onRetryLoadData}
        onLoadIndexData={onLoadIndexData}
        onGenerateIndex={onGenerateIndex}
        onCopyToClipboard={onCopyToClipboard}
        getStatusInSpanish={getStatusInSpanish}
      />
    </Drawer>
  );
};