import React, { useState } from 'react';
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
  const [theme, setTheme] = useState<'dark' | 'green' | 'amber'>(settings.theme);
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'appearance'>('general');

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
      theme,
    });

    // Apply theme class to body
    document.body.className = `theme-${theme}`;

    onClose();
  };

  // Handle theme change
  const handleThemeChange = (newTheme: 'dark' | 'green' | 'amber') => {
    setTheme(newTheme);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal monospace" 
      style={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: 'var(--bg-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
      >
        <div 
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
        >
          <div 
            className="modal-title"
            style={{
              fontWeight: 'bold',
              fontSize: '18px',
              color: 'var(--accent-color)',
            }}
          >
            Classified AI Settings
          </div>
          <button
            className="close-modal"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-color)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              lineHeight: '1',
              opacity: '0.7',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            &times;
          </button>
        </div>
        
        <div
          className="modal-tabs"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(0,0,0,0.1)',
          }}
        >
          <button
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'general' ? 'var(--bg-color)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'general' ? `2px solid var(--accent-color)` : 'none',
              color: activeTab === 'general' ? 'var(--accent-color)' : 'var(--text-color)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: activeTab === 'general' ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
          >
            General
          </button>
          <button
            className={`tab ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'api' ? 'var(--bg-color)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'api' ? `2px solid var(--accent-color)` : 'none',
              color: activeTab === 'api' ? 'var(--accent-color)' : 'var(--text-color)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: activeTab === 'api' ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
          >
            API Settings
          </button>
          <button
            className={`tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'appearance' ? 'var(--bg-color)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'appearance' ? `2px solid var(--accent-color)` : 'none',
              color: activeTab === 'appearance' ? 'var(--accent-color)' : 'var(--text-color)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: activeTab === 'appearance' ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
          >
            Appearance
          </button>
        </div>
        
        <div 
          className="modal-body"
          style={{
            padding: '20px',
            color: 'var(--text-color)',
            maxHeight: 'calc(80vh - 130px)',
            overflowY: 'auto',
          }}
        >
          {activeTab === 'general' && (
            <>
              <div 
                className="form-group"
                style={{
                  marginBottom: '20px',
                }}
              >
                <label 
                  className="form-label"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: 'var(--accent-color)',
                  }}
                >
                  User Role
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="form-input monospace"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-color)',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="developer">Developer</option>
                  <option value="casual">Casual User</option>
                  <option value="code-helper">Code Helper</option>
                </select>
              </div>
              
              <div 
                className="form-group"
                style={{
                  marginBottom: '20px',
                }}
              >
                <label 
                  className="form-label"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: 'var(--accent-color)',
                  }}
                >
                  Temperature
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    accentColor: 'var(--accent-color)',
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '12px',
                  marginTop: '5px',
                }}>
                  <span>0 - Precise</span>
                  <span>{temperature}</span>
                  <span>1 - Creative</span>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'api' && (
            <>
              <div 
                className="form-group"
                style={{
                  marginBottom: '20px',
                }}
              >
                <label 
                  className="form-label"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: 'var(--accent-color)',
                  }}
                >
                  API Provider
                </label>
                <select
                  value={activeProvider}
                  onChange={(e) => setActiveProvider(e.target.value as AIProvider)}
                  className="form-input monospace"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-color)',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="openai">OpenAI</option>
                  <option value="ollama">Ollama</option>
                  <option value="deepseek">Deepseek</option>
                </select>
              </div>
              
              <div 
                className="form-group"
                style={{
                  marginBottom: '20px',
                }}
              >
                <label 
                  className="form-label"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: 'var(--accent-color)',
                  }}
                >
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="form-input monospace"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-color)',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  placeholder={`Enter your ${activeProvider} API key`}
                />
              </div>
              
              {activeProvider === 'ollama' && (
                <div 
                  className="form-group"
                  style={{
                    marginBottom: '20px',
                  }}
                >
                  <label 
                    className="form-label"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold',
                      color: 'var(--accent-color)',
                    }}
                  >
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="form-input monospace"
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-color)',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                    placeholder="http://localhost:11434"
                  />
                </div>
              )}
            </>
          )}
          
          {activeTab === 'appearance' && (
            <>
              <div 
                className="form-group"
                style={{
                  marginBottom: '20px',
                }}
              >
                <label 
                  className="form-label"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: 'var(--accent-color)',
                  }}
                >
                  Theme
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '15px',
                  marginBottom: '15px',
                }}>
                  <div
                    className="theme-option theme-dark"
                    title="Modern Dark"
                    onClick={() => handleThemeChange('dark')}
                    style={{
                      width: '80px',
                      height: '60px',
                      borderRadius: '6px',
                      backgroundColor: '#1E1E1E',
                      border: theme === 'dark' 
                        ? '2px solid var(--accent-color)' 
                        : '1px solid #474747',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, border 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '0',
                      right: '0',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: theme === 'dark' ? 'var(--accent-color)' : '#CCCCCC',
                    }}>
                      Dark
                    </div>
                  </div>
                  <div
                    className="theme-option theme-green"
                    title="Classic Green"
                    onClick={() => handleThemeChange('green')}
                    style={{
                      width: '80px',
                      height: '60px',
                      borderRadius: '6px',
                      backgroundColor: '#000000',
                      border: theme === 'green' 
                        ? '2px solid #33FF33' 
                        : '1px solid #33FF33',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, border 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '0',
                      right: '0',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#33FF33',
                    }}>
                      Green
                    </div>
                  </div>
                  <div
                    className="theme-option theme-amber"
                    title="Retro Amber"
                    onClick={() => handleThemeChange('amber')}
                    style={{
                      width: '80px',
                      height: '60px',
                      borderRadius: '6px',
                      backgroundColor: '#2D1B00',
                      border: theme === 'amber' 
                        ? '2px solid #FFC133' 
                        : '1px solid #915900',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, border 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '0',
                      right: '0',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#FFB000',
                    }}>
                      Amber
                    </div>
                  </div>
                </div>
              </div>
              
              <div 
                className="form-group"
                style={{
                  marginBottom: '20px',
                }}
              >
                <label 
                  className="form-label"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: 'var(--accent-color)',
                  }}
                >
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="20"
                  step="1"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    accentColor: 'var(--accent-color)',
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '12px',
                  marginTop: '5px',
                }}>
                  <span>12px</span>
                  <span>16px</span>
                  <span>20px</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div
          className="modal-footer"
          style={{
            padding: '15px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
        >
          <button
            onClick={onClose}
            className="cancel-btn monospace"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
              fontFamily: 'inherit',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="save-btn monospace"
            style={{
              backgroundColor: 'var(--accent-color)',
              color: '#111',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 