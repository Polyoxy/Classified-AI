import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { AIProvider, UserRole } from '@/types';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen = true, onClose }) => {
  const { settings, updateSettings } = useAppContext();
  const [activeProvider, setActiveProvider] = useState<AIProvider>(settings.activeProvider);
  const [apiKey, setApiKey] = useState<string>(settings.providers[settings.activeProvider].apiKey || '');
  const [baseUrl, setBaseUrl] = useState<string>(settings.providers[settings.activeProvider].baseUrl || '');
  const [temperature, setTemperature] = useState<number>(settings.temperature || 0.7);
  const [fontSize, setFontSize] = useState<number>(settings.fontSize);
  const [userRole, setUserRole] = useState<UserRole>(settings.userRole);
  const [customPrompts, setCustomPrompts] = useState<{
    [key in UserRole]?: string;
  }>({
    developer: settings.customSystemPrompts?.developer || '',
    casual: settings.customSystemPrompts?.casual || '',
    'code-helper': settings.customSystemPrompts?.['code-helper'] || ''
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings.theme || 'system');
  const [showSystemMessages, setShowSystemMessages] = useState<boolean>(settings.showSystemMessages !== false);
  const [showTokenCount, setShowTokenCount] = useState<boolean>(settings.showTokenCount !== false);
  const [showTimestamps, setShowTimestamps] = useState<boolean>(settings.showTimestamps !== false);
  const [codeHighlighting, setCodeHighlighting] = useState<boolean>(settings.codeHighlighting !== false);
  const [showThinking, setShowThinking] = useState<boolean>(settings.showThinking !== false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'api' | 'prompts' | 'about'>('appearance');
  const [codeFontSize, setCodeFontSize] = useState<number>(settings.codeFontSize || settings.fontSize);
  const [lineHeight, setLineHeight] = useState<number>(settings.lineHeight || 1.5);
  const [codeLineHeight, setCodeLineHeight] = useState<number>(settings.codeLineHeight || 1.5);

  // Update state when settings change
  useEffect(() => {
    setActiveProvider(settings.activeProvider);
    setApiKey(settings.providers[settings.activeProvider].apiKey || '');
    setBaseUrl(settings.providers[settings.activeProvider].baseUrl || '');
    setTemperature(settings.temperature || 0.7);
    setFontSize(settings.fontSize);
    setUserRole(settings.userRole);
    setCustomPrompts({
      developer: settings.customSystemPrompts?.developer || '',
      casual: settings.customSystemPrompts?.casual || '',
      'code-helper': settings.customSystemPrompts?.['code-helper'] || ''
    });
    setShowSystemMessages(settings.showSystemMessages !== false);
    setShowTokenCount(settings.showTokenCount !== false);
    setShowTimestamps(settings.showTimestamps !== false);
    setCodeHighlighting(settings.codeHighlighting !== false);
    setShowThinking(settings.showThinking !== false);
    setCodeFontSize(settings.codeFontSize || settings.fontSize);
    setLineHeight(settings.lineHeight || 1.5);
    setCodeLineHeight(settings.codeLineHeight || 1.5);
  }, [settings]);

  // Save settings and close modal
  const handleSave = () => {
    const newSettings = {
      ...settings,
      theme,
      temperature,
      showSystemMessages,
      showTokenCount,
      showTimestamps,
      codeHighlighting,
      showThinking,
      customSystemPrompts: {
        developer: customPrompts.developer || DEFAULT_SYSTEM_PROMPTS.developer,
        casual: customPrompts.casual || DEFAULT_SYSTEM_PROMPTS.casual,
        'code-helper': customPrompts['code-helper'] || DEFAULT_SYSTEM_PROMPTS['code-helper'],
      },
      fontSize,
      userRole,
      activeProvider,
      providers: {
        ...settings.providers,
        [activeProvider]: {
          ...settings.providers[activeProvider],
          apiKey,
          baseUrl,
        }
      },
      codeFontSize,
      lineHeight,
      codeLineHeight,
    };

    updateSettings(newSettings);
    onClose();
  };

  // Handle custom prompt changes
  const handlePromptChange = (role: UserRole, value: string) => {
    setCustomPrompts(prev => ({
      ...prev,
      [role]: value
    }));
  };

  // Render the tabs navigation
  const renderTabs = () => (
    <div className="flex border-b border-[#2a2a2a] mb-6">
      <button
        onClick={() => setActiveTab('appearance')}
        className={`px-4 py-2 text-sm font-medium ${activeTab === 'appearance' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
      >
        Appearance
      </button>
      <button
        onClick={() => setActiveTab('api')}
        className={`px-4 py-2 text-sm font-medium ${activeTab === 'api' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
      >
        AI Providers
      </button>
      <button
        onClick={() => setActiveTab('prompts')}
        className={`px-4 py-2 text-sm font-medium ${activeTab === 'prompts' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
      >
        Prompts
      </button>
      <button
        onClick={() => setActiveTab('about')}
        className={`px-4 py-2 text-sm font-medium ${activeTab === 'about' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
      >
        About
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md shadow-xl border border-[#2a2a2a]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[1.5rem] font-medium text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {renderTabs()}
        
        <div className="space-y-6">
          {activeTab === 'appearance' && (
            <>
              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="w-full bg-[#2a2a2a] text-[1rem] text-white rounded-md px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  Font Size
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full bg-[#2a2a2a] text-[1rem] text-white rounded-md px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="14">Small (14px)</option>
                  <option value="16">Medium (16px)</option>
                  <option value="18">Large (18px)</option>
                </select>
              </div>

              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  Code Font Size
                </label>
                <select
                  value={codeFontSize}
                  onChange={(e) => setCodeFontSize(parseInt(e.target.value))}
                  className="w-full bg-[#2a2a2a] text-[1rem] text-white rounded-md px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="14">Small (14px)</option>
                  <option value="16">Medium (16px)</option>
                  <option value="18">Large (18px)</option>
                </select>
              </div>

              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  Line Height
                </label>
                <select
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  className="w-full bg-[#2a2a2a] text-[1rem] text-white rounded-md px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1.2">Compact (1.2)</option>
                  <option value="1.5">Normal (1.5)</option>
                  <option value="1.8">Relaxed (1.8)</option>
                </select>
              </div>

              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  Code Line Height
                </label>
                <select
                  value={codeLineHeight}
                  onChange={(e) => setCodeLineHeight(parseFloat(e.target.value))}
                  className="w-full bg-[#2a2a2a] text-[1rem] text-white rounded-md px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1.2">Compact (1.2)</option>
                  <option value="1.5">Normal (1.5)</option>
                  <option value="1.8">Relaxed (1.8)</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'api' && (
            <>
              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  Model Temperature
                </label>
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
              
              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  User Role
                </label>
                <select 
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full bg-[#2a2a2a] text-[1rem] text-white rounded-md px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="developer">Developer</option>
                  <option value="casual">Casual User</option>
                  <option value="code-helper">Code Helper</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'prompts' && (
            <>
              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  Developer Prompt
                </label>
                <textarea
                  value={customPrompts.developer || ''}
                  onChange={(e) => handlePromptChange('developer', e.target.value)}
                  placeholder="Enter developer prompt"
                  className="w-full bg-[#2a2a2a] text-[1rem] text-white rounded-md px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  Casual User Prompt
                </label>
                <textarea
                  value={customPrompts.casual || ''}
                  onChange={(e) => handlePromptChange('casual', e.target.value)}
                  placeholder="Enter casual user prompt"
                  className="w-full bg-[#2a2a2a] text-[1rem] text-white rounded-md px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[1rem] font-medium text-white mb-2">
                  Code Helper Prompt
                </label>
                <textarea
                  value={customPrompts['code-helper'] || ''}
                  onChange={(e) => handlePromptChange('code-helper', e.target.value)}
                  placeholder="Enter code helper prompt"
                  className="w-full bg-[#2a2a2a] text-[1rem] text-white rounded-md px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 space-x-2">
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