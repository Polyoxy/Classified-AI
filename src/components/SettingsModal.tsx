import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { AIProvider, UserRole } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAppContext();
  const [activeProvider, setActiveProvider] = useState<AIProvider>(settings.activeProvider);
  const [apiKey, setApiKey] = useState<string>(settings.providers[settings.activeProvider].apiKey || '');
  const [baseUrl, setBaseUrl] = useState<string>(settings.providers[settings.activeProvider].baseUrl || '');
  const [temperature, setTemperature] = useState<number>(settings.temperature);
  const [fontSize, setFontSize] = useState<number>(settings.fontSize);
  const [userRole, setUserRole] = useState<UserRole>(settings.userRole);
  const [customPrompts, setCustomPrompts] = useState<Record<UserRole, string>>(settings.customSystemPrompts);
  const [theme, setTheme] = useState<'dark' | 'light'>(settings.theme === 'dark' ? 'dark' : 'light');
  const [activeTab, setActiveTab] = useState<'General' | 'API Settings' | 'Appearance'>('General');

  // Update state when settings change
  useEffect(() => {
    setActiveProvider(settings.activeProvider);
    setApiKey(settings.providers[settings.activeProvider].apiKey || '');
    setBaseUrl(settings.providers[settings.activeProvider].baseUrl || '');
    setTemperature(settings.temperature);
    setFontSize(settings.fontSize);
    setUserRole(settings.userRole);
    setCustomPrompts(settings.customSystemPrompts);
    setTheme(settings.theme === 'dark' ? 'dark' : 'light');
  }, [settings]);

  // Save settings and close modal
  const handleSave = () => {
    // Update provider config
    const updatedProviders = { ...settings.providers };
    updatedProviders[activeProvider] = {
      ...updatedProviders[activeProvider],
      apiKey: apiKey,
      baseUrl: baseUrl,
    };

    // Update settings
    updateSettings({
      activeProvider,
      temperature,
      fontSize,
      userRole,
      customSystemPrompts: customPrompts,
      providers: updatedProviders,
      theme: theme === 'dark' ? 'dark' : 'light',
    });

    // Apply theme class to body
    document.body.className = `theme-${theme}`;

    onClose();
  };

  if (!isOpen) {
    return null;
  }

  console.log("⚠️ RENDERING SETTINGS MODAL ⚠️");

  // Simple version to ensure it shows
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        width: '500px',
        backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
        color: theme === 'dark' ? '#FFFFFF' : '#000000',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '20px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#FFFFFF' : '#000000'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Theme</label>
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
            style={{ 
              width: '100%', 
              padding: '8px',
              backgroundColor: theme === 'dark' ? '#333333' : '#F5F5F5',
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
              border: '1px solid #444'
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{ 
              padding: '8px 15px', 
              marginRight: '10px',
              backgroundColor: 'transparent',
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
              border: '1px solid #444',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{ 
              padding: '8px 15px',
              backgroundColor: '#007BFF',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 