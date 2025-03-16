import React from 'react';
import { useAppContext } from '@/context/AppContext';

type Theme = 'dark' | 'light';

interface ThemeOptionProps {
  theme: Theme;
  isActive: boolean;
  onClick: () => void;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({ theme, isActive, onClick }) => {
  const style = {
    width: '20px',
    height: '20px',
    borderRadius: '3px',
    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1E1E1E',
    border: isActive
      ? `2px solid ${theme === 'light' ? '#474747' : '#333333'}`
      : `1px solid ${theme === 'light' ? '#CCCCCC' : '#474747'}`,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  } as const;

  return (
    <div
      className={`theme-option theme-${theme}`}
      title={`${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme`}
      onClick={onClick}
      style={style}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    />
  );
};

const ThemeSelector: React.FC = () => {
  const { settings, updateSettings } = useAppContext();

  const handleThemeChange = (theme: Theme) => {
    updateSettings({ ...settings, theme });
    document.body.className = `theme-${theme}`;
  };

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <ThemeOption
        theme="light"
        isActive={settings.theme === 'light'}
        onClick={() => handleThemeChange('light')}
      />
      <ThemeOption
        theme="dark"
        isActive={settings.theme === 'dark'}
        onClick={() => handleThemeChange('dark')}
      />
    </div>
  );
};

export default ThemeSelector; 