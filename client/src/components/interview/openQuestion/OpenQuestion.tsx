import { Input, Button, Typography } from 'antd';
import { SendOutlined, RightOutlined, MessageOutlined } from '@ant-design/icons';
import { TypingIndicator } from '../openQuestion/TypingIndicator';
import { ChatMessage } from '../openQuestion/ChatMessage';
import { useOpenQuestion } from '../../../hooks/useOpenQuestion';
const { Text } = Typography;

const WIDTH = 900;
const HEIGHT = '60vh';
const TOP_OFFSET = '5vh'; 


export default function OpenQuestion({ onNext }: { onNext: () => void }) {
  const { token, messages, inputValue, setInputValue, isBotTyping, inputDisabled, showNextButton, scrollRef, sendAnswer } = useOpenQuestion();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: token.paddingLG,
        backgroundColor: token.colorBgLayout,
      }}
    >
      <div
        style={{
          marginTop: TOP_OFFSET,
          display: 'flex',
          flexDirection: 'column',
          width: WIDTH,
          height: HEIGHT,
          backgroundColor: token.colorBgLayout,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadow,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: token.paddingMD,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            backgroundColor: token.colorBgContainer,
          }}
        >
          <MessageOutlined style={{ marginRight: token.marginSM, color: token.colorPrimary }} />
          <Text style={{ fontSize: '1.25rem', fontWeight: 500, color: token.colorTextHeading }}>
            Interview
          </Text>
        </div>
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: token.paddingLG,
            backgroundColor: token.colorBgLayout,
          }}
        >
          {messages.map((msg, i) => (
            <ChatMessage key={i} text={msg.text} isUser={msg.sender === 'user'} token={token} />
          ))}
          {isBotTyping && <TypingIndicator token={token} />}
        </div>
        {!showNextButton && (
          <div
            style={{
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              display: 'flex',
              alignItems: 'center',
              padding: token.paddingSM,
              backgroundColor: token.colorBgContainer,
            }}
          >
            <Input
              placeholder="Escribe tu respuesta..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={sendAnswer}
              disabled={inputDisabled || isBotTyping}
              size="large"
              style={{
                borderRadius: token.borderRadiusLG,
                marginRight: token.marginSM,
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendAnswer}
              disabled={inputDisabled || isBotTyping}
              style={{
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </div>
        )}
      </div>

      {showNextButton && (
        <div
          style={{
            width: WIDTH,
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: token.marginMD,
            paddingRight: 0,
          }}
        >
          <Button
            type="primary"
            size="large"
            onClick={onNext}
            style={{
              borderRadius: token.borderRadiusLG,
              height: 48,
              padding: `0 ${token.paddingLG}px`,
              fontWeight: 600,
              boxShadow: token.boxShadow,
              marginRight: 0,
            }}
          >
            Siguiente Pregunta <RightOutlined />
          </Button>
        </div>
      )}
    </div>
  );
}
