import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import CodeSnippet from './CodeSnippet';

interface MessageItemProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  isProcessing?: boolean;
  model?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  role, 
  content, 
  timestamp,
  isProcessing,
  model 
}) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [showCopied, setShowCopied] = useState(false);
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const thinkingContentRef = useRef<HTMLDivElement>(null);
  const prevProcessingRef = useRef(isProcessing);

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

  // Effect to collapse thinking when processing is done
  useEffect(() => {
    // Check if processing has just finished
    if (prevProcessingRef.current === true && isProcessing === false) {
      // Auto collapse when thinking is done
      setIsThinkingCollapsed(true);
    }
    
    // Update ref for next check
    prevProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Helper to determine color based on content
  const getCodeColor = (line: string, isDark: boolean): string => {
    // HTML tag detection
    if (line.match(/<\/?[a-zA-Z]+.*?>/)) {
      return isDark ? '#CE9178' : '#800000'; // Tags
    }
    // HTML attribute detection
    if (line.match(/\s[a-zA-Z]+=["']/)) {
      return isDark ? '#9CDCFE' : '#0000FF'; // Attributes
    }
    // DOCTYPE declaration
    if (line.includes('<!DOCTYPE')) {
      return isDark ? '#569CD6' : '#0000FF';
    }
    // Default text color
    return isDark ? '#D4D4D4' : '#333333';
  };

  // Format content with code blocks - improved to handle live content
  const formatContent = (content: string) => {
    // If no content yet during processing, show empty space
    if (!content && isProcessing) {
      return <div style={{ minHeight: '20px' }}></div>;
    }
    
    // Split by code blocks (triple backticks)
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a code block or a partial code block during processing
      if (part.startsWith('```')) {
        // For completed code blocks
        if (part.endsWith('```')) {
          const match = part.match(/```(?:([a-zA-Z0-9]+))?\n([\s\S]*?)```/);
          
          if (match) {
            const [, language, code] = match;
            
            // Look for title comment at the beginning of the code
            let title = '';
            const titleMatch = code.match(/^\/\/\s*(.+?)\s*\n/);
            const cleanedCode = titleMatch ? code.substring(titleMatch[0].length) : code;
            
            if (titleMatch) {
              title = titleMatch[1];
            } else {
              // Try to guess a title from the code
              if (language === 'javascript' || language === 'typescript') {
                const functionMatch = code.match(/function\s+(\w+)/);
                const constMatch = code.match(/const\s+(\w+)/);
                const classMatch = code.match(/class\s+(\w+)/);
                
                if (functionMatch) {
                  title = `Function: ${functionMatch[1]}`;
                } else if (classMatch) {
                  title = `Class: ${classMatch[1]}`;
                } else if (constMatch) {
                  title = `${constMatch[1]}`;
                } else {
                  title = language ? `${language.charAt(0).toUpperCase() + language.slice(1)} code` : 'Code snippet';
                }
              } else if (language === 'html') {
                title = 'HTML Template';
              } else if (language === 'css') {
                title = 'CSS Styles';
              } else if (language === 'python') {
                const defMatch = code.match(/def\s+(\w+)/);
                const classMatch = code.match(/class\s+(\w+)/);
                
                if (defMatch) {
                  title = `Function: ${defMatch[1]}`;
                } else if (classMatch) {
                  title = `Class: ${classMatch[1]}`;
                } else {
                  title = 'Python code';
                }
              } else {
                title = language ? `${language.charAt(0).toUpperCase() + language.slice(1)} code` : 'Code snippet';
              }
            }
            
            return (
              <CodeSnippet 
                key={index} 
                code={cleanedCode}
                language={language || ''}
                title={title}
              />
            );
          }
        } 
        // For partial/in-progress code blocks during processing
        else if (isProcessing) {
          const match = part.match(/```(?:([a-zA-Z0-9]+))?\n?([\s\S]*)/);
          
          if (match) {
            const [, language, code] = match;
            
            return (
              <div key={index} className="code-block-container" style={{
                backgroundColor: isDarkTheme ? '#1E1E1E' : '#F5F5F5',
                borderRadius: '4px',
                padding: '0.5rem',
                margin: '0.5rem 0',
                overflow: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                lineHeight: 1.5,
                whiteSpace: 'pre',
                position: 'relative',
              }}>
                {code.split('\n').map((line, lineIndex) => (
                  <div key={lineIndex} style={{
                    display: 'block',
                    color: getCodeColor(line, isDarkTheme),
                    paddingLeft: getIndentation(line),
                  }}>
                    {line}
                  </div>
                ))}
              </div>
            );
          }
        }
      }
      
      // Regular text
      return <span key={index}>{part}</span>;
    });
  };
  
  // Helper to maintain indentation
  const getIndentation = (line: string): string => {
    const indent = line.match(/^(\s*)/)?.[1] || '';
    return indent.replace(/ /g, '\u00A0').replace(/\t/g, '\u00A0\u00A0');
  };

  // Get message style based on role
  const getMessageStyle = () => {
    if (role === 'system') {
      return {
        backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        color: isDarkTheme ? '#888' : '#666',
        fontStyle: 'italic' as const,
        borderRadius: '10px',
      };
    }

    if (role === 'user') {
      return {
        backgroundColor: isDarkTheme ? 'rgba(58, 134, 255, 0.08)' : 'rgba(58, 134, 255, 0.03)',
        color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
        border: `1px solid ${isDarkTheme ? 'rgba(58, 134, 255, 0.2)' : 'rgba(58, 134, 255, 0.1)'}`,
        borderRadius: 'var(--chat-bubble-radius-user)',
      };
    }

    return {
      backgroundColor: isDarkTheme ? 'rgba(23, 23, 23, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
      backdropFilter: 'blur(8px)',
      borderRadius: 'var(--chat-bubble-radius-ai)',
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
    <div className="response-container" style={{
      opacity: isProcessing ? 0.7 : 1,
      transition: 'opacity 0.2s ease, width 0.3s ease, transform 0.3s ease',
      position: 'relative',
      marginBottom: role === 'assistant' ? '3rem' : '2.5rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-1)',
        marginBottom: 'var(--spacing-1)',
        fontSize: 'var(--font-size-caption)',
        color: isDarkTheme ? '#888' : '#666',
      }}>
        <span style={{ fontWeight: 'bold' }}>
          {role === 'user' ? 'You' : role === 'system' ? 'System' : ''}
        </span>
      </div>

      <div style={{
        overflow: 'hidden',
        position: 'relative',
        boxShadow: role === 'assistant' ? `0px 2px 4px ${isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}` : 'none',
        ...getMessageStyle(),
      }}>
        {/* Thinking Section */}
        {(hasThinking || isProcessing) && role === 'assistant' && (
          <>
            <div 
              onClick={() => setIsThinkingCollapsed(!isThinkingCollapsed)}
              style={{
                padding: 'var(--spacing-1) var(--spacing-2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: isThinkingCollapsed ? 'none' : `1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'}`,
                transition: 'background-color 0.2s ease',
                backgroundColor: isDarkTheme ? 'rgba(35, 35, 38, 0.4)' : 'rgba(250, 250, 252, 0.8)',
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
            
            {/* True summary - only shown when collapsed */}
            {isThinkingCollapsed && (
              <div style={{
                padding: 'var(--spacing-1) var(--spacing-2)',
                fontSize: '11px',
                fontStyle: 'normal',
                color: isDarkTheme ? 'rgba(208, 208, 208, 0.7)' : 'rgba(80, 80, 80, 0.7)',
                backgroundColor: isDarkTheme ? 'rgba(32, 32, 34, 0.3)' : 'rgba(248, 248, 250, 0.5)',
                borderBottom: `1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.2)' : 'rgba(200, 200, 200, 0.4)'}`,
                borderTop: `1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.2)' : 'rgba(200, 200, 200, 0.4)'}`,
                margin: 0,
              }}>
                {(() => {
                  // Create a true summary of the request instead of showing what the user wrote
                  
                  // Extract the core topic or intent from the thinking content
                  const extractTopic = () => {
                    // Look for explicit topic mentions
                    const topicPatterns = [
                      /(?:about|regarding|concerning|on) ([\w\s-]+)/i,
                      /topic is ([\w\s-]+)/i,
                      /([a-z\s]+) poem/i,
                      /([a-z\s]+) code/i,
                      /([a-z\s]+) script/i,
                      /([a-z\s]+) data/i
                    ];
                    
                    for (const pattern of topicPatterns) {
                      const match = thinkingContent.match(pattern);
                      if (match && match[1] && match[1].length > 2) {
                        return match[1].trim();
                      }
                    }
                    
                    // Extract nouns after key verbs
                    const verbObjectPatterns = [
                      /(?:make|create|generate|write)(?: a| an)? ([a-z\s]+)/i,
                      /(?:explain|describe|clarify)(?: the| about)? ([a-z\s]+)/i,
                      /(?:find|search for|look up)(?: the| some)? ([a-z\s]+)/i
                    ];
                    
                    for (const pattern of verbObjectPatterns) {
                      const match = thinkingContent.match(pattern);
                      if (match && match[1] && match[1].length > 2) {
                        return match[1].trim();
                      }
                    }
                    
                    return '';
                  };
                  
                  // Determine the action/intent
                  const extractIntent = () => {
                    if (thinkingContent.match(/(?:create|make|generate|write|compose)/i)) 
                      return 'Create';
                    if (thinkingContent.match(/(?:explain|describe|tell|clarify)/i)) 
                      return 'Explain';
                    if (thinkingContent.match(/(?:analyze|review|evaluate|assess)/i)) 
                      return 'Analyze';
                    if (thinkingContent.match(/(?:find|search|locate)/i)) 
                      return 'Find';
                    if (thinkingContent.match(/(?:compare|contrast|differentiate)/i)) 
                      return 'Compare';
                    if (thinkingContent.match(/(?:summarize|summarise|recap)/i)) 
                      return 'Summarize';
                    if (thinkingContent.match(/(?:help|assist|aid)/i)) 
                      return 'Help with';
                    
                    // Default
                    return 'Request about';
                  };
                  
                  // Build the summary
                  const topic = extractTopic();
                  const intent = extractIntent();
                  
                  if (topic) {
                    let summary = `${intent} ${topic}`;
                    
                    // Clean up and format the summary
                    summary = summary
                      .replace(/\s+/g, ' ')
                      .trim();
                      
                    // Capitalize first letter
                    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
                    
                    // Limit length
                    if (summary.length > 60) {
                      summary = summary.substring(0, 57) + '...';
                    }
                    
                    return summary;
                  }
                  
                  // If we can't extract a good summary, fall back to a general one
                  return 'Request summary';
                })()}
              </div>
            )}
            
            {/* Only render thinking content when not collapsed */}
            {!isThinkingCollapsed && (
              <div 
                ref={thinkingContentRef}
                style={{
                  overflow: 'hidden',
                  fontSize: 'var(--font-size-caption)',
                  lineHeight: 1.5,
                  color: isDarkTheme ? '#d0d0d0' : '#333333',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-family-mono)',
                  borderBottom: `1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'}`,
                  backgroundColor: isDarkTheme ? 'rgba(32, 32, 34, 0.5)' : 'rgba(248, 248, 250, 0.7)',
                }}
              >
                <div style={{ padding: 'var(--spacing-3)', fontStyle: 'normal' }}>
                  {thinkingContent || (isProcessing ? 'Thinking...' : '')}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{
          padding: 'var(--message-padding)',
          paddingBottom: timestamp ? '1.5rem' : 'var(--message-padding)',
          fontSize: 'var(--font-size-body)',
          lineHeight: 'var(--line-height-chat)',
          fontFamily: 'var(--font-family-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          position: 'relative',
        }}>
          {formatContent(displayContent)}
          
          {/* Timestamp positioned at bottom right */}
          {timestamp && (
            <div style={{
              position: 'absolute',
              bottom: 'var(--spacing-1)',
              right: 'var(--spacing-2)',
              fontSize: '11px',
              color: isDarkTheme ? 'rgba(180, 180, 180, 0.6)' : 'rgba(100, 100, 100, 0.6)',
              fontFamily: 'var(--font-family-primary)',
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
            fontSize: 'var(--font-size-caption)',
            padding: 'var(--spacing-1)',
            borderRadius: 'var(--border-radius)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = showCopied ? '1' : '0.7';
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {showCopied ? (
            <span style={{ fontSize: 'var(--font-size-caption)', marginRight: 'var(--spacing-1)' }}>Copied</span>
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
        
        .code-block-container:hover .code-copy-button {
          display: flex !important;
        }
        
        .code-copy-button:hover {
          opacity: 1 !important;
        }
        
        /* Styling for lists in messages */
        .response-container ul, 
        .response-container ol {
          margin-left: var(--spacing-4);
          margin-bottom: var(--spacing-3);
        }
        
        .response-container li {
          margin-bottom: var(--spacing-1);
        }
      `}</style>
    </div>
  );
};

export default MessageItem;