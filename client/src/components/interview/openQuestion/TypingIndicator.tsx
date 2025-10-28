export const TypingIndicator: React.FC<{ token: any }> = ({ token }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: token.sizeMD / 3,
      padding: token.paddingSM,
      borderRadius: token.borderRadiusLG,
      backgroundColor: token.colorBgContainer,
      boxShadow: token.boxShadow,
      maxWidth: 'fit-content',
    }}
  >
    {[0, 0.2, 0.4].map((delay, i) => (
      <div
        key={i}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: token.colorPrimary,
          animation: 'pulse 1s infinite ease-in-out',
          animationDelay: `${delay}s`,
        }}
      />
    ))}
  </div>
);