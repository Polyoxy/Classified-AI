import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { SearchResult } from '@/types';
import { webSearchProxy } from '@/lib/searchService';
import { X } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input field when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const results = await webSearchProxy(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(
        error instanceof Error 
          ? error.message 
          : 'An error occurred while searching'
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add search result to conversation
  const addSearchResult = (result: SearchResult) => {
    // You can implement this to add the search result to the conversation
    // or to trigger a new response from the AI using the search result
    console.log('Adding search result to conversation:', result);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-2xl shadow-xl border border-[#2a2a2a] max-h-[80vh] flex flex-col"
        style={{ backgroundColor: settings?.theme === 'dark' ? '#1a1a1a' : '#f5f5f5' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            id="search-modal-title"
            className="text-[1.5rem] font-medium" 
            style={{ color: settings?.theme === 'dark' ? 'white' : '#333' }}
          >
            Web Search
          </h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white transition-colors"
            aria-label="Close search modal"
          >
            <X className="w-5 h-5" style={{ color: settings?.theme === 'dark' ? '#666' : '#333' }} />
          </button>
        </div>
        
        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the web..."
              className="flex-1 p-3 rounded-md border border-[#3a3a3a] bg-[#2a2a2a] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: settings?.theme === 'dark' ? '#2a2a2a' : '#fff',
                color: settings?.theme === 'dark' ? 'white' : '#333',
                borderColor: settings?.theme === 'dark' ? '#3a3a3a' : '#ddd'
              }}
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {/* Search results */}
        <div className="flex-1 overflow-y-auto">
          {searchError && (
            <div 
              className="p-4 mb-4 rounded-md bg-red-900/30 border border-red-900/50 text-red-200"
              style={{
                backgroundColor: settings?.theme === 'dark' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(254, 226, 226, 0.8)',
                color: settings?.theme === 'dark' ? '#f87171' : '#b91c1c'
              }}
            >
              {searchError}
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div 
              className="space-y-4"
              style={{ color: settings?.theme === 'dark' ? '#ccc' : '#333' }}
            >
              {searchResults.map((result, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-md border hover:bg-[#2a2a2a]/50 cursor-pointer transition-colors"
                  style={{
                    borderColor: settings?.theme === 'dark' ? '#3a3a3a' : '#ddd',
                    backgroundColor: settings?.theme === 'dark' ? '#1a1a1a' : '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => addSearchResult(result)}
                >
                  <h3 
                    className="text-[1.1rem] font-medium mb-2" 
                    style={{ color: settings?.theme === 'dark' ? '#3b82f6' : '#2563eb' }}
                  >
                    {result.title}
                  </h3>
                  <div className="text-[0.85rem] mb-2 opacity-70">{result.link}</div>
                  <p>{result.snippet}</p>
                </div>
              ))}
            </div>
          )}
          
          {!isSearching && searchResults.length === 0 && !searchError && (
            <div 
              className="text-center p-8 opacity-60"
              style={{ color: settings?.theme === 'dark' ? '#aaa' : '#666' }}
            >
              Search the web to find information
            </div>
          )}
          
          {isSearching && (
            <div 
              className="text-center p-8"
              style={{ color: settings?.theme === 'dark' ? '#aaa' : '#666' }}
            >
              Searching...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal; 