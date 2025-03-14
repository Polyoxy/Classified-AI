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

  return (
    <div 
      className="terminal-header draggable" 
      style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-color)',
        height: '36px',
        boxSizing: 'border-box',
      }}
    >
      <div className="terminal-title" style={{ 
        fontWeight: 'bold',
        letterSpacing: '1px',
        color: 'var(--text-color)', 
        fontSize: '16px',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {title}
      </div>
      
      <div className="window-controls non-draggable" style={{ 
        display: 'flex', 
        gap: '12px',
        alignItems: 'center',
        height: '100%',
      }}>
        <button
          onClick={handleMinimize}
          className="window-control minimize non-draggable"
          title="Minimize"
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: '#FFC107',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
            transition: 'all 0.2s',
            // @ts-ignore
            WebkitAppRegion: 'no-drag',
          }}
        >
          <span style={{ 
            fontSize: '12px', 
            lineHeight: 1, 
            color: '#333', 
            display: 'inline-block',
            marginTop: '-1px',
          }}>
            _
          </span>
        </button>
        
        <button
          onClick={handleMaximize}
          className="window-control maximize non-draggable"
          title="Maximize"
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
            transition: 'all 0.2s',
            // @ts-ignore
            WebkitAppRegion: 'no-drag',
          }}
        >
          <span style={{ 
            fontSize: '10px', 
            lineHeight: 1, 
            color: '#333', 
            display: 'inline-block',
          }}>
            □
          </span>
        </button>
        
        <button
          onClick={handleClose}
          className="window-control close non-draggable"
          title="Close"
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: '#F44336',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
            transition: 'all 0.2s',
            // @ts-ignore
            WebkitAppRegion: 'no-drag',
          }}
        >
          <span style={{ 
            fontSize: '12px', 
            lineHeight: 1, 
            color: '#333', 
            display: 'inline-block',
          }}>
            ×
          </span>
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 