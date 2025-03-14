import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

interface CommandInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onClearChat: () => void;
  onOpenSettings: () => void;
}

const CommandInput: React.FC<CommandInputProps> = ({
  onSendMessage,
  isProcessing,
  onClearChat,
  onOpenSettings,
}) => {
  const { resetConversations } = useAppContext();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showResetButton, setShowResetButton] = useState(true); // Temporary button

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-container" style={{
      display: 'flex',
      padding: '12px 16px',
      marginBottom: '0',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-color)',
      position: 'relative', // To position the reset button
    }}>
      {showResetButton && (
        <button
          onClick={() => {
            resetConversations(); 
            setShowResetButton(false);
          }}
          style={{
            position: 'absolute',
            top: '-40px', 
            right: '16px',
            backgroundColor: '#ff5555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            fontFamily: 'inherit',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 1000,
          }}
        >
          Reset All (Remove Welcome Message)
        </button>
      )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        gap: '12px',
      }}>
        <div className="input-prompt" style={{
          color: 'var(--accent-color)',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '15px',
          textAlign: 'center',
        }}>$</div>
        
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--input-bg)',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          height: '36px',
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={isProcessing}
            style={{
              flex: 1,
              resize: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-color)',
              border: 'none',
              padding: '0 12px',
              fontFamily: 'inherit',
              fontSize: '14px',
              height: '36px',
              lineHeight: '36px',
              outline: 'none',
              overflow: 'hidden',
            }}
            rows={1}
          />
        </div>
        
        <button
          onClick={() => {
            // Upload file functionality would go here
          }}
          title="Upload Classified Document"
          className="upload-btn"
          style={{
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '0 14px',
            minWidth: '80px',
            height: '36px',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-hover)';
            e.currentTarget.style.color = 'var(--accent-color)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--input-bg)';
            e.currentTarget.style.color = 'var(--text-color)';
          }}
        >
          Upload
        </button>
        
        <button
          onClick={handleSend}
          disabled={!input.trim() || isProcessing}
          className="send-btn"
          style={{
            backgroundColor: !input.trim() || isProcessing ? 'var(--input-bg)' : 'var(--accent-color)',
            color: !input.trim() || isProcessing ? 'var(--text-muted)' : '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '0 14px',
            minWidth: '80px',
            height: '36px',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: !input.trim() || isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: !input.trim() || isProcessing ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => {
            if (input.trim() && !isProcessing) {
              e.currentTarget.style.backgroundColor = 'var(--accent-color-dark)';
            }
          }}
          onMouseOut={(e) => {
            if (input.trim() && !isProcessing) {
              e.currentTarget.style.backgroundColor = 'var(--accent-color)';
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default CommandInput;