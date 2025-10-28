export const ChatMessage: React.FC<{ text: string; isUser: boolean; token: any }> = ({ text, isUser, token }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: token.marginMD,
    }}
  >
    <div
      style={{
        padding: `${token.paddingSM + 2}px ${token.paddingLG}px`,
        borderRadius: token.borderRadiusLG,
        maxWidth: '75%',
        backgroundColor: isUser ? token.colorPrimary : token.colorBgContainer,
        color: isUser ? token.colorTextLightSolid : token.colorText,
        boxShadow: token.boxShadow,
        fontSize: token.fontSize,
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
    >
      {text}
    </div>
  </div>
);