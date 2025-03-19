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
        console.error('[Search API] Missing SEARCH_API_KEY environment variable');
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
        
        // Format search results for AI consumption in a cleaner way
        let searchResultsRaw: Array<{title: string, link: string, snippet: string}> = [];
        
        // Add organic results
        if (searchData.organic_results && Array.isArray(searchData.organic_results)) {
          const topResults = searchData.organic_results.slice(0, 5); // Get top 5 results
          searchResultsRaw = topResults.map((result: any) => ({
            title: result.title || 'No title',
            link: result.link || 'No link',
            snippet: result.snippet || 'No description'
          }));
        }
        
        // Add knowledge graph if available
        if (searchData.knowledge_graph) {
          const kg = searchData.knowledge_graph;
          searchResultsRaw.unshift({
            title: kg.title || 'Knowledge Graph',
            link: kg.website || '',
            snippet: kg.description || 'No description'
          });
        }
        
        // Format results in a structured way with markdown
        const searchResultsFormatted = searchResultsRaw.map((result, index) => 
          `## ${index + 1}. ${result.title}\n` +
          `${result.snippet}\n` +
          `**Source**: [${result.link}](${result.link})\n`
        ).join('\n\n');
        
        // Updated the messages array with search results
        const updatedMessages = [...messages];
        
        // Remove the search directive from the last user message
        updatedMessages[updatedMessages.length - 1] = {
          ...lastUserMessage,
          content: query
        };
        
        // Add search results as a system message with improved formatting instructions
        updatedMessages.push({
          id: `search-${Date.now()}`,
          role: 'system',
          content: `I found the following information from the web about "${query}". Please use this information to provide a helpful, clear, and concise answer:\n\n${searchResultsFormatted}\n\nWhen responding:\n1. Start with a direct answer to the query\n2. Organize information in a clear structure with headings\n3. Include relevant source links in your response\n4. Focus only on information relevant to the query`,
          timestamp: Date.now()
        });
        
        // Now forward to the appropriate AI model endpoint with updated messages
        return NextResponse.json({
          messages: updatedMessages
        });
      } catch (error) {
        console.error('[Search API] Error:', error);
        return NextResponse.json(
          { error: 'Failed to search the web' },
          { status: 500 }
        );
      }
    }
    
    // Handle normal (non-search) chat request
    // Forward to your AI model service
    return NextResponse.json({ messages });
    
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 