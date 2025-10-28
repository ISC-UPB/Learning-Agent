import React from 'react';
import { Button, Typography, theme, Radio } from 'antd';
import { RightOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import QuestionLoading from '../QuestionLoading';
import { useTeoricQuestion } from '../../hooks/useTeoricQuestion';
import type { MultipleSelectionResponse } from '../../interfaces/interviewInt';

const { Paragraph, Text } = Typography;

const WIDTH = 900;
const HEIGHT = '60vh';
const TOP_OFFSET = '5vh';

interface TeoricQuestionProps {
   onNext: () => void;
   selectedValues: MultipleSelectionResponse[];
   setSelectedValues: React.Dispatch<React.SetStateAction<MultipleSelectionResponse[]>>;
}

export default function TeoricQuestion({ onNext, selectedValues, setSelectedValues }: TeoricQuestionProps) {
  const { token } = theme.useToken();
  const { mulOption, loading, loadingMessageIndex, loadingMessages, handleOptionChange, handleNextClick } = useTeoricQuestion({
    selectedValues,
    setSelectedValues,
    onNext,
  });

  if (loading) {
    return (
      <QuestionLoading
        loadingMessage={loadingMessages[loadingMessageIndex]}
        token={token}
      />
    );
  }

  if (!mulOption) return null;

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
          <QuestionCircleOutlined style={{ marginRight: token.marginSM, color: token.colorPrimary }} />
          <Text style={{ fontSize: '1.25rem', fontWeight: 500, color: token.colorTextHeading }}>
            Pregunta Teórica
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
            {mulOption.question}
          </Paragraph>

          <Radio.Group
            style={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              gap: token.marginMD,
              justifyContent: 'center',
            }}
            onChange={(e) => handleOptionChange(e.target.value)}
          >
            {mulOption.options.map((option, i) => {
              const selected = mulOption.givenAnswer == i;
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
                      textAlign: 'center',
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
                      {option}
                    </Paragraph>
                  </div>
                </Radio>
              );
            })}
          </Radio.Group>
        </div>
      </div>

      {mulOption.givenAnswer != undefined && (
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
            onClick={handleNextClick}
            style={{
              borderRadius: token.borderRadiusLG,
              height: 48,
              padding: `0 ${token.paddingLG}px`,
              fontWeight: 600,
              boxShadow: token.boxShadow,
            }}
          >
            Siguiente Pregunta <RightOutlined />
          </Button>
        </div>
      )}
    </div>
  );
}
