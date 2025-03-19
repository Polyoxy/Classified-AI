import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';

export function useModels() {
  const { settings, currentConversation, changeModel } = useAppContext();
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // Get available models for the current provider
  useEffect(() => {
    if (settings && settings.activeProvider) {
      const providerConfig = settings.providers[settings.activeProvider];
      if (providerConfig && providerConfig.models) {
        setAvailableModels(providerConfig.models);
      }
    }
  }, [settings]);
  
  // Check if a model is a DeepThink model
  const isDeepThinkModel = (model: string | undefined): boolean => {
    return model ? model.toLowerCase().includes('deepseek') || model.toLowerCase().includes('deepthink') : false;
  };
  
  // Check if a model is a Vision model
  const isVisionModel = (model: string | undefined): boolean => {
    return model ? model.toLowerCase().includes('vision') : false;
  };
  
  // Get the current model
  const getCurrentModel = (): string => {
    if (currentConversation && currentConversation.model) {
      return currentConversation.model;
    }
    
    // Default to the first model in the provider's list
    if (settings && settings.activeProvider) {
      const providerConfig = settings.providers[settings.activeProvider];
      if (providerConfig) {
        return providerConfig.defaultModel;
      }
    }
    
    return 'Unknown Model';
  };
  
  // Handle model change
  const handleModelChange = (model: string) => {
    changeModel(model);
  };
  
  return {
    availableModels,
    isDeepThinkModel,
    isVisionModel,
    getCurrentModel,
    handleModelChange,
  };
} 