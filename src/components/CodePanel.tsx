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
          padding: var(--spacing-4);
          border-bottom: 1px solid ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .code-panel-title {
          margin: 0;
          color: ${isDarkTheme ? '#e0e0e0' : '#333'};
          font-size: var(--font-size-body);
          font-weight: 500;
        }
        
        .code-panel-actions {
          display: flex;
          gap: var(--spacing-2);
        }
        
        .code-panel-button {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--spacing-1);
          color: ${isDarkTheme ? '#b0b0b0' : '#555'};
          font-size: var(--font-size-caption);
          padding: var(--spacing-1) var(--spacing-2);
          border-radius: var(--border-radius);
          transition: background-color 0.2s ease, transform 0.1s ease;
        }
        
        .code-panel-button:hover {
          background-color: ${isDarkTheme ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.5)'};
          transform: scale(1.05);
        }
        
        .code-panel-content {
          flex: 1;
          overflow: auto;
          padding: var(--spacing-4);
          font-family: var(--font-family-mono);
          font-size: var(--font-size-caption);
          line-height: 1.5;
          background-color: ${isDarkTheme ? 'var(--code-panel-bg-dark)' : 'var(--code-panel-bg-light)'};
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
            background-color: var(--accent-color);
            color: white;
            position: fixed;
            bottom: env(safe-area-inset-bottom, 24px);
            left: 50%;
            transform: translateX(-50%);
            width: auto;
            padding: 8px 16px;
            border-radius: var(--border-radius);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 1001;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
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