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

// Example questions to cycle through - simplified list
const EXAMPLE_QUESTIONS = [
  "How can I optimize my React application's performance?",
  "Write a Python script to analyze data",
  "Create a landing page with Next.js",
  "Help me debug this function",
  "What are the best practices for API design?",
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
    isSidebarOpen,
  } = useAppContext();
  
  // Add additional styles for the gradient and mobile optimization
  const customStyles = `
    @media (max-width: 767px) {
      .command-input {
        position: fixed !important;
        bottom: 50px !important; /* Position above the status bar */
        left: 10px !important;
        right: 10px !important;
        width: calc(100% - 20px) !important;
        max-width: calc(100% - 20px) !important;
        margin: 0 auto !important;
        z-index: 80 !important;
        background: ${settings?.theme === 'dark' 
          ? 'linear-gradient(to bottom, rgba(18, 18, 18, 0.85), rgba(24, 24, 24, 0.95))' 
          : 'linear-gradient(to bottom, rgba(245, 245, 245, 0.85), rgba(250, 250, 250, 0.95))'} !important;
      }
    }
    
    @media (min-width: 768px) {
      .command-input {
        position: fixed !important;
        bottom: 50px !important; /* Position above the status bar */
        left: 50% !important;
        transform: translateX(-50%) !important;
        margin: 0 !important;
        z-index: 80 !important;
        width: calc(100% - 3rem) !important;
        max-width: 800px !important;
      }
    }
  `;
  
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
  
  // Update button styles
  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    marginLeft: '8px',
    cursor: 'pointer',
    color: settings?.theme === 'dark' ? 'rgba(208, 208, 208, 0.6)' : 'rgba(64, 64, 64, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    opacity: !input.trim() || isProcessing ? 0.3 : 0.6,
    height: '40px',
    width: '40px',
    flexShrink: 0,
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
        ${customStyles}
      `}</style>
      
      <div 
        className="command-input"
        style={{
          position: 'relative',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          boxShadow: `0 1px 5px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.2' : '0.08'})`,
          borderRadius: '8px',
          margin: '5px auto 0.8rem auto',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          border: `1px solid ${settings?.theme === 'dark' ? 'rgba(60, 60, 60, 0.5)' : 'rgba(180, 180, 180, 0.3)'}`,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '14px',
          color: settings?.theme === 'dark' ? '#d0d0d0' : '#404040',
          width: 'calc(100% - 3rem)',
          maxWidth: '800px', /* Match max-width with AI responses */
          boxSizing: 'border-box',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          background: settings?.theme === 'dark' 
            ? 'linear-gradient(to bottom, rgba(26, 26, 26, 0.7), rgba(32, 32, 32, 0.9))' 
            : 'linear-gradient(to bottom, rgba(250, 250, 250, 0.7), rgba(255, 255, 255, 0.9))',
        }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = settings?.theme === 'dark' ? 'rgba(80, 80, 80, 0.8)' : 'rgba(160, 160, 160, 0.5)';
        e.currentTarget.style.boxShadow = `0 2px 8px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.25' : '0.12'})`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = settings?.theme === 'dark' ? 'rgba(60, 60, 60, 0.5)' : 'rgba(180, 180, 180, 0.3)';
        e.currentTarget.style.boxShadow = `0 1px 5px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.2' : '0.08'})`;
      }}
      >
        <div style={{
          color: settings?.theme === 'dark' ? 'rgba(208, 208, 208, 0.6)' : 'rgba(64, 64, 64, 0.6)',
          marginRight: '0.75rem',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          height: '18px',
          opacity: 0.7,
          marginTop: '2px',
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
            outline: 'none',
            minHeight: '20px',
            position: 'relative',
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
              color: settings?.theme === 'dark' ? '#d0d0d0' : '#505050', 
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: '14px',
              resize: 'none',
              height: 'auto',
              minHeight: '20px',
              width: '100%',
              outline: 'none',
              padding: '0',
              paddingTop: '0',
              overflow: 'hidden',
              lineHeight: 1.4,
              verticalAlign: 'middle',
              caretColor: settings?.theme === 'dark' ? '#d0d0d0' : '#505050',
              position: 'relative',
              zIndex: 2,
              letterSpacing: '0.01em',
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
                color: settings?.theme === 'dark' ? 'rgba(208, 208, 208, 0.6)' : 'rgba(64, 64, 64, 0.6)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6,
                transition: 'opacity 0.2s ease',
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
              color: settings?.theme === 'dark' ? 'rgba(208, 208, 208, 0.6)' : 'rgba(64, 64, 64, 0.6)',
              cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: input.trim() && !isProcessing ? 0.6 : 0.3,
              transition: 'opacity 0.2s ease',
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