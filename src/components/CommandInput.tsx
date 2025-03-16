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

const CommandInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [showResetButton, setShowResetButton] = useState(false); // Set to false by default
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
  
  // Show connection status changes and notify user
  const [prevConnectionStatus, setPrevConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | null>(null);
  
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
      
      <div className="command-input-container" style={{
        position: 'relative',
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: settings?.theme === 'dark' ? '#1a1a1a' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        boxShadow: settings?.theme === 'dark' 
          ? 'inset 0 1px 3px rgba(0,0,0,0.2)' 
          : 'inset 0 1px 3px rgba(0,0,0,0.05)',
        borderRadius: '8px',
        margin: '0.5rem',
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
              fontSize: `${settings?.fontSize || 14}px`,
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
        }}>
          <svg 
            className="lightning-icon"
            width="18" 
            height="18" 
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
            placeholder={isProcessing ? "Processing request..." : "Enter command..."}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-color)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: `${settings?.fontSize || 14}px`,
              resize: 'none',
              height: 'auto',
              minHeight: '24px',
              width: '100%',
              outline: 'none',
              padding: '0',
              paddingTop: '4px',
              overflow: 'hidden',
              lineHeight: '1.5',
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
            transition: 'all 0.2s ease',
          }}
          title="Upload file"
        >
          <svg 
            width="18" 
            height="18" 
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
            transition: 'all 0.2s ease',
            opacity: input.trim() && !isProcessing ? 1 : 0.5,
          }}
          title="Send message"
        >
          <svg 
            width="18" 
            height="18" 
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