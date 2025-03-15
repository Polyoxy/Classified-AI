import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

const CommandInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [showResetButton, setShowResetButton] = useState(false); // Set to false by default
  const { addMessage, isProcessing, resetConversations } = useAppContext();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    // Focus input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
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
  
  // Handle send message
  const handleSendMessage = () => {
    if (input.trim() && !isProcessing) {
      addMessage(input.trim(), 'user');
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
  
  return (
    <div className="command-input-container" style={{
      position: 'relative',
      padding: '0.75rem 1rem',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--input-bg)',
      display: 'flex',
      alignItems: 'center',
    }}>
      {showResetButton && (
        <button 
          onClick={handleResetClick}
          style={{
            position: 'absolute',
            top: '-40px',
            right: '20px',
            backgroundColor: 'var(--accent-color)',
            color: 'var(--bg-color)',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 100
          }}
        >
          Reset All
        </button>
      )}
      
      <div className="command-prompt" style={{
        color: 'var(--accent-color)',
        marginRight: '0.5rem',
        userSelect: 'none',
      }}>
        &gt;
      </div>
      
      <textarea
        ref={inputRef}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        disabled={isProcessing}
        placeholder={isProcessing ? "Processing..." : "Type your message..."}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--text-color)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          resize: 'none',
          height: 'auto',
          minHeight: '24px',
          flex: 1,
          outline: 'none',
          padding: '0',
          overflow: 'hidden',
        }}
        rows={1}
      />
      
      <button
        onClick={handleSendMessage}
        disabled={!input.trim() || isProcessing}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: input.trim() && !isProcessing ? 'var(--accent-color)' : 'var(--disabled-color)',
          cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '0.5rem',
          transition: 'all 0.2s ease',
        }}
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
        onMouseOver={(e) => {
          e.currentTarget.style.color = 'var(--accent-color)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = 'var(--text-color)';
        }}
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
    </div>
  );
};

export default CommandInput;