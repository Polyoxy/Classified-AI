import { useState, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Message, MessageRole, StreamResponse } from '../types';
import { rtdb } from '../lib/firebase';
import { ref, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

// Add checkOllamaServer function at the top of the file
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

const useChat = () => {
  const { 
    currentConversation, 
    addMessage, 
    setIsProcessing, 
    isProcessing,
    settings,
    user,
    setCurrentConversation,
    setConnectionStatus
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

  // Helper function to clean AI responses
  const cleanResponse = (content: string): string => {
    if (!content) return '';
    
    // Remove all <think> blocks (including their content)
    return content.replace(/<think>[\s\S]*?<\/think>/g, '')
      // Also remove any header tags that might be in the response
      .replace(/<\|start_header_id\|>.*?<\|end_header_id\|>/g, '')
      .trim();
  };

  // Helper function to send to Ollama
  const sendToOllama = async (messages: Message[]) => {
    try {
      // Check if Ollama server is running
      const isServerRunning = await checkOllamaServer();
      if (!isServerRunning) {
        throw new Error('Failed to get a valid response from any Ollama server');
      }

      // Format messages to ensure they are valid
      const formattedMessages = messages.filter(msg => 
        msg.content && typeof msg.content === 'string' && msg.content.trim() !== ''
      );

      if (formattedMessages.length === 0) {
        throw new Error('No valid messages to send');
      }

      // Add system message if not present
      if (!formattedMessages.some(msg => msg.role === 'system')) {
        formattedMessages.unshift({
          id: uuidv4(),
          role: 'system',
          content: 'You are a helpful AI assistant. Provide clear, concise, and accurate responses.',
          timestamp: Date.now()
        });
      }

      // Prepare request body
      const requestBody = {
        model: 'llama3.2:1b',
        messages: formattedMessages,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 1000
        }
      };

      console.log('[Chat] Sending messages to Ollama:', formattedMessages.length);

      // Send request to API
      const response = await fetch('/api/chat/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response from Ollama');
      }

      const data = await response.json();
      
      // Handle different response formats
      let content = '';
      if (data.content) {
        content = data.content;
      } else if (data.message?.content) {
        content = data.message.content;
      } else if (data.answer) {
        content = data.answer;
      } else if (typeof data === 'string') {
        content = data;
      }

      if (!content || typeof content !== 'string' || content.trim() === '') {
        throw new Error('Invalid response format from Ollama');
      }

      // Clean up the response content and remove thinking tags
      const cleanContent = cleanResponse(content.trim());
      
      // Update conversation with the response
      addMessage(cleanContent, 'assistant');

      return cleanContent;
    } catch (error) {
      console.error('[Chat] Error in sendToOllama:', error);
      throw error;
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
    if (!content.trim() || isProcessing || !currentConversation) return;

    try {
      // Create a user message
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      // Set the message immediately in the UI (don't wait for backend)
      addMessage(userMessage.content, userMessage.role);

      // Create assistant message placeholder immediately to ensure we have something to update
      const assistantMessageId = uuidv4();
      const placeholderMessage = {
        id: assistantMessageId,
        role: 'assistant' as MessageRole,
        content: '', // Empty content initially
        timestamp: Date.now(),
      };
      
      // Add the placeholder immediately so we have something to update
      addMessage(placeholderMessage.content, placeholderMessage.role);

      // Optimize conversation for good UX
      const optimizedMessages = [...currentConversation.messages];
      
      // Update connection status
      setConnectionStatus('connected');
      setIsProcessing(true);
      setError(null);
      
      // Handle accumulated content for streaming responses
      let accumulatedContent = '';
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      // Function to handle streaming updates
      const handleStreamUpdate = (content: string) => {
        // Clean up any header tags and thinking blocks in the content
        const cleanedContent = cleanResponse(content);
        accumulatedContent = cleanedContent;
        
        // Display the cleaned content
        setPartialResponse(cleanedContent || '...');
      };
      
      // Get the current model from settings
      const model = currentConversation?.model || 
        (settings.activeProvider === 'ollama' ? 'deepseek-r1:7b' : // Default to deepseek-r1:7b for Ollama
        (settings.activeProvider && settings.providers[settings.activeProvider]?.defaultModel));
      
      // Get API key if necessary
      const providerSettings = settings.providers[settings.activeProvider] || {};
      const apiKey = providerSettings.apiKey || '';
      
      // Prepare API call for the selected model
      let apiResponse;
      let assistantMessage: Message;

      try {
        if (settings.activeProvider === 'openai') {
          apiResponse = await sendToOpenAI(
            currentConversation.messages,
            settings
          );
        } else if (settings.activeProvider === 'ollama') {
          apiResponse = await sendToOllama(
            currentConversation.messages
          );
        } else if (settings.activeProvider === 'anthropic') {
          apiResponse = await sendToAnthropic(
            currentConversation.messages,
            settings
          );
        } else {
          throw new Error(`Unknown chat model: ${settings.activeProvider}`);
        }
      
        // Update the assistant message with the real content
        assistantMessage = {
          id: assistantMessageId,
          role: 'assistant' as MessageRole,
          content: cleanResponse(apiResponse) || "I'm sorry, I couldn't process that request.",
          timestamp: Date.now(),
        };
      
        // Add the assistant's response to the conversation
        addMessage(assistantMessage.content, assistantMessage.role);
      } catch (apiError) {
        console.error('API error:', apiError);
        // Update the placeholder with error message instead of letting it disappear
        const errorContent = `I encountered an error: ${apiError instanceof Error ? apiError.message : String(apiError)}`;
        addMessage(errorContent, 'assistant');
        throw apiError; // Re-throw to be caught by outer catch
      }
      
      // Update conversation in Firebase
      if (currentConversation.id && user) {
        try {
          // Check if user is a regular authenticated user or guest/electron user
          const isGuestUser = 
            !user.uid || 
            user.isAnonymous || 
            user.uid === 'guest-user' || 
            user.uid === 'electron-user' || 
            user.uid.startsWith('offline-');
          
          // Log user details for debugging
          console.log('User details in useChat:', {
            uid: user.uid,
            isAnonymous: user.isAnonymous,
            isGuest: isGuestUser
          });
          
          // If NOT a guest user, update Firebase
          if (!isGuestUser) {
            console.log('Registered user detected, updating Firebase');
            // Only update Firebase for regular authenticated users
            const conversationRef = ref(rtdb, `users/${user.uid}/conversations/${currentConversation.id}`);
            
            // Log the conversation we're updating
            console.log('Updating conversation in Firebase:', currentConversation.id);
            
            // Create optimized object to update
            const updateData = {
              title: currentConversation.title,
              messages: optimizedMessages,
              updatedAt: Date.now()
            };
            
            // Update in Firebase
            await update(conversationRef, updateData);
            console.log('Firebase update completed successfully');
          } else {
            // For guest/offline users, just use localStorage (handled by AppContext)
            console.log('Guest user detected, skipping Firebase update, using localStorage only');
          }
        } catch (error) {
          // If Firebase update fails, don't throw - just log and continue
          // This prevents the message from disappearing
          console.error('Error updating conversation in Realtime Database:', error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Make sure the error message stays visible by updating the latest message
      // instead of adding a new one that might get lost
      const errorMessage = `I encountered an error: ${error instanceof Error ? error.message : String(error)}`;
      addMessage(errorMessage, 'assistant');
    } finally {
      setIsProcessing(false);
      setPartialResponse('');
    }
  }, [currentConversation, addMessage, setIsProcessing, settings, user, setConnectionStatus]);
  
  const stopResponse = useCallback(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      console.log('Stopping response generation...');
      abortControllerRef.current.abort();
      
      // When stopping, make sure we keep whatever partial response we have
      if (currentConversation) {
        // Get the last assistant message (which is the one being generated)
        const partialMessage = currentConversation.messages.find(
          msg => msg.role === 'assistant' && msg.content === ''
        );
        
        // If we have a partial message placeholder, fill it with whatever we've streamed so far
        if (partialMessage) {
          // Use partial response or a message indicating cancellation
          const partialContent = partialResponse || "Response generation was cancelled.";
          
          // Update the message
          addMessage(partialContent, 'assistant');
        }
      }
    }
    
    // Reset processing state
    setIsProcessing(false);
    setPartialResponse('');
  }, [abortControllerRef, setIsProcessing, addMessage, currentConversation, partialResponse]);
  
  return { sendMessage, stopResponse, error, partialResponse };
};

export default useChat;