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
        marginBottom: '0.75rem',
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        width: '100%',
        zIndex: 100,
        boxShadow: `0 1px 3px ${isDarkTheme ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.03)'}`,
        backgroundColor: 'transparent',
        color: isDarkTheme ? 'rgba(224, 224, 224, 0.85)' : 'rgba(50, 50, 60, 0.85)',
        border: `1px solid ${isDarkTheme ? 'rgba(60, 60, 70, 0.2)' : 'rgba(200, 200, 220, 0.3)'}`,
      }}
    >
      <div 
        className="thinking-header"
        onClick={toggleExpand}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: isDarkTheme ? 'rgba(30, 30, 33, 0.4)' : 'rgba(245, 245, 250, 0.6)',
          borderBottom: isExpanded ? `1px solid ${isDarkTheme ? 'rgba(60, 60, 70, 0.2)' : 'rgba(200, 200, 220, 0.3)'}` : 'none',
        }}
      >
        <div 
          className="thinking-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 500,
            fontSize: '12px',
            letterSpacing: '0.5px',
            color: isDarkTheme ? 'rgba(200, 200, 220, 0.9)' : 'rgba(80, 80, 90, 0.9)',
          }}
        >
          <div 
            className="pulse-container"
            style={{
              position: 'relative',
              width: '16px',
              height: '16px',
              marginRight: '8px',
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
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--thinking-color)',
                    opacity: 0.8,
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
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--thinking-color)',
                    opacity: 0.4,
                    zIndex: 1,
                    animation: 'pulse 1.8s ease-out infinite',
                  }}
                ></div>
              </>
            )}
          </div>
          <span>Thinking...</span>
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
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: isDarkTheme ? 'rgba(190, 190, 200, 0.7)' : 'rgba(80, 80, 90, 0.7)',
            opacity: 0.7,
          }}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      {isExpanded && (
        <div 
          className="thinking-content"
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            transition: 'max-height 0.3s ease, padding 0.3s ease',
            backgroundColor: isDarkTheme ? 'rgba(25, 25, 28, 0.3)' : 'rgba(250, 250, 255, 0.5)',
            color: isDarkTheme ? 'rgba(200, 200, 220, 0.9)' : 'rgba(70, 70, 80, 0.9)',
          }}
        >
          <pre style={{ margin: 0 }}>{displayedContent || 'Processing...'}</pre>
        </div>
      )}
    </div>
  );
};

export default ThinkingIndicator; 