import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';

const ChatContainer: React.FC = () => {
  const { currentConversation, settings } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDarkTheme = settings?.theme === 'dark';

  // Scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentConversation?.messages]);

  // If no conversation is selected, show an empty container
  if (!currentConversation) {
    return (
      <div 
        ref={containerRef}
        className="chat-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          backgroundColor: isDarkTheme ? '#121212' : '#f8f9fa',
          scrollBehavior: 'smooth',
          display: 'flex',
          flexDirection: 'column',
        }}
      />
    );
  }

  // Debug: log the current conversation messages
  console.log('Current conversation messages:', currentConversation.messages);

  return (
    <div 
      ref={containerRef}
      className="chat-container"
      id="chatContainer"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        backgroundColor: isDarkTheme ? '#121212' : '#f8f9fa',
        scrollBehavior: 'smooth',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Welcome message if no messages yet */}
      {currentConversation.messages.length === 0 && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-color)',
          opacity: 0.7,
          fontStyle: 'italic'
        }}>
          Start a new conversation with the AI...
        </div>
      )}

      {/* Display messages */}
      {currentConversation.messages.map((message, index) => {
        // Skip initial system messages except errors
        if (message.role === 'system' && 
            !message.content.startsWith('Error') && 
            index === 0 && 
            currentConversation.messages.length > 1) {
          return null;
        }
        
        // Render all other messages
        return (
          <MessageItem
            key={message.id || index}
            role={message.role}
            content={message.content}
          />
        );
      })}

      {/* Scrolling spacer */}
      <div style={{ height: '1rem' }} />
    </div>
  );
};

export default ChatContainer; 