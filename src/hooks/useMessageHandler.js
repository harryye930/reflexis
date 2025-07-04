import { useState } from 'react';

export const useMessageHandler = () => {
  const [message, setMessage] = useState({ text: '', isError: false, show: false });

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError, show: true });
    setTimeout(() => {
      setMessage(prev => ({ ...prev, show: false }));
    }, isError ? 8000 : 3000);
  };

  return {
    message,
    showMessage
  };
};
