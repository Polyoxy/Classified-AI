import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  isLastMessage: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';

  const messageStyle = {
    padding: '1rem',
    marginBottom: '1rem',
    borderRadius: '8px',
    backgroundColor: message.role === 'user' 
      ? (isDarkTheme ? '#2a2a2a' : '#f0f0f0')
      : (isDarkTheme ? '#121212' : '#ffffff'),
    border: message.role === 'user'
      ? `2px solid ${isDarkTheme ? '#404040' : '#e0e0e0'}`
      : 'none',
    color: isDarkTheme ? '#e0e0e0' : '#404040',
  };

  const roleStyle = {
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: isDarkTheme ? '#e0e0e0' : '#404040',
  };

  return (
    <div style={messageStyle}>
      <div style={roleStyle}>
        {message.role === 'user' ? 'You' : 'Assistant'}
      </div>
      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {message.content}
      </div>
    </div>
  );
};

export default MessageItem; 