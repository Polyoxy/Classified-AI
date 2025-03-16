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
  const [activeTab, setActiveTab] = useState<'appearance' | 'api' | 'about'>('appearance');

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

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button 
            onClick={onClose}
            className="modal-close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
          >
            Appearance
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`tab-button ${activeTab === 'api' ? 'active' : ''}`}
          >
            API Settings
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
          >
            About
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div>
              <div className="form-group">
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
              
              <div className="form-group">
                <label className="form-label">Font Size</label>
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="10" 
                    max="20" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                  />
                  <span className="slider-value">{fontSize}px</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Model Temperature</label>
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={temperature} 
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                  <span className="slider-value">{temperature}</span>
                </div>
                <p className="form-help-text">
                  Lower values make responses more deterministic, higher values make responses more random.
                </p>
              </div>
              
              <div className="form-group">
                <label className="form-label">User Role</label>
                <select 
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="form-select"
                >
                  <option value="developer">Developer</option>
                  <option value="casual">Casual User</option>
                  <option value="code-helper">Code Helper</option>
                </select>
              </div>
            </div>
          )}

          {/* API Settings Tab */}
          {activeTab === 'api' && (
            <div>
              <div className="form-group">
                <label className="form-label">Active Provider</label>
                <select 
                  value={activeProvider}
                  onChange={(e) => setActiveProvider(e.target.value as AIProvider)}
                  className="form-select"
                  disabled={true}
                >
                  <option value="ollama">Ollama (Local LLM)</option>
                </select>
                <p className="form-help-text">
                  Currently focused on Ollama with deepseek-r1:7b
                </p>
              </div>
              
              <div className="info-box">
                <h3 className="info-box-title">
                  Ollama Quick Setup
                </h3>
                <p className="info-box-content">
                  Configure Ollama to use the locally running deepseek-r1:7b model
                </p>
                <button
                  onClick={() => {
                    const newSettings = { ...settings };
                    newSettings.activeProvider = 'ollama';
                    newSettings.providers.ollama.baseUrl = 'http://localhost:11434';
                    newSettings.providers.ollama.defaultModel = 'deepseek-r1:7b';
                    updateSettings(newSettings);
                  }}
                  className="btn btn-primary"
                >
                  Set Ollama as Active Provider
                </button>
                <p className="info-box-footer">
                  Note: Make sure Ollama is running with the command: <code>ollama run deepseek-r1:7b</code>
                </p>
              </div>
              
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="form-input"
                />
                {activeProvider === 'ollama' && (
                  <p className="form-help-text">
                    Ollama doesn't require an API key
                  </p>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Base URL</label>
                <input 
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="Enter base URL (optional)"
                  className="form-input"
                />
                {activeProvider === 'ollama' && (
                  <p className="form-help-text">
                    Default: http://localhost:11434
                  </p>
                )}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="about-section">
              <h3>Classified AI</h3>
              <p>A terminal-inspired chat application for interacting with AI models.</p>
              
              <div className="about-features">
                <h4>Features</h4>
                <ul>
                  <li>Multiple AI provider support</li>
                  <li>Customizable system prompts</li>
                  <li>Dark and light themes</li>
                  <li>Offline mode support</li>
                  <li>Firebase integration for account management</li>
                </ul>
              </div>
              
              <div className="about-version">
                <p>Version</p>
                <p>1.0.0</p>
              </div>

              <div className="info-box">
                <h3 className="info-box-title">
                  Ollama Setup
                </h3>
                <p className="info-box-content">
                  Configure Ollama to use the locally running Deepseek model
                </p>
                <button
                  onClick={() => {
                    const newSettings = { ...settings };
                    newSettings.activeProvider = 'ollama';
                    newSettings.providers.ollama.baseUrl = 'http://localhost:11434';
                    newSettings.providers.ollama.defaultModel = 'deepseek-r1:7b';
                    updateSettings(newSettings);
                  }}
                  className="btn btn-primary"
                >
                  Set Ollama as Active Provider
                </button>
                <p className="info-box-footer">
                  Note: Make sure Ollama is running with the command: <code>ollama run deepseek-r1:7b</code>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="btn btn-default"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="btn btn-primary"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 