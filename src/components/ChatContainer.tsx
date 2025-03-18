import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';
import ThinkingIndicator from './ThinkingIndicator';

const ChatContainer: React.FC = () => {
  const { 
    currentConversation, 
    settings, 
    isProcessing,
    setIsProcessing
  } = useAppContext();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isDarkTheme = settings?.theme === 'dark';
  
  // Example thinking content for demonstration
  const [thinkingContent, setThinkingContent] = React.useState<string>('');
  
  // Generate some simulated thinking content when isProcessing changes
  React.useEffect(() => {
    if (isProcessing) {
      // Simulate thinking process with content updates
      let content = "Analyzing query...\n";
      setThinkingContent(content);
      
      const timer1 = setTimeout(() => {
        content += "Considering relevant context and information...\n";
        setThinkingContent(content);
      }, 800);
      
      const timer2 = setTimeout(() => {
        content += "Formulating response based on best practices...\n";
        setThinkingContent(content);
      }, 1500);
      
      const timer3 = setTimeout(() => {
        content += "Refining response for clarity and accuracy...\n";
        setThinkingContent(content);
      }, 2200);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setThinkingContent('');
    }
  }, [isProcessing]);

  // Update the scroll to bottom effect
  useEffect(() => {
    const smoothScrollToBottom = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const currentScroll = container.scrollTop;
      const targetScroll = container.scrollHeight - container.clientHeight;
      
      // Only scroll if we're already close to the bottom (within 300px) or actively processing
      // The isProcessing check ensures we scroll when thinking indicator appears
      if (isProcessing || targetScroll - currentScroll < 300) {
        // Use browser's built-in smooth scrolling
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    };
    
    smoothScrollToBottom();
    
    // Also add a slight delay to handle content that might render after state updates
    const timeoutId = setTimeout(smoothScrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [currentConversation?.messages, settings?.autoScroll, isProcessing, thinkingContent]);

  // If no conversation is selected, show an empty container
  if (!currentConversation) {
    return (
      <div 
        className="chat-container"
        style={{
          flex: 1,
          padding: '1rem',
          backgroundColor: isDarkTheme ? '#121212' : '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '800px',
          margin: '0 auto',
          width: 'calc(100% - 3rem)',
          paddingBottom: '100px', // Space for the command input
          minHeight: 'calc(100vh - 80px)',
        }}
      />
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

  // Custom styles for the chat container
  const containerStyles = `
    .chat-container::-webkit-scrollbar {
      width: 8px;
      background-color: transparent;
    }

    .chat-container::-webkit-scrollbar-thumb {
      background-color: ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
      border-radius: 4px;
    }

    .chat-container::-webkit-scrollbar-thumb:hover {
      background-color: ${isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    }

    .chat-container {
      /* Additional custom styles for better scrolling experience */
      scrollbar-width: thin;
      scrollbar-color: ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} transparent;
    }

    @media (max-width: 768px) {
      .chat-container {
        width: calc(100% - 2rem) !important;
        padding: 0.75rem !important;
      }
    }
    
    /* Add styling for the agent UI container */
    .agent-ui {
      border-radius: 4px;
      overflow: hidden;
    }
  `;

  // Helper function to process AI messages and add ANALYSIS section if needed
  const processAIMessage = (message: any) => {
    // Default to showing analysis if the setting doesn't exist
    const shouldShowAnalysis = settings?.showAnalysis !== false;
    
    if (message.role !== 'assistant' || !shouldShowAnalysis) {
      return message;
    }
    
    // Check if message already has an ANALYSIS section
    const hasAnalysis = 
      /<ANALYSIS>[\s\S]*?<\/ANALYSIS>/i.test(message.content) || 
      /ANALYSIS:[\s\S]*?(?=\n\n|$)/i.test(message.content);
    
    if (hasAnalysis) {
      return message;
    }
    
    // If there's internal thinking/reasoning in the message
    // try to extract it and format as ANALYSIS
    
    // Patterns based on the examples in the image
    const thinkingPatterns = [
      // Common thinking openings
      /^(I should|Let me|I'll|I will|I need to|First,|To answer|Based on)[\s\S]*?\n\n/i,
      /^(Alright|Okay|I see|Looking at|Analyzing|Let's)[\s\S]*?\n\n/i,
      
      // Specific thought patterns from the image examples
      /^Okay, the user greeted me[\s\S]*?I'll respond by[\s\S]*?\n\n/i,
      /^I should check if[\s\S]*?Since there's no specific[\s\S]*?\n\n/i
    ];
    
    // Extract paragraphs to identify thinking sections
    const paragraphs = message.content.split('\n\n');
    
    // If we have at least 2 paragraphs and the first few look like thinking
    if (paragraphs.length >= 2) {
      // Check if the initial paragraphs match our thinking patterns
      let thinkingParts = [];
      let responseParts = [...paragraphs];
      
      // Analyze up to the first 3 paragraphs for thinking patterns
      const analyzeParagraphs = Math.min(3, paragraphs.length - 1);
      
      for (let i = 0; i < analyzeParagraphs; i++) {
        const paragraph = paragraphs[i];
        
        // Check if this paragraph looks like thinking
        const isThinking = 
          paragraph.startsWith("I ") || 
          paragraph.startsWith("Let's ") ||
          paragraph.startsWith("Let me ") ||
          paragraph.startsWith("First, I") ||
          paragraph.startsWith("Since there's") ||
          paragraph.startsWith("Okay,") ||
          paragraph.startsWith("Based on") ||
          paragraph.startsWith("Looking at");
          
        if (isThinking) {
          thinkingParts.push(paragraph);
          responseParts.shift(); // Remove from response
        } else {
          break; // Stop when we find a non-thinking paragraph
        }
      }
      
      // If we found thinking paragraphs, format them as ANALYSIS
      if (thinkingParts.length > 0) {
        const thinking = thinkingParts.join('\n\n').trim();
        const response = responseParts.join('\n\n').trim();
        
        return {
          ...message,
          content: `<ANALYSIS>\n${thinking}\n</ANALYSIS>\n\n${response}`
        };
      }
    }
    
    // Try the regex approach as a fallback
    for (const pattern of thinkingPatterns) {
      const match = message.content.match(pattern);
      if (match && match[0].length > 40) { // Only if thinking part is substantial
        const thinking = match[0].trim();
        const response = message.content.slice(match[0].length).trim();
        
        // Only split if we have both parts
        if (thinking && response) {
          return {
            ...message,
            content: `<ANALYSIS>\n${thinking}\n</ANALYSIS>\n\n${response}`
          };
        }
      }
    }
    
    return message;
  };

  return (
    <>
      <style>{containerStyles}</style>
      <div 
        ref={containerRef}
        className="chat-container"
        id="chatContainer"
        style={{
          flex: 1,
          padding: '1rem',
          backgroundColor: isDarkTheme ? '#121212' : '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '800px',
          margin: '0 auto',
          width: 'calc(100% - 3rem)',
          paddingBottom: '100px', // Space for the command input
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          minHeight: 'calc(100vh - 80px)', // Minimum height to fill viewport
        }}
      >
        {/* Welcome message if no messages yet */}
        {currentConversation.messages.length <= 1 && (
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
              currentConversation.messages.length > 1 &&
              !settings?.showSystemMessages) {
            return null;
          }
          
          // Process AI messages to potentially add ANALYSIS sections
          const processedMessage = message.role === 'assistant' 
            ? processAIMessage(message)
            : message;
          
          // Render all other messages
          return (
            <MessageItem
              key={message.id || `msg-${index}`}
              role={processedMessage.role}
              content={processedMessage.content}
              timestamp={message.timestamp}
            />
          );
        })}

        {/* Show thinking indicator when processing */}
        {isProcessing && (
          <MessageItem
            role="assistant"
            content=""
            isThinking={true}
            thinkingContent={thinkingContent}
          />
        )}

        {/* Scrolling spacer */}
        <div style={{ height: '20px' }} />
      </div>
    </>
  );
};

export default ChatContainer; 