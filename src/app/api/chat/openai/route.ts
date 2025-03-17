import { NextRequest, NextResponse } from 'next/server';

// Define the viewport export to fix the themeColor warning
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

export async function POST(request: NextRequest) {
  try {
    console.log("[API] /api/chat/openai received request");
    
    // Parse request body
    const { messages, model, temperature, chatId } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }
    
    const { apiKey, baseUrl } = messages[0]?.apiConfig || {};
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 401 }
      );
    }
    
    console.log(`[API] Processing chat request for model: ${model}, chat ID: ${chatId}`);
    
    // Prepare the request for OpenAI
    const openaiRequest = {
      model: model || "gpt-3.5-turbo",
      messages: messages.map(({ role, content }) => ({ role, content })),
      temperature: temperature || 0.7,
    };
    
    try {
      // Make request to OpenAI API
      const apiUrl = (baseUrl || 'https://api.openai.com/v1') + '/chat/completions';
      console.log(`[API] Connecting to OpenAI API at ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(openaiRequest),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return NextResponse.json(
          { 
            error: 'OpenAI API error', 
            status: response.status, 
            details: errorData
          },
          { status: response.status }
        );
      }
      
      // Process the OpenAI response
      const data = await response.json();
      
      // Return the formatted response
      return NextResponse.json({
        content: data.choices[0]?.message?.content || '',
        role: 'assistant',
        model: model,
        usage: data.usage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      });
      
    } catch (error) {
      console.error('[API] Error connecting to OpenAI:', error);
      return NextResponse.json(
        { 
          error: 'Failed to connect to OpenAI API',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 502 }
      );
    }
    
  } catch (error) {
    console.error('[API] Error processing chat request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 