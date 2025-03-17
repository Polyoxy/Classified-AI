import { useState, useCallback, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { callAI, StreamResponse } from '@/lib/aiService';
import { Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Add checkOllamaServer function
const checkOllamaServer = async () => {
  try {
    const response = await fetch('/api/chat/ollama/check');
    if (!response.ok) {
      const data = await response.json();
      console.error('[Chat] Ollama server check failed:', data.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Chat] Ollama server check failed:', error);
    return false;
  }
};

// Add helper function to clean AI responses
const cleanResponse = (content: string): string => {
  if (!content) return '';
  
  // Remove all <think> blocks (including their content)
  return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
};

interface AIError extends Error {
  name: string;
  message: string;
}

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
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopResponse = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing || !currentConversation) return;

    try {
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      
      console.log('Sending user message:', content.trim());
      
      // Add user message to the conversation
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      addMessage(content.trim(), 'user');
      
      setIsProcessing(true);
      setError(null);
      
      // Create temporary response message for streaming
      const tempMessageId = Date.now().toString();
      addMessage('', 'assistant');

      // Get the appropriate provider settings
      const providerSettings = settings.providers[settings.activeProvider];
      const model = currentConversation.model || providerSettings.defaultModel;
      
      // Check Ollama server if needed
      if (settings.activeProvider === 'ollama') {
        const isOllamaRunning = await checkOllamaServer();
        if (!isOllamaRunning) {
          throw new Error('Failed to get a valid response from any Ollama server');
        }
      }
      
      // Get API key if needed (not for Ollama)
      let apiKey: string | undefined = undefined;
      if (settings.activeProvider !== 'ollama') {
        apiKey = providerSettings.apiKey;
      }

      // Get all messages for the current conversation
      const messages = currentConversation.messages
        // Include all messages except empty ones and the temporary one
        .filter(msg => {
          // Keep all non-empty messages except the temporary one
          if (msg.content === '') {
            return false;
          }
          // Keep system messages
          if (msg.role === 'system') {
            return true;
          }
          // Keep all user and assistant messages that aren't temporary
          return msg.timestamp !== parseInt(tempMessageId, 10);
        })
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add the current user message
      messages.push({
        role: 'user',
        content: content.trim()
      });

      console.log('🚀 Sending message to AI:', { 
        provider: settings.activeProvider,
        model,
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]
      });

      // Log the actual conversation for debugging
      console.log('Full conversation being sent to AI:', 
        messages.map(m => `${m.role}: ${m.content.substring(0, 30)}${m.content.length > 30 ? '...' : ''}`));

      // Update connection status to connected
      setConnectionStatus('connected');

      // Stream handler for the response
      let accumulatedContent = '';
      const handleStreamUpdate = (response: StreamResponse) => {
        // Clean the content by removing thinking blocks
        const cleanedContent = cleanResponse(response.content);
        accumulatedContent = cleanedContent;
        
        // Add the response to the conversation
        addMessage(cleanedContent, 'assistant');

        // Update token usage if available
        if (response.done && response.usage) {
          updateTokenUsage(response.usage);
        }
      };
      
      try {
        // Call the AI service with direct connection first
        const tokenUsage = await callAI(
          messages as Message[],
          model,
          settings.activeProvider,
          handleStreamUpdate,
          apiKey,
          providerSettings.baseUrl,
          settings.temperature,
          abortControllerRef.current
        );
        
        // Update token usage
        updateTokenUsage(tokenUsage);
        
        console.log('✅ AI response completed:', { 
          tokenUsage,
          responseLength: accumulatedContent.length 
        });
      } catch (directError) {
        const error = directError as AIError;
        // Check if the error was due to abortion
        if (error.name === 'AbortError') {
          console.log('Response generation was cancelled');
          addMessage('Response generation was cancelled.', 'system');
          return;
        }
        
        console.error('❌ Direct connection failed:', error);
        
        // If in Electron environment, we can't use the API proxy route
        const isElectron = typeof window !== 'undefined' && window.electron;
        if (isElectron) {
          throw error;
        }
      }
    } catch (error) {
      const err = error as AIError;
      // Don't show error message if it was just cancelled
      if (err.name !== 'AbortError') {
        console.error('❌ Error sending message to AI:', err);
        setError(err.message);
        
        // Add error message to conversation
        addMessage(`Error: ${err.message}`, 'system');
        
        // Update connection status
        setConnectionStatus('error');
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
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
    stopResponse,
    error,
    isProcessing
  };
};

export default useChat; 