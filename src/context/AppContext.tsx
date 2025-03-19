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
  temperature: 0.7,
  customSystemPrompts: {
    developer: 'You are a helpful AI assistant for developers.',
    casual: 'You are a friendly AI assistant.',
    'code-helper': 'You are a coding assistant that helps with programming tasks.'
  },
  providers: {
    ollama: {
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
      models: ['deepseek-r1:7b', 'deepseek-r1:14b', 'llama3.2-vision:11b', 'deepseek-r1:1.5b', 'llama3.2:1b'],
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
  showAnalysis: true,
  searchApiKey: '',
  codeFontSize: 14,
  lineHeight: 1.5,
  codeLineHeight: 1.5,
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
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle Firebase Authentication
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if we're in Electron environment
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        // First check for offline/guest user
        const offlineUserJson = localStorage.getItem('offlineUser');
        if (offlineUserJson) {
          try {
            const offlineUser = JSON.parse(offlineUserJson);
            console.log('Restoring offline/guest user session:', offlineUser.uid);
            setUser(offlineUser);
            setIsLoading(false);
          } catch (parseError) {
            console.error('Error parsing offline user data:', parseError);
            localStorage.removeItem('offlineUser'); // Remove invalid data
            setUser(null);
            setIsLoading(false);
          }
          return () => {};
        }
        
        // Set up auth state observer for both Electron and web
        console.log('Setting up Firebase auth state observer');
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            console.log('User authenticated:', user.uid, 'Anonymous:', user.isAnonymous);
            setUser(user);
            
            // Store user data in localStorage for Electron
            if (isElectron) {
              try {
                localStorage.setItem('offlineUser', JSON.stringify(user));
              } catch (storageError) {
                console.warn('Failed to store user data in localStorage:', storageError);
              }
            }
            
            setIsLoading(false);
          } else {
            console.log('No authenticated user');
            setUser(null);
            
            // Clear offline user data
            localStorage.removeItem('offlineUser');
            
            setIsLoading(false);
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Firebase auth error:', error);
        setIsLoading(false);
        return () => {};
      }
    };
    
    handleAuth();
  }, []);

  // Load settings from Firebase or electron-store on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Check if we're in Electron environment
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (user && !isElectron) {
          // Listen to Realtime Database for settings
          const rtdbSettingsRef = ref(rtdb, `users/${user.uid}/settings`);
          const rtdbUnsubscribe = onValue(rtdbSettingsRef, (snapshot) => {
            if (snapshot.exists()) {
              const rtdbSettings = snapshot.val();
              setSettings(prev => ({ ...prev, ...rtdbSettings }));
            }
          });
          
          return () => {
            rtdbUnsubscribe();
          };
        } else if (isElectron) {
          // Use electron-store in Electron environment
          const storedSettings = await window.electron.store.get('settings');
          if (storedSettings) {
            setSettings(prev => ({ ...prev, ...storedSettings }));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    if (!isLoading) {
      loadSettings();
    }
  }, [user, isLoading]);

  // Load conversations from Firebase or electron-store
  useEffect(() => {
    const loadConversations = async () => {
      try {
        // Check if we're in Electron environment
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (user && !isElectron) {
          // Load from Realtime Database
          const conversationsRef = ref(rtdb, `users/${user.uid}/conversations`);
          const conversationsQuery = query(conversationsRef, orderByChild('updatedAt'));
          
          const unsubscribe = onValue(conversationsQuery, (snapshot) => {
            const loadedConversations: Conversation[] = [];
            
            if (snapshot.exists()) {
              snapshot.forEach((childSnapshot) => {
                const conversation = childSnapshot.val() as Conversation;
                
                // Clean any welcome messages from the conversation
                cleanWelcomeMessages(conversation);
                
                loadedConversations.push(conversation);
              });
              
              // Sort by updatedAt in descending order
              loadedConversations.sort((a, b) => b.updatedAt - a.updatedAt);
              
              setConversations(loadedConversations);
              
              // Set the most recent conversation as current if available
              if (loadedConversations.length > 0 && !currentConversation) {
                setCurrentConversation(loadedConversations[0]);
              }
            } else if (loadedConversations.length === 0) {
              // Create a new conversation if none exists
              const newConv = createNewConversation(settings);
              setConversations([newConv]);
              setCurrentConversation(newConv);
              
              // Save to Realtime Database
              try {
                set(ref(rtdb, `users/${user.uid}/conversations/${newConv.id}`), newConv)
                  .catch(error => console.error('Error saving conversation to Realtime Database:', error));
              } catch (error) {
                console.error('Error preparing conversation for Realtime Database:', error);
              }
            }
          });
          
          return () => unsubscribe();
        } else if (isElectron) {
          // Use electron-store in Electron environment
          const storedConversations = await window.electron.store.get('conversations');
          if (storedConversations && Array.isArray(storedConversations)) {
            // Clean any welcome messages from all conversations
            for (const conversation of storedConversations) {
              cleanWelcomeMessages(conversation);
            }
            
            setConversations(storedConversations);
            
            // Set the most recent conversation as current if available
            if (storedConversations.length > 0) {
              const mostRecent = storedConversations.reduce((latest, conv) => 
                conv.updatedAt > latest.updatedAt ? conv : latest, storedConversations[0]);
              setCurrentConversation(mostRecent);
            } else {
              // Create a new conversation if none exists
              const newConv = createNewConversation(settings);
              setConversations([newConv]);
              setCurrentConversation(newConv);
            }
          } else {
            // Create a new conversation if none exists
            const newConv = createNewConversation(settings);
            setConversations([newConv]);
            setCurrentConversation(newConv);
          }
        } else {
          // Neither Firebase nor Electron available, create a local conversation
          const newConv = createNewConversation(settings);
          setConversations([newConv]);
          setCurrentConversation(newConv);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        // Create a fallback conversation if loading fails
        const newConv = createNewConversation(settings);
        setConversations([newConv]);
        setCurrentConversation(newConv);
      }
    };

    if (!isLoading) {
      loadConversations();
    }
  }, [user, settings, isLoading]);

  // Save settings to Firebase or electron-store when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        // Check if we're in Electron environment
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (user && !isElectron) {
          // Save to Realtime Database
          await set(ref(rtdb, `users/${user.uid}/settings`), settings);
        }
        
        if (isElectron) {
          // Save to electron-store in Electron environment
          await window.electron.store.set('settings', settings);
        }
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    if (!isLoading) {
      saveSettings();
    }
  }, [settings, user, isLoading]);

  // Save conversations to electron-store when they change (only in Electron)
  useEffect(() => {
    const saveConversations = async () => {
      try {
        // Check if we're in Electron environment
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (isElectron) {
          // Save to electron-store in Electron environment
          await window.electron.store.set('conversations', conversations);
        }
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
    };

    if (!isLoading) {
      saveConversations();
    }
  }, [conversations, isLoading]);

  // Save a conversation to Firebase or electron-store
  const saveConversation = (conversation: Conversation) => {
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electron;
    
    // Save to Firebase if authenticated and not in Electron
    if (user && !isElectron) {
      try {
        // Save to Realtime Database
        set(ref(rtdb, `users/${user.uid}/conversations/${conversation.id}`), conversation)
          .catch(error => console.error('Error saving conversation to Realtime Database:', error));
      } catch (error) {
        console.error('Error preparing conversation for Realtime Database:', error);
      }
    } else if (isElectron) {
      // Save to electron-store
      try {
        window.electron.store.set(`conversation_${conversation.id}`, JSON.stringify(conversation))
          .catch(error => console.error('Error saving to electron-store:', error));
      } catch (error) {
        console.error('Error saving to electron-store:', error);
      }
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
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      systemPrompt,
      model: settings.providers[settings.activeProvider].defaultModel,
      provider: settings.activeProvider,
    };
    
    setCurrentConversation(newConversation);
    setConversations(prev => [...prev, newConversation]);
    
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electron;
    
    // Save to Firebase if authenticated and not in Electron
    if (user && !isElectron) {
      try {
        set(ref(rtdb, `users/${user.uid}/conversations/${id}`), newConversation)
          .catch(error => console.error('Error saving conversation to Realtime Database:', error));
      } catch (error) {
        console.error('Error preparing conversation for Realtime Database:', error);
      }
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
    
    setCurrentConversation(updatedConversation);
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
    
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electron;
    
    // Delete from Firebase if authenticated and not in Electron
    if (user && !isElectron) {
      remove(ref(rtdb, `users/${user.uid}/conversations/${id}`))
        .catch(error => console.error('Error deleting conversation from Realtime Database:', error));
    }
    
    // If the deleted conversation is the current one, set the first available as current
    if (currentConversation?.id === id) {
      const remaining = conversations.filter(conv => conv.id !== id);
      if (remaining.length > 0) {
        setCurrentConversation(remaining[0]);
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

    // Create updated conversation with the new message
    const updatedConversation: Conversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: Date.now(),
    };

    // Update state immediately
    setCurrentConversation(updatedConversation);
    
    // Update conversations list
    setConversations(prev => 
      prev.map(conv => conv.id === currentConversation.id ? updatedConversation : conv)
    );
    
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electron;
    
    // Update in Firebase if authenticated and not in Electron
    if (user && !isElectron) {
      try {
        // Update in Realtime Database
        update(ref(rtdb, `users/${user.uid}/conversations/${currentConversation.id}`), updatedConversation)
          .catch(error => console.error('Error updating conversation in Realtime Database:', error));
      } catch (error) {
        console.error('Error preparing conversation update for Realtime Database:', error);
      }
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

  // Function to clean welcome messages from a conversation
  const cleanWelcomeMessages = (conversation: Conversation) => {
    if (!conversation || !conversation.messages) return;
    
    // Filter out any assistant messages containing "Welcome to Classified AI"
    conversation.messages = conversation.messages.filter(message => 
      !(message.role === 'assistant' && 
        message.content.includes('Welcome to Classified AI'))
    );
  };

  // Reset all conversations and create a fresh one
  const resetConversations = async () => {
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electron;
    
    // Delete all conversations from Firebase if authenticated and not in Electron
    if (user && !isElectron) {
      try {
        // Remove all conversations from Realtime Database
        remove(ref(rtdb, `users/${user.uid}/conversations`))
          .catch(error => console.error('Error removing conversations from Realtime Database:', error));
      } catch (error) {
        console.error('Error resetting conversations in Realtime Database:', error);
      }
    } else if (isElectron) {
      // Clear conversations in electron-store
      try {
        await window.electron.store.set('conversations', []);
      } catch (error) {
        console.error('Error clearing conversations in electron-store:', error);
      }
    }
    
    // Clear conversations state
    setConversations([]);
    setCurrentConversation(null);
    
    // Create a fresh conversation
    createConversation();
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
    isAuthenticated: !!user,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 