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
    changeModel,
  } = useAppContext();
  
  // Add state for model dropdown
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Reference for model dropdown
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showModelDropdown && 
        modelDropdownRef.current && 
        modelSelectorRef.current && 
        !modelDropdownRef.current.contains(event.target as Node) &&
        !modelSelectorRef.current.contains(event.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelDropdown]);
  
  // Define a model interface
  interface Model {
    id: string;
    name: string;
  }
  
  // Get available models or fallback to empty array
  const getAvailableModels = (): string[] => {
    const provider = currentConversation?.provider || settings?.activeProvider;
    
    // Get models from settings
    const models = settings?.providers?.[provider]?.models || [];
    
    // Make sure llama3.2:1b is included for Ollama if not already in the list
    if (provider === 'ollama' && !models.includes('llama3.2:1b')) {
      return ['llama3.2:1b', ...models];
    }
    
    return models;
  };
  
  // Make sure we always have a valid model selected to display
  const getCurrentModel = () => {
    // If a conversation exists with a model, use that
    if (currentConversation?.model) return currentConversation.model;
    
    // Default to the provider's default model
    if (settings?.activeProvider) {
      return settings.providers[settings.activeProvider].defaultModel || 
             (settings.activeProvider === 'ollama' ? 'llama3.2:1b' : 'Unknown');
    }
    
    // Fallback to first available model
    const models = getAvailableModels();
    if (models.length > 0) {
      return models[0];
    }
    
    return 'No models available';
  };
  
  const availableModels = getAvailableModels();
  const currentModel = getCurrentModel();
  
  // Add additional styles for the gradient and mobile optimization
  const customStyles = `
    @media (max-width: 767px) {
      .command-input {
        position: fixed !important;
        bottom: 32px !important; /* More space from bottom on mobile */
        left: 10px !important;
        right: 10px !important;
        width: calc(100% - 20px) !important;
        max-width: calc(100% - 20px) !important;
        margin: 0 auto !important;
        z-index: 80 !important;
        background: ${settings?.theme === 'dark' 
          ? 'linear-gradient(to bottom, rgba(18, 18, 18, 0.85), rgba(24, 24, 24, 0.95))' 
          : 'linear-gradient(to bottom, rgba(245, 245, 245, 0.85), rgba(250, 250, 250, 0.95))'} !important;
        padding: 12px 16px !important; /* Larger padding for bigger input area */
        min-height: 60px !important; /* Increase minimum height */
      }
      
      .command-input textarea {
        font-size: 16px !important; /* Larger font size on mobile */
        min-height: 24px !important; /* Taller input area */
      }
    }
    
    @media (min-width: 768px) {
      .command-input {
        position: fixed !important;
        bottom: 48px !important; /* More space from bottom on desktop */
        left: 50% !important;
        transform: translateX(-50%) !important;
        margin: 0 !important;
        z-index: 80 !important;
        width: calc(100% - 3rem) !important;
        max-width: 800px !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.25' : '0.1'}) !important;
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
      // Reset height temporarily to get the correct scrollHeight
      inputRef.current.style.height = '0px';
      
      // Set to scrollHeight to adjust to content
      const scrollHeight = inputRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 200);
      inputRef.current.style.height = `${newHeight}px`;
      
      // Enable scrolling if content exceeds max height
      inputRef.current.style.overflowY = scrollHeight > 200 ? 'auto' : 'hidden';
      
      // Adjust container height if needed
      const container = inputRef.current.closest('.command-input-container') as HTMLElement;
      if (container) {
        container.style.height = newHeight > 45 ? 'auto' : '45px';
      }
    }
  };
  
  // Auto-resize when component mounts or input changes
  useEffect(() => {
    if (inputRef.current && input) {
      // Reset height temporarily to get the correct scrollHeight
      inputRef.current.style.height = '0px';
      
      // Set to scrollHeight to adjust to content
      const scrollHeight = inputRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 200);
      inputRef.current.style.height = `${newHeight}px`;
      
      // Enable scrolling if content exceeds max height
      inputRef.current.style.overflowY = scrollHeight > 200 ? 'auto' : 'hidden';
      
      // Adjust container height if needed
      const container = inputRef.current.closest('.command-input-container') as HTMLElement;
      if (container) {
        container.style.height = newHeight > 45 ? 'auto' : '45px';
      }
    }
  }, [input]);
  
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
        // Reset textarea height
        inputRef.current.style.height = '24px';
        inputRef.current.style.overflowY = 'hidden';
        
        // Reset container height
        const container = inputRef.current.closest('.command-input-container') as HTMLElement;
        if (container) {
          container.style.height = '45px';
        }
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
      // Call stopResponse which now handles everything
      stopResponse();
    }
  };
  
  // Handle model change
  const handleModelChange = (model: string) => {
    if (currentConversation && !isProcessing) {
      changeModel(model);
      setShowModelDropdown(false);
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
    <div style={{
      position: 'fixed',
      bottom: '48px', /* Increase space from bottom */
      left: '0',
      right: '0',
      zIndex: 100,
      backgroundColor: settings?.theme === 'dark' ? '#121212' : '#f8f9fa',
      padding: '1rem',
      transition: 'right 0.3s ease',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
      }}>
        {/* Model selector */}
        <div style={{
          position: 'absolute',
          bottom: '-24px',
          left: '0',
          fontSize: '12px',
          color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.7)' : 'rgba(120, 120, 120, 0.7)',
          cursor: 'pointer',
          zIndex: 10,
          userSelect: 'none',
        }}>
          <div 
            ref={modelSelectorRef}
            onClick={() => !isProcessing && setShowModelDropdown(!showModelDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: isProcessing ? 0.5 : 0.8,
              transition: 'opacity 0.2s',
              padding: '0.25rem 0.4rem',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.opacity = '0.8')}
          >
            <span style={{ 
              fontWeight: 500,
              fontSize: '11px',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginRight: '4px',
            }}>
              {currentModel}
            </span>
            <svg 
              width="10" 
              height="10" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                transform: showModelDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                opacity: 0.6,
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {/* Model dropdown */}
          {showModelDropdown && (
            <div 
              ref={modelDropdownRef}
              style={{
                position: 'absolute',
                bottom: '22px',
                left: '0',
                backgroundColor: settings?.theme === 'dark' ? 'rgba(26, 26, 26, 0.95)' : 'rgba(245, 245, 245, 0.95)',
                border: `1px solid ${settings?.theme === 'dark' ? 'rgba(60, 60, 60, 0.7)' : 'rgba(200, 200, 200, 0.7)'}`,
                borderRadius: '4px',
                marginBottom: '4px',
                zIndex: 10000,
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: settings?.theme === 'dark' ? '0 -4px 8px rgba(0,0,0,0.3)' : '0 -4px 8px rgba(0,0,0,0.1)',
                fontFamily: 'Inter, sans-serif',
                backdropFilter: 'blur(6px)',
                minWidth: '160px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {availableModels.map((model) => (
                <div 
                  key={model}
                  className="model-option"
                  onClick={() => handleModelChange(model)}
                  style={{
                    padding: '0.4rem',
                    cursor: 'pointer',
                    backgroundColor: model === currentModel
                      ? (settings?.theme === 'dark' ? '#333' : '#e0e0e0') 
                      : 'transparent',
                    transition: 'all 0.1s ease',
                    fontSize: '12px',
                    letterSpacing: '0.2px',
                    fontWeight: model === currentModel ? 'bold' : 'normal',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? '#333' : '#e0e0e0';
                  }}
                  onMouseOut={(e) => {
                    if (model !== currentModel) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {model}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="command-input-container" style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          backgroundColor: 'transparent',
          borderRadius: '8px',
          padding: '0.75rem',
          minHeight: '45px',
          height: 'auto',
          position: 'relative',
          transition: 'height 0.2s ease',
        }}>
          <style>
            {`
              .command-input-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 8px;
                padding: 1px;
                background: linear-gradient(
                  45deg,
                  rgba(128, 128, 128, 0.2),
                  rgba(64, 64, 64, 0.2),
                  rgba(128, 128, 128, 0.2)
                );
                -webkit-mask: linear-gradient(#fff 0 0) content-box,
                           linear-gradient(#fff 0 0);
                mask: linear-gradient(#fff 0 0) content-box,
                      linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                pointer-events: none;
                animation: borderGlow 4s linear infinite;
              }
              
              @keyframes borderGlow {
                0% {
                  filter: brightness(1) blur(1px);
                }
                50% {
                  filter: brightness(1.2) blur(1.5px);
                }
                100% {
                  filter: brightness(1) blur(1px);
                }
              }
            `}
          </style>
          <div style={{
            color: settings?.theme === 'dark' ? 'rgba(208, 208, 208, 0.6)' : 'rgba(64, 64, 64, 0.6)',
            marginRight: '0.75rem',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            height: '18px',
            opacity: 0.7,
            marginTop: '2px',
            flexShrink: 0,
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
              display: 'flex',
              alignItems: 'flex-start',
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
                height: '24px', // Start with a minimum height
                minHeight: '24px',
                maxHeight: '200px', // Maximum height
                width: '100%',
                outline: 'none',
                padding: '0',
                paddingTop: '0',
                overflow: 'auto', // Change from 'hidden' to 'auto' to allow scrolling
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
          
          <div style={{ 
              display: 'flex', 
              gap: '0.5rem',
              alignSelf: 'flex-start',
              marginTop: '2px',
              flexShrink: 0,
            }}>
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
                  flexShrink: 0,
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
                flexShrink: 0,
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
      </div>
      <style>
        {`
          .no-focus-visible:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          
          .no-focus-visible:focus-visible {
            outline: none !important;
            box-shadow: none !important;
          }
          
          textarea::selection {
            background-color: ${settings?.theme === 'dark' ? 'rgba(100, 100, 100, 0.4)' : 'rgba(200, 200, 200, 0.4)'};
          }
          
          /* For Firefox */
          textarea::-moz-selection {
            background-color: ${settings?.theme === 'dark' ? 'rgba(100, 100, 100, 0.4)' : 'rgba(200, 200, 200, 0.4)'};
          }
        `}
      </style>
    </div>
  );
};

export default CommandInput;