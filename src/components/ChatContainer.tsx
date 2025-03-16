import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';

const ChatContainer: React.FC = () => {
  const { currentConversation, settings } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDarkTheme = settings?.theme === 'dark';

  // Log current conversation state for debugging
  useEffect(() => {
    if (currentConversation) {
      console.log('Current conversation messages:', {
        count: currentConversation.messages.length,
        messages: currentConversation.messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) }))
      });
    }
  }, [currentConversation]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // If no conversation is selected, show an empty container
  if (!currentConversation) {
    return (
      <div className="flex-1 overflow-hidden bg-background">
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Select or start a conversation</p>
        </div>
      </div>
    );
  }

  // Debug: log the current conversation messages
  console.log('Current conversation messages:', {
    messageCount: currentConversation.messages.length,
    hasUserMessages: currentConversation.messages.some(m => m.role === 'user'),
    hasAssistantMessages: currentConversation.messages.some(m => m.role === 'assistant'),
    messageRoles: currentConversation.messages.map(m => m.role),
    messageIds: currentConversation.messages.map(m => m.id?.toString().substring(0, 6)),
    recentMessages: currentConversation.messages.slice(-3).map(m => ({
      role: m.role,
      content: m.content.substring(0, 30) + (m.content.length > 30 ? '...' : '')
    }))
  });

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden bg-background">
      <div className="h-full overflow-y-auto p-4 space-y-4">
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
          // Skip empty messages (except for streaming assistants)
          if (message.content === '' && message.role !== 'assistant') {
            return null;
          }
          
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
              message={message}
              isLastMessage={index === currentConversation.messages.length - 1}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatContainer; 