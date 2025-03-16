'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, Conversation, Message, TokenUsage, UserRole, AIProvider } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { auth, rtdb } from '@/lib/firebase';
import {
  ref,
  onValue,
  set,
  push,
  update,
  remove,
  get,
  query,
  orderByChild
} from 'firebase/database';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  User 
} from 'firebase/auth';

// Default system prompts for different user roles
const DEFAULT_SYSTEM_PROMPTS: Record<UserRole, string> = {
  developer: 'You are a helpful AI assistant for developers. Provide concise, accurate code examples and technical explanations.',
  casual: 'You are a friendly AI assistant. Respond in a conversational and helpful manner.',
  'code-helper': 'You are a code assistant. Focus on providing code solutions, debugging help, and programming explanations.',
};

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  userRole: 'developer',
  temperature: 0.3,
  customSystemPrompts: {
    developer: 'You are a helpful AI assistant for developers.',
    casual: 'You are a friendly AI assistant.',
    'code-helper': 'You are a coding assistant that helps with programming tasks.'
  },
  providers: {
    ollama: {
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
      models: ['deepseek-r1:7b'],
      defaultModel: 'deepseek-r1:7b'
    },
    openai: {
      provider: 'openai',
      apiKey: '',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      defaultModel: 'gpt-3.5-turbo'
    },
    deepseek: {
      provider: 'deepseek',
      apiKey: '',
      models: ['deepseek-chat'],
      defaultModel: 'deepseek-chat'
    }
  },
  activeProvider: 'ollama',
  showLineNumbers: true,
  showTimestamps: false,
  autoScroll: true,
  codeHighlighting: true,
  showSystemMessages: false,
};

// Create a new empty conversation
const createNewConversation = (settings: AppSettings): Conversation => {
  const { activeProvider, providers, userRole, customSystemPrompts } = settings;
  const provider = providers[activeProvider];
  
  return {
    id: uuidv4(),
    title: 'New Conversation',
    messages: [
      {
        id: uuidv4(),
        role: 'system',
        content: customSystemPrompts[userRole],
        timestamp: Date.now(),
      },
      {
        id: uuidv4(),
        role: 'assistant',
        content: 'Welcome to Classified AI! How can I help you today?',
        timestamp: Date.now() + 100, // Add slight timestamp offset
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    systemPrompt: customSystemPrompts[userRole],
    model: provider.defaultModel,
    provider: activeProvider,
  };
};

interface AppContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation) => void;
  addMessage: (content: string, role: 'user' | 'assistant' | 'system') => void;
  createConversation: () => void;
  deleteConversation: (id: string) => void;
  tokenUsage: TokenUsage;
  updateTokenUsage: (usage: Partial<TokenUsage>) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'error') => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  changeModel: (model: string) => void;
  resetConversations: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversationState] = useState<Conversation | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Simplified auth/user setup for Electron only
  useEffect(() => {
    const setupElectronUser = async () => {
      try {
        // Check if we're in Electron environment
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (!isElectron) {
          console.log('Not in Electron environment, app is designed for Electron only');
          setIsLoading(false);
          return;
        }
        
        console.log('Setting up electron user session');
        
        // Create or use a pseudo-user for Electron
        const electronUser = {
          uid: 'electron-user',
          displayName: 'Electron User',
          email: 'user@electron.app',
          isAnonymous: false
        };
        
        // Set user info
        setUser(electronUser as unknown as User);
        setIsLoading(false);
      } catch (error) {
        console.error('Error setting up electron user:', error);
        setIsLoading(false);
      }
    };
    
    setupElectronUser();
  }, []);

  // Load settings from electron-store on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (!isElectron) {
          console.log('Not in Electron environment, app is designed for Electron only');
          return;
        }
        
        // Use electron-store in Electron environment
        const storedSettings = await window.electron.store.get('settings');
        if (storedSettings) {
          setSettings(prev => ({ ...prev, ...storedSettings }));
          
          // Apply theme to document body
          if (storedSettings.theme) {
            document.body.className = `theme-${storedSettings.theme}`;
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
              metaThemeColor.setAttribute(
                'content',
                storedSettings.theme === 'dark' ? '#121212' : '#f8f9fa'
              );
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    if (!isLoading) {
      loadSettings();
    }
  }, [isLoading]);

  // Apply theme when settings change
  useEffect(() => {
    if (settings.theme) {
      document.body.className = `theme-${settings.theme}`;
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          settings.theme === 'dark' ? '#121212' : '#f8f9fa'
        );
      }
    }
  }, [settings.theme]);

  // Load conversations from electron-store
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (!isElectron) {
          console.log('Not in Electron environment, app is designed for Electron only');
          return;
        }
        
        // Load from electron-store
        const storedConversations = await window.electron.store.get('conversations');
        
        if (storedConversations && Array.isArray(storedConversations) && storedConversations.length > 0) {
          // Sort by updatedAt in descending order
          const sortedConversations = [...storedConversations].sort((a, b) => b.updatedAt - a.updatedAt);
          
          setConversations(sortedConversations);
          
          // Set the most recent conversation as current if available
          if (!currentConversation) {
            setCurrentConversationState(sortedConversations[0]);
          }
        } else {
          // Create a new conversation if none exists
          const newConv = createNewConversation(settings);
          setConversations([newConv]);
          setCurrentConversationState(newConv);
          
          // Save to electron-store
          try {
            await window.electron.store.set('conversations', [newConv]);
          } catch (error) {
            console.error('Error saving conversation to electron-store:', error);
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        // Create a fallback conversation if loading fails
        const newConv = createNewConversation(settings);
        setConversations([newConv]);
        setCurrentConversationState(newConv);
      }
    };

    if (!isLoading) {
      loadConversations();
    }
  }, [settings, isLoading, currentConversation]);

  // Save conversations when they change
  useEffect(() => {
    const saveConversations = async () => {
      try {
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (!isElectron) {
          return;
        }
        
        if (conversations.length > 0) {
          // Ensure we're not saving any temporary or error messages
          const cleanedConversations = conversations.map(conv => ({
            ...conv,
            messages: conv.messages.filter(msg => 
              !(msg.role === 'system' && msg.content.includes('Response generation was cancelled'))
            )
          }));

          // Sort conversations by updatedAt before saving
          const sortedConversations = [...cleanedConversations].sort((a, b) => b.updatedAt - a.updatedAt);
          
          // Save to electron-store
          await window.electron.store.set('conversations', sortedConversations);
          
          // Save current conversation ID if it exists
          if (currentConversation) {
            await window.electron.store.set('currentConversationId', currentConversation.id);
          }
          
          console.log('Successfully saved conversations to electron-store:', {
            conversationCount: sortedConversations.length,
            currentId: currentConversation?.id
          });
        }
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
    };

    if (!isLoading) {
      saveConversations();
    }
  }, [conversations, currentConversation, isLoading]);

  // Save settings to electron-store when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (!isElectron) {
          return;
        }
        
        // Save to electron-store
        await window.electron.store.set('settings', settings);
        console.log('Settings saved to electron-store');
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    if (!isLoading) {
      saveSettings();
    }
  }, [settings, isLoading]);

  // Save a conversation to electron-store
  const saveConversation = (conversation: Conversation) => {
    try {
      const isElectron = typeof window !== 'undefined' && window.electron;
      
      if (!isElectron) {
        return;
      }
      
      // Save to electron-store
      window.electron.store.set(`conversation_${conversation.id}`, JSON.stringify(conversation))
        .catch(error => console.error('Error saving to electron-store:', error));
    } catch (error) {
      console.error('Error saving to electron-store:', error);
    }
  };

  // Create a new conversation
  const createConversation = () => {
    const id = uuidv4();
    
    // Create an effective system prompt to reduce hallucinations
    const systemPrompt = `You are a helpful, accurate AI assistant. 
    
    - NEVER invent or hallucinate information
    - If you don't know something, say "I don't know" rather than guessing
    - Keep responses clear, concise and helpful
    - Respond directly to user questions
    - For code requests, provide working, well-commented examples`;
    
    const newConversation: Conversation = {
      id,
      title: 'New Conversation',
      messages: [
        {
          id: uuidv4(),
          role: 'system',
          content: systemPrompt,
          timestamp: Date.now(),
        },
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'Welcome to Classified AI! How can I help you today?',
          timestamp: Date.now() + 100, // Add slight timestamp offset
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      systemPrompt,
      model: settings.providers[settings.activeProvider].defaultModel,
      provider: settings.activeProvider,
      isStarred: false
    };
    
    // Update state immediately for better UX
    setCurrentConversationState(newConversation);
    setConversations(prev => [newConversation, ...prev]); // Add to beginning of list
    
    // Save to electron-store
    try {
      // Update conversations with the new conversation included
      window.electron.store.set('conversations', [newConversation, ...conversations])
        .catch(error => console.error('Error saving to electron-store:', error));
    } catch (error) {
      console.error('Error saving to electron-store:', error);
    }
    
    return newConversation;
  };

  // Change the model of the current conversation
  const changeModel = (model: string) => {
    if (!currentConversation) return;
    
    const updatedConversation = {
      ...currentConversation,
      model,
      updatedAt: Date.now(),
    };
    
    setCurrentConversationState(updatedConversation);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === updatedConversation.id ? updatedConversation : conv
      )
    );
    
    // Save the updated conversation
    saveConversation(updatedConversation);
  };

  // Delete a conversation
  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    // If the deleted conversation is the current one, set the first available as current
    if (currentConversation?.id === id) {
      const remaining = conversations.filter(conv => conv.id !== id);
      if (remaining.length > 0) {
        setCurrentConversationState(remaining[0]);
      } else {
        // Create a new conversation if all are deleted
        createConversation();
      }
    }
  };

  // Add a message to the current conversation
  const addMessage = (content: string, role: 'user' | 'assistant' | 'system') => {
    if (!currentConversation) return;

    console.log(`Adding ${role} message to conversation:`, content.substring(0, 50));

    const newMessage: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: Date.now(),
    };

    // Update conversation title if this is the first user message
    const isFirstUserMessage = currentConversation.messages.filter(m => m.role === 'user').length === 0 && role === 'user';
    
    // Generate a more descriptive title from the first user message
    let newTitle = currentConversation.title;
    if (isFirstUserMessage) {
      // Generate title based on content type
      if (content.toLowerCase().startsWith('create') || content.toLowerCase().startsWith('generate') || content.toLowerCase().startsWith('make')) {
        // For creation requests
        const matches = content.match(/create|generate|make|build|develop|implement|write/i);
        if (matches && matches.index !== undefined) {
          const actionWord = matches[0];
          const restOfSentence = content.substring(matches.index + actionWord.length).trim();
          // Extract the main subject (up to first punctuation or 5 words max)
          const mainSubject = restOfSentence.split(/[,.!?]/)[0].split(' ').slice(0, 5).join(' ');
          newTitle = `${actionWord.charAt(0).toUpperCase() + actionWord.slice(1)} ${mainSubject}`;
        }
      } else if (content.toLowerCase().startsWith('how')) {
        // For "how to" questions
        const howToMatch = content.match(/how (to|do|can|would|should|could)/i);
        if (howToMatch && howToMatch.index !== undefined) {
          const restOfSentence = content.substring(howToMatch.index).trim();
          const mainQuestion = restOfSentence.split(/[,.!?]/)[0].split(' ').slice(0, 6).join(' ');
          newTitle = mainQuestion.charAt(0).toUpperCase() + mainQuestion.slice(1);
        }
      } else if (content.toLowerCase().startsWith('what') || content.toLowerCase().startsWith('why') || 
                content.toLowerCase().startsWith('when') || content.toLowerCase().startsWith('where') ||
                content.toLowerCase().startsWith('who')) {
        // For other question types
        const questionMatch = content.match(/what|why|when|where|who/i);
        if (questionMatch && questionMatch[0]) {
          const questionType = questionMatch[0];
          const restOfSentence = content.substring(questionType.length).trim();
          const mainQuestion = `${questionType} ${restOfSentence.split(/[,.!?]/)[0].split(' ').slice(0, 5).join(' ')}`;
          newTitle = mainQuestion.charAt(0).toUpperCase() + mainQuestion.slice(1);
        }
      } else {
        // For other messages, take first 6-8 words
        const words = content.split(' ');
        newTitle = words.slice(0, Math.min(6, words.length)).join(' ');
        if (newTitle.length > 40) {
          newTitle = newTitle.substring(0, 40) + '...';
        }
      }
    }

    // Create updated conversation with the new message
    const updatedConversation: Conversation = {
      ...currentConversation,
      title: newTitle,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: Date.now(),
    };

    // Update state immediately with the new message
    setCurrentConversationState(updatedConversation);
    
    // Update conversations list and maintain order by updatedAt
    setConversations(prev => {
      const withoutCurrent = prev.filter(conv => conv.id !== currentConversation.id);
      return [updatedConversation, ...withoutCurrent];
    });

    // Save to electron-store
    try {
      const isElectron = typeof window !== 'undefined' && window.electron;
      
      if (isElectron) {
        // Save the updated conversation
        window.electron.store.set(`conversation_${updatedConversation.id}`, JSON.stringify(updatedConversation))
          .catch(error => console.error('Error saving conversation to electron-store:', error));
        
        // Also update the full conversations list
        window.electron.store.set('conversations', conversations.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        )).catch(error => console.error('Error saving conversations to electron-store:', error));
      }
    } catch (error) {
      console.error('Error preparing conversation update for electron-store:', error);
    }
  };

  // Update token usage
  const updateTokenUsage = (usage: Partial<TokenUsage>) => {
    setTokenUsage(prev => ({ ...prev, ...usage }));
  };

  // Update settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Reset all conversations and create a fresh one
  const resetConversations = async () => {
    try {
      // Remove all conversations from electron-store
      await window.electron.store.set('conversations', []);
      
      // Clear conversations state
      setConversations([]);
      setCurrentConversationState(null);
      
      // Create a fresh conversation
      createConversation();
    } catch (error) {
      console.error('Error resetting conversations:', error);
    }
  };

  // Update state
  const setCurrentConversation = async (conversation: Conversation) => {
    try {
      // Prevent switching to the same conversation
      if (currentConversation?.id === conversation.id) {
        return;
      }

      // Validate conversation data
      if (!conversation.id || typeof conversation.id !== 'string') {
        throw new Error('Invalid conversation: missing or invalid id');
      }
      if (!conversation.messages || !Array.isArray(conversation.messages)) {
        throw new Error('Invalid conversation: missing or invalid messages array');
      }

      // Clean up any error or temporary messages
      const cleanedMessages = conversation.messages.filter(msg => 
        !(msg.role === 'system' && msg.content.includes('Response generation was cancelled'))
      );

      // Update the current conversation with proper timestamps
      const updatedConversation = {
        ...conversation,
        updatedAt: Date.now(),
        messages: cleanedMessages.map(msg => ({
          ...msg,
          id: msg.id || uuidv4(),
          timestamp: msg.timestamp || Date.now()
        }))
      };

      // First update state to ensure UI responsiveness
      setCurrentConversationState(updatedConversation);

      // Update conversations list
      setConversations(prev => {
        const withoutCurrent = prev.filter(conv => conv.id !== conversation.id);
        return [updatedConversation, ...withoutCurrent].sort((a, b) => b.updatedAt - a.updatedAt);
      });

      // Save to electron-store
      try {
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (isElectron) {
          // Save the updated conversation
          window.electron.store.set(`conversation_${updatedConversation.id}`, JSON.stringify(updatedConversation))
            .catch(error => console.error('Error saving conversation to electron-store:', error));
          
          // Also update the full conversations list
          window.electron.store.set('conversations', conversations.map(conv => 
            conv.id === updatedConversation.id ? updatedConversation : conv
          )).catch(error => console.error('Error saving conversations to electron-store:', error));
        }
      } catch (error) {
        console.error('Error preparing conversation update for electron-store:', error);
      }
    } catch (error: any) {
      console.error('Error setting current conversation:', error);
      throw new Error(`Failed to switch conversation: ${error.message}`);
    }
  };

  const contextValue: AppContextType = {
    settings,
    updateSettings,
    conversations,
    currentConversation,
    setCurrentConversation,
    addMessage,
    createConversation,
    deleteConversation,
    tokenUsage,
    updateTokenUsage,
    isProcessing,
    setIsProcessing,
    connectionStatus,
    setConnectionStatus,
    user,
    setUser,
    isLoading,
    changeModel,
    resetConversations,
    isSidebarOpen,
    setIsSidebarOpen,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Export the useAppContext hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};