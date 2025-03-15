import { useState, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { callAI, StreamResponse } from '@/lib/aiService';
import { Message } from '@/types';

export const useChat = () => {
  const { 
    addMessage, 
    currentConversation, 
    settings, 
    isProcessing, 
    setIsProcessing,
    updateTokenUsage,
    setConnectionStatus
  } = useAppContext();

  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing || !currentConversation) return;

    try {
      // Add user message to the conversation
      addMessage(content.trim(), 'user');
      
      setIsProcessing(true);
      setError(null);
      
      // Create temporary response message for streaming
      const tempMessageId = Date.now().toString();
      addMessage('', 'assistant');

      // Get the appropriate provider settings
      const providerSettings = settings.providers[settings.activeProvider];
      const model = currentConversation.model || providerSettings.defaultModel;
      
      // Get API key if needed (not for Ollama)
      let apiKey: string | undefined = undefined;
      if (settings.activeProvider !== 'ollama') {
        apiKey = providerSettings.apiKey;
      }

      // Get all messages for the current conversation
      const messages = currentConversation.messages
        // Exclude the temporary empty message we just added
        .filter(msg => msg.timestamp !== parseInt(tempMessageId, 10))
        .map(msg => ({
          role: msg.role,
          content: msg.content
        })) as Message[];
      
      console.log('🚀 Sending message to AI:', { 
        provider: settings.activeProvider,
        model,
        messages: messages.length
      });

      // Update connection status to connected
      setConnectionStatus('connected');

      // Stream handler for the response
      let accumulatedContent = '';
      const handleStreamUpdate = (response: StreamResponse) => {
        accumulatedContent = response.content;
        
        // Add the response to the conversation
        addMessage(accumulatedContent, 'assistant');

        // Update token usage if available
        if (response.done && response.usage) {
          updateTokenUsage(response.usage);
        }
      };
      
      try {
        // Call the AI service with direct connection first
        const tokenUsage = await callAI(
          messages,
          model,
          settings.activeProvider,
          apiKey,
          providerSettings.baseUrl,
          settings.temperature,
          handleStreamUpdate
        );
        
        // Update token usage
        updateTokenUsage(tokenUsage);
        
        console.log('✅ AI response completed:', { 
          tokenUsage,
          responseLength: accumulatedContent.length 
        });
      } catch (directError) {
        console.error('❌ Direct connection failed:', directError);
        
        // If in Electron environment, we can't use the API proxy route
        const isElectron = typeof window !== 'undefined' && window.electron;
        if (isElectron) {
          throw directError;
        }
      }
    } catch (error) {
      console.error('❌ Error sending message to AI:', error);
      setError(error instanceof Error ? error.message : String(error));
      
      // Add error message to conversation
      addMessage(`Error: ${error instanceof Error ? error.message : String(error)}`, 'system');
      
      // Update connection status
      setConnectionStatus('error');
    } finally {
      setIsProcessing(false);
    }
  }, [
    addMessage,
    currentConversation,
    isProcessing,
    setIsProcessing,
    settings,
    updateTokenUsage,
    setConnectionStatus
  ]);

  return {
    sendMessage,
    error,
    isProcessing
  };
};

export default useChat; 