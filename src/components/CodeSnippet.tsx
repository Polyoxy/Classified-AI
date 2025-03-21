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
  
  // Detect language if not provided
  const detectLanguage = (code: string, providedLanguage: string): string => {
    if (providedLanguage && providedLanguage !== 'text') return providedLanguage;
    
    // Check for JavaScript/JSX
    if (code.includes('import React') || code.includes('const') || code.includes('function') || 
        code.includes('=>') || code.includes('render()') || code.includes('useState') ||
        code.includes('export default')) {
      return 'javascript';
    }
    
    // Check for HTML
    if (code.includes('<div') || code.includes('<span') || code.includes('<h1') || 
        code.includes('<html') || code.includes('<body') || code.includes('</') ||
        code.match(/<[a-z][\s\S]*>/)) {
      return 'html';
    }
    
    // Check for CSS
    if (code.includes('{') && code.includes('}') && 
        (code.includes('color:') || code.includes('margin:') || code.includes('padding:') ||
         code.includes('font-size:') || code.includes('.class'))) {
      return 'css';
    }
    
    // Check for Python
    if (code.includes('def ') || code.includes('import ') || code.includes('class ') || 
        code.includes('print(') || code.includes('for ') && code.includes(':')) {
      return 'python';
    }
    
    // Check for JSON
    if ((code.startsWith('{') && code.endsWith('}')) || 
        (code.startsWith('[') && code.endsWith(']'))) {
      try {
        JSON.parse(code);
        return 'json';
      } catch (e) {
        // Not valid JSON
      }
    }
    
    // Check for Bash/Shell
    if (code.includes('cd ') || code.includes('ls ') || code.includes('mkdir ') || 
        code.includes('echo ') || code.includes('sudo ') || code.includes('apt ') ||
        code.includes('npm ') || code.includes('git ')) {
      return 'bash';
    }
    
    // Default to text if no matches
    return 'text';
  };
  
  // Use detected language if none provided
  const effectiveLanguage = detectLanguage(code, language);
  
  // Check if code is large enough to warrant a panel view
  // This threshold can be adjusted based on preference
  const isLargeCode = () => {
    const lines = code.split('\n');
    // 50 lines or 500 characters as threshold
    return lines.length > 50 || code.length > 500;
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
    if (!isLargeCode()) {
      e.preventDefault();
      e.stopPropagation();
      return; // Don't open panel for small code
    }
    
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
    if (effectiveLanguage) {
      switch(effectiveLanguage.toLowerCase()) {
        case 'javascript':
        case 'js':
          enhancedTitle = 'JavaScript';
          break;
        case 'jsx':
          enhancedTitle = 'React JSX';
          break;
        case 'typescript':
        case 'ts':
          enhancedTitle = 'TypeScript';
          break;
        case 'tsx':
          enhancedTitle = 'React TSX';
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
        case 'bash':
        case 'sh':
          enhancedTitle = 'Shell Command';
          break;
        case 'yaml':
        case 'yml':
          enhancedTitle = 'YAML Configuration';
          break;
        case 'toml':
          enhancedTitle = 'TOML Configuration';
          break;
        case 'markdown':
        case 'md':
          enhancedTitle = 'Markdown';
          break;
        default:
          enhancedTitle = effectiveLanguage.charAt(0).toUpperCase() + effectiveLanguage.slice(1);
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
          borderRadius: 0,
          margin: 'var(--spacing-2) 0',
          overflow: 'hidden',
          fontFamily: '"Source Code Pro", monospace',
          fontSize: 'var(--font-size-caption)',
          lineHeight: 1.5,
          boxShadow: 'none',
        }}
      >
        <div className="code-snippet-title" style={{
          backgroundColor: '#2d2d2d',
          padding: 'var(--spacing-2) var(--spacing-3)',
          borderBottom: 'none',
          borderRadius: 0,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 0,
        }}>
          <span style={{ 
            color: '#f8f8f2',
            fontSize: '16px',
            fontFamily: '"Söhne", "Söhne Buch", "Söhne Halbfett", "Söhne Dreiviertelfett", "Söhne Breit", "Söhne Mono", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 500,
          }}>
            {getEnhancedTitle()}
          </span>
        </div>
        
        <div className="code-snippet-content" style={{
          backgroundColor: '#121212', // Near black background
          marginTop: 0,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
        }}>
          <SyntaxHighlighter
            language={effectiveLanguage || 'text'}
            style={vscDarkPlus}
            showLineNumbers={false}
            customStyle={{
              margin: 0,
              padding: 'var(--spacing-3)',
              borderRadius: 0,
              fontSize: 'var(--font-size-caption)',
              background: 'transparent',
              fontFamily: '"Source Code Pro", monospace',
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
          borderRadius: 0,
          margin: 'var(--spacing-2) 0',
          overflow: 'hidden',
          fontFamily: '"Source Code Pro", monospace',
          fontSize: 'var(--font-size-caption)',
          lineHeight: 1.5,
          boxShadow: 'none',
          cursor: isLargeCode() ? 'pointer' : 'default',
        }}
      >
        <div className="code-snippet-title" style={{
          backgroundColor: '#2d2d2d',
          padding: 'var(--spacing-2) var(--spacing-3)',
          borderBottom: 'none',
          borderRadius: 0,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 0,
        }}>
          <span style={{ 
            color: '#f8f8f2',
            fontSize: '16px',
            fontFamily: '"Söhne", "Söhne Buch", "Söhne Halbfett", "Söhne Dreiviertelfett", "Söhne Breit", "Söhne Mono", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 500,
          }}>
            {getEnhancedTitle()}
          </span>
          
          {isLargeCode() && (
            <span className="expand-button" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)',
              color: '#f8f8f2',
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
          )}
        </div>
        
        <div className="code-snippet-preview" style={{
          backgroundColor: '#121212', // Near black background
          position: 'relative',
          marginTop: 0,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
        }}>
          <SyntaxHighlighter
            language={effectiveLanguage || 'text'}
            style={vscDarkPlus}
            showLineNumbers={false}
            customStyle={{
              margin: 0,
              padding: 'var(--spacing-3)',
              borderRadius: 0,
              fontSize: 'var(--font-size-caption)',
              background: 'transparent',
              maxHeight: '150px',
              overflow: 'hidden',
              fontFamily: '"Source Code Pro", monospace',
            }}
          >
            {getCodePreview()}
          </SyntaxHighlighter>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30px',
            background: 'linear-gradient(to bottom, transparent, #0a0a0a)',
            pointerEvents: 'none',
          }}></div>
        </div>
      </div>
      
      {isPanelOpen && (
        <CodePanel
          code={code}
          language={effectiveLanguage}
          title={getEnhancedTitle()}
          isOpen={isPanelOpen}
          onClose={closePanel}
        />
      )}
    </>
  );
};

export default CodeSnippet; 