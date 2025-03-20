import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import CodePanel from './CodePanel';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

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
  
  // Check if code is large enough to warrant a panel view
  // This threshold can be adjusted based on preference
  const isLargeCode = () => {
    const lines = code.split('\n');
    return lines.length > 15 || code.length > 500;
  };
  
  // Get a preview of the code (first few lines)
  const getCodePreview = () => {
    const lines = code.split('\n');
    
    // If code is small, return the full code
    if (!isLargeCode()) {
      return code;
    }
    
    // Otherwise return a preview
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
    if (!isLargeCode()) return; // Don't open panel for small code
    
    e.stopPropagation(); // Prevent event bubbling
    setIsPanelOpen(true);
    document.body.classList.add('has-open-panel');
  };
  
  // Close the code panel
  const closePanel = () => {
    setIsPanelOpen(false);
    document.body.classList.remove('has-open-panel');
  };
  
  // Get a more descriptive title based on language and content
  const getEnhancedTitle = () => {
    if (title) return title;
    
    let enhancedTitle = '';
    
    // Check language first
    if (language) {
      switch(language.toLowerCase()) {
        case 'javascript':
        case 'js':
          enhancedTitle = 'JavaScript';
          break;
        case 'typescript':
        case 'ts':
          enhancedTitle = 'TypeScript';
          break;
        case 'python':
        case 'py':
          enhancedTitle = 'Python';
          break;
        case 'html':
          enhancedTitle = 'HTML';
          break;
        case 'css':
          enhancedTitle = 'CSS';
          break;
        case 'json':
          enhancedTitle = 'JSON';
          break;
        case 'jsx':
          enhancedTitle = 'React JSX';
          break;
        case 'tsx':
          enhancedTitle = 'React TSX';
          break;
        default:
          enhancedTitle = language.charAt(0).toUpperCase() + language.slice(1);
      }
    } else {
      enhancedTitle = 'Code';
    }
    
    // Add code length info for large code
    if (isLargeCode()) {
      const lines = code.split('\n').length;
      enhancedTitle += ` (${lines} lines)`;
    }
    
    return enhancedTitle;
  };
  
  // For small code, use a simpler display without expand option, but with syntax highlighting
  if (!isLargeCode()) {
    return (
      <div 
        className="code-snippet is-small-code"
        style={{
          backgroundColor: 'transparent',
          borderRadius: 'var(--border-radius)',
          margin: 'var(--spacing-2) 0',
          overflow: 'hidden',
          fontFamily: 'var(--font-family-mono)',
          fontSize: 'var(--font-size-caption)',
          lineHeight: 1.5,
          boxShadow: `0px 2px 4px ${isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
        }}
      >
        <div className="code-snippet-title" style={{
          backgroundColor: isDarkTheme ? '#2a2a2a' : '#e6e6e6',
          padding: 'var(--spacing-2) var(--spacing-3)',
          borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          borderTopLeftRadius: 'var(--border-radius)',
          borderTopRightRadius: 'var(--border-radius)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ 
            color: isDarkTheme ? '#e0e0e0' : '#333',
            fontSize: 'var(--font-size-caption)',
            fontWeight: 500,
          }}>
            {getEnhancedTitle()}
          </span>
        </div>
        
        <div className="code-snippet-content" style={{
          backgroundColor: isDarkTheme ? '#1E1E1E' : '#F5F5F5',
        }}>
          <SyntaxHighlighter
            language={language || 'text'}
            style={isDarkTheme ? vscDarkPlus : vs}
            customStyle={{
              margin: 0,
              padding: 'var(--spacing-3)',
              borderRadius: 0,
              fontSize: 'var(--font-size-caption)',
              background: 'transparent',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }
  
  // For large code, use expandable snippet with panel
  return (
    <>
      <div 
        className="code-snippet is-large-code"
        onClick={openPanel}
        style={{
          backgroundColor: 'transparent',
          borderRadius: 'var(--border-radius)',
          margin: 'var(--spacing-2) 0',
          overflow: 'hidden',
          fontFamily: 'var(--font-family-mono)',
          fontSize: 'var(--font-size-caption)',
          lineHeight: 1.5,
          boxShadow: `0px 2px 4px ${isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
          cursor: 'pointer',
        }}
      >
        <div className="code-snippet-title" style={{
          backgroundColor: isDarkTheme ? '#2a2a2a' : '#e6e6e6',
          padding: 'var(--spacing-2) var(--spacing-3)',
          borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          borderTopLeftRadius: 'var(--border-radius)',
          borderTopRightRadius: 'var(--border-radius)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ 
            color: isDarkTheme ? '#e0e0e0' : '#333',
            fontSize: 'var(--font-size-caption)',
            fontWeight: 500,
          }}>
            {getEnhancedTitle()}
          </span>
          
          <span className="expand-button" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-1)',
            color: isDarkTheme ? '#b0b0b0' : '#555',
            fontSize: 'var(--font-size-caption)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            Expand
          </span>
        </div>
        
        <div className="code-snippet-preview" style={{
          backgroundColor: isDarkTheme ? '#1E1E1E' : '#F5F5F5',
        }}>
          <SyntaxHighlighter
            language={language || 'text'}
            style={isDarkTheme ? vscDarkPlus : vs}
            customStyle={{
              margin: 0,
              padding: 'var(--spacing-3)',
              borderRadius: 0,
              fontSize: 'var(--font-size-caption)',
              background: 'transparent',
              maxHeight: '150px',
              overflow: 'hidden',
            }}
          >
            {getCodePreview()}
          </SyntaxHighlighter>
        </div>
      </div>
      
      {isPanelOpen && (
        <CodePanel
          code={code}
          language={language}
          title={getEnhancedTitle()}
          isOpen={isPanelOpen}
          onClose={closePanel}
        />
      )}
    </>
  );
};

export default CodeSnippet; 