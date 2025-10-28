import { theme } from 'antd';

export const useDeleteStyles = () => {
  const { token } = theme.useToken();
  
  return {
    modal: {
      body: {
        padding: `${token.paddingLG}px`,
      }
    },
    
    modalHeader: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      color: token.colorError,
      padding: `${token.paddingXS}px 0`
    },
    
    mainIcon: {
      fontSize: '48px',
      color: token.colorError,
      marginBottom: token.marginLG,
      display: 'flex' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const
    },
    
    message: {
      marginBottom: token.marginLG,
      fontSize: '16px',
      color: token.colorText,
      lineHeight: '1.5'
    },
    
    resourceContainer: {
      backgroundColor: token.colorWarningBg,
      border: `1px solid ${token.colorWarningBorder}`,
      borderRadius: token.borderRadius,
      padding: token.paddingLG,
      marginTop: token.marginLG,
      textAlign: 'left' as const
    },
    
    resourceHeader: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      marginBottom: token.marginXS
    },
    
    resourceIcon: {
      color: token.colorWarning,
      fontSize: '16px'
    },
    
    resourceName: {
      color: token.colorWarning,
      fontSize: '14px',
      marginLeft: token.marginXS
    },
    
    resourceType: {
      fontSize: '12px',
      marginLeft: token.marginXS,
      color: token.colorWarningText
    },
    
    additionalInfo: {
      marginTop: token.marginXS,
      fontSize: '12px',
      color: token.colorWarningText
    },
    
    warningMessage: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      marginTop: token.marginXS
    },
    
    warningIcon: {
      color: token.colorWarning,
      marginRight: token.marginXXS,
      fontSize: '12px'
    },
    
    warningText: {
      fontSize: '12px',
      fontStyle: 'italic' as const,
      color: token.colorWarningText
    }
  };
};

export const BASE_STYLES = {
  textAlignCenter: {
    textAlign: 'center' as const
  }
} as const;