import React from 'react';
import { useAppContext } from '@/context/AppContext';

const ThemeSelector: React.FC = () => {
  const { settings, updateSettings } = useAppContext();

  const handleThemeChange = (theme: 'dark' | 'light') => {
    updateSettings({ ...settings, theme });
    
    // Apply theme class to body
    document.body.className = `theme-${theme}`;
  };

  return (
    <div className="theme-selector" style={{
      display: 'flex',
      gap: '10px'
    }}>
      <div
        className="theme-option theme-light"
        title="Light Theme"
        onClick={() => handleThemeChange('light')}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '3px',
          backgroundColor: '#FFFFFF',
          border: settings.theme === 'light' 
            ? '2px solid #474747' 
            : '1px solid #CCCCCC',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      />
      <div
        className="theme-option theme-dark"
        title="Dark Theme"
        onClick={() => handleThemeChange('dark')}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '3px',
          backgroundColor: '#1E1E1E',
          border: settings.theme === 'dark' 
            ? '2px solid #333333' 
            : '1px solid #474747',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      />
    </div>
  );
};

export default ThemeSelector; 