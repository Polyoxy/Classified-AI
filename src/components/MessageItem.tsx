import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

interface MessageItemProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  isProcessing?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  role, 
  content, 
  timestamp,
  isProcessing 
}) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [showCopied, setShowCopied] = useState(false);
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const thinkingContentRef = useRef<HTMLDivElement>(null);

  // Process content to remove thinking tags from display
  const processContent = (content: string): string => {
    // Remove thinking tags from display content
    return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  };
  
  // Extract thinking content from message
  const extractThinking = (content: string): string => {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const matches = [];
    let match;
    
    while ((match = thinkRegex.exec(content)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches.join('\n\n');
  };
  
  const displayContent = processContent(content);
  const thinkingContent = extractThinking(content);
  const hasThinking = thinkingContent.length > 0;

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  // Measure content height when collapsed state changes
  useEffect(() => {
    if (!isThinkingCollapsed && thinkingContentRef.current) {
      // Get the scrollHeight of the content div
      setContentHeight(thinkingContentRef.current.scrollHeight);
    } else {
      setContentHeight(0);
    }
  }, [isThinkingCollapsed]);

  // Get message style based on role
  const getMessageStyle = () => {
    if (role === 'system') {
      return {
        backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        color: isDarkTheme ? '#888' : '#666',
        fontStyle: 'italic' as const,
      };
    }

    if (role === 'user') {
      return {
        backgroundColor: isDarkTheme ? 'rgba(58, 134, 255, 0.08)' : 'rgba(58, 134, 255, 0.03)',
        color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
        border: `1px solid ${isDarkTheme ? 'rgba(58, 134, 255, 0.2)' : 'rgba(58, 134, 255, 0.1)'}`,
      };
    }

    return {
      backgroundColor: isDarkTheme ? 'rgba(23, 23, 23, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
      backdropFilter: 'blur(8px)',
    };
  };

  // Format timestamp
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div style={{
      marginBottom: '2.5rem',
      opacity: isProcessing ? 0.7 : 1,
      transition: 'opacity 0.2s ease',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.25rem',
        fontSize: '12px',
        color: isDarkTheme ? '#888' : '#666',
      }}>
        <span style={{ fontWeight: 'bold' }}>
          {role === 'user' ? 'You' : role === 'system' ? 'System' : ''}
        </span>
      </div>

      <div style={{
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        ...getMessageStyle(),
      }}>
        {/* Thinking Section */}
        {(hasThinking || isProcessing) && role === 'assistant' && (
          <>
            <div 
              onClick={() => setIsThinkingCollapsed(!isThinkingCollapsed)}
              style={{
                padding: '0.4rem 0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: isThinkingCollapsed ? 'none' : `1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'}`,
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
                  transform: isThinkingCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            <div 
              ref={thinkingContentRef}
              style={{
                maxHeight: isThinkingCollapsed ? '0' : `${contentHeight}px`,
                opacity: isThinkingCollapsed ? 0 : 1,
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-in-out, opacity 0.2s ease-in-out',
                fontSize: '12px',
                lineHeight: 1.5,
                color: isDarkTheme ? '#d0d0d0' : '#333333',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)',
                borderBottom: !isThinkingCollapsed ? `1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'}` : 'none',
              }}
            >
              <div style={{ padding: '0.75rem' }}>
                {thinkingContent || (isProcessing ? 'Thinking...' : '')}
              </div>
            </div>
          </>
        )}

        <div style={{
          padding: '1rem',
          paddingBottom: timestamp ? '1.5rem' : '1rem',
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          position: 'relative',
        }}>
          {displayContent}
          
          {/* Timestamp positioned at bottom right */}
          {timestamp && (
            <div style={{
              position: 'absolute',
              bottom: '0.5rem',
              right: '0.75rem',
              fontSize: '11px',
              color: isDarkTheme ? 'rgba(180, 180, 180, 0.6)' : 'rgba(100, 100, 100, 0.6)',
            }}>
              {formatTime(timestamp)}
            </div>
          )}
        </div>
      </div>

      {/* Copy button for AI responses only */}
      {role === 'assistant' && !isProcessing && (
        <div 
          onClick={handleCopy}
          title={showCopied ? "Copied!" : "Copy to clipboard"}
          style={{
            position: 'absolute',
            bottom: '-22px',
            right: '0',
            cursor: 'pointer',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: showCopied ? 1 : 0.7,
            color: isDarkTheme ? 'rgba(180, 180, 180, 0.8)' : 'rgba(120, 120, 120, 0.8)',
            fontSize: '12px',
            padding: '3px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = showCopied ? '1' : '0.7'}
        >
          {showCopied ? (
            <span style={{ fontSize: '12px', marginRight: '4px' }}>Copied</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MessageItem;