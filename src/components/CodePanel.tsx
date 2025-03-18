import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import ReactDOM from 'react-dom';

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
  
  // Toggle body class when panel opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-open-panel');
    } else {
      document.body.classList.remove('has-open-panel');
    }
    
    return () => {
      document.body.classList.remove('has-open-panel');
    };
  }, [isOpen]);
  
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
  
  // Helper to determine code colors for syntax highlighting
  const getLineColor = (line: string, isDark: boolean): string => {
    // Keywords
    if (/\b(function|return|if|for|while|var|let|const|import|export|class|interface|extends|implements|new|this)\b/.test(line)) {
      return isDark ? '#C586C0' : '#AF00DB';
    }
    
    // Comment detection
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      return isDark ? '#6A9955' : '#008000';
    }
    
    // Strings
    if (/'([^'\\]|\\.)*'|"([^"\\]|\\.)*"/.test(line)) {
      return isDark ? '#CE9178' : '#A31515';
    }
    
    // Functions/methods
    if (/\w+\s*\(/.test(line)) {
      return isDark ? '#DCDCAA' : '#795E26';
    }
    
    // Types/interfaces
    if (/\b([A-Z]\w*)\b/.test(line)) {
      return isDark ? '#4EC9B0' : '#267F99';
    }
    
    // Default text color
    return isDark ? '#D4D4D4' : '#333333';
  };
  
  // Helper to maintain indentation
  const getIndentation = (line: string): string => {
    const indent = line.match(/^(\s*)/)?.[1] || '';
    return indent.replace(/ /g, '\u00A0').replace(/\t/g, '\u00A0\u00A0');
  };
  
  // Create portal content
  const panelContent = (
    <div
      className={`code-panel ${isOpen ? 'open' : ''}`}
      style={{
        position: 'fixed',
        top: '60px',
        right: isOpen ? '20px' : '-50%',
        width: 'calc(50% - 40px)',
        height: 'calc(100vh - 150px)',
        margin: '0',
        backgroundColor: 'var(--ai-response-background)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex', 
        flexDirection: 'column',
        transition: 'right 0.3s ease-in-out',
        zIndex: 50,
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      ref={panelRef}
    >
      <div className="code-panel-header">
        <h3 className="code-panel-title">
          {title || `Code ${language ? `(${language})` : ''}`}
        </h3>
        
        <div className="code-panel-actions">
          <button
            onClick={handleCopy}
            className="code-panel-button"
            title="Copy code"
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
            title="Close panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="code-panel-content">
        {code.split('\n').map((line, lineIndex) => (
          <div key={lineIndex} style={{
            display: 'block',
            color: getLineColor(line, isDarkTheme),
            paddingLeft: getIndentation(line),
            whiteSpace: 'pre',
          }}>
            {line}
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .code-panel {
          position: fixed;
          top: 60px;
          right: -50%;
          width: calc(50% - 40px);
          height: calc(100vh - 150px);
          margin: 0;
          background-color: ${isDarkTheme ? 'var(--code-panel-bg-dark)' : 'var(--code-panel-bg-light)'};
          box-shadow: ${isDarkTheme ? '-5px 0 15px var(--code-panel-shadow-dark)' : '-5px 0 15px var(--code-panel-shadow-light)'};
          transition: right 0.3s ease-in-out;
          z-index: 50;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'};
        }
        
        .code-panel.open {
          right: 0;
        }
        
        .code-panel-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'};
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: ${isDarkTheme ? 'rgba(35, 35, 38, 0.4)' : 'rgba(250, 250, 252, 0.8)'};
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        
        .code-panel-title {
          margin: 0;
          color: ${isDarkTheme ? '#e0e0e0' : '#333'};
          font-size: 14px;
          font-weight: 500;
        }
        
        .code-panel-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .code-panel-button {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: ${isDarkTheme ? '#b0b0b0' : '#555'};
          font-size: 12px;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .code-panel-button:hover {
          background-color: ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'};
        }
        
        .code-panel-content {
          flex: 1;
          overflow: auto;
          padding: 1rem;
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.5;
          background-color: ${isDarkTheme ? 'rgba(23, 23, 23, 0.6)' : 'rgba(255, 255, 255, 0.6)'};
          backdrop-filter: blur(8px);
        }
        
        @media (max-width: 768px) {
          .code-panel {
            width: 100%;
            right: -100%;
            margin: 0;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
  
  // Use portal to render at document root
  if (!mounted || typeof document === 'undefined') {
    return null;
  }
  
  return ReactDOM.createPortal(
    panelContent,
    document.body
  );
};

export default CodePanel; 