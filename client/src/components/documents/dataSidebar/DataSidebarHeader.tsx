import React from 'react';
import { Button, Typography, theme as antTheme } from 'antd';
import { FileTextOutlined, CloseOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../../store/themeStore';
import { palette } from '../../../theme';

const { Title, Text } = Typography;

interface DataSidebarHeaderProps {
  document: any;
  onClose: () => void;
  isMobile?: boolean;
}

export const DataSidebarHeader: React.FC<DataSidebarHeaderProps> = ({ 
  document, 
  onClose, 
  isMobile = false 
}) => {
  const theme = useThemeStore((state: { theme: string }) => state.theme);
  const isDark = theme === "dark";
  const { token } = antTheme.useToken();

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${isDark ? token.colorBorder : palette.neutral200}`,
        backgroundColor: isDark ? token.colorBgElevated : palette.neutral50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <FileTextOutlined style={{ color: isDark ? token.colorPrimary : palette.P0, fontSize: 18, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <Title level={5} style={{ margin: 0, color: isDark ? token.colorPrimary : palette.P0 }}>
            Datos del Documento
          </Title>
          {document && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', maxWidth: isMobile ? 200 : 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {document.originalName}
            </Text>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={onClose} 
          style={{ color: palette.neutral600, fontSize: 16, padding: 6 }} 
        />
      </div>
    </div>
  );
};