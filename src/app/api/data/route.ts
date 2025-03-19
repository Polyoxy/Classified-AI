import { NextRequest, NextResponse } from 'next/server';

/**
 * Unified data API to handle requests for different data sources
 */
export async function GET(request: NextRequest) {
  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const source = searchParams.get('source') || 'web';
    
    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }
    
    console.log(`[Data API] Processing ${source} request for: "${query}"`);
    
    // Handle different data sources
    switch (source) {
      case 'web':
        return await handleWebSearch(query);
      case 'sports':
        return await handleSportsData(query);
      case 'news':
        return await handleNewsData(query);
      default:
        return await handleWebSearch(query);
    }
  } catch (error) {
    console.error('[Data API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

/**
 * Handle web search requests using SerpAPI
 */
async function handleWebSearch(query: string) {
  try {
    // Get the search API key from env
    const apiKey = process.env.SEARCH_API_KEY;
    
    if (!apiKey) {
      console.error('[Data API] Missing SEARCH_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Search API key is not configured' },
        { status: 500 }
      );
    }
    
    // Perform web search using SerpAPI
    const searchUrl = `https://serpapi.com/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&engine=google`;
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    // Format search results
    const results = [];
    
    // Add organic results
    if (searchData.organic_results && Array.isArray(searchData.organic_results)) {
      const topResults = searchData.organic_results.slice(0, 5); // Limit to 5 results
      topResults.forEach((result: any) => {
        results.push({
          title: result.title || 'No title',
          link: result.link || 'No link',
          snippet: result.snippet || 'No description',
          source: 'web'
        });
      });
    }
    
    // Add knowledge graph if available
    if (searchData.knowledge_graph) {
      const kg = searchData.knowledge_graph;
      results.unshift({
        title: kg.title || 'Knowledge Graph',
        link: kg.website || '',
        snippet: kg.description || 'No description',
        source: 'knowledge_graph'
      });
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('[Data API] Web search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform web search' },
      { status: 500 }
    );
  }
}

/**
 * Handle sports data requests
 * In a real app, this would connect to a sports API
 */
async function handleSportsData(query: string) {
  try {
    // In a real implementation, this would call a sports API service
    console.log(`[Data API] Would fetch sports data for: "${query}"`);
    
    // Call a real sports API here in the future
    // const sportsData = await fetchFromSportsAPI(query);
    
    // For now, return minimal placeholder data
    return NextResponse.json({
      news: [{ title: "NBA News Placeholder", summary: "This would be real NBA news from an API", source: "NBA API", url: "https://api.nba.com" }],
      scores: [{ homeTeam: "Team A", awayTeam: "Team B", homeScore: 100, awayScore: 98, status: "Final" }],
      standings: [{ team: "Team A", wins: 50, losses: 32, conference: "East", position: 1 }]
    });
  } catch (error) {
    console.error('[Data API] Sports data error:', error);
    return NextResponse.json({ error: 'Failed to fetch sports data' }, { status: 500 });
  }
}

/**
 * Handle news data requests
 * In a real app, this would connect to a news API
 */
async function handleNewsData(query: string) {
  try {
    // In a real implementation, this would call a news API service
    console.log(`[Data API] Would fetch news for: "${query}"`);
    
    // Call a real news API here in the future
    // const newsData = await fetchFromNewsAPI(query);
    
    // For now, return minimal placeholder data
    return NextResponse.json([
      { title: "News Placeholder", summary: "This would be real news from an API", source: "News API", url: "https://api.news.com" }
    ]);
  } catch (error) {
    console.error('[Data API] News data error:', error);
    return NextResponse.json({ error: 'Failed to fetch news data' }, { status: 500 });
  }
} 