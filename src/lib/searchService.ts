import { SearchResult } from '@/types';

/**
 * Fetch data from our unified data API
 * @param query The search query
 * @param source The data source type (web, sports, news, general)
 * @returns Promise with search results
 */
export const fetchData = async (
  query: string,
  source: 'web' | 'sports' | 'news' | 'general' = 'web'
): Promise<any> => {
  try {
    const response = await fetch(`/api/data?q=${encodeURIComponent(query)}&source=${source}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Data API error: ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${source} data:`, error);
    throw error;
  }
};

/**
 * Legacy web search function using the proxy route for backward compatibility
 */
export const webSearchProxy = async (
  query: string
): Promise<SearchResult[]> => {
  return fetchData(query, 'web') as Promise<SearchResult[]>;
};

/**
 * Fetch sports data, focused on NBA
 */
export const fetchSportsData = async (query: string): Promise<any> => {
  return fetchData(query, 'sports');
};

/**
 * Fetch news data
 */
export const fetchNewsData = async (query: string): Promise<any> => {
  return fetchData(query, 'news');
};

/**
 * Fetch general data
 */
export const fetchGeneralData = async (query: string): Promise<any> => {
  return fetchData(query, 'general');
}; 