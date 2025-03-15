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
    document.body.className = theme === 'dark' ? 'theme-dark' : '';

    onClose();
  };

  // Close icon SVG
  const CloseIcon = () => (
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
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div 
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: theme === 'dark' ? 'var(--input-bg)' : 'white',
          border: `1px solid ${theme === 'dark' ? 'var(--border-color)' : 'var(--border-color)'}`,
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div 
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: `1px solid ${theme === 'dark' ? 'var(--border-color)' : 'var(--border-color)'}`,
          }}
        >
          <h2 
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'var(--accent-color)',
              margin: 0,
            }}
          >
            Classified AI Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme === 'dark' ? 'var(--text-color)' : 'var(--text-color)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-color)')}
            onMouseOut={(e) => (e.currentTarget.style.color = theme === 'dark' ? 'var(--text-color)' : 'var(--text-color)')}
          >
            <CloseIcon />
          </button>
        </div>
        
        {/* Tabs */}
        <div
          className="modal-tabs"
          style={{
            display: 'flex',
            borderBottom: `1px solid ${theme === 'dark' ? 'var(--border-color)' : 'var(--border-color)'}`,
          }}
        >
          {(['General', 'API Settings', 'Appearance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid var(--accent-color)` : 'none',
                color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-color)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div 
          className="modal-body"
          style={{
            padding: '1.5rem',
            color: 'var(--text-color)',
            maxHeight: 'calc(80vh - 130px)',
            overflowY: 'auto',
            backgroundColor: theme === 'dark' ? 'var(--input-bg)' : 'white',
          }}
        >
          {activeTab === 'General' && (
            <div className="space-y-6">
              <div>
                <label className="form-label">User Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="form-select"
                >
                  <option value="developer">Developer</option>
                  <option value="casual">Casual Chat</option>
                  <option value="code-helper">Code Helper</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent-color)',
                    height: '0.5rem',
                    borderRadius: '0.25rem',
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.75rem',
                  marginTop: '0.5rem',
                  color: 'var(--text-color)',
                  opacity: 0.8,
                }}>
                  <span>0 - Precise</span>
                  <span>{temperature}</span>
                  <span>1 - Creative</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'API Settings' && (
            <div className="space-y-6">
              <div>
                <label className="form-label">API Provider</label>
                <select
                  value={activeProvider}
                  onChange={(e) => setActiveProvider(e.target.value as AIProvider)}
                  className="form-select"
                >
                  <option value="openai">OpenAI</option>
                  <option value="ollama">Ollama</option>
                  <option value="deepseek">Deepseek</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="form-input"
                  placeholder={`Enter your ${activeProvider} API key`}
                />
              </div>
              
              <div>
                <label className="form-label">Default Model</label>
                <select
                  value={settings.providers[activeProvider].defaultModel}
                  onChange={(e) => {
                    const updatedProviders = { ...settings.providers };
                    updatedProviders[activeProvider] = {
                      ...updatedProviders[activeProvider],
                      defaultModel: e.target.value,
                    };
                    updateSettings({ providers: updatedProviders });
                  }}
                  className="form-select"
                >
                  {settings.providers[activeProvider].models.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              {activeProvider === 'ollama' && (
                <div>
                  <label className="form-label">Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="form-input"
                    placeholder="http://localhost:11434"
                  />
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'Appearance' && (
            <div className="space-y-6">
              <div>
                <label className="form-label">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                  className="form-select"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Font Size: {fontSize}px</label>
                <input
                  type="range"
                  min="12"
                  max="20"
                  step="1"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent-color)',
                    height: '0.5rem',
                    borderRadius: '0.25rem',
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.75rem',
                  marginTop: '0.5rem',
                  color: 'var(--text-color)',
                  opacity: 0.8,
                }}>
                  <span>12px</span>
                  <span>16px</span>
                  <span>20px</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            padding: '1rem',
            borderTop: `1px solid ${theme === 'dark' ? 'var(--border-color)' : 'var(--border-color)'}`,
            backgroundColor: theme === 'dark' ? 'var(--input-bg)' : 'var(--code-bg)',
          }}
        >
          <button
            onClick={onClose}
            className="terminal-button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="terminal-button-primary"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 