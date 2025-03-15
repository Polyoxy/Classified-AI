import { NextRequest, NextResponse } from 'next/server';

// Default Ollama server URL
const OLLAMA_SERVER = 'http://localhost:11434';

/**
 * Ollama API proxy to bypass CORS restrictions
 * This handles GET requests to /api/ollama, passing them to the Ollama server
 */
export async function GET(request: NextRequest) {
  try {
    // Extract the target endpoint from query parameters
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'api/tags';
    
    console.log(`[Proxy] Forwarding GET request to Ollama: ${endpoint}`);
    
    // Forward request to Ollama server
    const response = await fetch(`${OLLAMA_SERVER}/${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`[Proxy] Ollama error on GET: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Ollama error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get response data
    const data = await response.json();
    console.log(`[Proxy] Successfully got response from Ollama: ${endpoint}`);
    
    // Return the proxied response
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('[Proxy] Error forwarding GET request to Ollama:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Ollama server' },
      { status: 500 }
    );
  }
}

/**
 * Ollama API proxy to bypass CORS restrictions
 * This handles POST requests to /api/ollama, passing them to the Ollama server
 */
export async function POST(request: NextRequest) {
  try {
    // Extract the target endpoint from query parameters
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'api/chat';
    
    console.log(`[Proxy] Forwarding POST request to Ollama: ${endpoint}`);
    
    // Clone the request and parse body
    const clonedRequest = request.clone();
    let body;
    try {
      body = await clonedRequest.json();
      console.log(`[Proxy] Request body for ${endpoint}:`, 
        body.stream ? { ...body, stream: true } : body);
    } catch (parseError) {
      console.error('[Proxy] Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Forward request to Ollama server
    console.log(`[Proxy] Attempting to connect to Ollama at ${OLLAMA_SERVER}/${endpoint}`);
    const response = await fetch(`${OLLAMA_SERVER}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Check if response is OK
    if (!response.ok) {
      console.error(`[Proxy] Ollama error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Ollama error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    console.log(`[Proxy] Got successful response from Ollama for ${endpoint}`);
    
    // For streaming responses
    if (body.stream) {
      console.log(`[Proxy] Setting up streaming response pipe for ${endpoint}`);
      
      // Create a TransformStream to process the server response
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          // Forward the chunk directly
          controller.enqueue(chunk);
        },
      });
      
      // Pipe the response body to our transform stream
      if (response.body) {
        const readable = response.body;
        const writable = transformStream.writable;
        
        // Start piping
        readable.pipeTo(writable).catch(err => {
          console.error('[Proxy] Error piping stream:', err);
        });
        
        console.log(`[Proxy] Stream pipe established for ${endpoint}`);
      } else {
        console.error('[Proxy] Response body is null, cannot pipe stream');
      }
      
      // Return the transformed stream
      return new Response(transformStream.readable, {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } else {
      // For non-streaming responses, return as JSON
      const data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
  } catch (error) {
    console.error('[Proxy] Error forwarding request to Ollama:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Ollama server', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Handler for OPTIONS requests (needed for CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 