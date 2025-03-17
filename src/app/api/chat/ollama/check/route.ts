import { NextRequest, NextResponse } from 'next/server';

// Default Ollama server URL - try both localhost and 127.0.0.1
const OLLAMA_SERVERS = [
  'http://127.0.0.1:11434', 
  'http://localhost:11434',
  // Try different ports in case user has custom setup
  'http://127.0.0.1:8000',
  'http://localhost:8000'
];

export async function GET(request: NextRequest) {
  console.log("[API] Checking if Ollama is running");
  
  let connectionAttempts: string[] = [];
  let successfulServer = null;
  
  for (const server of OLLAMA_SERVERS) {
    try {
      console.log(`[API] Checking Ollama server: ${server}/api/tags`);
      
      // Use a short timeout for the check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[API] Connection timeout for ${server}/api/tags after 5 seconds`);
        controller.abort();
      }, 5000);
      
      const response = await fetch(`${server}/api/tags`, {
        method: 'GET',
        headers: { 
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        // Avoid browser caching issues
        cache: 'no-store'
      }).catch((e: Error) => {
        console.log(`[API] Fetch error for ${server}: ${e.message}`);
        connectionAttempts.push(`${server}: Fetch error - ${e.message}`);
        return null;
      });
      
      clearTimeout(timeoutId);
      
      if (!response) continue;
      
      if (response.ok) {
        console.log(`[API] Successfully connected to ${server}/api/tags`);
        const data = await response.json();
        successfulServer = server;
        
        // Return success with available models
        return NextResponse.json({
          status: 'ok',
          server: server,
          models: data.models || [],
        });
      } else {
        console.log(`[API] Failed to connect to ${server}: ${response.status} ${response.statusText}`);
        connectionAttempts.push(`${server}: Status ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      const err = error as Error;
      console.warn(`[API] Error checking Ollama server at ${server}:`, err.message);
      connectionAttempts.push(`${server}: ${err.message}`);
    }
  }
  
  // If we reach here, all connection attempts failed
  console.error('[API] Failed to connect to any Ollama server');
  return NextResponse.json({
    status: 'error',
    message: 'Ollama is not running or not accessible',
    attempts: connectionAttempts,
  }, { status: 503 });
} 