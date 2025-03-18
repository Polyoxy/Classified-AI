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
  const [isExpanded, setIsExpanded] = useState(false);
  const [reasoningPhase, setReasoningPhase] = useState<'reasoning' | 'reasoned' | null>(null);
  const [shouldShowContent, setShouldShowContent] = useState(false);
  
  // Reset states when thinking starts/stops
  useEffect(() => {
    if (isThinking) {
      setReasoningPhase('reasoning');
      const timer = setTimeout(() => {
        setReasoningPhase('reasoned');
      }, 10000); // Switch to "reasoned" after 10 seconds
      return () => clearTimeout(timer);
    } else {
      setReasoningPhase(null);
      setIsExpanded(false);
    }
  }, [isThinking]);

  // Toggle collapse state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setShouldShowContent(true);
    if (onToggleCollapse) onToggleCollapse(!isExpanded);
  };
  
  if (!isThinking && !shouldShowContent) return null;
  
  return (
    <div 
      className="thinking-container" 
      style={{
        marginBottom: '0.5rem',
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        width: '100%',
        backgroundColor: isDarkTheme ? 'rgba(30, 30, 33, 0.2)' : 'rgba(245, 245, 250, 0.2)',
        border: `1px solid ${isDarkTheme ? 'rgba(60, 60, 70, 0.1)' : 'rgba(200, 200, 220, 0.2)'}`,
      }}
    >
      <div 
        className="thinking-header"
        onClick={toggleExpand}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          cursor: 'pointer',
          userSelect: 'none',
          fontSize: '11px',
          letterSpacing: '0.3px',
          color: isDarkTheme ? 'rgba(200, 200, 220, 0.8)' : 'rgba(80, 80, 90, 0.8)',
        }}
      >
        <div 
          className="thinking-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div 
            className="pulse-container"
            style={{
              position: 'relative',
              width: '12px',
              height: '12px',
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
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: isDarkTheme ? '#4a9eff' : '#1e88e5',
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
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: isDarkTheme ? '#4a9eff' : '#1e88e5',
                    opacity: 0.4,
                    zIndex: 1,
                    animation: 'pulse 2s ease-out infinite',
                  }}
                ></div>
              </>
            )}
          </div>
          <span style={{ 
            fontFamily: 'var(--font-general)',
            opacity: 0.9,
          }}>
            {reasoningPhase === 'reasoning' ? 'Reasoning...' : 'Reasoned'}
          </span>
        </div>
        {thinkingContent && (
          <button 
            className="collapse-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              fontSize: '10px',
              cursor: 'pointer',
              color: isDarkTheme ? 'rgba(190, 190, 200, 0.6)' : 'rgba(80, 80, 90, 0.6)',
              opacity: 0.7,
            }}
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
      </div>
      
      {isExpanded && thinkingContent && (
        <div 
          className="thinking-content"
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '8px',
            fontSize: '12px',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            backgroundColor: isDarkTheme ? 'rgba(25, 25, 28, 0.2)' : 'rgba(250, 250, 255, 0.3)',
            color: isDarkTheme ? 'rgba(200, 200, 220, 0.8)' : 'rgba(70, 70, 80, 0.8)',
            borderTop: `1px solid ${isDarkTheme ? 'rgba(60, 60, 70, 0.1)' : 'rgba(200, 200, 220, 0.2)'}`,
          }}
        >
          <pre style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>{thinkingContent}</pre>
        </div>
      )}
    </div>
  );
};

export default ThinkingIndicator; 