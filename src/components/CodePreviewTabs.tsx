import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';

interface CodePreviewTabsProps {
  codePreview?: string;
  commandPreview?: string;
}

const CodePreviewTabs: React.FC<CodePreviewTabsProps> = ({
  codePreview,
  commandPreview
}) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [activeTab, setActiveTab] = useState<'code' | 'command'>('code');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      style={{
        position: 'fixed',
        right: isCollapsed ? '-400px' : '0',
        top: '0',
        bottom: '32px', // Account for status bar
        width: '400px',
        backgroundColor: isDarkTheme ? '#1a1a1a' : '#f0f0f0',
        borderLeft: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'right 0.3s ease',
        zIndex: 50,
      }}
    >
      {/* Collapse toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute',
          left: '-32px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '32px',
          height: '64px',
          backgroundColor: isDarkTheme ? '#1a1a1a' : '#f0f0f0',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRight: 'none',
          borderRadius: '4px 0 0 4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDarkTheme ? '#fff' : '#000',
          opacity: 0.7,
          transition: 'opacity 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        {isCollapsed ? '◀' : '▶'}
      </button>

      {/* Tab buttons */}
      <div style={{
        display: 'flex',
        padding: '8px',
        gap: '8px',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}>
        <button
          onClick={() => setActiveTab('code')}
          style={{
            padding: '6px 12px',
            backgroundColor: activeTab === 'code' 
              ? (isDarkTheme ? '#333' : '#ddd')
              : 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: isDarkTheme ? '#fff' : '#000',
            cursor: 'pointer',
            opacity: activeTab === 'code' ? 1 : 0.7,
            transition: 'all 0.2s ease',
          }}
        >
          Code Preview
        </button>
        <button
          onClick={() => setActiveTab('command')}
          style={{
            padding: '6px 12px',
            backgroundColor: activeTab === 'command'
              ? (isDarkTheme ? '#333' : '#ddd')
              : 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: isDarkTheme ? '#fff' : '#000',
            cursor: 'pointer',
            opacity: activeTab === 'command' ? 1 : 0.7,
            transition: 'all 0.2s ease',
          }}
        >
          Command Preview
        </button>
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem',
      }}>
        {activeTab === 'code' ? (
          <pre style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.5,
            color: isDarkTheme ? '#fff' : '#000',
            opacity: 0.9,
          }}>
            {codePreview || 'No code preview available'}
          </pre>
        ) : (
          <pre style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.5,
            color: isDarkTheme ? '#fff' : '#000',
            opacity: 0.9,
          }}>
            {commandPreview || 'No command preview available'}
          </pre>
        )}
      </div>
    </div>
  );
};

export default CodePreviewTabs; 