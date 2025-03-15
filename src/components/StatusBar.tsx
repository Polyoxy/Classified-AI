import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';

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
    changeModel 
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

  // Get connection status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'var(--success-color)';
      case 'error':
        return 'var(--error-color)';
      case 'disconnected':
        return 'var(--error-color)';
      default:
        return 'var(--warning-color)';
    }
  };

  // Get connection status tooltip
  const getStatusTooltip = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to AI provider';
      case 'disconnected':
        return 'Disconnected from AI provider';
      case 'error':
        return 'Error connecting to AI provider';
      default:
        return 'Connecting to AI provider...';
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
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
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

  return (
    <div 
      className="status-bar"
      style={{
        padding: '0.25rem 1rem',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--input-bg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Model selector */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.25rem' }}>Model:</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select 
                value={getCurrentModel()}
                onChange={(e) => handleModelChange(e.target.value)}
                className="form-select"
                style={{
                  backgroundColor: '#f0f0f0',
                  border: '1px solid var(--border-color)',
                  color: '#000000',
                  padding: '0.125rem 0.25rem',
                  paddingRight: '1.5rem', // Make room for the arrows
                  fontSize: '0.75rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 'bold',
                  appearance: 'none', // Remove default arrow
                }}
              >
                {getModelsForProvider().map((model) => (
                  <option key={model} value={model}>{model}</option>
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
                height: '100%'
              }}>
                <span style={{ fontSize: '8px', lineHeight: '8px' }}>▲</span>
                <span style={{ fontSize: '8px', lineHeight: '8px' }}>▼</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Connection status light */}
        <div
          title={getStatusTooltip()}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            display: 'inline-block',
          }}
        />
        
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
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => {
            console.log("Settings button clicked");
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
            e.currentTarget.style.color = 'var(--accent-color)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-color)';
          }}
        >
          <SettingsIcon />
        </button>
        
        <button
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
            e.currentTarget.style.color = 'var(--accent-color)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-color)';
          }}
        >
          <SaveIcon />
        </button>
        
        <button
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
            e.currentTarget.style.color = 'var(--accent-color)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-color)';
          }}
        >
          <MonitorIcon />
        </button>
      </div>
    </div>
  );
};

export default StatusBar; 