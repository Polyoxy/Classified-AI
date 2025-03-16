import { AIProvider, Message, TokenUsage } from '@/types';

// Estimated cost per 1000 tokens (in USD)
const COST_PER_1K_TOKENS = {
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'default': { input: 0.0005, output: 0.0015 }, // Default fallback
};

// Simple token estimator (very rough approximation)
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// Calculate estimated cost
export const calculateCost = (
  promptTokens: number,
  completionTokens: number,
  model: string
): number => {
  const costRates = COST_PER_1K_TOKENS[model as keyof typeof COST_PER_1K_TOKENS] || COST_PER_1K_TOKENS.default;
  
  const promptCost = (promptTokens / 1000) * costRates.input;
  const completionCost = (completionTokens / 1000) * costRates.output;
  
  return promptCost + completionCost;
};

// Interface for streaming response
export interface StreamResponse {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// OpenAI API
export const callOpenAI = async (
  messages: Message[],
  model: string,
  apiKey: string,
  temperature: number,
  onUpdate: (response: StreamResponse) => void
): Promise<TokenUsage> => {
  try {
    // Prepare messages for OpenAI format
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Estimate prompt tokens
    const promptText = messages.map(msg => msg.content).join(' ');
    const promptTokens = estimateTokens(promptText);
    
    // Call OpenAI API with streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling OpenAI API');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to get response reader');

    let accumulatedContent = '';
    let completionTokens = 0;

    // Process the stream
    const processStream = async (): Promise<TokenUsage> => {
      const { done, value } = await reader.read();
      
      if (done) {
        // Final update with token usage
        completionTokens = estimateTokens(accumulatedContent);
        const totalTokens = promptTokens + completionTokens;
        const estimatedCost = calculateCost(promptTokens, completionTokens, model);
        
        onUpdate({
          content: accumulatedContent,
          done: true,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens,
          },
        });
        
        return {
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCost,
        };
      }

      // Decode the chunk
      const chunk = new TextDecoder().decode(value);
      const lines = chunk
        .split('\n')
        .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;
            
            const json = JSON.parse(jsonStr);
            const content = json.choices[0]?.delta?.content || '';
            
            if (content) {
              accumulatedContent += content;
              onUpdate({
                content: accumulatedContent,
                done: false,
              });
            }
          } catch (e) {
            console.error('Error parsing JSON from stream:', e);
          }
        }
      }

      return processStream();
    };

    return await processStream();
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
};

// Ollama API
export const callOllama = async (
  messages: Message[],
  model: string,
  baseUrl: string,
  temperature: number,
  onUpdate: (response: StreamResponse) => void
): Promise<TokenUsage> => {
  try {
    // Log initial call details
    console.log('🚀 Initializing Ollama API call:', {
      model,
      baseUrl,
      temperature,
      numMessages: messages.length
    });

    // Make sure we have a proper system message to set the context
    let hasSystemMessage = false;
    const systemMessageContent = "You are a helpful AI assistant that provides accurate, factual information. Only answer what you know with certainty. If you don't know something, say 'I don't know' or 'I'm not sure' rather than making up information. Keep your responses concise and focused on the user's question. Format your responses with single line breaks between paragraphs and avoid multiple consecutive line breaks.";
    
    // Prepare messages for Ollama format with improved role handling
    const ollamaMessages = messages.map(msg => {
      // Clean up excessive newlines in the content
      const cleanContent = msg.content
        .replace(/\n{3,}/g, '\n\n') // Replace 3 or more newlines with 2
        .replace(/\n\s+\n/g, '\n\n') // Replace newlines with spaces between them
        .trim();
      
      return {
        role: msg.role,
        content: cleanContent,
      };
    });

    // Only add system message if there isn't one already
    if (!messages.some(msg => msg.role === 'system')) {
      ollamaMessages.unshift({
        role: 'system',
        content: systemMessageContent
      });
    }

    console.log('📝 Prepared messages for Ollama:', 
      ollamaMessages.map(m => ({
        role: m.role,
        preview: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
      })));

    // Estimate prompt tokens
    const promptText = messages.map(msg => msg.content).join(' ');
    const promptTokens = estimateTokens(promptText);
    console.log('🔢 Estimated prompt tokens:', promptTokens);
    
    // Try both baseUrl formats (with and without trailing slash)
    const cleanBaseUrl = baseUrl.endsWith('/') 
      ? baseUrl.slice(0, -1) 
      : baseUrl;
    
    console.log(`📡 Sending to Ollama API: ${cleanBaseUrl}/api/chat`);
    console.log('Request body:', {
      model: model || "deepseek-r1:7b",
      messages: ollamaMessages,
      stream: true,
      options: { temperature }
    });
    
    // Determine if we're in Electron
    const isElectron = typeof window !== 'undefined' && window.electron;
    
    // Prepare the request body
    const requestBody = JSON.stringify({
      model: model || "deepseek-r1:7b", // Use provided model or fallback to deepseek
      messages: ollamaMessages,
      stream: true,
      options: {
        temperature,
      },
    });
    
    // Try different connection methods
    let response;
    
    if (isElectron) {
      // In Electron, disable CSP completely for this request by using a custom fetch
      console.log('Using API proxy route in Electron');
      response = await fetch(`/api/ollama?endpoint=api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
    } else {
      // In browser, try direct connection first, then fallback to proxy
      try {
        // Try multiple approaches
        const urls = [
          `/api/ollama?endpoint=api/chat`, // API proxy route
          `${cleanBaseUrl}/api/chat`,      // Direct connection using baseUrl
          `http://127.0.0.1:11434/api/chat`, // Direct IP
          `http://localhost:11434/api/chat`  // localhost
        ];
        
        let lastError;
        for (const url of urls) {
          try {
            console.log(`Attempting connection to: ${url}`);
            response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: requestBody,
            });
            
            if (response.ok) {
              console.log(`Successfully connected to ${url}`);
              break;
            }
          } catch (err) {
            lastError = err;
            console.warn(`Failed to connect to ${url}:`, err);
          }
        }
        
        if (!response || !response.ok) {
          throw lastError || new Error('All connection attempts to Ollama failed');
        }
      } catch (error) {
        console.error('All connection attempts failed:', error);
        throw error;
      }
    }

    if (!response.ok) {
      let errorMsg = 'Error calling Ollama API';
      try {
        const error = await response.json();
        console.error("❌ Error response from Ollama:", error);
        errorMsg = error.error || errorMsg;
      } catch (e) {
        console.error("❌ Failed to parse error response:", e);
        errorMsg = `Ollama error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }

    console.log("✅ Successfully connected to Ollama, processing response stream");
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to get response reader');

    let accumulatedContent = '';
    let chunkCount = 0;

    // Process the stream
    const processStream = async (): Promise<void> => {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          // Final update
          const completionTokens = estimateTokens(accumulatedContent);
          const totalTokens = promptTokens + completionTokens;
          
          console.log('🏁 Stream completed:', {
            totalChunks: chunkCount,
            finalLength: accumulatedContent.length,
            completionTokens,
            totalTokens
          });
          
          onUpdate({
            content: accumulatedContent,
            done: true,
            usage: {
              promptTokens,
              completionTokens,
              totalTokens,
            },
          });
          
          return;
        }

        // Decode the chunk
        const chunk = new TextDecoder().decode(value);
        chunkCount++;
        
        // Split by newlines and filter out empty lines
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        console.log(`📦 Processing chunk #${chunkCount}:`, {
          numLines: lines.length,
          rawChunk: chunk
        });
        
        for (const line of lines) {
          try {
            if (line.trim() === '') continue;
            
            // Parse the JSON response
            const parsedLine = JSON.parse(line);
            console.log(`🔍 Parsed line from chunk #${chunkCount}:`, parsedLine);
            
            // Extract content based on Ollama's response format
            let content = '';
            if (parsedLine.message?.content) {
              content = parsedLine.message.content;
              console.log('📄 Content from message:', content);
            } else if (parsedLine.response) {
              content = parsedLine.response;
              console.log('📄 Content from response:', content);
            } else if (parsedLine.content) {
              content = parsedLine.content;
              console.log('📄 Content direct:', content);
            }
            
            if (content) {
              // Clean up the response formatting
              const cleanContent = content
                .replace(/\n{3,}/g, '\n\n') // Replace 3 or more newlines with 2
                .replace(/\n\s+\n/g, '\n\n') // Replace newlines with spaces between them
                .trim();
              
              // Add a space before appending if needed
              if (accumulatedContent && !accumulatedContent.endsWith(' ') && !cleanContent.startsWith(' ')) {
                accumulatedContent += ' ';
              }
              accumulatedContent += cleanContent;
              console.log(`💬 Updated content (${accumulatedContent.length} chars)`);
              onUpdate({
                content: accumulatedContent,
                done: false,
              });
            }
          } catch (e) {
            // Log parsing errors but continue processing
            console.error(`❌ Error parsing line from chunk #${chunkCount}:`, e);
            console.log('Problematic line:', line);
          }
        }

        return processStream();
      } catch (error) {
        console.error('❌ Error processing stream:', error);
        throw error;
      }
    };

    await processStream();
    
    // Calculate final token usage
    const completionTokens = estimateTokens(accumulatedContent);
    const totalTokens = promptTokens + completionTokens;
    
    console.log('📊 Final statistics:', {
      promptTokens,
      completionTokens,
      totalTokens,
      totalChunks: chunkCount,
      finalLength: accumulatedContent.length
    });
    
    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: 0, // Local models have no cost
    };
  } catch (error) {
    console.error('❌ Error in Ollama API call:', error);
    throw error;
  }
};

// Deepseek API
export const callDeepseek = async (
  messages: Message[],
  model: string,
  apiKey: string,
  temperature: number,
  onUpdate: (response: StreamResponse) => void
): Promise<TokenUsage> => {
  try {
    // Prepare messages for Deepseek format
    const deepseekMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Estimate prompt tokens
    const promptText = messages.map(msg => msg.content).join(' ');
    const promptTokens = estimateTokens(promptText);
    
    // Call Deepseek API with streaming
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: deepseekMessages,
        temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling Deepseek API');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to get response reader');

    let accumulatedContent = '';

    // Process the stream
    const processStream = async (): Promise<TokenUsage> => {
      const { done, value } = await reader.read();
      
      if (done) {
        // Final update
        const completionTokens = estimateTokens(accumulatedContent);
        const totalTokens = promptTokens + completionTokens;
        const estimatedCost = calculateCost(promptTokens, completionTokens, 'default');
        
        onUpdate({
          content: accumulatedContent,
          done: true,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens,
          },
        });
        
        return {
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCost,
        };
      }

      // Decode the chunk
      const chunk = new TextDecoder().decode(value);
      const lines = chunk
        .split('\n')
        .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;
            
            const json = JSON.parse(jsonStr);
            const content = json.choices[0]?.delta?.content || '';
            
            if (content) {
              accumulatedContent += content;
              onUpdate({
                content: accumulatedContent,
                done: false,
              });
            }
          } catch (e) {
            console.error('Error parsing JSON from Deepseek stream:', e);
          }
        }
      }

      return processStream();
    };

    return await processStream();
  } catch (error) {
    console.error('Error calling Deepseek:', error);
    throw error;
  }
};

// Main function to call the appropriate AI provider
export const callAI = async (
  messages: Message[],
  model: string,
  provider: AIProvider,
  apiKey: string | undefined,
  baseUrl: string | undefined,
  temperature: number,
  onUpdate: (response: StreamResponse) => void
): Promise<TokenUsage> => {
  switch (provider) {
    case 'openai':
      if (!apiKey) throw new Error('OpenAI API key is required');
      return callOpenAI(messages, model, apiKey, temperature, onUpdate);
    
    case 'ollama':
      const ollamaBaseUrl = baseUrl || 'http://localhost:11434';
      return callOllama(messages, model, ollamaBaseUrl, temperature, onUpdate);
    
    case 'deepseek':
      if (!apiKey) throw new Error('Deepseek API key is required');
      return callDeepseek(messages, model, apiKey, temperature, onUpdate);
    
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}; 