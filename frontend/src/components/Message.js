import React from 'react';
import './Message.css';

const Message = ({ text, type }) => {
  if (!text) return null;

  return (
    <div className={`message message-${type}`}>
      {text}
    </div>
  );
};

export default Message;

