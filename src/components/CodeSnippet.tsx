import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import CodePanel from './CodePanel';

interface CodeSnippetProps {
  code: string;
  language: string;
  title: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ 
  code, 
  language, 
  title
}) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Get a preview of the code (first few lines)
  const getCodePreview = () => {
    const lines = code.split('\n');
    const previewLines = lines.slice(0, 6); // Show first 6 lines max
    let preview = previewLines.join('\n');
    
    // Add ellipsis if there are more lines
    if (lines.length > 6) {
      preview += '\n...';
    }
    
    return preview;
  };
  
  // Open the code panel
  const openPanel = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsPanelOpen(true);
    document.body.classList.add('has-open-panel');
  };
  
  // Close the code panel
  const closePanel = () => {
    setIsPanelOpen(false);
    document.body.classList.remove('has-open-panel');
  };
  
  return (
    <>
      <div 
        className="code-snippet"
        onClick={openPanel}
        style={{
          backgroundColor: isDarkTheme ? '#1E1E1E' : '#F5F5F5',
          borderRadius: '4px',
          padding: '0.75rem',
          margin: '0.5rem 0',
          overflow: 'hidden',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          lineHeight: 1.5,
          boxShadow: `0px 2px 4px ${isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
        }}
      >
        <div className="code-snippet-title">
          <span style={{ 
            color: isDarkTheme ? '#e0e0e0' : '#333',
            fontSize: '14px',
          }}>
            {title || `Code ${language ? `(${language})` : ''}`}
          </span>
          
          <span className="expand-button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            Expand
          </span>
        </div>
        
        <div className="code-snippet-preview">
          <pre style={{
            margin: 0,
            padding: 0,
            color: isDarkTheme ? '#D4D4D4' : '#333333',
            whiteSpace: 'pre',
            overflow: 'hidden',
          }}>
            {getCodePreview()}
          </pre>
        </div>
      </div>
      
      {isPanelOpen && (
        <CodePanel
          code={code}
          language={language}
          title={title}
          isOpen={isPanelOpen}
          onClose={closePanel}
        />
      )}
    </>
  );
};

export default CodeSnippet; 