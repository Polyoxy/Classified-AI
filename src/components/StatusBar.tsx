import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { auth } from '@/lib/firebase';
// Import the interfaces for type assertions
import type { ElectronStore, ElectronWindowControls } from '../types/electron-interfaces';

interface StatusBarProps {
  onOpenSettings: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ onOpenSettings }) => {
  const { 
    connectionStatus, 
    tokenUsage, 
    currentConversation, 
    settings,
    changeModel,
    user,
    setUser
  } = useAppContext();
  
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialRenderRef = useRef(true);
  const [windowWidth, setWindowWidth] = useState(1024); // Default to desktop
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    
    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelDropdownOpen]);

  // Set the initial selected model when component mounts or conversation changes
  useEffect(() => {
    if (currentConversation?.model) {
      setSelectedModel(currentConversation.model);
      initialRenderRef.current = false;
    } else if (settings?.providers?.[settings.activeProvider]?.defaultModel && initialRenderRef.current) {
      setSelectedModel(settings.providers[settings.activeProvider].defaultModel);
      initialRenderRef.current = false;
    }
  }, [currentConversation, settings]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Initialize with the current model when the component mounts
    if (settings?.providers?.[settings.activeProvider]?.defaultModel) {
      setSelectedModel(settings.providers[settings.activeProvider].defaultModel);
    }
  }, [settings]);

  // Add window resize listener
  useEffect(() => {
    // Set initial width
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      // Add resize listener
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  const handleModelChange = (model: string) => {
    if (model === selectedModel) return;
    
    setSelectedModel(model);
    
    // Close dropdown after a short delay to prevent spazzing
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    
    changeTimeoutRef.current = setTimeout(() => {
      setIsModelDropdownOpen(false);
      if (currentConversation) {
        changeModel(model);
      }
    }, 150);
  };

  // Format token cost
  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get the currently active model name
  const getActiveModelName = () => {
    if (settings.activeProvider === 'ollama') {
      return settings.providers.ollama.defaultModel || 'deepseek-r1:7b';
    }
    return 'Unknown';
  };

  // Get status indicator color based on connection status
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'var(--success-color)';
      case 'disconnected':
        return 'var(--error-color)';
      case 'error':
        return 'var(--warning-color)';
      default:
        return '#999';
    }
  };

  // Get models for current provider
  const getModelsForProvider = () => {
    const provider = currentConversation?.provider || settings.activeProvider;
    
    // Get models from settings
    const models = settings.providers[provider]?.models || [];
    
    // Make sure llama3.2:1b is included for Ollama if not already in the list
    if (provider === 'ollama' && !models.includes('llama3.2:1b')) {
      return ['llama3.2:1b', ...models];
    }
    
    return models;
  };

  // Make sure we always have a valid model selected to display
  const getCurrentModel = () => {
    // If a model is explicitly selected by the user, prioritize that
    if (selectedModel) return selectedModel;
    
    // If a conversation exists with a model, use that
    if (currentConversation?.model) return currentConversation.model;
    
    // Check if there are any models available
    const models = getModelsForProvider();
    
    // Default to the provider's default model
    if (settings?.activeProvider) {
      return settings.providers[settings.activeProvider].defaultModel || 
             (settings.activeProvider === 'ollama' ? 'llama3.2:1b' : 'Unknown');
    }
    
    // Fallback to first available model
    if (models.length > 0) {
      return models[0];
    }
    
    return 'No models available';
  };

  // Settings icon SVG
  const SettingsIcon = () => (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ pointerEvents: 'none' }}
    >
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );

  // Update customStatusBarStyles to ensure model selector displays properly
  const customStatusBarStyles = `
    .model-selector {
      display: flex !important;
      position: relative;
    }
    
    .selected-model {
      display: flex;
      align-items: center;
    }

    .selected-model-text {
      font-size: 12px;
    }
    
    .model-dropdown {
      position: absolute;
      top: 100% !important;
      left: 0;
      width: 100%;
      margin-top: 4px !important;
      max-height: 200px;
      z-index: 10000 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.4' : '0.2'}) !important;
    }
    
    @media (max-width: 767px) {
      .status-bar {
        height: 32px !important;
        padding: 0 8px !important;
        justify-content: space-between !important;
      }
      
      .model-selector {
        max-width: 110px !important;
        overflow: hidden !important;
      }
      
      .selected-model-text {
        max-width: 80px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      
      .token-display, .cost-display {
        display: none !important;
      }
      
      .connection-status span {
        font-size: 10px !important;
      }
    }
  `;

  return (
    <>
      <style>{customStatusBarStyles}</style>
      <div 
        className="status-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '32px',
          backgroundColor: settings?.theme === 'dark' ? 'rgba(18, 18, 18, 0.92)' : 'rgba(245, 245, 245, 0.92)',
          borderBottom: `1px solid ${settings?.theme === 'dark' ? 'rgba(51, 51, 51, 0.8)' : 'rgba(221, 221, 221, 0.8)'}`,
          color: settings?.theme === 'dark' ? '#b0b0b0' : '#505050',
          padding: '0 12px',
          fontSize: '12px',
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
          zIndex: 70,
          boxShadow: `0 1px 2px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.15' : '0.08'})`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '0' }}>
          <div 
            className="model-selector" 
            ref={dropdownRef}
            style={{ 
              position: 'relative'
            }}
          >
            <div
              className="selected-model"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.25rem 0.4rem',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
              }}
            >
              <span 
                className="selected-model-text"
                style={{ 
                  marginRight: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {getCurrentModel()}
              </span>
              <svg 
                width="10" 
                height="10" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ marginLeft: 'auto', opacity: 0.6 }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {isModelDropdownOpen && (
              <div 
                className="model-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  width: '100%',
                  backgroundColor: settings?.theme === 'dark' ? 'rgba(26, 26, 26, 0.95)' : 'rgba(245, 245, 245, 0.95)',
                  border: `1px solid ${settings?.theme === 'dark' ? 'rgba(60, 60, 60, 0.7)' : 'rgba(200, 200, 200, 0.7)'}`,
                  borderRadius: '4px',
                  marginTop: '4px',
                  zIndex: 10000,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: settings?.theme === 'dark' 
                    ? '0 4px 8px rgba(0,0,0,0.3)' 
                    : '0 4px 8px rgba(0,0,0,0.1)',
                  fontFamily: 'Inter, sans-serif',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {getModelsForProvider().map((model) => (
                  <div 
                    key={model}
                    className="model-option"
                    onClick={() => handleModelChange(model)}
                    style={{
                      padding: '0.4rem',
                      cursor: 'pointer',
                      backgroundColor: (model === selectedModel || model === currentConversation?.model)
                        ? (settings?.theme === 'dark' ? '#333' : '#e0e0e0') 
                        : 'transparent',
                      transition: 'all 0.1s ease',
                      fontSize: '12px',
                      letterSpacing: '0.2px',
                      fontWeight: (model === selectedModel || model === currentConversation?.model) ? 'bold' : 'normal',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? '#333' : '#e0e0e0';
                    }}
                    onMouseOut={(e) => {
                      if (model !== selectedModel && model !== currentConversation?.model) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {model}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="connection-status" style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              marginRight: '4px',
              opacity: 0.8,
            }}></div>
            <span style={{ 
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px', 
              letterSpacing: '0.2px',
              opacity: 0.9,
            }}>
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'disconnected' ? 'Disconnected' : 
               connectionStatus === 'error' ? 'Error' : 'Unknown'}
            </span>
          </div>
          
          {tokenUsage.totalTokens > 0 && (
            <>
              <span className="token-display" style={{ 
                marginLeft: '8px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                letterSpacing: '0.2px',
                opacity: 0.7,
              }}>
                {formatNumber(tokenUsage.totalTokens)} tokens
              </span>
            </>
          )}
        </div>
        
        <div className="status-buttons" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0' }}>
          <button
            onClick={() => {
              const isElectron = typeof window !== 'undefined' && window.electron;
              if (isElectron) {
                window.electron?.windowControls?.reload?.();
              } else {
                window.location.reload();
              }
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px',
              borderRadius: '3px',
              color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.7)' : 'rgba(100, 100, 100, 0.7)',
              opacity: 0.6,
              transition: 'opacity 0.2s ease',
              fontFamily: 'Inter, sans-serif',
            }}
            title="Reload"
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
          >
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
              <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
          
          <button
            onClick={onOpenSettings}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px',
              borderRadius: '3px',
              color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.7)' : 'rgba(100, 100, 100, 0.7)',
              opacity: 0.6,
              transition: 'opacity 0.2s ease',
              fontFamily: 'Inter, sans-serif',
            }}
            title="Settings"
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </>
  );
};

export default StatusBar; 