import React from 'react';
import { useAppContext } from '@/context/AppContext';
import ThinkingDisplay from './ThinkingDisplay';

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

  // Process content to remove thinking tags from display
  const processContent = (content: string): string => {
    // Remove thinking tags from display content
    return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  };
  
  const displayContent = processContent(content);

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
      marginBottom: '1rem',
      opacity: isProcessing ? 0.7 : 1,
      transition: 'opacity 0.2s ease',
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
          {role === 'user' ? 'You' : role === 'assistant' ? 'AI' : 'System'}
        </span>
        {timestamp && (
          <>
            <span>•</span>
            <span>{formatTime(timestamp)}</span>
          </>
        )}
      </div>

      <div style={{
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1.5',
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...getMessageStyle(),
      }}>
        {isProcessing ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            Processing...
          </div>
        ) : (
          displayContent
        )}
      </div>

      {/* Show thinking display for AI messages only if enabled in settings */}
      {role === 'assistant' && settings?.showAnalysis && !isProcessing && (
        <ThinkingDisplay content={content} />
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