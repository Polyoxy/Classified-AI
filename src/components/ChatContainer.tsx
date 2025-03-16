import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';
import { Message } from '@/types';

const ChatContainer: React.FC = () => {
  const { currentConversation, settings, addMessage } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const backgroundColor = settings?.theme === 'dark' ? '#121212' : '#f8f8f8';
  const textColor = settings?.theme === 'dark' ? '#a0a0a0' : '#666666';
  const previousConversationId = useRef<string | null>(null);

  // Update messages when conversation changes
  useEffect(() => {
    try {
      // Check if this is actually a new conversation
      const isNewConversation = currentConversation?.id !== previousConversationId.current;
      
      console.log('Conversation change detected:', {
        id: currentConversation?.id,
        isNew: isNewConversation,
        messageCount: currentConversation?.messages?.length
      });

      if (currentConversation) {
        // Validate conversation data
        if (!currentConversation.messages || !Array.isArray(currentConversation.messages)) {
          throw new Error('Invalid conversation: messages array is missing or invalid');
        }

        // Clear messages first if it's a new conversation
        if (isNewConversation) {
          setMessages([]);
          // Small delay to allow clearing animation
          setTimeout(() => {
            setMessages(currentConversation.messages);
          }, 50);
        } else {
          // Direct update if same conversation
          setMessages(currentConversation.messages);
        }
        
        setError(null);
        previousConversationId.current = currentConversation.id;
        
        console.log('Messages updated:', {
          conversationId: currentConversation.id,
          count: currentConversation.messages.length,
          lastMessage: currentConversation.messages[currentConversation.messages.length - 1]?.content.substring(0, 50)
        });
      } else {
        console.log('No current conversation, clearing messages');
        setMessages([]);
        setError(null);
        previousConversationId.current = null;
      }
    } catch (error: any) {
      console.error('Error updating messages:', error);
      setError(error?.message || 'Error loading messages');
      setMessages([]);
      addMessage(`Error loading conversation: ${error.message}`, 'system');
    }
  }, [currentConversation?.id, currentConversation?.messages, addMessage]);

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
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ 
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          color: textColor,
          opacity: 0.9,
        }}>
          <div style={{
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                opacity: 0.8,
              }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <circle cx="15.5" cy="8.5" r="1.5"></circle>
              <path d="M8.5 13.5a3.5 3.5 0 0 0 7 0"></path>
            </svg>
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: settings?.theme === 'dark' ? '#e0e0e0' : '#404040',
            letterSpacing: '-0.02em',
          }}>
            Welcome to Classified AI
          </h2>
          <p style={{
            fontSize: '1.1rem',
            lineHeight: '1.6',
            marginBottom: '1.5rem',
            color: settings?.theme === 'dark' ? '#b0b0b0' : '#666666',
          }}>
            I'm here to assist you with coding, debugging, and technical discussions.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            textAlign: 'left',
            marginBottom: '2rem',
          }}>
            {[
              {
                title: 'Code Analysis',
                description: 'Get help understanding and improving your code',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                )
              },
              {
                title: 'Debugging Support',
                description: 'Identify and fix issues in your codebase',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"></path>
                    <path d="M12 16v.01"></path>
                    <path d="M12 8v4"></path>
                  </svg>
                )
              },
              {
                title: 'Best Practices',
                description: 'Learn modern development techniques',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                )
              },
              {
                title: 'Project Planning',
                description: 'Get guidance on architecture and design',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                )
              }
            ].map((item, index) => (
              <div key={index} style={{
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: settings?.theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${settings?.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                  gap: '0.5rem',
                  color: settings?.theme === 'dark' ? '#d0d0d0' : '#505050',
                }}>
                  {item.icon}
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                  }}>{item.title}</h3>
                </div>
                <p style={{
                  fontSize: '0.9rem',
                  margin: 0,
                  color: settings?.theme === 'dark' ? '#909090' : '#666666',
                  lineHeight: '1.5',
                }}>{item.description}</p>
              </div>
            ))}
          </div>
          <p style={{
            fontSize: '0.95rem',
            color: settings?.theme === 'dark' ? '#909090' : '#666666',
            fontStyle: 'italic',
          }}>
            Start typing below to begin our conversation
          </p>
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