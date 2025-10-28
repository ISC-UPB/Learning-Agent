import { useState, useRef, useEffect } from 'react';
import { theme } from 'antd';
import apiClient from '../api/apiClient';

export const useOpenQuestion = () => {
  const { token } = theme.useToken();
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(true);
  const [showNextButton, setShowNextButton] = useState(false);
  const hasFetchedInitial = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0%,100% { transform: scale(1); opacity: .5; }
        50%    { transform: scale(1.2); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;
    (async () => {
      setIsBotTyping(true);
      await fetchQuestion();
      setIsBotTyping(false);
      setInputDisabled(false);
    })();
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isBotTyping, showNextButton]);

  async function fetchQuestion() {
    try {
      const response = await apiClient.get("/chatint/question?topico=fisica");
      const { question } = await response.data;
      setMessages((m) => [...m, { sender: 'bot', text: question }]);
    } catch (error) {
      console.error(error);
    }
  }

  async function sendAnswer() {
    const answer = inputValue.trim();
    if (!answer || isBotTyping) return;
    const lastQuestion = messages[messages.length - 1]?.text || '';
    setMessages((m) => [...m, { sender: 'user', text: answer }]);
    setInputValue('');
    setInputDisabled(true);
    setIsBotTyping(true);
    try {
      const { data } = await apiClient.post("/chatint/advice", {
        question: lastQuestion,
        answer,
        topic: 'fisica',
      });
      setMessages((m) => [...m, { sender: 'bot', text: data.coaching_advice || 'Error.' }]);
    } catch {
      setMessages((m) => [...m, { sender: 'bot', text: 'Hubo un error.' }]);
    } finally {
      setIsBotTyping(false);
      setInputDisabled(false);
      setShowNextButton(true);
    }
  }
  
  return {
    token,
    messages,
    inputValue,
    setInputValue,
    isBotTyping,
    inputDisabled,
    showNextButton,
    scrollRef,
    sendAnswer,
  };

}