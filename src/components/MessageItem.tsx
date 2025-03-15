import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MessageItemProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ role, content }) => {
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
          style={{
            display: 'block',
            backgroundColor: 'var(--code-bg)',
            padding: '0.75rem 1rem',
            borderRadius: '0.25rem',
            margin: '0.5rem 0',
            border: '1px solid var(--border-color)',
            whiteSpace: 'pre',
            overflowX: 'auto'
          }}
        >
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              backgroundColor: 'transparent',
              padding: 0,
              margin: 0,
              border: 'none'
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

  // Determine message color based on role
  const getMessageColor = () => {
    if (role === 'user') return 'var(--user-prefix-color)';
    if (role === 'assistant') return 'var(--ai-prefix-color)';
    return 'var(--system-color)';
  };

  return (
    <div 
      className={`message ${role}-message`}
      style={{ 
        marginBottom: '0.5rem',
        color: getMessageColor(),
      }}
    >
      {role !== 'system' ? (
        <>
          <span 
            className="prefix" 
            style={{ 
              fontWeight: 'bold',
              userSelect: 'none',
            }}
          >
            {role === 'user' ? '> USER: ' : '> AI: '}
          </span>
          <span style={{ 
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
          }}>
            {formatContent(content)}
          </span>
        </>
      ) : (
        <span style={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5',
          color: 'var(--system-color)',
          opacity: 0.8,
          fontStyle: 'italic'
        }}>
          {content}
        </span>
      )}
    </div>
  );
};

export default MessageItem; 