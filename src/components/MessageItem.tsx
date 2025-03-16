import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useAppContext } from '@/context/AppContext';

interface MessageItemProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ role, content }) => {
  // Get theme from context to use appropriate syntax highlighting
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  
  // Function to format the message content and handle code blocks
  const formatContent = (text: string) => {
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${parts.length}`} style={{ whiteSpace: 'pre-wrap' }}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add code block with syntax highlighting
      const language = match[1] || 'text';
      const code = match[2];
      parts.push(
        <div 
          key={`code-${parts.length}`} 
          style={codeBlockStyle}
        >
          <SyntaxHighlighter
            language={language}
            style={isDarkTheme ? vscDarkPlus : vs}
            customStyle={{
              backgroundColor: 'transparent',
              padding: 0,
              margin: 0,
              border: 'none',
              fontSize: `${settings?.fontSize || 14}px`,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${parts.length}`} style={{ whiteSpace: 'pre-wrap' }}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  // Get appropriate colors based on role and theme
  const getUserColors = () => {
    if (isDarkTheme) {
      return {
        prefix: '#FFD700', // Golden color for user prefix
        bg: '#1e3a8a',    // Dark blue for better visibility
        border: '2px solid #3b82f6'  // Prominent blue border
      };
    } else {
      return {
        prefix: '#1d4ed8', // Blue for user prefix in light mode
        bg: '#dbeafe',     // Light blue background for user messages
        border: '2px solid #3b82f6'  // Blue border for visibility
      };
    }
  };
  
  const getAIColors = () => {
    if (isDarkTheme) {
      return {
        prefix: 'var(--accent-color, #E34234)', // Vermillion orange for prefix
        bg: '#121212',      // Dark background
        border: 'none'
      };
    } else {
      return {
        prefix: 'var(--accent-color, #E34234)', // Vermillion orange for prefix
        bg: '#ffffff',      // White background
        border: 'none'
      };
    }
  };

  // Get colors for current role
  const colors = role === 'user' ? getUserColors() : getAIColors();

  // Create message style based on role
  const messageStyle = {
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: colors.bg,
    border: colors.border,
    color: 'var(--text-color)',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    fontSize: `${settings?.fontSize || 14}px`,
    lineHeight: '1.6',
    transition: 'all 0.2s ease',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box' as const,
    boxShadow: isDarkTheme 
      ? '0 1px 2px rgba(0, 0, 0, 0.2)' 
      : '0 1px 2px rgba(0, 0, 0, 0.05)'
  };

  // Style for the role prefix
  const prefixStyle = {
    fontWeight: 'bold' as const,
    color: colors.prefix,
    userSelect: 'none' as const,
    display: 'inline-block',
    marginBottom: '0.5rem',
    fontSize: `${(settings?.fontSize || 14)}px`,
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)'
  };

  // Style for the message content
  const contentStyle = {
    whiteSpace: 'pre-wrap' as const,
    lineHeight: '1.6',
    color: 'var(--text-color)',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)'
  };

  // Add code block syntax highlighting
  const codeBlockStyle = {
    display: 'block',
    backgroundColor: isDarkTheme ? '#1e1e1e' : '#f5f5f5',
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    margin: '0.75rem 0',
    border: `1px solid ${isDarkTheme ? '#2a2a2a' : '#e0e0e0'}`,
    whiteSpace: 'pre' as const,
    overflowX: 'auto' as const,
    boxShadow: isDarkTheme ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.05)',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)'
  };

  // Style for system messages
  const systemStyle = {
    ...messageStyle,
    fontStyle: 'italic' as const,
    opacity: 0.8,
    color: 'var(--system-color)',
    backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
    padding: '0.5rem 0.75rem',
  };

  return (
    <div 
      className={`message ${role}-message`}
      style={role === 'system' ? systemStyle : messageStyle}
    >
      {role !== 'system' ? (
        <>
          <span className="prefix" style={prefixStyle}>
            {role === 'user' ? '$ USER:' : '$ AI:'}
          </span>
          <div style={contentStyle}>
            {formatContent(content)}
          </div>
        </>
      ) : (
        <span style={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5',
          fontStyle: 'italic'
        }}>
          {content}
        </span>
      )}
    </div>
  );
};

export default MessageItem; 