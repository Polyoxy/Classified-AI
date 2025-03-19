import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';

const ChatContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentConversation, isProcessing, settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';

  // Scroll to bottom when new messages are added or when processing state changes
  useEffect(() => {
    if (containerRef.current && settings?.autoScroll !== false) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentConversation?.messages, isProcessing, settings?.autoScroll]);

  // Filter visible messages
  const visibleMessages = currentConversation?.messages?.filter(msg => {
    // Skip empty messages
    if (!msg.content?.trim()) return false;
    // Skip system messages unless they contain errors
    if (msg.role === 'system' && !msg.content.toLowerCase().includes('error')) return false;
    return true;
  }) || [];

  return (
    <div 
      ref={containerRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px',
        paddingBottom: '3rem',
        backgroundColor: isDarkTheme ? '#121212' : '#ffffff',
        transition: 'background-color 0.2s ease',
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkTheme ? '#333 #121212' : '#ccc #ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>
        {`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: ${isDarkTheme ? '#121212' : '#ffffff'};
          }
          div::-webkit-scrollbar-thumb {
            background-color: ${isDarkTheme ? '#333' : '#ccc'};
            border-radius: 6px;
          }
        `}
      </style>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        flex: 1,
      }}>
        {visibleMessages.map((message, index) => (
          <MessageItem
            key={index}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            isProcessing={index === visibleMessages.length - 1 && isProcessing}
            model={currentConversation?.model}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatContainer; 