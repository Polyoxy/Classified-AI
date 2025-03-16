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
    isProcessing,
    settings,
    changeModel,
    user,
    setUser,
    conversations
  } = useAppContext();
  
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialRenderRef = useRef(true);
  
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

  // Set the initial selected model only once when component mounts or conversation changes
  useEffect(() => {
    if (currentConversation?.model && initialRenderRef.current) {
      setSelectedModel(currentConversation.model);
      initialRenderRef.current = false;
    }
  }, [currentConversation]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

  const handleModelChange = (model: string) => {
    if (model === selectedModel) return; // Skip if same model selected
    
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

  // Get status message
  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'connected':
        return `Connected - ${getActiveModelName()}`;
      case 'disconnected':
        return 'Disconnected - Check local server';
      case 'error':
        return 'Error connecting to model server';
      default:
        return 'Status unknown';
    }
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

  // Save icon SVG
  const SaveIcon = () => (
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  );

  // Monitor icon SVG
  const MonitorIcon = () => (
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
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  );

  // Logout icon SVG
  const LogoutIcon = () => (
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );

  // Get models for current provider
  const getModelsForProvider = () => {
    if (!currentConversation) return [];
    
    const provider = currentConversation.provider;
    return settings.providers[provider]?.models || [];
  };

  // Make sure we always have a valid model selected to display
  const getCurrentModel = () => {
    if (selectedModel) return selectedModel;
    if (currentConversation?.model) return currentConversation.model;
    
    const models = getModelsForProvider();
    if (models.length > 0) {
      return models[0]; // Default to first model if nothing else is available
    }
    
    return 'No models available';
  };

  // Check if a model is deepseek-r1:7b
  const isLocalModel = (model: string) => {
    return model.toLowerCase().includes('deepseek-r1') ||
           model.toLowerCase().includes('deepseek');
  };

  // Handle logout
  const handleLogout = async () => {
    console.log('Logout button clicked');
    
    try {
      // Check if we're in Electron environment
      const isElectron = typeof window !== 'undefined' && window.electron;
      console.log('Is Electron environment:', isElectron);
      console.log('Current user:', user);
      
      // Store the current user's email before logging out
      if (user && user.email) {
        localStorage.setItem('lastLoginEmail', user.email);
      }

      // Clear the local storage first (important for Electron)
      localStorage.removeItem('offlineUser');
      
      // In Electron, also clear the electron-store
      if (isElectron && window.electron?.store) {
        try {
          // Use type assertion to fix type checking
          const electronStore = window.electron.store as ElectronStore;
          await electronStore.clear();
          console.log('Electron store cleared');
        } catch (storeError) {
          console.warn('Failed to clear electron store:', storeError);
        }
      }
      
      // Check if user is an offline user
      const isOfflineUser = user && (user.uid.startsWith('offline-') || user.isAnonymous);
      console.log('Is offline/anonymous user:', isOfflineUser);
      
      // Always try to sign out from Firebase
      try {
        console.log('Attempting Firebase signOut');
        await auth.signOut();
      } catch (firebaseError) {
        console.warn('Firebase sign out error:', firebaseError);
      }
      
      // Also manually clear the user state (important for Electron)
      setUser(null);
      
      console.log('Logout completed');
      
      // In Electron, reload the window to ensure clean state
      if (isElectron && window.electron?.windowControls) {
        console.log('Reloading Electron app after logout');
        // Wait a moment before reloading to ensure state is cleared
        setTimeout(() => {
          try {
            // Use type assertion to fix type checking
            const windowControls = window.electron.windowControls as ElectronWindowControls;
            windowControls.reload();
          } catch (reloadError) {
            console.warn('Failed to reload window:', reloadError);
            window.location.reload(); // Fallback
          }
        }, 500);
      } else {
        // For non-Electron, reload the page after a delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // If all else fails, try forcing a hard logout
      localStorage.removeItem('offlineUser');
      setUser(null);
      window.location.reload();
    }
  };

  return (
    <div className="status-bar" style={{
      height: '40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 12px',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--input-bg)',
      color: 'var(--text-color)',
      fontSize: '0.75rem',
      fontFamily: 'var(--font-mono)',
      boxSizing: 'border-box',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        height: '100%'
      }}>
        {/* Model selector */}
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center',
          height: '100%',
          marginRight: '2px',
        }} ref={dropdownRef}>
          <span style={{ 
            marginRight: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            height: '100%' 
          }}>Model:</span>
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center',
            height: '100%'
          }}>
            <select 
              value={getCurrentModel()}
              onChange={(e) => handleModelChange(e.target.value)}
              className="form-select"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                padding: '0 0.5rem',
                paddingRight: '1.75rem',
                fontSize: '0.75rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold',
                appearance: 'none',
                height: '26px',
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
                boxSizing: 'border-box',
                verticalAlign: 'middle',
                top: '0',
                width: 'auto',
                minWidth: '130px',
                lineHeight: '26px',
                textAlign: 'center',
              }}
            >
              {getModelsForProvider().map((model) => (
                <option 
                  key={model} 
                  value={model}
                  style={{
                    color: 'var(--text-color)',
                    fontWeight: 'normal',
                  }}
                >
                  {model}
                </option>
              ))}
            </select>
            <div style={{ 
              position: 'absolute', 
              right: '0.25rem', 
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              top: '0',
              bottom: '0',
              margin: 'auto',
              width: '12px',
            }}>
              <span style={{ fontSize: '8px', lineHeight: '1', height: '8px', display: 'block', marginBottom: '1px' }}>▲</span>
              <span style={{ fontSize: '8px', lineHeight: '1', height: '8px', display: 'block', marginTop: '1px' }}>▼</span>
            </div>
          </div>
        </div>
        
        {/* Connection status display */}
        {connectionStatus === 'connected' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: 'var(--text-color)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.3)',
            height: '26px',
            marginLeft: '10px',
            boxSizing: 'border-box',
            position: 'relative',
            top: '0',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--text-color)',
              marginRight: '6px',
            }}></div>
            Connected
          </div>
        )}
        
        {/* Token usage */}
        {tokenUsage && tokenUsage.totalTokens > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span>
              Tokens: {formatNumber(tokenUsage.totalTokens)}
            </span>
            <span>
              Cost: {formatCost(tokenUsage.estimatedCost)}
            </span>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* Active model info - REMOVED as requested */}
        
        <button
          onClick={() => {
            onOpenSettings();
          }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-color)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--accent-color, #E34234)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-color)';
          }}
          aria-label="Open settings"
          id="settings-button"
          title="Settings"
        >
          <SettingsIcon />
        </button>
        
        <button
          title="Save"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-color)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--accent-color, #E34234)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-color)';
          }}
        >
          <SaveIcon />
        </button>
        
        <button
          title="Output"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-color)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--accent-color, #E34234)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-color)';
          }}
        >
          <MonitorIcon />
        </button>
        
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-color)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--accent-color, #E34234)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-color)';
          }}
        >
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
};

export default StatusBar; 