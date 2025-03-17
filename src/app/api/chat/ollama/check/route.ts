import { NextRequest, NextResponse } from 'next/server';

// Default Ollama server URL - try both localhost and 127.0.0.1
const OLLAMA_SERVERS = [
  'http://127.0.0.1:11434', 
  'http://localhost:11434',
  'http://127.0.0.1:8000',
  'http://localhost:8000'
];

interface ServerStatus {
  available: boolean;
  server: string | null;
  error: string | null;
}

export async function GET(request: NextRequest) {
  try {
    console.log("[API] Checking Ollama server availability");
    
    // Try different Ollama servers
    let serverStatus: ServerStatus = { available: false, server: null, error: null };
    let responseDetails: Array<{
      server: string;
      status: string;
      statusCode?: number;
      message?: string;
    }> = [];
    
    for (const server of OLLAMA_SERVERS) {
      try {
        console.log(`[API] Checking ${server}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`${server}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        }).catch(e => {
          console.log(`[API] Error checking ${server}: ${e.message}`);
          responseDetails.push({ server, status: 'connection_error', message: e.message });
          return null;
        });
        
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          console.log(`[API] ${server} is available`);
          serverStatus.available = true;
          serverStatus.server = server;
          responseDetails.push({ server, status: 'ok', statusCode: response.status });
          break;
        } else if (response) {
          console.log(`[API] ${server} responded with status ${response.status}`);
          responseDetails.push({ server, status: 'error', statusCode: response.status });
        }
      } catch (error) {
        console.error(`[API] Error checking ${server}:`, error);
        responseDetails.push({ 
          server, 
          status: 'error', 
          message: error instanceof Error ? error.message : String(error) 
        });
      }
    }
    
    return NextResponse.json({
      available: serverStatus.available,
      server: serverStatus.server,
      details: responseDetails,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Error checking Ollama server:', error);
    return NextResponse.json(
      { error: 'Failed to check Ollama server', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 