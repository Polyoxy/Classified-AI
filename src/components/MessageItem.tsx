import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import CodeSnippet from './CodeSnippet';
import Markdown from 'markdown-to-jsx';

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
              // Try to infer title from surrounding content - look for instructions before the code block
              const contentBeforeCodeBlock = parts[index - 1];
              if (contentBeforeCodeBlock) {
                // Look for phrases like "create a file", "modify this code", "here's an example of", etc.
                const titleHints = [
                  /create (?:a|the) (?:file|script|component|function) (?:for|called|named) [`'"]*([a-zA-Z0-9_\-.]+)[`'"']*/i,
                  /modify [`'"]*([a-zA-Z0-9_\-.]+)[`'"']*/i,
                  /update [`'"]*([a-zA-Z0-9_\-.]+)[`'"']*/i,
                  /example (?:of|for) [`'"]*([a-zA-Z0-9_\-.]+)[`'"']*/i,
                  /(?:here is|here's) (?:the|a) ([a-zA-Z0-9_\- ]+) (?:file|code|script|component)/i,
                  /([a-zA-Z0-9_\-.]+\.(?:js|ts|jsx|tsx|py|java|rb|go|c|cpp|cs|php|html|css|scss))/i,
                ];
                
                for (const pattern of titleHints) {
                  const match = contentBeforeCodeBlock.match(pattern);
                  if (match && match[1]) {
                    title = match[1].trim();
                    break;
                  }
                }
                
                // If still no title, try to get a title from the text right before the code block
                if (!title) {
                  // Get the last sentence before the code block
                  const sentences = contentBeforeCodeBlock.split(/[.!?]\s+/);
                  const lastSentence = sentences[sentences.length - 1].trim();
                  
                  // If it's relatively short, use it as a title
                  if (lastSentence.length > 0 && lastSentence.length < 60) {
                    title = lastSentence;
                  }
                }
              }
              
              // If still no title, try to guess from the code itself
              if (!title) {
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
                    // Look for file name pattern at the beginning of the code
                    const fileNameMatch = code.match(/^(?:\/\/|#|\/\*)\s*([a-zA-Z0-9_\-.]+\.(?:js|ts|jsx|tsx|py|java|rb|go|c|cpp|cs|php|html|css|scss))/);
                    if (fileNameMatch) {
                      title = fileNameMatch[1];
                    } else {
                      title = language ? `${language.charAt(0).toUpperCase() + language.slice(1)} code` : 'Code snippet';
                    }
                  }
                } else if (language === 'html') {
                  // Look for title tag content
                  const titleTagMatch = code.match(/<title>(.*?)<\/title>/i);
                  if (titleTagMatch) {
                    title = titleTagMatch[1];
                  } else {
                    title = 'HTML Template';
                  }
                } else if (language === 'css') {
                  // Look for first selector
                  const selectorMatch = code.match(/([a-zA-Z0-9_\-.#][a-zA-Z0-9_\-.# ]*?)\s*\{/);
                  if (selectorMatch) {
                    title = `CSS for ${selectorMatch[1].trim()}`;
                  } else {
                    title = 'CSS Styles';
                  }
                } else if (language === 'python') {
                  const defMatch = code.match(/def\s+(\w+)/);
                  const classMatch = code.match(/class\s+(\w+)/);
                  
                  if (defMatch) {
                    title = `Function: ${defMatch[1]}`;
                  } else if (classMatch) {
                    title = `Class: ${classMatch[1]}`;
                  } else {
                    // Look for module docstring
                    const docstringMatch = code.match(/^(?:\'\'\'|\"\"\")([^]*?)(?:\'\'\'|\"\"\")/);
                    if (docstringMatch) {
                      const firstLine = docstringMatch[1].trim().split('\n')[0];
                      if (firstLine.length < 60) {
                        title = firstLine;
                      } else {
                        title = 'Python code';
                      }
                    } else {
                      title = 'Python code';
                    }
                  }
                } else {
                  title = language ? `${language.charAt(0).toUpperCase() + language.slice(1)} code` : 'Code snippet';
                }
              }
            }
            
            // Simply pass to CodeSnippet component which now handles the conditional display
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
      
      // Regular text - use markdown-to-jsx to render markdown 
return (
  <div key={index} className="markdown-content">
    <Markdown 
      options={{
        overrides: {
          h1: {
            component: 'h2',
            props: {
              style: {
                fontSize: '1.6em',
                fontWeight: 'bold',
                marginTop: '1.2em',
                marginBottom: '0.6em',
                color: isDarkTheme ? '#E0E0E0' : '#222',
                borderBottom: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                paddingBottom: '0.4em',
              },
            },
          },
          h2: {
            props: {
              style: {
                fontSize: '1.4em',
                fontWeight: 'bold',
                marginTop: '1em',
                marginBottom: '0.5em',
                color: isDarkTheme ? '#E0E0E0' : '#222',
              },
            },
          },
          h3: {
            props: {
              style: {
                fontSize: '1.2em',
                fontWeight: 'bold',
                marginTop: '0.8em',
                marginBottom: '0.4em',
                color: isDarkTheme ? '#E0E0E0' : '#333',
              },
            },
          },
          p: {
            props: {
              style: {
                marginTop: '0.7em',
                marginBottom: '0.7em',
                lineHeight: '1.6',
                fontSize: '1.05em',
                color: isDarkTheme ? '#D0D0D0' : '#111',
              },
            },
          },
          a: {
            props: {
              style: {
                color: 'var(--accent-color)',
                textDecoration: 'none',
                fontWeight: '500',
              },
            },
          },
          strong: {
            props: {
              style: {
                fontWeight: 'bold',
                color: isDarkTheme ? '#FFFFFF' : '#000000',
              },
            },
          },
          em: {
            props: {
              style: {
                fontStyle: 'italic',
                color: isDarkTheme ? '#D0D0D0' : '#333',
              },
            },
          },
          ul: {
            props: {
              style: {
                paddingLeft: '1.8em',
                marginTop: '0.6em',
                marginBottom: '0.6em',
              },
            },
          },
          ol: {
            props: {
              style: {
                paddingLeft: '1.8em',
                marginTop: '0.6em',
                marginBottom: '0.6em',
              },
            },
          },
          li: {
            props: {
              style: {
                marginBottom: '0.4em',
                fontSize: '1.05em',
              },
            },
          },
          blockquote: {
            props: {
              style: {
                borderLeft: `3px solid ${isDarkTheme ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'}`,
                paddingLeft: '1em',
                marginLeft: '0',
                color: isDarkTheme ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)',
                fontStyle: 'italic',
                fontSize: '1.1em',
              },
            },
          },
          hr: {
            props: {
              style: {
                border: 'none',
                borderBottom: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                margin: '1em 0',
              },
            },
          },
          code: {
            props: {
              style: {
                fontFamily: 'var(--font-family-mono)',
                backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                padding: '0.3em 0.5em',
                borderRadius: '5px',
                fontSize: '0.95em',
                color: isDarkTheme ? '#E6E6E6' : '#333',
              },
            },
          },
          inlineCode: {
            component: 'code',
            props: {
              style: {
                fontFamily: 'var(--font-family-mono)',
                backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                padding: '0.2em 0.4em',
                borderRadius: '4px',
                fontSize: '0.95em',
                color: isDarkTheme ? '#E6E6E6' : '#333',
              },
            },
          },
          table: {
            props: {
              style: {
                borderCollapse: 'collapse',
                width: '100%',
                marginTop: '1em',
                marginBottom: '1em',
              },
            },
          },
          th: {
            props: {
              style: {
                border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                padding: '8px',
                textAlign: 'left',
                backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                fontSize: '1em',
              },
            },
          },
          td: {
            props: {
              style: {
                border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                padding: '8px',
                textAlign: 'left',
                fontSize: '1em',
              },
            },
          },
        },
      }}
    >
      {part}
    </Markdown>
  </div>
);

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
      backgroundColor: isDarkTheme ? 'rgba(32, 32, 32, 0.7)' : 'rgba(252, 252, 252, 0.8)',
      color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
      backdropFilter: 'blur(8px)',
      borderRadius: 'var(--chat-bubble-radius-ai)',
      border: `1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.2)' : 'rgba(200, 200, 200, 0.3)'}`,
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

  // Get model-based colors
  const getModelColors = () => {
    if (!model) return null;
    
    if (model.toLowerCase().includes('deepseek') || model.toLowerCase().includes('deepthink')) {
      return {
        color: isDarkTheme ? '#88a9e0' : '#1e60cc',
        bgColor: isDarkTheme ? 'rgba(45, 90, 160, 0.25)' : 'rgba(60, 110, 220, 0.15)',
        borderColor: isDarkTheme ? 'rgba(45, 90, 160, 0.3)' : 'rgba(60, 110, 220, 0.2)',
      };
    }
    
    if (model.toLowerCase().includes('vision')) {
      return {
        color: isDarkTheme ? '#95d095' : '#1a7a1a',
        bgColor: isDarkTheme ? 'rgba(80, 155, 80, 0.25)' : 'rgba(90, 180, 90, 0.15)',
        borderColor: isDarkTheme ? 'rgba(80, 155, 80, 0.3)' : 'rgba(90, 180, 90, 0.2)',
      };
    }
    
    return null;
  };

  const modelColors = getModelColors();

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
                borderBottom: isThinkingCollapsed ? 'none' : `1px solid ${isDarkTheme ? 'rgba(45, 45, 45, 0.5)' : 'rgba(200, 200, 200, 0.3)'}`,
                transition: 'background-color 0.2s ease',
                backgroundColor: isDarkTheme ? 
                  (isProcessing ? 'rgba(45, 90, 160, 0.25)' : 'rgba(35, 65, 120, 0.2)') : 
                  (isProcessing ? 'rgba(60, 110, 220, 0.15)' : 'rgba(50, 90, 180, 0.1)'),
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isDarkTheme ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)',
                border: `1px solid ${isDarkTheme ? 
                  (isProcessing ? 'rgba(45, 90, 160, 0.3)' : 'rgba(35, 65, 120, 0.25)') : 
                  (isProcessing ? 'rgba(60, 110, 220, 0.2)' : 'rgba(50, 90, 180, 0.15)')}`,
                borderRadius: '6px 6px 0 0',
              }}
              className={isProcessing ? "thinking-badge-container" : "thinking-badge-container-inactive"}
            >
              <span 
                className={isProcessing ? "thinking-text-glow" : ""} 
                style={{ 
                  fontSize: '12px', 
                  fontWeight: 500,
                  color: isDarkTheme ? 
                    (isProcessing ? 'rgba(220, 220, 255, 0.95)' : 'rgba(180, 180, 180, 0.7)') : 
                    (isProcessing ? 'rgba(20, 80, 180, 0.95)' : 'rgba(100, 100, 100, 0.7)'),
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                Thinking Process
              </span>
              
              <svg 
                className={isProcessing ? "thinking-text-glow" : ""}
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={isDarkTheme ? 
                  (isProcessing ? 'rgba(220, 220, 255, 0.95)' : 'rgba(180, 180, 180, 0.7)') : 
                  (isProcessing ? 'rgba(20, 80, 180, 0.95)' : 'rgba(100, 100, 100, 0.7)')}
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{
                  transform: isThinkingCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {/* True summary - only shown when collapsed */}
            {isThinkingCollapsed && (
              <div style={{
                padding: 'var(--spacing-1) var(--spacing-2)',
                fontSize: '12px',
                fontStyle: 'normal',
                color: isDarkTheme ? 
                  (isProcessing ? 'rgba(208, 208, 208, 0.7)' : 'rgba(180, 180, 180, 0.7)') : 
                  (isProcessing ? 'rgba(80, 80, 80, 0.7)' : 'rgba(120, 120, 120, 0.7)'),
                backgroundColor: isDarkTheme ? 'rgba(20, 20, 20, 0.95)' : 'rgba(248, 248, 250, 0.8)',
                borderBottom: `1px solid ${isDarkTheme ? 'rgba(45, 45, 45, 0.5)' : 'rgba(200, 200, 200, 0.3)'}`,
                margin: 0,
                opacity: isProcessing ? 1 : 0.7,
                transition: 'opacity 0.3s ease, color 0.3s ease',
              }}>
                {(() => {
                  // Create a true summary of the AI's thinking process instead of user's input
                  
                  // Extract the core topic or intent from the thinking content
                  const extractTopic = () => {
                    // Look for explicit topic mentions in AI's thinking
                    const topicPatterns = [
                      /analyzing|reviewing|considering ([\w\s-]+)/i,
                      /focused on ([\w\s-]+)/i,
                      /looking at ([\w\s-]+)/i,
                      /examining ([\w\s-]+)/i,
                      /([a-z\s]+) code|data|analysis|implementation/i
                    ];
                    
                    for (const pattern of topicPatterns) {
                      const match = thinkingContent.match(pattern);
                      if (match && match[1] && match[1].length > 2) {
                        return match[1].trim();
                      }
                    }
                    
                    // Extract key concepts from thinking content
                    const conceptPatterns = [
                      /need to ([\w\s]+)/i,
                      /will ([\w\s]+)/i,
                      /should ([\w\s]+)/i,
                      /working on ([\w\s]+)/i
                    ];
                    
                    for (const pattern of conceptPatterns) {
                      const match = thinkingContent.match(pattern);
                      if (match && match[1] && match[1].length > 2) {
                        return match[1].trim();
                      }
                    }
                    
                    return '';
                  };
                  
                  // Determine the action/intent from AI's thinking
                  const extractIntent = () => {
                    if (thinkingContent.match(/(?:analyze|review|examine|assess)/i)) 
                      return 'Analyzing';
                    if (thinkingContent.match(/(?:search|look|find|locate)/i)) 
                      return 'Searching for';
                    if (thinkingContent.match(/(?:modify|change|update|edit)/i)) 
                      return 'Modifying';
                    if (thinkingContent.match(/(?:fix|resolve|correct)/i)) 
                      return 'Fixing';
                    if (thinkingContent.match(/(?:implement|add|create)/i)) 
                      return 'Implementing';
                    if (thinkingContent.match(/(?:debug|troubleshoot)/i)) 
                      return 'Debugging';
                    if (thinkingContent.match(/(?:plan|design)/i)) 
                      return 'Planning';
                    
                    // Default based on AI process
                    return 'Working on';
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
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: isDarkTheme ? 
                    (isProcessing ? '#d0d0d0' : '#a0a0a0') : 
                    (isProcessing ? '#333333' : '#666666'),
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-family-mono)',
                  borderBottom: `1px solid ${isDarkTheme ? 'rgba(45, 45, 45, 0.5)' : 'rgba(200, 200, 200, 0.3)'}`,
                  backgroundColor: isDarkTheme ? 'rgba(18, 18, 18, 0.95)' : 'rgba(248, 248, 250, 0.8)',
                  opacity: isProcessing ? 1 : 0.8,
                  transition: 'opacity 0.3s ease, color 0.3s ease',
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
        @keyframes movingStroke {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
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
        
        .thinking-badge-container {
          position: relative;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: ${isDarkTheme ? 
            '0 0 8px rgba(70, 130, 220, 0.3), 0 0 12px rgba(70, 130, 220, 0.1)' : 
            '0 0 8px rgba(60, 130, 240, 0.2), 0 0 12px rgba(60, 130, 240, 0.1)'};
        }
        
        .thinking-badge-container::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: ${isDarkTheme ? 
            'linear-gradient(90deg, rgba(45, 90, 160, 0.05), rgba(70, 140, 230, 0.5), rgba(45, 90, 160, 0.05))' : 
            'linear-gradient(90deg, rgba(60, 110, 220, 0.05), rgba(80, 160, 255, 0.45), rgba(60, 110, 220, 0.05))'
          };
          z-index: 0;
          background-size: 200% 200%;
          animation: movingStroke 3s ease-in-out infinite;
          pointer-events: none;
          border-radius: 6px 6px 0 0;
        }
        
        .thinking-badge-container-inactive {
          position: relative;
          border-radius: 6px;
          overflow: hidden;
          opacity: 0.7;
        }
        
        .thinking-text-glow {
          text-shadow: ${isDarkTheme ? 
            '0 0 8px rgba(150, 180, 255, 0.7), 0 0 12px rgba(100, 150, 255, 0.5)' : 
            '0 0 8px rgba(60, 130, 240, 0.5), 0 0 12px rgba(60, 130, 240, 0.3)'};
          animation: textGlowSideToSide 3s ease-in-out infinite;
        }
        
        @keyframes textGlowSideToSide {
          0%, 100% {
            text-shadow: ${isDarkTheme ? 
              '-5px 0 8px rgba(150, 180, 255, 0.9), -5px 0 15px rgba(100, 150, 255, 0.7)' : 
              '-5px 0 8px rgba(60, 130, 240, 0.7), -5px 0 15px rgba(60, 130, 240, 0.5)'};
          }
          50% {
            text-shadow: ${isDarkTheme ? 
              '5px 0 8px rgba(150, 180, 255, 0.9), 5px 0 15px rgba(100, 150, 255, 0.7)' : 
              '5px 0 8px rgba(60, 130, 240, 0.7), 5px 0 15px rgba(60, 130, 240, 0.5)'};
          }
        }
        
        /* Animation for the thinking content text */
        .thinking-text-active {
          position: relative;
        }
        
        .thinking-text-active::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: ${isDarkTheme ? 
            'linear-gradient(90deg, transparent, rgba(70, 140, 230, 0.15), transparent)' : 
            'linear-gradient(90deg, transparent, rgba(80, 160, 255, 0.12), transparent)'};
          animation: slidingGlow 3s ease-in-out infinite;
        }
        
        @keyframes slidingGlow {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default MessageItem;