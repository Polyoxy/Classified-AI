import React from 'react';

interface TitleBarProps {
  title: string;
  style?: React.CSSProperties;
}

const TitleBar: React.FC<TitleBarProps> = ({ title, style }) => {
  return (
    <div style={{
      height: '36px',
      backgroundColor: 'var(--header-bg)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      // @ts-ignore
      WebkitAppRegion: 'drag',
      userSelect: 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      ...style,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          color: 'var(--text-color)',
        }}>
          {title}
        </span>
      </div>
      
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        gap: '8px',
        // @ts-ignore
        WebkitAppRegion: 'no-drag',
      }}>
        <button
          onClick={() => window.electron?.windowControls.minimize()}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: 'none',
            padding: 0,
            backgroundColor: '#f59e0b',
            cursor: 'pointer',
          }}
        />
        <button
          onClick={() => window.electron?.windowControls.close()}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: 'none',
            padding: 0,
            backgroundColor: '#ef4444',
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
};

export default TitleBar; 