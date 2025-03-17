import { NextRequest, NextResponse } from 'next/server';

// Define the viewport export to fix the themeColor warning
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

// Default Ollama server URL - try both localhost and 127.0.0.1
const OLLAMA_SERVERS = [
  'http://127.0.0.1:11434', 
  'http://localhost:11434',
  // Try different ports in case user has custom setup
  'http://127.0.0.1:8000',
  'http://localhost:8000'
];

export async function POST(request: NextRequest) {
  try {
    console.log("[API] /api/chat/ollama received request");
    
    // Parse request body
    const { messages, model, temperature, chatId } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      console.error("[API] Invalid messages array:", messages);
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Processing chat request for model: ${model || 'default'}, messages: ${messages.length}`);
    
    // Log the first user message for debugging
    const userMessage = messages.find(m => m.role === 'user');
    if (userMessage) {
      console.log(`[API] First user message: ${userMessage.content.substring(0, 50)}...`);
    }
    
    // Prepare the request for Ollama
    const ollamaRequest = {
      model: model || "llama3.2:1b" || "deepseek-r1:7b",
      messages: messages.map(msg => ({
        role: msg.role === 'system' ? 'system' : msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      options: {
        temperature: parseFloat(temperature) || 0.7,
      },
      stream: false // Ensure streaming is disabled
    };
    
    console.log(`[API] Using model: ${ollamaRequest.model}`);
    console.log(`[API] Request format:`, JSON.stringify(ollamaRequest).substring(0, 200) + '...');
    
    // Try different Ollama servers
    let response = null;
    let responseStatus = null;
    let responseText = null;
    let lastError: Error | null = null;
    let connectionAttempts: string[] = [];
    
    for (const server of OLLAMA_SERVERS) {
      try {
        console.log(`[API] Attempting to connect to ${server}/api/chat`);
        
        // Set timeout to prevent hanging requests - increase to 15 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`[API] Connection timeout for ${server}/api/chat after 15 seconds`);
          controller.abort();
        }, 15000); // Increase from 5000 to 15000 ms
        
        response = await fetch(`${server}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ollamaRequest),
          signal: controller.signal
        }).catch((e: Error) => {
          console.log(`[API] Fetch error for ${server}: ${e.message}`);
          connectionAttempts.push(`${server}: Fetch error - ${e.message}`);
          return null;
        });
        
        clearTimeout(timeoutId);
        
        if (!response) continue;
        
        responseStatus = response.status;
        console.log(`[API] Response from ${server}: ${response.status} ${response.statusText}`);
        connectionAttempts.push(`${server}: Status ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log(`[API] Successfully connected to ${server}/api/chat`);
          break;
        } else {
          // Try to read the error response
          try {
            responseText = await response.text();
            console.error(`[API] Error response from ${server}: ${responseText}`);
          } catch (e) {
            const error = e as Error;
            console.error(`[API] Could not read error response: ${error.message}`);
          }
        }
      } catch (error) {
        const err = error as Error;
        lastError = err;
        console.warn(`[API] Connection error to ${server}/api/chat:`, err.message);
        connectionAttempts.push(`${server}: ${err.message}`);
      }
    }
    
    if (!response || !response.ok) {
      console.error('[API] All Ollama connection attempts failed');
      return NextResponse.json(
        { 
          error: 'Failed to connect to Ollama server',
          details: responseText || (lastError ? lastError.message : 'Unknown error'),
          status: responseStatus,
          attempts: connectionAttempts
        },
        { status: 502 }
      );
    }
    
    // Process the Ollama response
    try {
      // First get the response as text to debug any parsing issues
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        console.error('[API] Empty response from Ollama server');
        return NextResponse.json(
          { error: 'Empty response from Ollama server' },
          { status: 500 }
        );
      }
      
      console.log('[API] Raw response text:', responseText.substring(0, 100) + '...');
      
      let data;
      try {
        // Try to parse the response text as JSON
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('[API] JSON parse error:', jsonError);
        
        // Try to fix common JSON parsing issues
        let fixedJson = responseText;
        
        // Fix timestamp format issues (e.g., truncated timestamps)
        fixedJson = fixedJson.replace(/\"created_at\":\"[^\"]*\"/, '"created_at":"2025-01-01T00:00:00Z"');
        
        // Remove any trailing commas that might be causing issues
        fixedJson = fixedJson.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
        
        // Try parsing again with fixed JSON
        try {
          data = JSON.parse(fixedJson);
          console.log('[API] Successfully parsed JSON after fixing format');
        } catch (secondError) {
          console.error('[API] Failed to fix JSON:', secondError);
          return NextResponse.json(
            { 
              error: 'Failed to parse Ollama response',
              details: (jsonError as Error).message,
              rawText: responseText.substring(0, 300) + '...' // Send partial text for debugging
            },
            { status: 500 }
          );
        }
      }
      
      console.log('[API] Successfully received JSON response from Ollama');
      
      if (!data || !data.message) {
        console.error('[API] Invalid response format:', data);
        return NextResponse.json(
          { error: 'Invalid response format from Ollama server', rawResponse: data },
          { status: 500 }
        );
      }
      
      // Ensure the message content property exists and is a string
      if (typeof data.message.content !== 'string') {
        console.error('[API] Missing or invalid content property in response message:', data.message);
        
        // Try to extract content from a different property or use empty string
        const fallbackContent = 
          (data.message && typeof data.message.content === 'object') ? JSON.stringify(data.message.content) :
          (data.response) ? data.response :
          (data.message && data.message.text) ? data.message.text :
          '';
        
        return NextResponse.json({
          content: fallbackContent || 'No readable content found in the model response.',
          role: 'assistant',
          model: model,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          }
        });
      }
      
      // Return the formatted response
      return NextResponse.json({
        content: data.message?.content || '',
        role: 'assistant',
        model: model,
        usage: {
          promptTokens: 0, // Ollama doesn't provide detailed token usage
          completionTokens: 0,
          totalTokens: 0
        }
      });
    } catch (parseError) {
      const error = parseError as Error;
      console.error('[API] Error parsing Ollama response:', error);
      return NextResponse.json(
        { 
          error: 'Failed to parse Ollama response',
          details: error.message,
          rawResponse: null
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const err = error as Error;
    console.error('[API] Error processing chat request:', err);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: err.message
      },
      { status: 500 }
    );
  }
} 