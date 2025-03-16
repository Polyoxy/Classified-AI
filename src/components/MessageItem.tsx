import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MessageItemProps {
  message: Message;
  isLastMessage: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [showThinking, setShowThinking] = useState(true); // Default to open for better visibility
  const [copySuccess, setCopySuccess] = useState(false);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Determine if the message has system analysis content (thinking text)
  const hasThinking = message.role === 'assistant' && message.content.includes('<think>');
  
  // Split content into thinking and response if needed
  let thinking = '';
  let response = message.content;
  
  if (hasThinking) {
    const thinkingMatch = message.content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkingMatch && thinkingMatch[1]) {
      thinking = thinkingMatch[1].trim();
      response = message.content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    }
  }

  // Container style for the entire message
  const containerStyle = {
    marginBottom: message.role === 'assistant' ? '0.5rem' : '1rem',
    fontFamily: message.role === 'assistant' ? 'Inter, sans-serif' : 'JetBrains Mono, monospace',
    fontSize: '14px',
    color: isDarkTheme ? '#e0e0e0' : '#404040',
  };

  // Style for the role label
  const roleLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
    gap: '0.5rem',
  };

  // Role badge style
  const roleBadgeStyle = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    backgroundColor: message.role === 'user' 
      ? (isDarkTheme ? '#2a2a2a' : '#e0e0e0')
      : (isDarkTheme ? '#1e1e1e' : '#d0d0d0'),
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '12px',
    color: isDarkTheme ? '#e0e0e0' : '#404040',
  };

  // Style for the analysis badge
  const analysisBadgeStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    backgroundColor: isDarkTheme ? '#1a1a1a' : '#e0e0e0',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    gap: '6px',
    transition: 'background-color 0.2s ease',
    border: `1px solid ${isDarkTheme ? '#3a3a3a' : '#ccc'}`,
  };

  // Style for thinking section
  const thinkingContainerStyle = {
    backgroundColor: isDarkTheme ? 'rgba(30, 30, 30, 0.6)' : 'rgba(245, 245, 245, 0.8)',
    padding: '0.75rem',
    borderLeft: `4px solid ${isDarkTheme ? '#404040' : '#a0a0a0'}`,
    marginBottom: '0.75rem',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    color: isDarkTheme ? '#b0b0b0' : '#606060',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    maxHeight: showThinking ? '500px' : '0px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    opacity: showThinking ? 1 : 0,
    borderRadius: '3px',
  };

  // Style for thinking animation
  const thinkingAnimationStyle = {
    fontWeight: 'bold',
    color: isDarkTheme ? '#c0c0c0' : '#505050',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px'
  };

  // Dots animation keyframes (defined in a style tag)
  const dotsAnimation = `
    @keyframes thinking-dots {
      0%, 20% {
        opacity: 0.2;
        transform: translateY(0px);
      }
      40% {
        opacity: 1;
        transform: translateY(-2px);
      }
      60% {
        opacity: 1;
        transform: translateY(-2px);
      }
      80%, 100% {
        opacity: 0.2;
        transform: translateY(0px);
      }
    }
  `;

  // Message content style
  const messageContentStyle = {
    padding: '0.75rem',
    backgroundColor: message.role === 'user' 
      ? (isDarkTheme ? 'transparent' : 'transparent')
      : (isDarkTheme ? 'transparent' : 'transparent'),
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    lineHeight: 1.5,
    borderRadius: '3px',
    border: message.role === 'assistant' 
      ? `1px solid ${isDarkTheme ? 'rgba(42, 42, 42, 0.15)' : 'rgba(224, 224, 224, 0.3)'}`
      : 'none',
    fontFamily: message.role === 'assistant' ? 'Inter, sans-serif' : 'inherit',
  };

  // Timestamp style
  const timestampStyle = {
    fontSize: '12px',
    color: isDarkTheme ? 'rgba(224, 224, 224, 0.5)' : 'rgba(64, 64, 64, 0.5)',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: `1px solid ${isDarkTheme ? 'rgba(42, 42, 42, 0.3)' : 'rgba(224, 224, 224, 0.5)'}`,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '16px',
  };

  // Toggle thinking display
  const toggleThinking = () => {
    setShowThinking(!showThinking);
  };

  // Add copy function with error handling
  const handleCopy = async () => {
    try {
      // Copy both thinking and response content if available
      const contentToCopy = hasThinking 
        ? `${thinking}\n\n${response}`
        : response;
      
      await navigator.clipboard.writeText(contentToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy:', error);
      // Handle the error gracefully - maybe show a tooltip or use a fallback
      const textarea = document.createElement('textarea');
      textarea.value = hasThinking ? `${thinking}\n\n${response}` : response;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textarea);
    }
  };

  // Define markdown components for syntax highlighting
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    // Style tables
    table({ node, ...props }: any) {
      return (
        <div style={{ overflow: 'auto', marginBottom: '1rem' }}>
          <table style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '14px',
            fontFamily: message.role === 'assistant' ? 'Inter, sans-serif' : 'JetBrains Mono, monospace',
          }} {...props} />
        </div>
      );
    },
    // Style table headers
    th({ node, ...props }: any) {
      return (
        <th style={{
          backgroundColor: isDarkTheme ? '#2a2a2a' : '#e0e0e0',
          padding: '8px',
          textAlign: 'left',
          border: `1px solid ${isDarkTheme ? '#3a3a3a' : '#ccc'}`,
        }} {...props} />
      );
    },
    // Style table cells
    td({ node, ...props }: any) {
      return (
        <td style={{
          padding: '8px',
          textAlign: 'left',
          border: `1px solid ${isDarkTheme ? '#3a3a3a' : '#ccc'}`,
        }} {...props} />
      );
    },
    // Style blockquotes
    blockquote({ node, ...props }: any) {
      return (
        <blockquote style={{
          borderLeft: `3px solid ${isDarkTheme ? '#3a3a3a' : '#ccc'}`,
          padding: '0 1rem',
          margin: '1rem 0',
          color: isDarkTheme ? '#a0a0a0' : '#606060',
        }} {...props} />
      );
    },
    // Style paragraph elements
    p({ node, ...props }: any) {
      return (
        <p style={{ marginBottom: '1rem' }} {...props} />
      );
    },
    // Style heading elements
    h1({ node, ...props }: any) {
      return <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', marginTop: '1rem' }} {...props} />;
    },
    h2({ node, ...props }: any) {
      return <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.8rem', marginTop: '1rem' }} {...props} />;
    },
    h3({ node, ...props }: any) {
      return <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.6rem', marginTop: '1rem' }} {...props} />;
    },
    // Style lists
    ul({ node, ...props }: any) {
      return <ul style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />;
    },
    ol({ node, ...props }: any) {
      return <ol style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />;
    },
    // Style list items
    li({ node, ...props }: any) {
      return <li style={{ marginBottom: '0.25rem' }} {...props} />;
    },
    // Style strong (bold) text
    strong({ node, ...props }: any) {
      return <strong style={{ fontWeight: 'bold' }} {...props} />;
    },
    // Style emphasis (italic) text
    em({ node, ...props }: any) {
      return <em style={{ fontStyle: 'italic' }} {...props} />;
    },
  };

  // Determine if thinking is complete - an answer exists and isn't empty
  const isThinkingComplete = hasThinking && response.trim().length > 0;

  // Always show thinking section for incomplete thinking
  React.useEffect(() => {
    if (hasThinking && !isThinkingComplete) {
      setShowThinking(true);
    }
  }, [hasThinking, isThinkingComplete]);

  // Add copy button style
  const copyButtonStyle = {
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    color: isDarkTheme ? 'rgba(224, 224, 224, 0.5)' : 'rgba(64, 64, 64, 0.5)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    '&:hover': {
      color: isDarkTheme ? 'rgba(224, 224, 224, 0.8)' : 'rgba(64, 64, 64, 0.8)',
    }
  };

  return (
    <div style={{...containerStyle, position: 'relative' as const}}>
      {/* Role label with classified analysis integrated */}
      <div style={roleLabelStyle}>
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          justifyContent: 'space-between'
        }}>
          {/* Role indicator */}
          <div style={{display: 'flex', alignItems: 'center'}}>
            {message.role === 'user' ? (
              <>
                <span style={{marginRight: '0.5rem'}}>&#62;</span>
                <span style={roleBadgeStyle}>USER</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <circle cx="15.5" cy="8.5" r="1.5"></circle>
                  <path d="M9 15a3 3 0 0 0 6 0"></path>
                </svg>
                <span style={roleBadgeStyle}>AGENT</span>
              </>
            )}
          </div>

          {/* Classified Analysis toggle (only for assistant messages) */}
          {hasThinking && (
            <div 
              style={{
                ...analysisBadgeStyle,
                backgroundColor: showThinking 
                  ? (isDarkTheme ? '#2a2a2a' : '#d0d0d0') 
                  : (isDarkTheme ? '#1a1a1a' : '#e0e0e0'),
              }}
              onClick={toggleThinking}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={isDarkTheme ? '#b0b0b0' : '#606060'} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span style={{color: isDarkTheme ? '#e0e0e0' : '#404040'}}>CLASSIFIED ANALYSIS</span>
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{
                  transform: showThinking ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Analysis content - also render with markdown */}
      {hasThinking && (
        <div style={thinkingContainerStyle}>
          <style>{dotsAnimation}</style>
          <div style={thinkingAnimationStyle}>
            {isThinkingComplete ? (
              <span>Thinking process</span>
            ) : (
              <>
                <span>Thinking process</span>
                <span style={{ 
                  display: 'inline-block', 
                  marginLeft: '2px',
                  fontWeight: 'bold',
                  fontSize: '16px', 
                  animation: 'thinking-dots 1.5s infinite 0s'
                }}>.</span>
                <span style={{ 
                  display: 'inline-block',
                  fontWeight: 'bold',
                  fontSize: '16px',  
                  animation: 'thinking-dots 1.5s infinite 0.3s'
                }}>.</span>
                <span style={{ 
                  display: 'inline-block',
                  fontWeight: 'bold',
                  fontSize: '16px',  
                  animation: 'thinking-dots 1.5s infinite 0.6s'
                }}>.</span>
              </>
            )}
          </div>
          <ReactMarkdown
            components={MarkdownComponents}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {thinking}
          </ReactMarkdown>
        </div>
      )}

      {/* Message content and footer container */}
      <div style={{
        ...messageContentStyle,
        backgroundColor: message.role === 'assistant' 
          ? (isDarkTheme ? 'rgba(30, 30, 30, 0.2)' : 'rgba(245, 245, 245, 0.5)')
          : 'transparent',
      }}>
        <ReactMarkdown
          components={MarkdownComponents}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
        >
          {response}
        </ReactMarkdown>

        {/* Footer with timestamp and copy button */}
        <div style={timestampStyle}>
          <span>{formatTime(message.timestamp || Date.now())}</span>
          
          {/* Add copy button for assistant messages */}
          {message.role === 'assistant' && (
            <button
              onClick={handleCopy}
              style={{
                ...copyButtonStyle,
                color: copySuccess 
                  ? (isDarkTheme ? '#81c784' : '#4caf50')
                  : (isDarkTheme ? 'rgba(224, 224, 224, 0.5)' : 'rgba(64, 64, 64, 0.5)'),
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Copy response"
            >
              {copySuccess ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style={{ fontSize: '12px' }}>Copied</span>
                </>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem; 