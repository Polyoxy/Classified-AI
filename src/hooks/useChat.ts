import { useState, useCallback, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { callAI, StreamResponse } from '@/lib/aiService';
import { Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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
  // Add AbortController reference
  const abortControllerRef = useRef<AbortController | null>(null);
  // Add a flag to track whether we've manually stopped the response
  const isStopped = useRef<boolean>(false);

  const stopResponse = useCallback(() => {
    // Set the stopped flag to true
    isStopped.current = true;
    console.log('🛑 Stopping AI response...');
    
    // If there's an active request, abort it
    if (abortControllerRef.current) {
      console.log('🛑 Aborting AI response');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Immediately set processing to false to update UI
    setIsProcessing(false);
  }, [setIsProcessing]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing || !currentConversation) return;

    try {
      // Reset the stopped flag when sending a new message
      isStopped.current = false;
      
      console.log('Sending user message:', content.trim());
      
      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();
      
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
        // Check if we've manually stopped - if so, don't update the UI further
        if (isStopped.current) {
          console.log('🛑 Response update ignored because stream was stopped');
          return;
        }
        
        accumulatedContent = response.content;
        
        // Add the response to the conversation
        addMessage(accumulatedContent, 'assistant');

        // Update token usage if available
        if (response.done && response.usage) {
          updateTokenUsage(response.usage);
        }
      };
      
      // Check if this is a web search request
      const isWebSearchRequest = content.includes('[WEB_SEARCH_REQUEST]');
      
      if (isWebSearchRequest) {
        // Extract the actual query
        const query = content.replace('[WEB_SEARCH_REQUEST]', '').trim();
        console.log('Processing web search for query:', query);
        
        // Add a temporary message about searching
        addMessage(`I'll search the web for information about: "${query}"`, 'assistant');
        
        try {
          // Call the appropriate AI provider with the web search flag
          // ... provider-specific code ...
          
          // For demonstration, we're showing how this would be flagged for processing
          // The actual web search happens in the backend or aiService
          console.log('Web search request will be processed by the AI service');
          
          // Continue with normal message processing, but the backend will handle the search
          // The rest of the function should be the same as regular message handling
        } catch (searchError) {
          console.error('Error processing web search:', searchError);
          addMessage("I wasn't able to search the web at this time. Please try again later.", 'assistant');
          setIsProcessing(false);
          return;
        }
      }
      
      try {
        // Pass the abort signal to the callAI function
        const tokenUsage = await callAI(
          messages as Message[],
          model,
          settings.activeProvider,
          apiKey,
          providerSettings.baseUrl,
          settings.temperature,
          handleStreamUpdate,
          abortControllerRef.current.signal // Pass the signal
        );
        
        // Don't update anything if we've manually stopped
        if (isStopped.current) {
          console.log('🛑 Token usage update skipped because response was stopped');
          return;
        }
        
        // Update token usage
        updateTokenUsage(tokenUsage);
        
        console.log('✅ AI response completed:', { 
          tokenUsage,
          responseLength: accumulatedContent.length 
        });
      } catch (directError) {
        // If we manually stopped, don't show any errors
        if (isStopped.current) {
          console.log('🛑 Error handling skipped because response was stopped');
          return;
        }
        
        // Check if this is an abort error, which we can ignore
        if (directError instanceof DOMException && directError.name === 'AbortError') {
          console.log('Request was aborted by user');
          // Instead of adding a system message, we'll just stop processing
          // The accumulated content will remain visible
          return;
        }
        
        console.error('❌ Direct connection failed:', directError);
        
        // If in Electron environment, we can't use the API proxy route
        const isElectron = typeof window !== 'undefined' && window.electron;
        if (isElectron) {
          throw directError;
        }
      }
    } catch (error) {
      // If we manually stopped, don't show any errors
      if (isStopped.current) {
        console.log('🛑 Final error handling skipped because response was stopped');
        return;
      }
      
      // Check if this is an abort error, which we can ignore
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Request was aborted by user');
        return;
      }
      
      console.error('❌ Error sending message to AI:', error);
      setError(error instanceof Error ? error.message : String(error));
      
      // Add error message to conversation
      addMessage(`Error: ${error instanceof Error ? error.message : String(error)}`, 'system');
      
      // Update connection status
      setConnectionStatus('error');
    } finally {
      // Only reset state if we haven't manually stopped (which would have already reset it)
      if (!isStopped.current) {
        setIsProcessing(false);
      }
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