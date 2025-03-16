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
  const [showResetButton, setShowResetButton] = useState(false);
  const [placeholder, setPlaceholder] = useState("Enter command...");
  const [targetPlaceholder, setTargetPlaceholder] = useState("Enter command...");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  const { 
    addMessage, 
    resetConversations, 
    settings, 
    currentConversation,
    setConnectionStatus,
    connectionStatus,
    isProcessing,
    setIsProcessing
  } = useAppContext();
  
  // Use our new chat hook
  const { sendMessage } = useChat();
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Show connection status changes and notify user
  const [prevConnectionStatus, setPrevConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | null>(null);
  
  // Function to scramble text with enhanced hacker effect
  const scrambleText = (target: string, current: string, progress: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    
    return target.split('').map((char, index) => {
      // If character is a space or punctuation, preserve it
      if (char === ' ' || /[.,?!]/.test(char)) {
        return char;
      }

      // If we're past the progress point for this character
      if (index < progress * target.length) {
        return char;
      }
      
      // For characters we haven't "solved" yet
      const rand = Math.random();
      
      // Higher chance of showing the correct character as we get closer
      const closeToReveal = (index - (progress * target.length)) < 2;
      if (closeToReveal && rand > 0.6) {
        return target[index];
      }
      
      // Use only letters for scrambling
      return rand > 0.8 ? target[index] : chars[Math.floor(Math.random() * chars.length)];
    }).join('');
  };

  // Animation function to gradually transform placeholder
  const animatePlaceholder = (current: string, target: string, startTime: number) => {
    const duration = 1200; // Faster animation
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress < 1) {
      // Update with scrambled text
      setPlaceholder(scrambleText(target, current, progress));
      
      // Continue animation
      animationTimerRef.current = setTimeout(() => {
        animatePlaceholder(current, target, startTime);
      }, 20); // Even smoother updates
    } else {
      // Animation complete
      setPlaceholder(target);
      
      // Schedule next change with consistent timing
      cycleTimerRef.current = setTimeout(() => {
        const nextIndex = (placeholderIndex + 1) % EXAMPLE_QUESTIONS.length;
        setPlaceholderIndex(nextIndex);
        setTargetPlaceholder(EXAMPLE_QUESTIONS[nextIndex]);
      }, 4000); // Consistent 4-second display time
    }
  };

  // Effect to handle placeholder animation
  useEffect(() => {
    if (!isProcessing && targetPlaceholder !== placeholder) {
      // Clear any existing animation
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      
      // Start new animation
      animatePlaceholder(placeholder, targetPlaceholder, Date.now());
    }
    
    return () => {
      // Cleanup timers
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [targetPlaceholder, isProcessing]);
  
  // Start cycling through examples
  useEffect(() => {
    // Initial setup - start with default and then cycle
    cycleTimerRef.current = setTimeout(() => {
      setTargetPlaceholder(EXAMPLE_QUESTIONS[0]);
    }, 3000);
    
    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Remove the auto-focus when component mounts
    // Only focus if explicitly requested (e.g., after sending a message)
    
    // No longer checking Ollama connection automatically
    // This prevents console spam
    
    // Immediately set connection status to connected
    setConnectionStatus('connected');
  }, [settings.activeProvider, setConnectionStatus]);

  // Also run connection check whenever the conversation changes
  useEffect(() => {
    // Removed Ollama connection check
  }, [currentConversation]);

  // Update previous connection status after the current one changes
  useEffect(() => {
    if (prevConnectionStatus === null) {
      setPrevConnectionStatus(connectionStatus);
      return;
    }
    
    // If we were previously disconnected or error, but now connected,
    // add a system message to inform the user
    if ((prevConnectionStatus === 'disconnected' || prevConnectionStatus === 'error') && 
         connectionStatus === 'connected') {
      const configuredModel = settings.providers.ollama.defaultModel;
      addMessage(`Connection established to Ollama server. Using model: ${configuredModel}`, 'system');
    }
    
    setPrevConnectionStatus(connectionStatus);
  }, [connectionStatus, prevConnectionStatus, settings.providers.ollama.defaultModel, addMessage]);
  
  // Handle input change and auto resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto resize
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
  
  // Handle send message - now calls our new useChat hook
  const handleSendMessage = () => {
    if (input.trim() && !isProcessing) {
      console.log('User sending message:', input.trim());
      
      // Send message using our chat hook
      sendMessage(input.trim());
      setInput('');
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };
  
  // Handle reset button click
  const handleResetClick = () => {
    resetConversations();
    setShowResetButton(false);
  };
  
  // Define the stopAIResponse function to handle stopping the AI response
  const stopAIResponse = () => {
    // Logic to stop the AI response
    setIsProcessing(false);
  };
  
  // Add a function to handle manual focus when user explicitly clicks in the input area
  const handleInputClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <>
      {/* Add the styles to the component */}
      <style>{pulsingLightningStyles}</style>
      
      {/* Add additional styles to hide focus rings */}
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
      `}</style>
      
      <style>{`
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
      
      <div className="command-input-container" style={{
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
        {showResetButton && (
          <button 
            onClick={handleResetClick}
            style={{
              position: 'absolute',
              top: '-40px',
              right: '20px',
              backgroundColor: 'var(--button-bg)',
              color: 'var(--button-text)',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              zIndex: 100,
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.5px',
              fontWeight: 500,
            }}
          >
            Reset All
          </button>
        )}
        
        {/* Lightning bolt icon with animation class */}
        <div className="command-prompt" style={{
          color: 'var(--text-color)',
          marginRight: '0.75rem',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          height: '24px',
          opacity: 0.8,
        }}>
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
        </div>
        
        {/* Wrap the textarea in a div that handles click events */}
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
        
        {/* Upload button */}
        <button
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
            marginLeft: '0.5rem',
            opacity: 0.6,
          }}
          title="Upload file"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </button>
        
        {/* Send button */}
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
            marginLeft: '0.5rem',
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
    </>
  );
};

export default CommandInput;