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
      
      const isOfflineUser = user && (user.uid.startsWith('offline-') || user.isAnonymous);
      
      try {
        await auth.signOut();
      } catch (firebaseError) {
        console.warn('Firebase sign out error:', firebaseError);
      }
      
      setUser(null);
      
      if (isElectron && window.electron?.windowControls) {
        setTimeout(() => {
          try {
            const windowControls = window.electron.windowControls as ElectronWindowControls;
            windowControls.reload();
          } catch (reloadError) {
            console.warn('Failed to reload window:', reloadError);
            window.location.reload();
          }
        }, 500);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.removeItem('offlineUser');
      setUser(null);
      window.location.reload();
    }
  };

  return (
    <div className="status-bar" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 1rem',
      backgroundColor: settings?.theme === 'dark' ? '#121212' : '#f0f0f0',
      borderTop: `1px solid ${settings?.theme === 'dark' ? '#333' : '#ddd'}`,
      color: 'var(--text-color)',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      position: 'relative',
      minHeight: '32px',
    }}>
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
              backgroundColor: settings?.theme === 'dark' ? '#1a1a1a' : '#e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              minWidth: '150px',
              border: `1px solid ${settings?.theme === 'dark' ? '#333' : '#ccc'}`,
              transition: 'all 0.2s ease',
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
                backgroundColor: settings?.theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
                border: `1px solid ${settings?.theme === 'dark' ? '#333' : '#ddd'}`,
                borderRadius: '4px',
                marginBottom: '0.25rem',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: settings?.theme === 'dark' 
                  ? '0 -4px 8px rgba(0,0,0,0.3)' 
                  : '0 -4px 8px rgba(0,0,0,0.1)',
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
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            marginRight: '4px',
          }}></div>
          <span>Connected</span>
          
          {tokenUsage.totalTokens > 0 && (
            <>
              <span style={{ marginLeft: '12px' }}>
                Tokens: {formatNumber(tokenUsage.totalTokens)}
              </span>
              <span style={{ marginLeft: '12px' }}>
                Cost: {formatCost(tokenUsage.estimatedCost)}
              </span>
            </>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '4px',
            color: 'var(--text-color)',
            opacity: isSidebarOpen ? 1 : 0.7,
            transition: 'opacity 0.2s ease',
          }}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
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
            color: 'var(--text-color)',
          }}
          title="Settings"
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  );
};

export default StatusBar; 