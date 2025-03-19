import { NextRequest, NextResponse } from 'next/server';

/**
 * Search API proxy to protect API keys
 * This handles GET requests to /api/search, passing them to the search provider
 */
export async function GET(request: NextRequest) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.SEARCH_API_KEY;
    
    if (!apiKey) {
      console.error('[Search API] Missing SEARCH_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Search API key is not configured' },
        { status: 500 }
      );
    }
    
    // Extract the search query from URL parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'No search query provided' },
        { status: 400 }
      );
    }
    
    console.log(`[Search API] Searching for: ${query}`);
    
    // Using SerpAPI as an example
    const searchUrl = `https://serpapi.com/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&engine=google`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Search API] Error from search provider: ${errorText}`);
      
      return NextResponse.json(
        { error: `Search provider error: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Get search results
    const data = await response.json();
    
    // Transform the results from SerpAPI format to our application format
    const results = [];
    
    // Process organic results
    if (data.organic_results && Array.isArray(data.organic_results)) {
      // Limit to top results to ensure one search is sufficient
      const topResults = data.organic_results.slice(0, 5);
      topResults.forEach((result: any) => {
        results.push({
          title: result.title || '',
          link: result.link || '',
          snippet: result.snippet || '',
          source: 'web',
        });
      });
    }
    
    // Add knowledge graph info if available
    if (data.knowledge_graph) {
      const kg = data.knowledge_graph;
      results.push({
        title: kg.title || '',
        link: kg.website || '',
        snippet: kg.description || '',
        source: 'knowledge_graph',
      });
    }
    
    console.log(`[Search API] Found ${results.length} results`);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('[Search API] Error processing search request:', error);
    
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
} 