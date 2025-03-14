import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';

const ChatContainer: React.FC = () => {
  const { currentConversation } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);

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
          backgroundColor: 'var(--bg-color)',
          scrollBehavior: 'smooth',
          display: 'flex',
          flexDirection: 'column',
        }}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      className="chat-container"
      id="chatContainer"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.75rem',
        backgroundColor: 'var(--bg-color)',
        scrollBehavior: 'smooth',
        display: 'flex',
        flexDirection: 'column',
        border: '1.5px solid var(--border-color)',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
      }}
    >
      {currentConversation.messages.map((message, index) => (
        // Only skip system messages that are not error messages
        (message.role !== 'system' || message.content.startsWith('Error')) ? (
          <MessageItem
            key={message.id || index}
            role={message.role}
            content={message.content}
          />
        ) : null
      ))}
    </div>
  );
};

export default ChatContainer; 