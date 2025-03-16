import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  isLastMessage: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [showThinking, setShowThinking] = useState(false);

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
    marginBottom: '1rem',
    fontFamily: 'JetBrains Mono, monospace',
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

  // Style for thinking section
  const thinkingContainerStyle = {
    backgroundColor: isDarkTheme ? '#1a1a1a' : '#f0f0f0',
    padding: '0.75rem',
    borderLeft: `3px solid ${isDarkTheme ? '#2a2a2a' : '#d0d0d0'}`,
    marginBottom: '0.75rem',
    fontSize: '12px',
    color: isDarkTheme ? '#a0a0a0' : '#606060',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    display: showThinking ? 'block' : 'none',
  };

  // Style for the summary section
  const summaryStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  // Message content style
  const messageContentStyle = {
    padding: '0.75rem',
    backgroundColor: message.role === 'user' 
      ? (isDarkTheme ? 'transparent' : 'transparent')
      : (isDarkTheme ? 'transparent' : 'transparent'),
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    lineHeight: 1.5,
  };

  // Timestamp style
  const timestampStyle = {
    fontSize: '12px',
    color: isDarkTheme ? '#808080' : '#a0a0a0',
    textAlign: 'right' as const,
    marginTop: '0.25rem',
  };

  // Toggle thinking display
  const toggleThinking = () => {
    setShowThinking(!showThinking);
  };

  return (
    <div style={containerStyle}>
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
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: isDarkTheme ? '#1e1e1e' : '#e0e0e0',
                fontSize: '12px',
                fontWeight: 600,
              }}
              onClick={toggleThinking}
            >
              <span style={{color: isDarkTheme ? '#e0e0e0' : '#404040'}}>CLASSIFIED ANALYSIS</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '0.5rem', transform: showThinking ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Analysis content */}
      {hasThinking && (
        <div style={thinkingContainerStyle}>
          {thinking}
        </div>
      )}

      {/* Message content */}
      <div style={messageContentStyle}>
        {response}
      </div>

      {/* Timestamp */}
      <div style={timestampStyle}>
        {formatTime(message.timestamp || Date.now())}
      </div>
    </div>
  );
};

export default MessageItem; 