import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodePreviewProps {
  code: string;
  language: string;
  isDarkTheme: boolean;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, language, isDarkTheme }) => {
  return (
    <div className="code-preview-container" style={{
      marginBottom: '1rem',
      borderRadius: '6px',
      overflow: 'hidden',
      border: 'none',
      boxShadow: `0 1px 3px ${isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'}`,
    }}>
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
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDarkTheme ? vscDarkPlus : vs}
        customStyle={{
          margin: 0,
          padding: '12px 16px',
          borderRadius: '0 0 6px 6px',
          fontSize: '14px',
          backgroundColor: isDarkTheme ? '#1e1e2e' : '#f5f5f5',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodePreview; 