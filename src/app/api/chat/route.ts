import { NextRequest, NextResponse } from 'next/server';
import { Message } from '@/types';

/**
 * Chat API to process messages and potentially perform web searches
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();
    
    // Extract the most recent user message
    const lastUserMessage = messages.findLast(
      (message: Message) => message.role === 'user'
    );
    
    // Check if this is a web search request
    const isSearchRequest = 
      lastUserMessage?.content?.includes('[WEB_SEARCH_REQUEST]');
    
    if (isSearchRequest) {
      // Extract the actual query from the message
      const query = lastUserMessage.content.replace('[WEB_SEARCH_REQUEST]', '').trim();
      
      // Get the search API key from env
      const apiKey = process.env.SEARCH_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Search API key is not configured' },
          { status: 500 }
        );
      }
      
      console.log(`[Chat API] Web search requested for: "${query}"`);
      
      try {
        // Perform web search using the search API
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
        
        // Format search results for AI consumption
        let searchResults = '';
        
        // Add organic results
        if (searchData.organic_results && Array.isArray(searchData.organic_results)) {
          const topResults = searchData.organic_results.slice(0, 3); // Limit to 3 results
          topResults.forEach((result: any, index: number) => {
            searchResults += `Result ${index + 1}:\n`;
            searchResults += `Title: ${result.title || 'No title'}\n`;
            searchResults += `Link: ${result.link || 'No link'}\n`;
            searchResults += `Snippet: ${result.snippet || 'No description'}\n\n`;
          });
        }
        
        // Add knowledge graph if available
        if (searchData.knowledge_graph) {
          const kg = searchData.knowledge_graph;
          searchResults += 'Knowledge Graph:\n';
          searchResults += `Title: ${kg.title || 'No title'}\n`;
          searchResults += `Description: ${kg.description || 'No description'}\n`;
          if (kg.website) searchResults += `Website: ${kg.website}\n`;
          searchResults += '\n';
        }
        
        // Updated the messages array with search results
        const updatedMessages = [...messages];
        
        // Remove the search directive from the last user message
        updatedMessages[updatedMessages.length - 1] = {
          ...lastUserMessage,
          content: query
        };
        
        // Add search results as a system message
        updatedMessages.push({
          id: `search-${Date.now()}`,
          role: 'system',
          content: `I performed a web search for "${query}" and found the following information. Please use this information to help answer the query:\n\n${searchResults}`,
          timestamp: Date.now()
        });
        
        // Now forward to the appropriate AI model endpoint
        // This is a placeholder - you would integrate with your AI model provider here
        
        return NextResponse.json({
          answer: `I searched the web for "${query}" and found relevant information. Here's what I found:\n\n${searchResults}\n\nBased on these results, I can tell you that...`,
          searchResults: searchResults
        });
      } catch (searchError) {
        console.error('[Chat API] Search error:', searchError);
        return NextResponse.json(
          { error: 'Failed to perform web search' },
          { status: 500 }
        );
      }
    }
    
    // If not a search request, process normally with your AI model
    // This is a placeholder - implement your AI provider logic here
    
    return NextResponse.json({
      answer: "This is a normal chat response without web search."
    });
  } catch (error) {
    console.error('[Chat API] Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 