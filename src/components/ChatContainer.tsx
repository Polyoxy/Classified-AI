import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';

const ChatContainer: React.FC = () => {
  const { currentConversation } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentConversation?.messages]);

  if (!currentConversation) {
    return (
      <div className="flex-1 overflow-hidden bg-background">
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Select or start a conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-y-auto bg-background p-4"
      style={{ height: 'calc(100vh - 160px)' }} // Adjust height to leave space for input
    >
      {currentConversation.messages.map((message, index) => {
        // Skip system messages
        if (message.role === 'system') return null;
        
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