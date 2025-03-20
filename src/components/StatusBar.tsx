import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { auth } from '@/lib/firebase';
// Import the interfaces for type assertions
import type { ElectronStore, ElectronWindowControls } from '../types/electron-interfaces';

interface StatusBarProps {
  onOpenSettings: () => void;
}

// Define available metrics types
type MetricType = 'tokensPerSecond' | 'totalTokens' | 'promptTokens' | 'completionTokens';

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
  
  // New state for metrics management
  const [activeMetrics, setActiveMetrics] = useState<MetricType[]>(['tokensPerSecond', 'totalTokens']);
  const [isMetricsDropdownOpen, setIsMetricsDropdownOpen] = useState(false);
  const metricsDropdownRef = useRef<HTMLDivElement>(null);
  
  // Helper functions for model types
  const isDeepThinkModel = (model: string | undefined): boolean => {
    return model ? model.toLowerCase().includes('deepseek') || model.toLowerCase().includes('deepthink') : false;
  };
  
  const isVisionModel = (model: string | undefined): boolean => {
    return model ? model.toLowerCase().includes('vision') : false;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (metricsDropdownRef.current && !metricsDropdownRef.current.contains(event.target as Node)) {
        setIsMetricsDropdownOpen(false);
      }
    };
    
    if (isModelDropdownOpen || isMetricsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelDropdownOpen, isMetricsDropdownOpen]);

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

  // Add useEffect for dropdown positioning
  useEffect(() => {
    // Position the dropdown if it's open
    if (isModelDropdownOpen && dropdownRef.current) {
      const dropdownElement = dropdownRef.current.querySelector('.model-dropdown') as HTMLElement;
      if (dropdownElement) {
        const rect = dropdownRef.current.getBoundingClientRect();
        // Apply a left offset to move dropdown more to the left
        dropdownElement.style.left = '-30px';
        dropdownElement.style.top = `${rect.height + 8}px`;
      }
    }
  }, [isModelDropdownOpen]);

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
    
    // Ensure all Ollama models are included
    if (provider === 'ollama') {
      const ollamaModels = [
        'deepseek-r1:7b',
        'deepseek-r1:14b',
        'llama3.2-vision:11b',
        'deepseek-r1:1.5b',
        'llama3.2:1b'
      ];
      
      // Add any models that aren't already in the list
      const combinedModels = [...new Set([...ollamaModels, ...models])];
      return combinedModels;
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

  // Helper function to clean up model names for display
  const formatModelName = (model: string): string => {
    if (!model) return 'Unknown';
    
    // Remove version numbers and special characters
    let displayName = model;
    
    // Special case handling for common models
    if (model.includes('deepseek-r1')) {
      if (model.includes('1.5b')) {
        return 'DeepSeek 1.5B';
      } else if (model.includes('7b')) {
        return 'DeepSeek 7B';
      } else if (model.includes('14b')) {
        return 'DeepSeek 14B';
      }
      return 'DeepSeek';
    }
    
    if (model.includes('llama3.2')) {
      if (model.includes('vision')) {
        return 'Llama3 Vision 11B';
      }
      
      if (model.includes('1b')) {
        return 'Llama3 1B';
      } else if (model.includes('11b')) {
        return 'Llama3 11B';
      }
      return 'Llama3';
    }
    
    // Remove any special characters and format remaining
    displayName = displayName
      .replace(/[-:]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    return displayName;
  };

  // Handle adding a metric to the display
  const handleAddMetric = (metricType: MetricType) => {
    if (!activeMetrics.includes(metricType)) {
      setActiveMetrics([...activeMetrics, metricType]);
    }
    setIsMetricsDropdownOpen(false);
  };

  // Handle removing a metric from the display
  const handleRemoveMetric = (metricType: MetricType) => {
    setActiveMetrics(activeMetrics.filter(metric => metric !== metricType));
  };

  // Toggle metrics dropdown
  const toggleMetricsDropdown = () => {
    setIsMetricsDropdownOpen(!isMetricsDropdownOpen);
  };

  // Get available metrics that are not already displayed
  const getAvailableMetrics = (): MetricType[] => {
    const allMetrics: MetricType[] = ['tokensPerSecond', 'totalTokens', 'promptTokens', 'completionTokens'];
    return allMetrics.filter(metric => !activeMetrics.includes(metric));
  };

  // Get friendly name for a metric type
  const getMetricName = (metricType: MetricType): string => {
    switch (metricType) {
      case 'tokensPerSecond': return 'Tokens/sec';
      case 'totalTokens': return 'Total Tokens';
      case 'promptTokens': return 'Prompt Tokens';
      case 'completionTokens': return 'Completion Tokens';
      default: return 'Unknown Metric';
    }
  };

  // Get the value for a specific metric
  const getMetricValue = (metricType: MetricType): string => {
    switch (metricType) {
      case 'tokensPerSecond': return `${formatNumber(Math.round(tokenUsage.tokensPerSecond || 0))} t/s`;
      case 'totalTokens': return `${formatNumber(tokenUsage.totalTokens || 0)}`;
      case 'promptTokens': return `${formatNumber(tokenUsage.promptTokens || 0)}`;
      case 'completionTokens': return `${formatNumber(tokenUsage.completionTokens || 0)}`;
      default: return '0';
    }
  };

  // Settings icon SVG
  const SettingsIcon = () => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ pointerEvents: 'none' }}
    >
      <circle cx="12" cy="12" r="2.5"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );

  // Add Metric icon SVG
  const AddMetricIcon = () => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ pointerEvents: 'none' }}
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  // Close/Remove icon SVG
  const RemoveIcon = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ pointerEvents: 'none' }}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  // Add style definitions for model type glows
  const customStatusBarStyles = `
    .status-bar {
      height: var(--status-bar-height);
      padding: var(--status-bar-padding);
      font-family: var(--font-family-general);
      font-size: var(--status-bar-font-size);
      line-height: var(--status-bar-line-height);
    }
    
    .status-bar > div {
      gap: var(--status-bar-element-gap);
    }
    
    .status-bar svg {
      width: var(--status-bar-icon-size);
      height: var(--status-bar-icon-size);
    }
    
    .model-selector {
      display: flex !important;
      position: relative;
    }
    
    .selected-model {
      display: flex;
      align-items: center;
    }

    .selected-model-text {
      font-size: var(--status-bar-font-size);
      text-align: center;
    }
    
    .model-dropdown {
      position: absolute;
      top: 100% !important;
      left: -30px !important;
      margin-top: 8px !important;
      max-height: 240px;
      z-index: 10000 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.4' : '0.2'}) !important;
      min-width: 180px;
    }
    
    .metrics-dropdown {
      position: absolute;
      top: 100% !important;
      right: 0 !important;
      margin-top: 8px !important;
      max-height: 240px;
      z-index: 10000 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.4' : '0.2'}) !important;
      min-width: 180px;
      background: ${settings?.theme === 'dark' ? '#222' : '#fff'};
      border-radius: var(--border-radius);
      border: 1px solid ${settings?.theme === 'dark' ? '#333' : '#e0e0e0'};
      overflow: hidden;
    }
    
    .metrics-dropdown-item {
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.2s ease;
      color: ${settings?.theme === 'dark' ? '#d0d0d0' : '#505050'};
    }
    
    .metrics-dropdown-item:hover {
      background: ${settings?.theme === 'dark' ? '#333' : '#f0f0f0'};
    }
    
    .metric-container {
      position: relative;
      transition: all 0.2s ease;
    }
    
    .metric-container:hover .metric-remove-btn {
      opacity: 1;
      transform: translateX(0);
    }
    
    .metric-remove-btn {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${settings?.theme === 'dark' ? 'rgba(80, 80, 80, 0.7)' : 'rgba(200, 200, 200, 0.7)'};
      border-radius: 50%;
      cursor: pointer;
      opacity: 0;
      transform: translateX(4px);
      transition: all 0.2s ease;
    }
    
    .metric-remove-btn:hover {
      background: ${settings?.theme === 'dark' ? 'rgba(120, 120, 120, 0.9)' : 'rgba(160, 160, 160, 0.9)'};
    }
    
    @keyframes movingStroke {
      0% {
        background-position: -100% 50%;
      }
      100% {
        background-position: 200% 50%;
      }
    }
    
    .vision-model-glow {
      position: relative;
      overflow: hidden;
      border-radius: var(--border-radius);
    }
    
    .vision-model-glow::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        transparent 20%,
        ${settings?.theme === 'dark' ? 'rgba(255, 80, 80, 0.08)' : 'rgba(255, 60, 60, 0.04)'} 35%,
        ${settings?.theme === 'dark' ? 'rgba(255, 80, 80, 0.15)' : 'rgba(255, 60, 60, 0.08)'} 50%,
        ${settings?.theme === 'dark' ? 'rgba(255, 80, 80, 0.08)' : 'rgba(255, 60, 60, 0.04)'} 65%,
        transparent 80%,
        transparent 100%
      );
      background-size: 200% 200%;
      animation: movingStroke 4s infinite cubic-bezier(0.4, 0.0, 0.2, 1);
      border-radius: inherit;
      pointer-events: none;
    }
    
    .thinking-model-glow {
      position: relative;
      overflow: hidden;
      border-radius: var(--border-radius);
    }
    
    .thinking-model-glow::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        transparent 20%,
        ${settings?.theme === 'dark' ? 'rgba(0, 102, 204, 0.08)' : 'rgba(0, 102, 204, 0.04)'} 35%,
        ${settings?.theme === 'dark' ? 'rgba(0, 102, 204, 0.15)' : 'rgba(0, 102, 204, 0.08)'} 50%,
        ${settings?.theme === 'dark' ? 'rgba(0, 102, 204, 0.08)' : 'rgba(0, 102, 204, 0.04)'} 65%,
        transparent 80%,
        transparent 100%
      );
      background-size: 200% 200%;
      animation: movingStroke 4.5s infinite cubic-bezier(0.4, 0.0, 0.2, 1);
      border-radius: inherit;
      pointer-events: none;
    }
    
    .vision-model-indicator {
      background: ${settings?.theme === 'dark' ? 'rgba(255, 80, 80, 0.15)' : 'rgba(255, 60, 60, 0.07)'};
      border-radius: var(--border-radius);
    }
    
    .thinking-model-indicator {
      background: ${settings?.theme === 'dark' ? 'rgba(0, 102, 204, 0.15)' : 'rgba(0, 102, 204, 0.07)'};
      border-radius: var(--border-radius);
    }
    
    @media (max-width: 767px) {
      .status-bar {
        height: var(--status-bar-height) !important;
        padding: var(--status-bar-padding) !important;
        justify-content: space-between !important;
      }
      
      .model-selector {
        max-width: 140px !important;
        overflow: hidden !important;
      }
      
      .selected-model-text {
        max-width: 100px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      
      .token-display, .cost-display {
        display: none !important;
      }
      
      .connection-status span {
        font-size: 14px !important;
      }
      
      .metrics-container {
        position: absolute !important;
        bottom: -24px !important;
        left: 0 !important;
        background: ${settings?.theme === 'dark' ? 'rgba(18, 18, 18, 0.92)' : 'rgba(245, 245, 245, 0.92)'} !important;
        padding: 2px 10px !important;
        border-radius: 0 0 4px 0 !important;
        border-right: 1px solid ${settings?.theme === 'dark' ? 'var(--status-bar-border-dark)' : 'var(--status-bar-border-color)'} !important;
        border-bottom: 1px solid ${settings?.theme === 'dark' ? 'var(--status-bar-border-dark)' : 'var(--status-bar-border-color)'} !important;
        z-index: 69 !important;
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
          height: 'var(--status-bar-height)',
          backgroundColor: settings?.theme === 'dark' ? 'rgba(18, 18, 18, 0.92)' : 'rgba(245, 245, 245, 0.92)',
          borderBottom: `1px solid ${settings?.theme === 'dark' ? 'var(--status-bar-border-dark)' : 'var(--status-bar-border-color)'}`,
          color: settings?.theme === 'dark' ? '#b0b0b0' : '#505050',
          padding: 'var(--status-bar-padding)',
          fontSize: 'var(--status-bar-font-size)',
          fontFamily: 'var(--font-family-general)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
          zIndex: 70,
          boxShadow: `0 1px 2px rgba(0, 0, 0, ${settings?.theme === 'dark' ? '0.15' : '0.08'})`,
          lineHeight: 'var(--status-bar-line-height)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '0', gap: 'calc(var(--status-bar-element-gap) * 1.6)' }}>
          {/* App title - static, not a dropdown */}
          <div 
            className="app-title-container"
            style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.2rem 0.4rem',
                fontFamily: 'var(--font-family-general, "Söhne", sans-serif)',
                fontSize: 'var(--status-bar-font-size)',
                textAlign: 'center',
                borderRadius: 'var(--border-radius)',
                background: settings?.theme === 'dark' ? 'rgba(50, 50, 50, 0.4)' : 'rgba(240, 240, 240, 0.7)',
              }}
            >
              <span 
                className="app-title"
                style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  letterSpacing: '0.2px',
                }}
              >
                Classified.AI
              </span>
            </div>
          </div>
          
          {/* Connection status indicator */}
          <div 
            className="connection-status" 
            style={{ 
              position: 'relative',
              marginLeft: '15px',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem 0.6rem',
              fontFamily: 'var(--font-family-general, "Söhne", sans-serif)',
              fontSize: 'var(--status-bar-font-size)',
              textAlign: 'center',
              borderRadius: 'var(--border-radius)',
              background: settings?.theme === 'dark' ? 'rgba(50, 50, 50, 0.4)' : 'rgba(240, 240, 240, 0.7)',
            }}
          >
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              marginRight: '6px',
              opacity: 0.8,
            }}></div>
            <span style={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              fontWeight: '500',
            }}>
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'disconnected' ? 'Disconnected' : 
               connectionStatus === 'error' ? 'Error' : 'Unknown'}
            </span>
          </div>
        </div>
        
        {/* Metrics Container */}
        <div className="metrics-container" style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--status-bar-element-gap) * 1.3)', marginRight: 'auto', marginLeft: '20px' }}>
          {activeMetrics.map((metricType) => (
            <div
              key={metricType}
              className="metric-container"
              style={{ 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: '0.2rem 0.4rem',
                fontFamily: 'var(--font-family-general, "Söhne", sans-serif)',
                fontSize: 'var(--status-bar-font-size)',
                textAlign: 'center',
                borderRadius: 'var(--border-radius)',
                background: settings?.theme === 'dark' ? 'rgba(50, 50, 50, 0.4)' : 'rgba(240, 240, 240, 0.7)',
                cursor: metricType === 'totalTokens' ? 'pointer' : 'default',
              }}
              onClick={metricType === 'totalTokens' ? toggleMetricsDropdown : undefined}
              title={metricType === 'totalTokens' ? 'Click to manage metrics' : getMetricName(metricType)}
            >
              <span 
                style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  fontWeight: '500',
                }}
              >
                {getMetricName(metricType)}: {getMetricValue(metricType)}
              </span>
              
              {/* Remove button that appears on hover */}
              <div 
                className="metric-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveMetric(metricType);
                }}
                title={`Remove ${getMetricName(metricType)} metric`}
              >
                <RemoveIcon />
              </div>
            </div>
          ))}
          
          {/* Add Metric Button */}
          <div ref={metricsDropdownRef} style={{ position: 'relative', marginLeft: '2px' }}>
            <button
              onClick={toggleMetricsDropdown}
              style={{
                backgroundColor: settings?.theme === 'dark' ? 'rgba(50, 50, 50, 0.4)' : 'rgba(240, 240, 240, 0.7)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px 5px',
                borderRadius: 'var(--border-radius)',
                color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.8)' : 'rgba(100, 100, 100, 0.8)',
                opacity: 0.9,
                transition: 'opacity 0.2s ease',
                fontFamily: 'var(--font-family-general, "Söhne", sans-serif)',
              }}
              title="Add metric"
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0.9'}
            >
              <AddMetricIcon />
            </button>
            
            {isMetricsDropdownOpen && (
              <div className="metrics-dropdown">
                {getAvailableMetrics().length > 0 ? (
                  getAvailableMetrics().map((metricType) => (
                    <div 
                      key={metricType}
                      className="metrics-dropdown-item"
                      onClick={() => handleAddMetric(metricType)}
                    >
                      {getMetricName(metricType)}
                    </div>
                  ))
                ) : (
                  <div className="metrics-dropdown-item" style={{ cursor: 'default' }}>
                    No more metrics available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="status-buttons" style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--status-bar-element-gap) * 1.3)', padding: '0', marginLeft: '12px' }}>
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
              borderRadius: '4px',
              color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.7)' : 'rgba(100, 100, 100, 0.7)',
              opacity: 0.8,
              transition: 'opacity 0.2s ease',
              fontFamily: 'var(--font-family-general, "Söhne", sans-serif)',
            }}
            title="Reload"
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            <svg 
              width="var(--status-bar-icon-size)" 
              height="var(--status-bar-icon-size)" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M4 11.5a8 8 0 0 1 14-3l3.5 3.5M20 12.5a8 8 0 0 1-14 3L2.5 12"></path>
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
              borderRadius: '4px',
              color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.7)' : 'rgba(100, 100, 100, 0.7)',
              opacity: 0.8,
              transition: 'opacity 0.2s ease',
              fontFamily: 'var(--font-family-general, "Söhne", sans-serif)',
            }}
            title="Settings"
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </>
  );
};

export default StatusBar; 