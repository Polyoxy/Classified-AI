import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  const [showThinking, setShowThinking] = useState(true);
  const [reasoningTime, setReasoningTime] = useState(0);
  const thinkingContentRef = useRef<HTMLDivElement>(null);
  const prevProcessingRef = useRef(isProcessing);
  const reasoningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if current model is a thinking model
  const isThinkingModel = useMemo(() => {
    // Add logic to check if the model supports thinking
    // This can be customized based on your app's model configuration
    const thinkingModels = [
      'deepseek-r1:7b', 
      'deepseek-r1:14b', 
      'deepseek-r1:1.5b',
      'deepseek-chat'
    ];
    return thinkingModels.includes(model || '');
  }, [model]);

  // Process content to remove thinking tags from display
  const processContent = (content: string): string => {
    // Remove thinking tags and their content from display
    // More aggressive regex that handles incomplete tags as well
    let processed = content;
    
    // First handle any complete think tags
    processed = processed.replace(/<think>[\s\S]*?<\/think>/g, '');
    
    // Then handle any remaining open think tags without closing tags
    const openTagIndex = processed.lastIndexOf('<think>');
    if (openTagIndex !== -1) {
      processed = processed.substring(0, openTagIndex);
    }
    
    return processed.trim();
  };
  
  // Extract thinking content from message
  const extractThinking = (content: string): string => {
    // Handle incomplete <think> tags during streaming
    if (isProcessing) {
      // Check for an open <think> tag without a closing tag
      const openTagIndex = content.lastIndexOf('<think>');
      if (openTagIndex !== -1 && content.indexOf('</think>', openTagIndex) === -1) {
        // Extract all complete thinking blocks
        const completeThinking = extractCompleteThinking(content.substring(0, openTagIndex));
        
        // Extract the partial thinking content (after the last open tag)
        const partialThinking = content.substring(openTagIndex + '<think>'.length);
        
        // Combine complete and partial thinking
        return completeThinking.length > 0 
          ? completeThinking + '\n\n' + partialThinking
          : partialThinking;
      }
    }
    
    return extractCompleteThinking(content);
  };
  
  // Extract complete thinking blocks
  const extractCompleteThinking = (content: string): string => {
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
  const isAssistant = role === 'assistant';

  // Extract response style if present in content
  const extractResponseStyle = (content: string): string => {
    const styleMatch = content.match(/^\[Response style: ([a-z]+)\]/i);
    return styleMatch ? styleMatch[1].toLowerCase() : 'normal';
  };

  const responseStyle = extractResponseStyle(content);

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

  // Effect to start and stop reasoning timer
  useEffect(() => {
    // Only start timer for thinking models
    if (isProcessing && role === 'assistant' && isThinkingModel) {
      // For both scenarios (with or without thinking content), start with a timer
      const startTime = Date.now() - (reasoningTime * 1000); // Preserve existing time if any
      reasoningTimerRef.current = setInterval(() => {
        setReasoningTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      // Only show the blue dot if there's no thinking content yet
      if (!thinkingContent || thinkingContent.length === 0) {
        setShowThinking(true);
      } else {
        // When we have thinking content, show the reasoning box instead of the dot
        setShowThinking(false);
        setIsThinkingCollapsed(false);
      }
    } else if (!isProcessing && reasoningTimerRef.current) {
      // Stop timer when AI stops processing
      clearInterval(reasoningTimerRef.current);
      reasoningTimerRef.current = null;
      
      // Auto-collapse thinking section when processing completes
      setTimeout(() => {
        setIsThinkingCollapsed(true);
      }, 1000); // Small delay before collapsing
    } else if (isProcessing && role === 'assistant' && !isThinkingModel) {
      // For non-thinking models, show only the blue dot
      setShowThinking(true);
    }
    
    // Cleanup
    return () => {
      if (reasoningTimerRef.current) {
        clearInterval(reasoningTimerRef.current);
        reasoningTimerRef.current = null;
      }
    };
  }, [isProcessing, role, thinkingContent, reasoningTime, isThinkingModel]);

  // Effect to handle thinking content changes
  useEffect(() => {
    // When thinking content appears during processing, transition from dot to reasoning
    if (isProcessing && thinkingContent && thinkingContent.length > 0) {
      setShowThinking(false); // Hide the dot
      setIsThinkingCollapsed(false); // Expand the reasoning box
    }
  }, [isProcessing, thinkingContent]);

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

  // Special handling for nested code blocks inside markdown text
  // This helps render markdown code blocks correctly
  const processMarkdownCodeBlocks = (content: string) => {
    // Replace markdown code blocks with placeholders to protect them during processing
    const codeBlockRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
    let match;
    const codeBlocks = [];
    let modifiedContent = content;
    
    // Extract all code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const lang = match[1] || 'text';
      const code = match[2];
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      
      codeBlocks.push({ language: lang, code });
      modifiedContent = modifiedContent.replace(match[0], placeholder);
    }
    
    // Return content with placeholders and extracted code blocks for further processing
    return { content: modifiedContent, codeBlocks };
  };

  // Format content with code blocks - improved to handle live content
  const formatContent = (content: string) => {
    // If no content yet during processing, show empty space
    if (!content && isProcessing) {
      return <div style={{ minHeight: '20px' }}></div>;
    }
    
    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```')) {
        // For completed code blocks
        if (part.endsWith('```') && part.length > 6) { // At least ```a``` (language identifier + content)
          const match = part.match(/```(?:([a-zA-Z0-9]+))?\n([\s\S]*?)```/);
          
          if (match) {
            const [, language, code] = match;
            
            // Look for title comment at the beginning of the code
            const titleMatch = code.match(/^\/\/\s*(.+?)\s*\n/);
            const cleanedCode = titleMatch ? code.substring(titleMatch[0].length) : code;
            
            // Use ONLY the language name as the title
            const title = language 
              ? language.charAt(0).toUpperCase() + language.slice(1) 
              : 'Code';
            
            // Simply pass to CodeSnippet component which now handles the conditional display
            return (
              <CodeSnippet 
                key={index} 
                code={cleanedCode}
                language={language || ''}
                title={language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code'}
              />
            );
          }
        } 
        // For partial code blocks, just display as text during streaming
        else if (isProcessing) {
          return <div key={index}>{part}</div>;
        }
      }
      
      // Regular text - process for nested markdown code blocks first
      const { content: processedContent, codeBlocks } = processMarkdownCodeBlocks(part);
      
      // Return markdown component that correctly handles nested code
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
                  component: ({ children, ...props }) => {
                    // Check if this paragraph contains a code block placeholder
                    if (typeof children === 'string' && children.includes('__CODE_BLOCK_')) {
                      const match = children.match(/__CODE_BLOCK_(\d+)__/);
                      if (match && match[1]) {
                        const blockIndex = parseInt(match[1]);
                        const { language, code } = codeBlocks[blockIndex];
                        
                        // Return the code snippet component for the nested code block
                        return (
                          <CodeSnippet 
                            code={code}
                            language={language}
                            title={language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code'}
                          />
                        );
                      }
                    }
                    
                    // Otherwise return normal paragraph
                    return (
                      <p
                        {...props}
                        style={{
                          marginTop: '0.7em',
                          marginBottom: '0.7em',
                          lineHeight: '1.6',
                          fontSize: '1.05em',
                          color: isDarkTheme ? '#D0D0D0' : '#111',
                        }}
                      >
                        {children}
                      </p>
                    );
                  }
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
            {processedContent}
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

  // Get message style based on role and response style
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
        backgroundColor: isDarkTheme ? 'rgba(52, 53, 65, 1)' : 'rgba(247, 247, 248, 1)',
        color: isDarkTheme ? '#ececf1' : '#343541',
        padding: '16px',
        borderRadius: '0',
        width: '100%',
        border: 'none',
        boxSizing: 'border-box' as const,
      };
    }

    // Assistant role with different style colors
    if (role === 'assistant') {
      // Apply different subtle background colors based on response style
      switch (responseStyle) {
        case 'concise':
          return {
            backgroundColor: isDarkTheme ? 'rgba(95, 145, 80, 0.05)' : 'rgba(95, 180, 95, 0.03)',
            color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
            border: `1px solid ${isDarkTheme ? 'rgba(95, 145, 80, 0.1)' : 'rgba(95, 180, 95, 0.1)'}`,
            borderRadius: 'var(--chat-bubble-radius)',
          };
        case 'explanatory':
          return {
            backgroundColor: isDarkTheme ? 'rgba(95, 120, 160, 0.05)' : 'rgba(95, 130, 190, 0.03)',
            color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
            border: `1px solid ${isDarkTheme ? 'rgba(95, 120, 160, 0.1)' : 'rgba(95, 130, 190, 0.1)'}`,
            borderRadius: 'var(--chat-bubble-radius)',
          };
        case 'formal':
          return {
            backgroundColor: isDarkTheme ? 'rgba(140, 95, 150, 0.05)' : 'rgba(160, 95, 180, 0.03)',
            color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
            border: `1px solid ${isDarkTheme ? 'rgba(140, 95, 150, 0.1)' : 'rgba(160, 95, 180, 0.1)'}`,
            borderRadius: 'var(--chat-bubble-radius)',
          };
        default:
          return {
            backgroundColor: 'transparent',
            color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
            backdropFilter: 'none',
            borderRadius: 0,
            border: 'none',
          };
      }
    }

    return {
      backgroundColor: 'transparent',
      color: isDarkTheme ? '#d4d4d4' : '#2d2d2d',
      backdropFilter: 'none',
      borderRadius: 0,
      border: 'none',
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
      marginBottom: role === 'assistant' ? '3rem' : '0',
      width: '100%',
      backgroundColor: role === 'user' ? (isDarkTheme ? '#343541' : '#f7f7f8') : 'transparent',
    }}>
      {role === 'system' && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-1)',
        marginBottom: 'var(--spacing-1)',
        fontSize: 'var(--font-size-caption)',
        color: isDarkTheme ? '#888' : '#666',
      }}>
          <span style={{ fontWeight: 'bold' }}>System</span>
      </div>
      )}

      <div style={{
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'none',
        ...getMessageStyle(),
      }}>
        {/* Processing indicator (blue dot) - always shown when processing */}
        {isProcessing && role === 'assistant' && showThinking && (
          <div className="processing-indicator" style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isDarkTheme ? 'rgba(120, 160, 255, 0.7)' : 'rgba(70, 110, 220, 0.6)',
            margin: '0 8px 0 0',
            animation: 'pulse 1.5s infinite ease-in-out',
            verticalAlign: 'middle',
            opacity: 0.8,
          }}/>
        )}

        {/* Reasoning section (shown when thinking content exists or when actively thinking) - only for thinking models */}
        {isThinkingModel && (hasThinking || (isProcessing && role === 'assistant') || (!isProcessing && reasoningTime > 0)) && (
          <>
            <div 
              onClick={() => setIsThinkingCollapsed(!isThinkingCollapsed)}
              style={{
                padding: 'var(--spacing-1) var(--spacing-2)',
                fontSize: '14px',
                color: isDarkTheme ? 'rgba(180, 180, 180, 0.8)' : 'rgba(60, 60, 60, 0.8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: isThinkingCollapsed ? 'none' : `1px solid ${isDarkTheme ? 'rgba(45, 45, 45, 0.2)' : 'rgba(200, 200, 200, 0.1)'}`,
                transition: 'color 0.2s ease',
                borderRadius: '0',
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkTheme ? 
                  'rgba(210, 210, 210, 0.9)' : 'rgba(100, 100, 100, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkTheme ? 
                  'rgba(180, 180, 180, 0.8)' : 'rgba(60, 60, 60, 0.8)';
              }}
            >
              <span 
                style={{ 
                  fontWeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  color: isProcessing ? 
                    (isDarkTheme ? 'rgba(210, 210, 235, 0.9)' : 'rgba(50, 70, 110, 0.9)') : 
                    (isDarkTheme ? 'rgba(180, 180, 180, 0.8)' : 'rgba(60, 60, 60, 0.8)'),
                }}
                className={isProcessing ? "reasoning-active" : ""}
              >
                {isProcessing && (
                  <div className="reasoning-indicator" style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isDarkTheme ? 'rgba(120, 160, 255, 0.6)' : 'rgba(70, 110, 220, 0.5)',
                    marginRight: '8px',
                    animation: 'pulse 1.5s infinite ease-in-out',
                    boxShadow: 'none',
                  }}/>
                )}
                {(() => {
                  // Extract the reasoning topic
                  const extractTopic = () => {
                    // If we have thinking content, use it to extract topic
                    if (thinkingContent && thinkingContent.length > 0) {
                      const topicPatterns = [
                        /(?:about|on) ([\w\s\-]+)/i,
                        /analyzing ([\w\s\-]+)/i,
                        /considering ([\w\s\-]+)/i,
                      ];
                      
                      for (const pattern of topicPatterns) {
                        const match = thinkingContent.match(pattern);
                        if (match && match[1] && match[1].length > 2) {
                          const topic = match[1].trim();
                          // Capitalize first letter
                          return topic.charAt(0).toUpperCase() + topic.slice(1);
                        }
                      }
                    }
                    
                    // Show generic text during active processing if we don't have thinking content yet
                    if (isProcessing) {
                      return 'request';
                    }
                    
                    return 'response generation';
                  };
                  
                  // Display thinking topic and time
                  const topic = extractTopic();
                  if (isProcessing) {
                    return `Thinking about ${topic} for ${reasoningTime} seconds`;
                  } else {
                    return `Thought about ${topic} for ${reasoningTime} seconds`;
                  }
                })()}
              </span>
              
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{
                  transform: isThinkingCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                  transition: 'transform 0.2s ease',
                  opacity: isProcessing ? 0.9 : 0.7,
                }}
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            
            {/* Only render expanded thinking content when not collapsed */}
            {!isThinkingCollapsed && (
              <div 
                ref={thinkingContentRef}
                style={{
                  backgroundColor: 'transparent',
                  padding: '12px 16px',
                  borderBottom: 'none',
                  maxHeight: '300px',
                  overflow: 'auto',
                  borderRadius: '0',
                  border: 'none',
                  borderTop: 'none',
                }}
              >
                <div style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: isDarkTheme ? '#ECECF1' : '#2d2d2d',
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Söhne", "Söhne Buch", "Söhne Halbfett", "Söhne Dreiviertelfett", "Söhne Breit", "Söhne Mono", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                }}>
                  {thinkingContent || (isProcessing && !thinkingContent ? "Analyzing request..." : "")}
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
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
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
        
        .reasoning-active {
          transition: color 0.3s ease;
        }
        
        .reasoning-indicator {
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default MessageItem;