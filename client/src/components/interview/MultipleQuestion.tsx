import { Typography, Radio, Button, theme } from 'antd';
import { RightOutlined, CodeOutlined } from '@ant-design/icons';
import type { DoubleOptionResponse } from '../../interfaces/interviewInt';
import { useMultipleQuestion } from '../../hooks/useMultipleQuestion';
import QuestionLoading from '../QuestionLoading';

const { Paragraph, Text } = Typography;

const WIDTH = 900;
const HEIGHT = '60vh';
const TOP_OFFSET = '5vh';

interface MultipleQuestionProps {
  onNext: () => void;
  selectedValues: DoubleOptionResponse[];
  setSelectedValues: React.Dispatch<React.SetStateAction<DoubleOptionResponse[]>>;
}

export default function MultipleQuestion({ onNext, selectedValues, setSelectedValues }: MultipleQuestionProps) {
  const { token } = theme.useToken();
  
  const {
    doubleOption,
    loading,
    loadingMessageIndex,
    loadingMessages,
    onClick,
    handleAnswerChange,
  } = useMultipleQuestion(onNext, selectedValues, setSelectedValues);

  if (loading) {
    return (
      <QuestionLoading
        loadingMessage={loadingMessages[loadingMessageIndex]}
        token={token}
      />
    );
  }

  if (!doubleOption) return null;

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
          <CodeOutlined style={{ marginRight: token.marginSM, color: token.colorPrimary }} />
          <Text style={{ fontSize: '1.25rem', fontWeight: 500, color: token.colorTextHeading }}>
            Pregunta de Complejidad
          </Text>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: token.paddingLG,
            backgroundColor: token.colorBgLayout,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: token.marginLG,
          }}
        >
          <Paragraph
            style={{
              margin: 0,
              fontWeight: 600,
              color: token.colorText,
              fontSize: token.fontSizeXL,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            {doubleOption.question}
          </Paragraph>

          <Radio.Group
            onChange={(e) => handleAnswerChange(e.target.value)}
            value={doubleOption?.givenAnswer}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: token.marginMD,
              justifyContent: 'center',
            }}
          >
            {doubleOption.options.map((opt, i) => {
              const selected = doubleOption.givenAnswer === i;
              return (
                <Radio key={i} value={i} style={{ margin: 0 }}>
                  <div
                    style={{
                      width: 320,
                      padding: token.paddingMD,
                      borderRadius: token.borderRadiusLG,
                      border: `2px solid ${selected ? token.colorPrimary : token.colorBorderSecondary}`,
                      backgroundColor: token.colorBgContainer,
                      boxShadow: selected
                        ? `0 4px 12px ${token.colorPrimary}33`
                        : token.boxShadowSecondary,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: token.marginSM,
                    }}
                  >
                    <Paragraph
                      style={{
                        margin: 0,
                        fontWeight: 'bold',
                        color: token.colorText,
                        fontSize: token.fontSize,
                      }}
                    >
                      {opt.label}
                    </Paragraph>
                    <pre
                      style={{
                        backgroundColor: token.colorFillTertiary,
                        padding: `${token.paddingSM}px ${token.paddingMD}px`,
                        borderRadius: token.borderRadiusSM,
                        fontSize: token.fontSizeSM,
                        overflowX: 'auto',
                        margin: 0,
                        color: token.colorText,
                        lineHeight: 1.5,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {opt.answer}
                    </pre>
                  </div>
                </Radio>
              );
            })}
          </Radio.Group>
        </div>
      </div>

      {doubleOption.givenAnswer != undefined && (
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
            onClick={onClick}
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
