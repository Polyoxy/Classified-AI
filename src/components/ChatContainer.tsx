import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';

const ChatContainer: React.FC = () => {
  const { currentConversation, settings } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDarkTheme = settings?.theme === 'dark';

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentConversation?.messages]);

  if (!currentConversation) {
    return (
      <div 
        className="flex-1 overflow-hidden"
        style={{ 
          backgroundColor: isDarkTheme ? '#121212' : '#f8f8f8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <div style={{ 
          padding: '2rem',
          textAlign: 'center',
          color: isDarkTheme ? '#a0a0a0' : '#666666'
        }}>
          <p>Start a new conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-y-auto"
      style={{ 
        backgroundColor: isDarkTheme ? '#121212' : '#f8f8f8',
        height: 'calc(100vh - 160px)',
        padding: '1rem',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {currentConversation.messages.map((message, index) => {
        // Skip system messages unless they're error messages
        if (message.role === 'system' && !message.content.startsWith('Error')) {
          return null;
        }
        
        return (
          <MessageItem
            key={message.id || index}
            message={message}
            isLastMessage={index === currentConversation.messages.length - 1}
          />
        );
      })}
    </div>
  );
};

export default ChatContainer; 