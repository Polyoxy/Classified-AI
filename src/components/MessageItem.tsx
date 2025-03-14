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
        <code 
          key={`code-${parts.length}`} 
          style={{
            display: 'block',
            backgroundColor: '#2A2A2A',
            padding: '8px 12px',
            borderRadius: '4px',
            margin: '8px 0',
            borderLeft: '3px solid var(--accent-color)',
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
        </code>
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

  return (
    <div 
      className={`message ${role === 'user' ? 'user-message' : 'ai-message'}`}
      style={{ 
        marginBottom: '16px', 
        display: 'flex',
        alignItems: 'flex-start'
      }}
    >
      {role !== 'system' ? (
        <span 
          className="prefix" 
          style={{ 
            color: role === 'user' ? 'var(--user-prefix-color)' : 'var(--ai-prefix-color)',
            fontWeight: 'bold',
            userSelect: 'none',
            marginRight: '8px',
            display: 'inline-block',
            minWidth: '45px'
          }}
        >
          {role === 'user' ? 'USER>' : 'AI>'}
        </span>
      ) : null}
      <span style={{ 
        flex: 1, 
        whiteSpace: 'pre-wrap',
        lineHeight: '1.6'
      }}>
        {formatContent(content)}
      </span>
    </div>
  );
};

export default MessageItem; 