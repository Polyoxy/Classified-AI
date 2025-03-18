import React, { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
  isThinking: boolean;
  thinkingContent?: string;
  isDarkTheme: boolean;
  onToggleCollapse?: (isVisible: boolean) => void;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  isThinking,
  thinkingContent = '',
  isDarkTheme,
  onToggleCollapse
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Toggle collapse state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (onToggleCollapse) onToggleCollapse(!isExpanded);
  };
  
  // Simulated thinking content reveal effect
  useEffect(() => {
    if (!isThinking || !thinkingContent) {
      setDisplayedContent('');
      setCurrentIndex(0);
      return;
    }
    
    if (currentIndex < thinkingContent.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(thinkingContent.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 10); // Speed of text reveal
      
      return () => clearTimeout(timer);
    }
  }, [isThinking, thinkingContent, currentIndex]);
  
  if (!isThinking && !displayedContent) return null;
  
  return (
    <div 
      className="thinking-container" 
      style={{
        marginBottom: '1rem',
        borderRadius: '6px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        width: '100%',
        zIndex: 100,
        boxShadow: `0 2px 8px ${isDarkTheme ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)'}`,
        backgroundColor: isDarkTheme ? 'var(--thinking-bg-dark)' : 'var(--thinking-bg-light)',
        color: isDarkTheme ? '#e0e0e0' : '#333',
      }}
    >
      <div 
        className="thinking-header"
        onClick={toggleExpand}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: isDarkTheme ? 'rgba(30, 30, 33, 0.8)' : 'rgba(235, 235, 240, 0.9)',
          borderBottom: `1px solid ${isDarkTheme ? 'rgba(60, 60, 70, 0.5)' : 'rgba(180, 180, 200, 0.5)'}`,
        }}
      >
        <div 
          className="thinking-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '0.7px',
            textTransform: 'uppercase',
          }}
        >
          <div 
            className="pulse-container"
            style={{
              position: 'relative',
              width: '20px',
              height: '20px',
              marginRight: '10px',
            }}
          >
            {isThinking && (
              <>
                <div 
                  className="pulse-dot"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--thinking-color)',
                    zIndex: 2,
                  }}
                ></div>
                <div 
                  className="pulse-ring"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--thinking-color)',
                    opacity: 0.7,
                    zIndex: 1,
                    animation: 'pulse 1.5s ease-out infinite',
                  }}
                ></div>
              </>
            )}
          </div>
          <span>THINKING</span>
        </div>
        <button 
          className="collapse-button"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand();
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: isDarkTheme ? 'rgba(224, 224, 224, 0.8)' : 'rgba(50, 50, 60, 0.8)',
          }}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isExpanded && (
        <div 
          className="thinking-content"
          style={{
            maxHeight: '600px',
            overflowY: 'auto',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            transition: 'max-height 0.3s ease, padding 0.3s ease',
            backgroundColor: isDarkTheme ? 'rgba(25, 25, 28, 0.8)' : 'rgba(250, 250, 255, 0.8)',
          }}
        >
          <pre>{displayedContent || 'Processing...'}</pre>
        </div>
      )}
    </div>
  );
};

export default ThinkingIndicator; 