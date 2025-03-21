import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import ReactDOM from 'react-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodePanelProps {
  code: string;
  language: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const CodePanel: React.FC<CodePanelProps> = ({ 
  code, 
  language, 
  title,
  isOpen,
  onClose
}) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [showCopied, setShowCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // Handle component mount/unmount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);
  
  // Get enhanced title with line count if not already provided
  const getEnhancedTitle = () => {
    if (title && !title.includes('lines')) {
      const lines = code.split('\n').length;
      return `${title} (${lines} lines)`;
    }
    return title || 'Code Panel';
  };
  
  // Create portal content
  const panelContent = (
    <div 
      className={`code-panel ${isOpen ? 'open' : ''}`}
      ref={panelRef}
    >
      <div className="code-panel-header">
        <h3 className="code-panel-title">
          {getEnhancedTitle()}
        </h3>
        
        <div className="code-panel-actions">
          <button
            onClick={handleCopy}
            className="code-panel-button"
          >
            {showCopied ? (
              'Copied!'
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="code-panel-button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="code-panel-content" style={{
        width: '100%',
        overflow: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkTheme ? '#333 #121212' : '#ccc #ffffff',
      }}>
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          showLineNumbers={true}
          lineNumberStyle={{
            color: isDarkTheme ? 'rgba(180, 180, 180, 0.5)' : 'rgba(80, 80, 80, 0.5)', 
            paddingRight: '1.2em',
            marginRight: '0.5em',
            minWidth: '2.5em',
            textAlign: 'right',
          }}
          customStyle={{
            margin: 0,
            padding: '1rem',
            borderRadius: 0,
            fontSize: '14px',
            background: 'transparent',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            fontFamily: '"Source Code Pro", monospace',
            scrollbarWidth: 'thin',
            scrollbarColor: isDarkTheme ? '#333 #121212' : '#ccc #ffffff',
          }}
          wrapLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
      
      {/* Mobile back button */}
      <div className="mobile-back-button" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back to Chat
      </div>
      
      <style jsx>{`
        .code-panel {
          position: fixed;
          top: 0;
          right: -50%;
          width: 50%;
          height: 100vh;
          background-color: ${isDarkTheme ? 'var(--code-panel-bg-dark)' : 'var(--code-panel-bg-light)'};
          box-shadow: ${isDarkTheme ? '-5px 0 15px var(--code-panel-shadow-dark)' : '-5px 0 15px var(--code-panel-shadow-light)'};
          transition: right 0.3s ease-in-out;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .code-panel.open {
          right: 0;
        }
        
        .code-panel-header {
          padding: 0.5rem 1rem;
          background-color: #2d2d2d;
          border-bottom: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0;
        }
        
        .code-panel-title {
          margin: 0;
          color: ${isDarkTheme ? '#e0e0e0' : '#333'};
          font-size: 16px;
          font-family: '"Söhne", "Söhne Buch", "Söhne Halbfett", "Söhne Dreiviertelfett", "Söhne Breit", "Söhne Mono", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
          font-weight: 500;
          margin-bottom: 0;
        }
        
        .code-panel-actions {
          display: flex;
          gap: 4px;
        }
        
        .code-panel-button {
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 4px;
        }
        
        .code-panel-button:hover {
          color: white;
        }
        
        .code-panel-content {
          flex-grow: 1;
          height: calc(100% - 40px);
        }
        
        .code-panel-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .code-panel-content::-webkit-scrollbar-track {
          background: ${isDarkTheme ? 'rgba(24, 24, 24, 0.7)' : 'rgba(252, 252, 252, 0.8)'};
        }
        
        .code-panel-content::-webkit-scrollbar-thumb {
          background-color: ${isDarkTheme ? 'rgba(80, 80, 80, 0.5)' : 'rgba(200, 200, 200, 0.8)'};
          border-radius: 6px;
        }
        
        .code-panel-content::-webkit-scrollbar-thumb:hover {
          background: ${isDarkTheme ? '#444' : '#999'};
        }
        
        .mobile-back-button {
          display: none;
        }
        
        @media (max-width: 768px) {
          .code-panel {
            width: 100%;
            right: -100%;
          }
          
          .mobile-back-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-3);
            background-color: ${isDarkTheme ? 'rgba(40, 40, 40, 0.8)' : 'rgba(240, 240, 240, 0.8)'};
            color: ${isDarkTheme ? '#d0d0d0' : '#333'};
            border-top: 1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'};
            font-size: var(--font-size-body);
            cursor: pointer;
          }
          
          .mobile-back-button:hover {
            background-color: ${isDarkTheme ? 'rgba(60, 60, 60, 0.8)' : 'rgba(220, 220, 220, 0.8)'};
          }
        }
      `}</style>
    </div>
  );
  
  // Use portal to render outside of normal flow
  return mounted ? ReactDOM.createPortal(panelContent, document.body) : null;
};

export default CodePanel; 