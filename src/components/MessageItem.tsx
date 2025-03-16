import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useAppContext } from '@/context/AppContext';
import { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  isLastMessage: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLastMessage }) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  
  const getUserColors = () => {
    return isDarkTheme
      ? { bg: '#2a2a2a', border: '1px solid #404040' }
      : { bg: '#f0f0f0', border: '1px solid #e0e0e0' };
  };

  const getAIColors = () => {
    return isDarkTheme
      ? { bg: '#121212', border: 'none' }
      : { bg: '#ffffff', border: 'none' };
  };

  const messageStyle = {
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '0.5rem',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    ...(message.role === 'user' ? getUserColors() : getAIColors()),
  };

  const codeBlockStyle = {
    margin: '0.5rem 0',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: isDarkTheme ? '#1e1e1e' : '#f5f5f5',
    border: `1px solid ${isDarkTheme ? '#2d2d2d' : '#e0e0e0'}`,
  };

  const formatContent = (content: string) => {
    // Split content by code block markers
    const parts = content.split('```');
    
    return parts.map((part, index) => {
      // Even indices are regular text, odd indices are code blocks
      if (index % 2 === 0) {
        return <span key={index}>{part}</span>;
      } else {
        // Extract language if specified
        const [lang, ...code] = part.split('\n');
        const language = lang.trim() || 'plaintext';
        const codeContent = code.join('\n').trim();
        
        return (
          <div key={index} style={codeBlockStyle}>
            <SyntaxHighlighter
              language={language}
              style={isDarkTheme ? vscDarkPlus : vs}
              customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
            >
              {codeContent}
            </SyntaxHighlighter>
          </div>
        );
      }
    });
  };

  return (
    <div style={messageStyle}>
      <div style={{ fontWeight: 500, marginBottom: '0.5rem', color: isDarkTheme ? '#e0e0e0' : '#404040' }}>
        {message.role === 'user' ? 'You' : 'Assistant'}
      </div>
      <div style={{ color: isDarkTheme ? '#e0e0e0' : '#404040' }}>
        {formatContent(message.content)}
      </div>
    </div>
  );
};

export default MessageItem; 