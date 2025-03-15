import React from 'react';

interface TitleBarProps {
  title: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ title }) => {
  // Handle window controls
  const handleMinimize = () => {
    if (typeof window !== 'undefined' && window.electron) {
      try {
        window.electron.windowControls.minimize();
        console.log('Minimize command sent');
      } catch (error) {
        console.error('Error minimizing window:', error);
      }
    }
  };

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && window.electron) {
      try {
        window.electron.windowControls.maximize();
        console.log('Maximize command sent');
      } catch (error) {
        console.error('Error maximizing window:', error);
      }
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.electron) {
      try {
        window.electron.windowControls.close();
        console.log('Close command sent');
      } catch (error) {
        console.error('Error closing window:', error);
      }
    }
  };

  // Terminal icon SVG
  const TerminalIcon = () => (
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  );

  return (
    <div 
      className="terminal-header draggable" 
      style={{
        padding: '0.5rem 1rem',
        borderBottom: '2px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--header-bg)',
        height: '36px',
        boxSizing: 'border-box',
      }}
    >
      <div className="terminal-title" style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <TerminalIcon />
        <span style={{
          fontWeight: 'bold',
          letterSpacing: '1px',
          fontSize: '0.875rem',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
      </div>
      
      <div className="window-controls non-draggable" style={{ 
        display: 'flex', 
        gap: '0.5rem',
      }}>
        <div
          onClick={handleMinimize}
          className="window-control minimize non-draggable"
          title="Minimize"
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#f59e0b', // amber-500
            border: 'none',
            cursor: 'pointer',
          }}
        />
        
        <div
          onClick={handleMaximize}
          className="window-control maximize non-draggable"
          title="Maximize"
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#10b981', // green-500
            border: 'none',
            cursor: 'pointer',
          }}
        />
        
        <div
          onClick={handleClose}
          className="window-control close non-draggable"
          title="Close"
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#ef4444', // red-500
            border: 'none',
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
};

export default TitleBar; 