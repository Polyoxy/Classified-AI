import React, { useState, useRef } from 'react';
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
}

// Add ContextArea component at the top, outside of MessageItem
const ContextArea: React.FC<{ 
  isDarkTheme: boolean; 
  onAddMessage: (content: string, role: 'user' | 'assistant' | 'system') => void 
}> = ({ isDarkTheme, onAddMessage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    try {
      for (const file of fileArray) {
        const text = await file.text();
        const fileExtension = file.name.split('.').pop() || '';
        const content = `**Context from ${file.name}:**\n\`\`\`${fileExtension}\n${text}\n\`\`\``;
        onAddMessage(content, 'user');
      }
    } catch (error) {
      console.error('Error reading files:', error);
      onAddMessage(`Error reading file: ${error}`, 'system');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
      e.target.value = '';
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        marginBottom: '4px',
        borderRadius: '6px',
        fontSize: '12px',
        color: isDarkTheme ? '#909090' : '#606060',
        backgroundColor: isDarkTheme 
          ? (isDragging ? 'rgba(255, 255, 255, 0.05)' : 'rgba(26, 26, 26, 0.4)') 
          : (isDragging ? 'rgba(0, 0, 0, 0.05)' : 'rgba(245, 245, 245, 0.6)'),
        border: `1px solid ${isDarkTheme 
          ? (isDragging ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)') 
          : (isDragging ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)')}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        opacity: isDragging ? 1 : 0.85,
      }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        borderRadius: '4px',
        backgroundColor: isDarkTheme 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.05)',
      }}>
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <path d="M3 15h6"></path>
          <path d="M6 12v6"></path>
        </svg>
      </div>
      <span style={{ letterSpacing: '0.3px', fontWeight: 500 }}>
        Drop files or click to add context
      </span>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".txt,.js,.jsx,.ts,.tsx,.json,.md,.py,.html,.css,.scss,.less,.yaml,.yml,.toml,.ini,.env,.sh,.bash,.zsh,.fish,.sql,.graphql,.prisma"
      />
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { settings, addMessage } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [showThinking, setShowThinking] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasThinking = message.role === 'assistant' && message.content.includes('<think>');
  let thinking = '';
  let response = message.content;
  
  if (hasThinking) {
    const thinkingMatch = message.content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkingMatch && thinkingMatch[1]) {
      thinking = thinkingMatch[1].trim();
      response = message.content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    }
  }

  const handleCopy = async () => {
    try {
      const contentToCopy = hasThinking ? `${thinking}\n\n${response}` : response;
      await navigator.clipboard.writeText(contentToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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

  const formatContent = (content: string) => {
    return content
      // Fix extra spaces between words
      .replace(/\s+/g, ' ')
      // Fix extra spaces around punctuation
      .replace(/\s+([.,!?])/g, '$1')
      // Ensure proper spacing after punctuation
      .replace(/([.,!?])(\w)/g, '$1 $2')
      // Fix extra spaces around quotes
      .replace(/"\s+/g, '"')
      .replace(/\s+"/g, '"')
      // Fix extra spaces around apostrophes
      .replace(/'\s+/g, "'")
      .replace(/\s+'/g, "'")
      // Ensure proper paragraph breaks
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  };

  const commonMarkdownStyles = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div style={{ 
          marginBottom: '1rem',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: isDarkTheme 
            ? '0 2px 4px rgba(0, 0, 0, 0.2)' 
            : '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <SyntaxHighlighter
            style={isDarkTheme ? vscDarkPlus : vs}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: '4px',
              fontSize: '13px',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code 
          className={className} 
          style={{
            backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    table: ({ node, ...props }: any) => (
      <div style={{ overflow: 'auto', marginBottom: '1rem' }}>
        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          fontSize: '14px',
          fontFamily: message.role === 'assistant' ? 'Inter, sans-serif' : 'JetBrains Mono, monospace',
        }} {...props} />
      </div>
    ),
    th: ({ node, ...props }: any) => (
      <th style={{
        backgroundColor: isDarkTheme ? '#2a2a2a' : '#e0e0e0',
        padding: '8px',
        textAlign: 'left',
        border: `1px solid ${isDarkTheme ? '#3a3a3a' : '#ccc'}`,
      }} {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td style={{
        padding: '8px',
        textAlign: 'left',
        border: `1px solid ${isDarkTheme ? '#3a3a3a' : '#ccc'}`,
      }} {...props} />
    ),
    blockquote: ({ node, ...props }: any) => (
      <blockquote style={{
        borderLeft: `3px solid ${isDarkTheme ? '#3a3a3a' : '#ccc'}`,
        padding: '0 1rem',
        margin: '1rem 0',
        color: isDarkTheme ? '#a0a0a0' : '#606060',
      }} {...props} />
    ),
    p: ({ node, ...props }: any) => (
      <p style={{ marginBottom: '1rem', whiteSpace: 'pre-line' }} {...props} />
    ),
    h1: ({ node, ...props }: any) => (
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', marginTop: '1rem' }} {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.8rem', marginTop: '1rem' }} {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.6rem', marginTop: '1rem' }} {...props} />
    ),
    ul: ({ node, ...props }: any) => (
      <ul style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />
    ),
    ol: ({ node, ...props }: any) => (
      <ol style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />
    ),
    li: ({ node, ...props }: any) => (
      <li style={{ marginBottom: '0.25rem' }} {...props} />
    ),
    strong: ({ node, ...props }: any) => (
      <strong style={{ fontWeight: 'bold' }} {...props} />
    ),
    em: ({ node, ...props }: any) => (
      <em style={{ fontStyle: 'italic' }} {...props} />
    ),
  };

  const isThinkingComplete = hasThinking && response.trim().length > 0;

  React.useEffect(() => {
    if (hasThinking && !isThinkingComplete) {
      setShowThinking(true);
    }
  }, [hasThinking, isThinkingComplete]);

  return (
    <>
      {message.role === 'user' && <ContextArea isDarkTheme={isDarkTheme} onAddMessage={addMessage} />}
      <div style={{
        marginBottom: '1.5rem',
        fontFamily: message.role === 'assistant' ? 'Inter, sans-serif' : 'JetBrains Mono, monospace',
        fontSize: '14px',
        color: isDarkTheme ? '#e0e0e0' : '#404040',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        backgroundColor: message.role === 'assistant' 
          ? (isDarkTheme ? 'rgba(26, 26, 26, 0.4)' : 'rgba(245, 245, 245, 0.6)')
          : 'transparent',
        border: message.role === 'assistant'
          ? `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
          : 'none',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '0.75rem',
          gap: '0.5rem',
          justifyContent: 'space-between',
        }}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            {message.role === 'user' ? (
              <>
                <span style={{marginRight: '0.5rem'}}>&#62;</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: isDarkTheme ? '#2a2a2a' : '#e0e0e0',
                  borderRadius: '4px',
                  fontWeight: 500,
                  fontSize: '11px',
                  color: isDarkTheme ? '#e0e0e0' : '#404040',
                  letterSpacing: '0.5px',
                }}>USER</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <circle cx="15.5" cy="8.5" r="1.5"></circle>
                  <path d="M9 15a3 3 0 0 0 6 0"></path>
                </svg>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: isDarkTheme ? '#1e1e1e' : '#d0d0d0',
                  borderRadius: '4px',
                  fontWeight: 500,
                  fontSize: '11px',
                  color: isDarkTheme ? '#e0e0e0' : '#404040',
                  letterSpacing: '0.5px',
                }}>AGENT</span>
              </>
            )}
          </div>

          {hasThinking && (
            <div 
              onClick={() => setShowThinking(!showThinking)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: showThinking 
                  ? (isDarkTheme ? '#2a2a2a' : '#d0d0d0') 
                  : (isDarkTheme ? '#1a1a1a' : '#e0e0e0'),
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                gap: '4px',
                transition: 'all 0.2s ease',
                border: `1px solid ${isDarkTheme ? '#2a2a2a' : '#d0d0d0'}`,
                opacity: 0.8,
                userSelect: 'none',
              }}
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={isDarkTheme ? '#909090' : '#606060'} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span style={{color: isDarkTheme ? '#b0b0b0' : '#505050', letterSpacing: '0.5px'}}>ANALYSIS</span>
              <svg 
                width="10" 
                height="10" 
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

        {hasThinking && (
          <div style={{
            padding: '0.5rem 0.75rem',
            borderLeft: `2px solid ${isDarkTheme ? '#2a2a2a' : '#d0d0d0'}`,
            marginBottom: '0.75rem',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            color: isDarkTheme ? '#909090' : '#606060',
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
            maxHeight: showThinking ? '500px' : '0px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            opacity: showThinking ? 0.9 : 0,
            lineHeight: 1.5,
          }}>
            <div style={{
              fontWeight: 500,
              color: isDarkTheme ? '#a0a0a0' : '#505050',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '4px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {isThinkingComplete ? 'Analysis' : 'Analyzing...'}
            </div>
            <ReactMarkdown
              components={commonMarkdownStyles}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {thinking}
            </ReactMarkdown>
          </div>
        )}

        <div style={{
          padding: '0.5rem 0.75rem',
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
          lineHeight: 1.6,
          fontFamily: message.role === 'assistant' ? 'Inter, sans-serif' : 'inherit',
          marginTop: hasThinking ? '0.5rem' : '0',
        }}>
          <ReactMarkdown
            components={commonMarkdownStyles}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {formatContent(response)}
          </ReactMarkdown>

          <div style={{
            fontSize: '11px',
            color: isDarkTheme ? 'rgba(224, 224, 224, 0.4)' : 'rgba(64, 64, 64, 0.4)',
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: `1px solid ${isDarkTheme ? 'rgba(42, 42, 42, 0.2)' : 'rgba(224, 224, 224, 0.3)'}`,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span>{formatTime(message.timestamp || Date.now())}</span>
            
            {message.role === 'assistant' && (
              <button
                onClick={handleCopy}
                className="command-button"
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: copySuccess 
                    ? (isDarkTheme ? '#81c784' : '#4caf50')
                    : (isDarkTheme ? 'rgba(224, 224, 224, 0.5)' : 'rgba(64, 64, 64, 0.5)'),
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  opacity: 0.8,
                }}
                title="Copy response"
              >
                {copySuccess ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Copied</span>
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
    </>
  );
};

export default MessageItem; 