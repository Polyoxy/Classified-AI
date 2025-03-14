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

  // Set the initial selected model
  useEffect(() => {
    if (currentConversation?.model && !selectedModel) {
      setSelectedModel(currentConversation.model);
    }
  }, [currentConversation, selectedModel]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

  // Get available models for the current provider
  const getModelsForCurrentProvider = () => {
    if (!currentConversation) return [];
    
    const provider = currentConversation.provider;
    return settings.providers[provider]?.models || [];
  };

  // Handle model selection
  const handleModelSelection = (model: string) => {
    if (model === selectedModel) {
      // No need to change if it's the same model
      setIsModelDropdownOpen(false);
      return;
    }
    
    setSelectedModel(model);
    
    // Clear any existing timeout
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    
    // Set a slight delay before closing dropdown and changing model
    changeTimeoutRef.current = setTimeout(() => {
      changeModel(model);
      setIsModelDropdownOpen(false);
    }, 300);
  };

  // Format the cost to display with 4 decimal places
  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  // Format the number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Get status color based on connection status
  const getStatusColor = () => {
    if (connectionStatus === 'connected') return '#4CAF50';
    if (connectionStatus === 'disconnected') return '#F44336';
    if (connectionStatus === 'error') return '#F44336';
    return '#FFC107'; // Yellow/amber for any other state
  };

  // Get status tooltip text based on connection status
  const getStatusTooltip = () => {
    if (connectionStatus === 'connected') return 'Connected';
    if (connectionStatus === 'disconnected') return 'Disconnected';
    if (connectionStatus === 'error') return 'Error';
    return 'Pending';
  };

  return (
    <div 
      className="status-bar"
      style={{
        padding: '4px 16px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          ref={dropdownRef}
          className="model-info" 
          style={{ 
            cursor: 'pointer', 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid transparent',
            transition: 'all 0.2s',
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
          }}
        >
          <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Model:</span> 
          <span>{selectedModel || currentConversation?.model || 'terminal-gpt-3.5'}</span>
          <span style={{ fontSize: '10px', marginLeft: '3px', color: 'var(--accent-color)' }}>▼</span>
          
          {isModelDropdownOpen && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              width: '200px',
              zIndex: 10,
              boxShadow: '0 -4px 8px rgba(0,0,0,0.3)',
              marginBottom: '5px',
            }}>
              <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--accent-color)',
                fontWeight: 'bold',
              }}>
                Select Model
              </div>
              {getModelsForCurrentProvider().map(model => (
                <div 
                  key={model}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: (selectedModel || currentConversation?.model) === model ? 'var(--input-bg)' : 'transparent',
                    color: (selectedModel || currentConversation?.model) === model ? 'var(--accent-color)' : 'var(--text-color)',
                    transition: 'all 0.2s',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModelSelection(model);
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--input-bg)';
                  }}
                  onMouseOut={(e) => {
                    if ((selectedModel || currentConversation?.model) !== model) {
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
        
        <div 
          className="connection-status" 
          title={getStatusTooltip()}
          style={{ 
            display: 'flex', 
            alignItems: 'center'
          }}
        >
          <span 
            className="status-dot" 
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              boxShadow: `0 0 5px ${getStatusColor()}`,
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          className={`typing-indicator ${isProcessing ? 'active' : ''}`} 
          id="typingIndicator"
          style={{
            visibility: isProcessing ? 'visible' : 'hidden',
            display: 'inline-block',
          }}
        >
          <style jsx>{`
            .typing-indicator::after {
              content: '▋';
              animation: blink 1s step-end infinite;
            }
            
            @keyframes blink {
              50% {
                opacity: 0;
              }
            }
          `}</style>
        </div>
        
        <button
          onClick={onOpenSettings}
          title="Settings"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-color)',
            border: 'none',
            borderRadius: '3px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-color)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-color)')}
        >
          ⚙
        </button>
      </div>
    </div>
  );
};

export default StatusBar; 