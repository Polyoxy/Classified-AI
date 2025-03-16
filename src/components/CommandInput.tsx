import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import useChat from '@/hooks/useChat';

// Add styles for the pulsing animation
const pulsingLightningStyles = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.3);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.7;
    }
  }

  .lightning-icon {
    animation: pulse 1.5s ease-in-out infinite;
    transform-origin: center;
  }
`;

// Example questions to cycle through
const EXAMPLE_QUESTIONS = [
  "How can I optimize my React application's performance?",
  "Write a Python script to analyze sentiment in tweets",
  "Create a beautiful landing page with Next.js and Tailwind",
  "Explain the concept of blockchain in simple terms",
  "Help me debug this async/await function",
  "Design a scalable microservices architecture",
  "Generate a secure password validation regex",
  "What are the best practices for API design?",
  "Create a machine learning model for image classification",
  "How does quantum computing differ from classical computing?",
  "Implement a real-time chat system with WebSockets",
  "Build a responsive navigation menu with CSS Grid",
];

const CommandInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [placeholder, setPlaceholder] = useState("Enter command...");
  const [targetPlaceholder, setTargetPlaceholder] = useState("Enter command...");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  const { 
    settings,
    isProcessing,
    setIsProcessing,
    currentConversation,
    createConversation,
  } = useAppContext();
  
  // Use our chat hook
  const { sendMessage, stopResponse } = useChat();
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to scramble text with enhanced hacker effect
  const scrambleText = (target: string, current: string, progress: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    
    return target.split('').map((char, index) => {
      if (char === ' ' || /[.,?!]/.test(char)) {
        return char;
      }

      if (index < progress * target.length) {
        return char;
      }
      
      const rand = Math.random();
      const closeToReveal = (index - (progress * target.length)) < 2;
      if (closeToReveal && rand > 0.6) {
        return target[index];
      }
      
      return rand > 0.8 ? target[index] : chars[Math.floor(Math.random() * chars.length)];
    }).join('');
  };

  // Animation function to gradually transform placeholder
  const animatePlaceholder = (current: string, target: string, startTime: number) => {
    const duration = 1200;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress < 1) {
      setPlaceholder(scrambleText(target, current, progress));
      animationTimerRef.current = setTimeout(() => {
        animatePlaceholder(current, target, startTime);
      }, 20);
    } else {
      setPlaceholder(target);
      cycleTimerRef.current = setTimeout(() => {
        const nextIndex = (placeholderIndex + 1) % EXAMPLE_QUESTIONS.length;
        setPlaceholderIndex(nextIndex);
        setTargetPlaceholder(EXAMPLE_QUESTIONS[nextIndex]);
      }, 4000);
    }
  };

  // Effect to handle placeholder animation
  useEffect(() => {
    if (!isProcessing && targetPlaceholder !== placeholder) {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      animatePlaceholder(placeholder, targetPlaceholder, Date.now());
    }
    
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [targetPlaceholder, isProcessing]);
  
  // Start cycling through examples
  useEffect(() => {
    cycleTimerRef.current = setTimeout(() => {
      setTargetPlaceholder(EXAMPLE_QUESTIONS[0]);
    }, 3000);
    
    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, []);

  // Handle input change and auto resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle send message
  const handleSendMessage = () => {
    if (input.trim() && !isProcessing) {
      sendMessage(input.trim());
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };
  
  // Handle manual focus when user clicks in the input area
  const handleInputClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Ensure we're connected to the AI when the user interacts with the input
    if (!currentConversation) {
      createConversation();
    }
  };
  
  // Handle cancel message
  const handleCancelMessage = () => {
    if (isProcessing) {
      stopResponse();
      setIsProcessing(false);
    }
  };
  
  return (
    <>
      <style>{pulsingLightningStyles}</style>
      
      <style>{`
        .no-focus-visible:focus,
        .no-focus-visible:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          border-color: transparent !important;
        }
        
        textarea::selection {
          background-color: rgba(150, 150, 150, 0.3);
        }
        
        .command-button {
          transition: opacity 0.2s ease;
        }
        .command-button:hover {
          opacity: 0.8 !important;
        }
        .command-button-disabled:hover {
          opacity: 0.3 !important;
        }
      `}</style>
      
      <div style={{
        position: 'relative',
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: settings?.theme === 'dark' ? 'rgba(26, 26, 26, 0.4)' : 'rgba(245, 245, 245, 0.6)',
        display: 'flex',
        alignItems: 'center',
        boxShadow: settings?.theme === 'dark' 
          ? 'inset 0 1px 2px rgba(0,0,0,0.1)' 
          : 'inset 0 1px 2px rgba(0,0,0,0.05)',
        borderRadius: '8px',
        margin: '0.75rem 1rem 1rem 1rem',
      }}>
        <div style={{
          color: 'var(--text-color)',
          marginRight: '0.75rem',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          height: '24px',
          opacity: 0.8,
        }}>
          {isProcessing ? (
            <svg 
              className="lightning-icon"
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          ) : (
            <svg 
              className="lightning-icon"
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          )}
        </div>
        
        <div 
          onClick={handleInputClick}
          style={{ 
            flex: 1, 
            cursor: 'text',
            outline: 'none'
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            disabled={isProcessing}
            placeholder={isProcessing ? "Processing request..." : placeholder}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-color)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: '14px',
              resize: 'none',
              height: 'auto',
              minHeight: '24px',
              width: '100%',
              outline: 'none',
              padding: '0',
              paddingTop: '2px',
              overflow: 'hidden',
              lineHeight: '1.6',
              verticalAlign: 'middle',
              caretColor: 'var(--text-color)',
            }}
            rows={1}
            autoFocus={false}
            className="no-focus-visible"
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isProcessing && (
            <button
              onClick={handleCancelMessage}
              className="command-button"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-color)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6,
              }}
              title="Stop generating"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </button>
          )}
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className={`command-button ${(!input.trim() || isProcessing) ? 'command-button-disabled' : ''}`}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-color)',
              cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: input.trim() && !isProcessing ? 0.6 : 0.3,
            }}
            title="Send message"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default CommandInput;