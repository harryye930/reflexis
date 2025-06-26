import React from 'react';

const MessageBox = ({ message }) => {
  if (!message.show) return null;

  return (
    <div className={`message-box text-white py-2 px-4 rounded-lg shadow-md transition-opacity duration-300 ${message.isError ? 'bg-red-500' : 'bg-green-500'}`}>
      <p id="message-text">{message.text}</p>
    </div>
  );
};

export default MessageBox;
