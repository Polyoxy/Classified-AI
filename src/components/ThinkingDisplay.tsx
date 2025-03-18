import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

interface ThinkingDisplayProps {
  content: string;
}

const ThinkingDisplay: React.FC<ThinkingDisplayProps> = ({ content }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';

  // Check if there's any thinking content
  if (!content) return null;

  // Extract thinking content from the message
  const extractThinking = (content: string) => {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const matches = [];
    let match;
    
    while ((match = thinkRegex.exec(content)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches.join('\n\n');
  };

  const thinkingContent = extractThinking(content);
  if (!thinkingContent) return null;

  // Measure content height when collapsed state changes
  useEffect(() => {
    if (!isCollapsed && contentRef.current) {
      // Get the scrollHeight of the content div
      setContentHeight(contentRef.current.scrollHeight);
    } else {
      setContentHeight(0);
    }
  }, [isCollapsed]);

  return (
    <div 
      style={{
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'}`,
        marginBottom: '0.75rem',
      }}
    >
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          padding: '0.4rem 0.75rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isCollapsed ? 'none' : `1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'}`,
          transition: 'background-color 0.2s ease',
        }}
      >
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 500,
          color: isDarkTheme ? '#b0b0b0' : '#505050',
        }}>
          Thinking Process
        </span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isDarkTheme ? '#b0b0b0' : '#505050'} 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      <div 
        ref={contentRef}
        style={{
          maxHeight: isCollapsed ? '0' : `${contentHeight}px`,
          opacity: isCollapsed ? 0 : 1,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out, opacity 0.2s ease-in-out',
          fontSize: '12px',
          lineHeight: 1.5,
          color: isDarkTheme ? '#d0d0d0' : '#333333',
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ padding: '0.75rem' }}>
          {thinkingContent}
        </div>
      </div>
    </div>
  );
};

export default ThinkingDisplay; 