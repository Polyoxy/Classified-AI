import { SearchResult } from '@/types';

/**
 * Perform a web search using a search API
 * @param query Search query string
 * @param apiKey API key for the search service
 * @returns Promise with search results
 */
export const webSearch = async (
  query: string,
  apiKey: string
): Promise<SearchResult[]> => {
  try {
    // Using Serpapi as an example; this could be replaced with Google or Bing APIs
    const response = await fetch(`https://serpapi.com/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&engine=google`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Search API error: ${errorData}`);
    }

    const data = await response.json();
    
    // Transform the results from SerpAPI format to our application format
    const results: SearchResult[] = [];
    
    // Process organic results
    if (data.organic_results && Array.isArray(data.organic_results)) {
      data.organic_results.forEach((result: any) => {
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

    return results;
  } catch (error) {
    console.error('Error performing web search:', error);
    throw error;
  }
};

/**
 * Alternative implementation using a proxy route to avoid exposing API key in client
 */
export const webSearchProxy = async (
  query: string
): Promise<SearchResult[]> => {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Search API error: ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error performing web search via proxy:', error);
    throw error;
  }
}; 