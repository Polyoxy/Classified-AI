import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { AIProvider, UserRole } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAppContext();
  const [formState, setFormState] = useState({
    activeProvider: settings.activeProvider,
    apiKey: settings.providers[settings.activeProvider].apiKey || '',
    baseUrl: settings.providers[settings.activeProvider].baseUrl || '',
    temperature: settings.temperature,
    fontSize: settings.fontSize,
    userRole: settings.userRole,
    customPrompts: settings.customSystemPrompts,
    theme: settings.theme || 'dark' as const,
  });
  const [activeTab, setActiveTab] = useState<'appearance' | 'api' | 'about'>('appearance');

  useEffect(() => {
    if (!isOpen) return;
    setFormState({
      activeProvider: settings.activeProvider,
      apiKey: settings.providers[settings.activeProvider].apiKey || '',
      baseUrl: settings.providers[settings.activeProvider].baseUrl || '',
      temperature: settings.temperature,
      fontSize: settings.fontSize,
      userRole: settings.userRole,
      customPrompts: settings.customSystemPrompts,
      theme: settings.theme || 'dark' as const,
    });
  }, [isOpen, settings]);

  const handleSave = () => {
    const updatedProviders = { ...settings.providers };
    updatedProviders[formState.activeProvider] = {
      ...updatedProviders[formState.activeProvider],
      apiKey: formState.apiKey,
      baseUrl: formState.baseUrl,
    };

    updateSettings({
      activeProvider: formState.activeProvider,
      temperature: formState.temperature,
      fontSize: formState.fontSize,
      userRole: formState.userRole,
      customSystemPrompts: formState.customPrompts,
      providers: updatedProviders,
      theme: formState.theme,
    });

    document.body.className = `theme-${formState.theme}`;
    onClose();
  };

  const handleOllamaSetup = () => {
    const newSettings = {
      ...settings,
      activeProvider: 'ollama' as AIProvider,
      providers: {
        ...settings.providers,
        ollama: {
          ...settings.providers.ollama,
          baseUrl: 'http://localhost:11434',
          defaultModel: 'deepseek-r1:7b',
        },
      },
    };
    updateSettings(newSettings);
    setFormState(prev => ({
      ...prev,
      activeProvider: 'ollama',
      baseUrl: 'http://localhost:11434',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

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

        <div className="modal-content">
          {activeTab === 'appearance' && (
            <div>
              <div className="form-group">
                <label className="form-label">Theme</label>
                <select 
                  value={formState.theme}
                  onChange={(e) => setFormState(prev => ({ ...prev, theme: e.target.value as 'dark' | 'light' }))}
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
                    value={formState.fontSize} 
                    onChange={(e) => setFormState(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  />
                  <span className="slider-value">{formState.fontSize}px</span>
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
                    value={formState.temperature} 
                    onChange={(e) => setFormState(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  />
                  <span className="slider-value">{formState.temperature}</span>
                </div>
                <p className="form-help-text">
                  Lower values make responses more deterministic, higher values make responses more random.
                </p>
              </div>
              
              <div className="form-group">
                <label className="form-label">User Role</label>
                <select 
                  value={formState.userRole}
                  onChange={(e) => setFormState(prev => ({ ...prev, userRole: e.target.value as UserRole }))}
                  className="form-select"
                >
                  <option value="developer">Developer</option>
                  <option value="casual">Casual User</option>
                  <option value="code-helper">Code Helper</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div>
              <div className="form-group">
                <label className="form-label">Active Provider</label>
                <select 
                  value={formState.activeProvider}
                  onChange={(e) => setFormState(prev => ({ ...prev, activeProvider: e.target.value as AIProvider }))}
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
                <h3 className="info-box-title">Ollama Quick Setup</h3>
                <p className="info-box-content">
                  Configure Ollama to use the locally running deepseek-r1:7b model
                </p>
                <button onClick={handleOllamaSetup} className="btn btn-primary">
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
                  value={formState.apiKey}
                  onChange={(e) => setFormState(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key"
                  className="form-input"
                />
                {formState.activeProvider === 'ollama' && (
                  <p className="form-help-text">Ollama doesn't require an API key</p>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Base URL</label>
                <input 
                  type="text"
                  value={formState.baseUrl}
                  onChange={(e) => setFormState(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="Enter base URL (optional)"
                  className="form-input"
                />
                {formState.activeProvider === 'ollama' && (
                  <p className="form-help-text">Default: http://localhost:11434</p>
                )}
              </div>
            </div>
          )}

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
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-default">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 