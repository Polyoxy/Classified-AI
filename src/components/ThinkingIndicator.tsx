import React, { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
  isThinking: boolean;
  thinkingContent?: string;
  isDarkTheme: boolean;
  thinkingPhase?: 'reasoning' | 'processing' | null;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  isThinking,
  thinkingContent = '',
  isDarkTheme,
  thinkingPhase
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Toggle collapse state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  if (!isThinking) return null;
  
  return (
    <div className="thinking-container" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    }}>
      <div className="pulse-dot" style={{
        width: '3px',
        height: '3px',
        borderRadius: '50%',
        backgroundColor: isDarkTheme ? 'rgba(200, 200, 220, 0.6)' : 'rgba(80, 80, 90, 0.6)',
        animation: 'pulse 2.5s infinite',
      }} />
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default ThinkingIndicator; 