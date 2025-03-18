import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodePreviewProps {
  code: string;
  language: string;
  isDarkTheme: boolean;
  fullWidth?: boolean;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, language, isDarkTheme, fullWidth = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // If fullWidth is true, don't show collapse toggle and always show expanded
  return (
    <div className="code-preview-container" style={{
      marginBottom: fullWidth ? 0 : '1rem',
      borderRadius: fullWidth ? 0 : '6px',
      overflow: 'hidden',
      border: fullWidth ? 'none' : 'none',
      boxShadow: fullWidth ? 'none' : `0 1px 3px ${isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'}`,
      transition: 'transform 0.3s ease-in-out',
      transform: !fullWidth && isExpanded ? 'translateX(0)' : (fullWidth ? 'translateX(0)' : 'translateX(calc(100% - 40px))'),
      position: 'relative',
    }}>
      {!fullWidth && (
        <div 
          className="collapse-toggle"
          onClick={toggleExpanded}
          style={{
            position: 'absolute',
            left: 0,
            top: '40%',
            backgroundColor: isDarkTheme ? '#2a2a2a' : '#e6e6e6',
            color: isDarkTheme ? '#b0b0b0' : '#505060',
            width: '24px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '0 4px 4px 0',
            zIndex: 10,
            boxShadow: `2px 0 4px ${isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'}`,
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            borderLeft: 'none',
          }}
        >
          {isExpanded ? '›' : '‹'}
        </div>
      )}
      {!fullWidth && (
        <div className="code-preview-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: isDarkTheme ? '#2a2a2a' : '#e6e6e6',
          borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}>
          <span style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px',
            fontWeight: 500,
            color: isDarkTheme ? '#b0b0b0' : '#505060',
          }}>
            {language.toUpperCase()}
          </span>
          <button
            onClick={toggleExpanded}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDarkTheme ? '#b0b0b0' : '#505060',
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            {isExpanded ? 'Hide' : 'Show'}
          </button>
        </div>
      )}
      {(isExpanded || fullWidth) && (
        <SyntaxHighlighter
          language={language}
          style={isDarkTheme ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            padding: '12px 16px',
            borderRadius: fullWidth ? 0 : '0 0 6px 6px',
            fontSize: '14px',
            backgroundColor: isDarkTheme ? '#1e1e2e' : '#f5f5f5',
            minHeight: fullWidth ? '250px' : 'auto',
          }}
        >
          {code}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

export default CodePreview; 