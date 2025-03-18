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
      borderRadius: '8px',
      overflow: 'hidden',
      border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    }}>
      <div className="code-preview-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: isDarkTheme ? '#1e1e2e' : '#f5f5f5',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}>
        <span style={{ 
          fontFamily: 'monospace', 
          fontSize: '12px',
          color: isDarkTheme ? '#a0a0b0' : '#505060',
        }}>
          {language.toUpperCase()}
        </span>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDarkTheme ? vscDarkPlus : vs}
        customStyle={{
          margin: 0,
          padding: '12px',
          borderRadius: '0 0 8px 8px',
          fontSize: '14px',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodePreview; 