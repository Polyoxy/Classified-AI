import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';
import { Message } from '@/types';

const ChatContainer: React.FC = () => {
  const { currentConversation, settings } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const backgroundColor = settings?.theme === 'dark' ? '#121212' : '#f8f8f8';
  const textColor = settings?.theme === 'dark' ? '#a0a0a0' : '#666666';

  // Update messages when conversation changes
  useEffect(() => {
    try {
      console.log('Conversation changed in ChatContainer:', {
        id: currentConversation?.id,
        messageCount: currentConversation?.messages?.length
      });

      if (currentConversation) {
        // Validate conversation data
        if (!currentConversation.messages || !Array.isArray(currentConversation.messages)) {
          throw new Error('Invalid conversation: messages array is missing or invalid');
        }

        // Set messages and clear any previous errors
        setMessages(currentConversation.messages);
        setError(null);
        
        console.log('Messages updated:', {
          count: currentConversation.messages.length,
          lastMessage: currentConversation.messages[currentConversation.messages.length - 1]?.content.substring(0, 50)
        });
      } else {
        console.log('No current conversation, clearing messages');
        setMessages([]);
        setError(null);
      }
    } catch (error: any) {
      console.error('Error updating messages:', error);
      setError(error?.message || 'Error loading messages');
      setMessages([]);
    }
  }, [currentConversation?.id, currentConversation?.messages]);

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
  }, [messages]);

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

  if (error) {
    return (
      <div 
        className="flex-1 overflow-hidden"
        style={{ 
          backgroundColor,
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
          color: '#ff6b6b'
        }}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!currentConversation) {
    return (
      <div 
        className="flex-1 overflow-hidden"
        style={{ 
          backgroundColor,
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
          color: textColor
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
        backgroundColor,
        height: 'calc(100vh - 160px)',
        padding: '1rem',
        fontFamily: 'JetBrains Mono, monospace',
        overflowX: 'hidden',
      }}
    >
      {/* Message content */}
      <div style={{ paddingBottom: '20px' }}>
        {messages.map((message, index) => {
          // Skip system messages unless they're error messages
          if (message.role === 'system' && !message.content.startsWith('Error')) {
            return null;
          }
          
          return (
            <MessageItem
              key={message.id || index}
              message={message}
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