import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { auth } from '@/lib/firebase';
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
    setUser,
    isSidebarOpen,
    setIsSidebarOpen
  } = useAppContext();
  
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialRenderRef = useRef(true);
  
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

  useEffect(() => {
    if (currentConversation?.model && initialRenderRef.current) {
      setSelectedModel(currentConversation.model);
      initialRenderRef.current = false;
    }
  }, [currentConversation]);

  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

  const handleModelChange = (model: string) => {
    if (model === selectedModel) return;
    
    setSelectedModel(model);
    
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

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getActiveModelName = () => {
    if (settings.activeProvider === 'ollama') {
      return settings.providers.ollama.defaultModel || 'deepseek-r1:7b';
    }
    return 'Unknown';
  };

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

  const getModelsForProvider = () => {
    if (!currentConversation) return [];
    
    const provider = currentConversation.provider;
    return settings.providers[provider]?.models || [];
  };

  const getCurrentModel = () => {
    if (selectedModel) return selectedModel;
    if (currentConversation?.model) return currentConversation.model;
    
    const models = getModelsForProvider();
    if (models.length > 0) {
      return models[0];
    }
    
    return 'No models available';
  };

  const handleLogout = async () => {
    try {
      const isElectron = typeof window !== 'undefined' && window.electron;
      
      if (user && user.email) {
        localStorage.setItem('lastLoginEmail', user.email);
      }

      localStorage.removeItem('offlineUser');
      
      if (isElectron && window.electron?.store) {
        try {
          const electronStore = window.electron.store as ElectronStore;
          await electronStore.clear();
        } catch (storeError) {
          console.warn('Failed to clear electron store:', storeError);
        }
      }
      
      try {
        await auth.signOut();
      } catch (firebaseError) {
        console.warn('Firebase sign out error:', firebaseError);
      }
      
      setUser(null);
      
      if (isElectron && window.electron?.windowControls) {
        window.location.href = '/auth';
      } else {
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.removeItem('offlineUser');
      setUser(null);
      window.location.href = '/auth';
    }
  };

  // Create custom styles within the component where settings is defined
  const customStatusBarStyles = `
    @media (max-width: 767px) {
      .status-bar {
        height: 42px !important;
        padding: 0 0.75rem !important;
      }
      .token-display, .cost-display, .model-selector {
        display: none !important;
      }
      .status-buttons {
        justify-content: center !important;
        width: 100% !important;
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
          bottom: 0,
          left: 0,
          right: isSidebarOpen ? '320px' : 0,
          height: '40px',
          backgroundColor: settings?.theme === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(245, 245, 245, 0.9)',
          borderTop: `1px solid ${settings?.theme === 'dark' ? 'rgba(51, 51, 51, 0.8)' : 'rgba(221, 221, 221, 0.8)'}`,
          color: settings?.theme === 'dark' ? '#b0b0b0' : '#505050',
          padding: '0 1.25rem',
          fontSize: '12px',
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          backdropFilter: 'blur(10px)',
          transition: 'right 0.3s ease',
          zIndex: 70, // Higher than messages to ensure visibility
          boxShadow: `0 -1px 4px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.2' : '0.1'})`,
        }}
      >
        <style>
          {`
            @media (max-width: 767px) {
              .token-display, .cost-display {
                display: none !important;
              }
              .status-bar {
                padding: 0.5rem 0.75rem !important;
              }
            }
            
            @media (min-width: 768px) {
              .token-display, .cost-display {
                display: inline !important;
              }
            }
          `}
        </style>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            className="model-selector" 
            ref={dropdownRef}
            style={{ position: 'relative' }}
          >
            <div
              className="selected-model"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.25rem 0.5rem',
                backgroundColor: settings?.theme === 'dark' ? 'rgba(35, 35, 35, 0.6)' : 'rgba(230, 230, 230, 0.7)',
                borderRadius: '4px',
                cursor: 'pointer',
                minWidth: '150px',
                border: `1px solid ${settings?.theme === 'dark' ? 'rgba(60, 60, 60, 0.8)' : 'rgba(200, 200, 200, 0.8)'}`,
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.2px',
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>
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
                style={{ marginLeft: 'auto' }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {isModelDropdownOpen && (
              <div 
                className="model-dropdown"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '0',
                  width: '100%',
                  backgroundColor: settings?.theme === 'dark' ? 'rgba(26, 26, 26, 0.9)' : 'rgba(245, 245, 245, 0.9)',
                  border: `1px solid ${settings?.theme === 'dark' ? 'rgba(60, 60, 60, 0.7)' : 'rgba(200, 200, 200, 0.7)'}`,
                  borderRadius: '4px',
                  marginBottom: '0.25rem',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: settings?.theme === 'dark' 
                    ? '0 -4px 8px rgba(0,0,0,0.2)' 
                    : '0 -4px 8px rgba(0,0,0,0.05)',
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
                      padding: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: model === selectedModel 
                        ? (settings?.theme === 'dark' ? '#333' : '#e0e0e0') 
                        : 'transparent',
                      transition: 'all 0.1s ease',
                      fontSize: '12px',
                      letterSpacing: '0.2px',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? '#333' : '#e0e0e0';
                    }}
                    onMouseOut={(e) => {
                      if (model !== selectedModel) {
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
          
          <div className="connection-status" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              marginRight: '4px',
              opacity: 0.8,
            }}></div>
            <span style={{ 
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              letterSpacing: '0.2px',
              opacity: 0.9,
            }}>
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'disconnected' ? 'Disconnected' : 
               connectionStatus === 'error' ? 'Error' : 'Unknown'}
            </span>
            
            {tokenUsage.totalTokens > 0 && (
              <>
                <span className="token-display" style={{ 
                  marginLeft: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.2px',
                  opacity: 0.8,
                }}>
                  Tokens: {formatNumber(tokenUsage.totalTokens)}
                </span>
                <span className="cost-display" style={{ 
                  marginLeft: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.2px',
                  opacity: 0.8,
                }}>
                  Cost: {formatCost(tokenUsage.estimatedCost)}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              const isElectron = typeof window !== 'undefined' && window.electron;
              if (isElectron && window.electron) {
                const windowControls = window.electron.windowControls as ElectronWindowControls;
                windowControls.reload();
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
              padding: '4px',
              borderRadius: '4px',
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
              width="14" 
              height="14" 
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
              padding: '4px',
              borderRadius: '4px',
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