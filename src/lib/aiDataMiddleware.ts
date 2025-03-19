import { Message, MessageRole } from '@/types';
import { webSearchProxy, fetchSportsData, fetchNewsData, fetchGeneralData } from './searchService';

interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  [key: string]: any;
}

/**
 * Middleware that intercepts AI requests, detects if they need data from external sources,
 * fetches that data, and enriches the context before sending to the AI model
 */
export const processRequestWithData = async (
  messages: Message[],
  model: string,
  options: AIRequestOptions
): Promise<{
  messages: Message[];
  enhancedWithData: boolean;
  dataSource?: string;
}> => {
  // Get the last user message
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage) {
    return { messages, enhancedWithData: false };
  }

  // Check if the message contains any data request markers
  const isWebSearchRequest = lastUserMessage.content.includes('[WEB_SEARCH_REQUEST]');
  const isSportsDataRequest = lastUserMessage.content.includes('[SPORTS_DATA_REQUEST]');
  const isNewsDataRequest = lastUserMessage.content.includes('[NEWS_DATA_REQUEST]');
  const isGeneralDataRequest = lastUserMessage.content.includes('[DATA_REQUEST]');
  
  // If no data request markers, proceed with unmodified messages
  if (!isWebSearchRequest && !isSportsDataRequest && !isNewsDataRequest && !isGeneralDataRequest) {
    return { messages, enhancedWithData: false };
  }

  try {
    let query = '';
    let contextMessage = '';
    let dataSource = '';
    
    // Extract the actual query by removing the marker
    if (isWebSearchRequest) {
      query = lastUserMessage.content.replace('[WEB_SEARCH_REQUEST]', '').trim();
      dataSource = 'web';
      
      // Fetch web search results
      const searchResults = await webSearchProxy(query);
      
      // Format the results as context for the AI
      contextMessage = formatWebSearchResults(query, searchResults);
    } 
    else if (isSportsDataRequest) {
      query = lastUserMessage.content.replace('[SPORTS_DATA_REQUEST]', '').trim();
      dataSource = 'sports';
      
      // Fetch sports data
      const sportData = await fetchSportsData(query);
      
      // Format the results as context for the AI
      contextMessage = formatSportsResults(query, sportData);
    }
    else if (isNewsDataRequest) {
      query = lastUserMessage.content.replace('[NEWS_DATA_REQUEST]', '').trim();
      dataSource = 'news';
      
      // Fetch news data
      const newsData = await fetchNewsData(query);
      
      // Format the results as context for the AI
      contextMessage = formatNewsResults(query, newsData);
    }
    else if (isGeneralDataRequest) {
      query = lastUserMessage.content.replace('[DATA_REQUEST]', '').trim();
      dataSource = 'general';
      
      // Fetch general data
      const generalData = await fetchGeneralData(query);
      
      // Format as general data results
      contextMessage = formatGeneralDataResults(query, generalData);
    }
    
    // Create modified messages with:
    // 1. The last user message with the marker removed
    // 2. A system message containing the fetched data
    const modifiedMessages = [...messages];
    
    // Replace the last user message with the clean query
    const userMessageIndex = modifiedMessages.findIndex(m => 
      m.role === 'user' && m.id === lastUserMessage.id
    );
    
    if (userMessageIndex !== -1) {
      modifiedMessages[userMessageIndex] = {
        ...lastUserMessage,
        content: query
      };
    }
    
    // Add the context message as a system message
    modifiedMessages.push({
      id: `data-${Date.now()}`,
      role: 'system' as MessageRole,
      content: contextMessage,
      timestamp: Date.now()
    });
    
    return { 
      messages: modifiedMessages, 
      enhancedWithData: true,
      dataSource
    };
  } catch (error) {
    console.error('Error enhancing request with data:', error);
    
    // Add an error message for the AI to understand what went wrong
    const errorMessage = {
      id: `error-${Date.now()}`,
      role: 'system' as MessageRole,
      content: `I attempted to fetch external data for you but encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please proceed with your existing knowledge.`,
      timestamp: Date.now()
    };
    
    messages.push(errorMessage);
    return { messages, enhancedWithData: false };
  }
};

// Helper function to format web search results
const formatWebSearchResults = (query: string, results: any[]) => {
  let formattedResults = `IMPORTANT: I have just performed a real-time web search for "${query}" and found the following current information. You DO have access to this up-to-date information:\n\n`;
  
  results.forEach((result, index) => {
    formattedResults += `## ${index + 1}. ${result.title}\n`;
    formattedResults += `${result.snippet}\n`;
    formattedResults += `Source: [${result.link}](${result.link})\n\n`;
  });
  
  formattedResults += `\nYou MUST use this up-to-date information to answer the user's question. NEVER say you don't have real-time capabilities or can't perform web searches. This data was just retrieved from the internet specifically for this query. Answer as if you directly have access to current information.`;
  
  return formattedResults;
};

// Helper function to format sports results
const formatSportsResults = (query: string, sportData: any) => {
  let formattedResults = `IMPORTANT: I have just retrieved real-time NBA data from official sports sources. You DO have access to this current information:\n\n`;
  
  // Add news section
  formattedResults += `## Latest NBA News\n\n`;
  sportData.news.forEach((item: any) => {
    formattedResults += `📌 **${item.title}**\n`;
    formattedResults += `📰 ${item.summary}\n`;
    formattedResults += `🔗 **Source**: [${item.source}](${item.url})\n\n`;
  });
  
  // Add scores section
  formattedResults += `## 📊 Latest NBA Scores\n\n`;
  sportData.scores.forEach((game: any) => {
    formattedResults += `🏀 **${game.awayTeam}** vs. **${game.homeTeam}** → ${game.awayScore}-${game.homeScore} (${game.status})\n`;
  });
  
  // Add standings if available
  if (sportData.standings && sportData.standings.length > 0) {
    formattedResults += `\n## 📋 Current Standings (Eastern Conference)\n\n`;
    sportData.standings.forEach((team: any, index: number) => {
      formattedResults += `${index+1}. **${team.team}**: ${team.wins}-${team.losses}\n`;
    });
  }
  
  // Add sources section
  formattedResults += `\n## For more details, visit:\n\n`;
  formattedResults += `- NBA Official Website: [nba.com](https://www.nba.com)\n`;
  formattedResults += `- ESPN NBA: [espn.com/nba](https://www.espn.com/nba)\n`;
  formattedResults += `- Yahoo Sports: [sports.yahoo.com/nba](https://sports.yahoo.com/nba)\n\n`;
  
  formattedResults += `\nYou MUST use this current data in your response. NEVER say you don't have real-time capabilities or can't access current sports data. Answer as if you directly have access to live sports information. Use appropriate headings and emoji formatting. End with "Let me know if you need more specific stats! 🚀"`;
  
  return formattedResults;
};

// Helper function to format news results
const formatNewsResults = (query: string, newsData: any[]) => {
  let formattedResults = `IMPORTANT: I have just retrieved current news about "${query}" from news sources. You DO have access to this up-to-date news:\n\n`;
  
  newsData.forEach((item, index) => {
    formattedResults += `## ${index + 1}. ${item.title}\n`;
    formattedResults += `📰 ${item.summary}\n`;
    formattedResults += `🔗 **Source**: [${item.source}](${item.url})\n\n`;
  });
  
  formattedResults += `\nYou MUST use this current news in your response. NEVER say you don't have real-time capabilities or can't access current news. Provide a concise summary of this current information with proper attribution to sources.`;
  
  return formattedResults;
};

// Helper function to format general data results
const formatGeneralDataResults = (query: string, results: any[]) => {
  let formattedResults = `IMPORTANT: I have just retrieved current information about "${query}" from reliable sources. You DO have access to this up-to-date information:\n\n`;
  
  results.forEach((result, index) => {
    formattedResults += `## ${index + 1}. ${result.title}\n`;
    formattedResults += `${result.snippet}\n`;
    formattedResults += `Source: [${result.link}](${result.link})\n\n`;
  });
  
  formattedResults += `\nYou MUST use this current information in your response. NEVER say you don't have real-time capabilities or can't access up-to-date information. Provide a comprehensive answer incorporating this data naturally without mentioning these are search results.`;
  
  return formattedResults;
}; 