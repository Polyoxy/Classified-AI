import React from 'react';
import { useAppContext } from '@/context/AppContext';

const ThemeSelector: React.FC = () => {
  const { settings, updateSettings } = useAppContext();

  const handleThemeChange = (theme: 'dark' | 'green' | 'amber') => {
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
        className="theme-option theme-green"
        title="Classic Green"
        onClick={() => handleThemeChange('green')}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '3px',
          backgroundColor: '#0D1117',
          border: settings.theme === 'green' 
            ? '2px solid #56D364' 
            : '1px solid #26A641',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      />
      <div
        className="theme-option theme-dark"
        title="Modern Dark"
        onClick={() => handleThemeChange('dark')}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '3px',
          backgroundColor: '#1E1E1E',
          border: settings.theme === 'dark' 
            ? '2px solid #569CD6' 
            : '1px solid #474747',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      />
      <div
        className="theme-option theme-amber"
        title="Retro Amber"
        onClick={() => handleThemeChange('amber')}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '3px',
          backgroundColor: '#2D1B00',
          border: settings.theme === 'amber' 
            ? '2px solid #FFC133' 
            : '1px solid #915900',
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