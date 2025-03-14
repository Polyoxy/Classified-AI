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
    // Prepare messages for Ollama format
    const ollamaMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Estimate prompt tokens
    const promptText = messages.map(msg => msg.content).join(' ');
    const promptTokens = estimateTokens(promptText);
    
    // Call Ollama API with streaming
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: ollamaMessages,
        stream: true,
        options: {
          temperature,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error calling Ollama API');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to get response reader');

    let accumulatedContent = '';

    // Process the stream
    const processStream = async (): Promise<void> => {
      const { done, value } = await reader.read();
      
      if (done) {
        // Final update
        const completionTokens = estimateTokens(accumulatedContent);
        const totalTokens = promptTokens + completionTokens;
        
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
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            const content = json.message.content;
            accumulatedContent += content;
            onUpdate({
              content: accumulatedContent,
              done: false,
            });
          }
        } catch (e) {
          console.error('Error parsing JSON from Ollama stream:', e);
        }
      }

      return processStream();
    };

    await processStream();
    
    // Calculate final token usage (Ollama doesn't provide token counts)
    const completionTokens = estimateTokens(accumulatedContent);
    const totalTokens = promptTokens + completionTokens;
    
    // Ollama is free, so cost is 0
    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: 0,
    };
  } catch (error) {
    console.error('Error calling Ollama:', error);
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