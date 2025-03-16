import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';

const ChatContainer: React.FC = () => {
  const { currentConversation, settings } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDarkTheme = settings?.theme === 'dark';

  // Smooth scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Initial scroll and when messages change
  useEffect(() => {
    // Immediate scroll without animation on initial load
    scrollToBottom(false);
    
    // Then smooth scroll after a short delay (in case of images or other content loading)
    const timer = setTimeout(() => {
      scrollToBottom(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentConversation?.messages]);

  // Add resize observer to handle container height changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(() => {
      scrollToBottom(false);
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);

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
        scrollBehavior: 'smooth',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* Message content */}
      <div style={{ paddingBottom: '20px' }}>
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
      
      {/* Invisible element at the bottom for scrolling target */}
      <div id="chat-bottom-anchor" style={{ height: '1px', width: '100%' }} />
    </div>
  );
};

export default ChatContainer; 