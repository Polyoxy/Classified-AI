import { NextRequest, NextResponse } from 'next/server';

// Define the viewport export to fix the themeColor warning
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

// Default Ollama server URL - prioritize 127.0.0.1 for local connections
const OLLAMA_SERVERS = [
  'http://127.0.0.1:11434', 
  'http://localhost:11434'
];

// Helper function to safely parse JSON chunks
const safeJSONParse = (text: string) => {
  try {
    // Clean up the text by removing any trailing commas or incomplete objects
    const cleanText = text
      .replace(/,\s*$/, '')  // Remove trailing commas
      .replace(/}\s*{/g, '},{')  // Fix adjacent objects
      .trim();
      
    // Try to parse as a single object first
    try {
      return JSON.parse(cleanText);
    } catch {
      // If that fails, try to parse as an array of objects
      return JSON.parse(`[${cleanText}]`)[0];
    }
  } catch (error) {
    console.error('[API] JSON parse error:', error);
    return null;
  }
};

// Helper function to process streaming response
const processStreamingResponse = (responseText: string) => {
  try {
    // Split the response into individual JSON objects
    const jsonObjects = responseText
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error('[API] Error parsing JSON line:', line);
          return null;
        }
      })
      .filter(obj => obj !== null);

    // Extract content from each message
    const content = jsonObjects
      .map(obj => obj.message?.content || '')
      .join('')
      .trim();

    return content;
  } catch (error) {
    console.error('[API] Error processing streaming response:', error);
    return null;
  }
};

// Update the POST handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model = 'deepseek-r1:7b', temperature = 0.7 } = body;

    console.log('[API] Processing chat request for model:', model, 'messages:', messages.length);
    
    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Invalid messages format' }), { status: 400 });
    }

    // Try each Ollama server in sequence
    for (const server of OLLAMA_SERVERS) {
      try {
        console.log('[API] Attempting to connect to', server);
        
        const response = await fetch(`${server}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages,
            options: {
              temperature,
              num_predict: 1000,
            }
          })
        });

        if (!response.ok) {
          console.error('[API] Error response from', server + ':', response.status, response.statusText);
          continue;
        }

        // Get the response text
        const responseText = await response.text();
        console.log('[API] Raw response:', responseText);

        // Process the streaming response
        const content = processStreamingResponse(responseText);
        if (!content) {
          throw new Error('Failed to process response content');
        }

        // Return the processed response
        return new NextResponse(JSON.stringify({ content }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('[API] Error with', server + ':', error);
        continue;
      }
    }

    // If we get here, all servers failed
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to get a valid response from any Ollama server' 
    }), { status: 503 });

  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'An unexpected error occurred while processing the request' 
    }), { status: 500 });
  }
} 