import { useState, useCallback, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Message, MessageRole } from '@/types';
import { rtdb } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

const useChat = () => {
  const { 
    currentConversation, 
    addMessage, 
    setIsProcessing, 
    isProcessing,
    settings,
    user,
    setCurrentConversation
  } = useAppContext();
  
  const [partialResponse, setPartialResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Helper function to send to OpenAI
  const sendToOpenAI = async (messages: Message[], settings: any) => {
    const response = await fetch('/api/chat/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
        model: settings.providers.openai.defaultModel,
        temperature: settings.temperature,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.content;
  };

  // Helper function to send to Ollama
  const sendToOllama = async (messages: Message[], settings: any, setPartial: (text: string) => void) => {
    try {
      console.log('Sending request to Ollama API with messages:', messages.length);
      
      // First check if Ollama API is accessible via a quick ping
      try {
        const checkResponse = await fetch('/api/chat/ollama/check', { 
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        }).catch(() => null);
        
        if (!checkResponse || !checkResponse.ok) {
          console.log('Ollama server check failed, proceeding anyway');
          // Add a warning that Ollama might not be running
          console.warn('Ollama might not be running. Please ensure Ollama is installed and running on your machine.');
        } else {
          console.log('Ollama server check passed');
        }
      } catch (e) {
        console.log('Error checking Ollama server:', e);
      }
      
      // Proceed with the actual API call
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      // Try to use a model that's likely to work
      let modelToUse = settings.providers.ollama.defaultModel;
      
      // If no model is specified or the model is the problematic deepseek, try llama3.2:1b
      if (!modelToUse || modelToUse === 'deepseek-r1:7b') {
        console.log('Using llama3.2:1b as fallback model instead of deepseek-r1:7b');
        modelToUse = 'llama3.2:1b'; // Much smaller model (1.3 GB vs 4.7 GB)
      }
      
      const response = await fetch('/api/chat/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
          model: modelToUse,
          temperature: settings.temperature,
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        let errorMessage = `Ollama API error: ${response.status}`;
        try {
          // First get the response as text to avoid JSON parse errors
          const responseText = await response.text();
          
          // Try to parse the text as JSON if possible
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (parseJsonError) {
            // If can't parse as JSON, use raw text
            errorMessage = `Ollama API error: ${response.status} - ${responseText || 'No error details available'}`;
            throw new Error(errorMessage);
          }
          
          console.error('Ollama API error details:', errorData);
          
          // Safely access properties with optional chaining
          if (errorData) {
            errorMessage = `Ollama API error: ${response.status} - ${errorData.error || errorData.details || JSON.stringify(errorData)}`;
          }
          throw new Error(errorMessage);
        } catch (parseError) {
          if (parseError instanceof Error) {
            throw parseError; // Rethrow the already formatted error
          }
          // Fallback error message
          throw new Error(`Ollama API error: ${response.status} - No error details available`);
        }
      }
      
      // Get the response text first to avoid JSON parsing errors
      const responseText = await response.text();
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing Ollama response:', parseError);
        throw new Error(`Failed to parse Ollama response: ${(parseError as Error).message}`);
      }
      
      if (!data || !data.content) {
        console.error('Invalid response format from Ollama API:', data);
        throw new Error('Invalid response format from Ollama API');
      }
      
      return data.content;
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      
      // Provide more specific error message based on error type
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request was cancelled');
        }
        
        // Check for connection errors
        if (error.message.includes('Failed to connect') || 
            error.message.includes('fetch failed') || 
            error.message.includes('aborted') ||
            error.message.includes('timeout')) {
          throw new Error(`Unable to connect to Ollama or the model timed out. You are using the "deepseek-r1:7b" model which may be too large. Try using the smaller "llama3.2:1b" model which is already installed on your system.`);
        }
      }
      
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Helper function to send to Anthropic
  const sendToAnthropic = async (messages: Message[], settings: any) => {
    const response = await fetch('/api/chat/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
        model: settings.providers.anthropic?.defaultModel,
        temperature: settings.temperature,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content;
  };
  
  const sendMessage = useCallback(async (content: string) => {
    // Don't allow empty messages
    if (!content.trim() || !currentConversation) return;

    try {
      // Add the user message to the conversation
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user' as MessageRole,
        content: content.trim(),
        timestamp: Date.now(),
      };
      
      setIsProcessing(true);
      setError(null);
      addMessage(userMessage.content, userMessage.role);

      // Prepare API call for the selected model
      let apiResponse;
      let assistantMessage: Message;

      if (settings.activeProvider === 'openai') {
        apiResponse = await sendToOpenAI(
          currentConversation.messages,
          settings
        );
        assistantMessage = {
          id: uuidv4(),
          role: 'assistant' as MessageRole,
          content: apiResponse || "I'm sorry, I couldn't process that request.",
          timestamp: Date.now(),
        };
      } else if (settings.activeProvider === 'ollama') {
        apiResponse = await sendToOllama(
          currentConversation.messages,
          settings,
          setPartialResponse
        );
        assistantMessage = {
          id: uuidv4(),
          role: 'assistant' as MessageRole,
          content: apiResponse || "I'm sorry, I couldn't process that request.",
          timestamp: Date.now(),
        };
      } else if (settings.activeProvider === 'anthropic') {
        apiResponse = await sendToAnthropic(
          currentConversation.messages,
          settings
        );
        assistantMessage = {
          id: uuidv4(),
          role: 'assistant' as MessageRole,
          content: apiResponse || "I'm sorry, I couldn't process that request.",
          timestamp: Date.now(),
        };
      } else {
        throw new Error(`Unknown chat model: ${settings.activeProvider}`);
      }

      // Add the assistant's response to the conversation
      addMessage(assistantMessage.content, assistantMessage.role);
      
      // Save to database
      if (user) {
        // Get the current messages including the new ones
        const updatedConversation = {
          ...currentConversation,
          updatedAt: Date.now(),
          messages: [
            ...currentConversation.messages,
            userMessage,
            assistantMessage
          ]
        };
        
        // Update in Realtime Database
        try {
          update(ref(rtdb, `users/${user.uid}/conversations/${currentConversation.id}`), updatedConversation)
            .catch(error => console.error('Error updating conversation in Realtime Database:', error));
        } catch (error) {
          console.error('Error saving conversation to database:', error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Add an error message from the assistant
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant' as MessageRole,
        content: `I encountered an error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
      };
      addMessage(errorMessage.content, errorMessage.role);
    } finally {
      setIsProcessing(false);
      setPartialResponse('');
    }
  }, [currentConversation, addMessage, setIsProcessing, settings, user]);
  
  const stopResponse = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  return { sendMessage, stopResponse, error, partialResponse };
};

export default useChat; 