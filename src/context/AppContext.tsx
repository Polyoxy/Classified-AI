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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Handle Firebase Authentication
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Set up auth state observer
        console.log('Setting up Firebase auth state observer');
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            console.log('User authenticated:', user.uid, 'Anonymous:', user.isAnonymous);
            setUser(user);
            setIsLoading(false);
          } else {
            console.log('No authenticated user, signing in anonymously');
            try {
              const anonUser = await signInAnonymously(auth);
              console.log('Anonymous user signed in:', anonUser.user.uid);
              setUser(anonUser.user);
            } catch (signInError) {
              console.error('Anonymous sign in failed:', signInError);
              setUser(null);
            }
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
        // Load from Realtime Database
        const conversationsRef = ref(rtdb, `users/${user?.uid || 'anonymous'}/conversations`);
        const conversationsQuery = query(conversationsRef, orderByChild('updatedAt'));
        
        const unsubscribe = onValue(conversationsQuery, (snapshot) => {
          const loadedConversations: Conversation[] = [];
          
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const conversation = childSnapshot.val() as Conversation;
              loadedConversations.push(conversation);
            });
            
            // Sort by updatedAt in descending order
            loadedConversations.sort((a, b) => b.updatedAt - a.updatedAt);
            
            setConversations(loadedConversations);
            
            // Set the most recent conversation as current if available
            if (loadedConversations.length > 0 && !currentConversation) {
              setCurrentConversationState(loadedConversations[0]);
            }
          } else if (loadedConversations.length === 0) {
            // Create a new conversation if none exists
            const newConv = createNewConversation(settings);
            setConversations([newConv]);
            setCurrentConversationState(newConv);
            
            // Save to Realtime Database
            try {
              set(ref(rtdb, `users/${user?.uid || 'anonymous'}/conversations/${newConv.id}`), newConv)
                .catch(error => console.error('Error saving conversation to Realtime Database:', error));
            } catch (error) {
              console.error('Error preparing conversation for Realtime Database:', error);
            }
          }
        });
        
        return () => unsubscribe();
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
  }, [user, settings, isLoading, currentConversation]);

  // Save conversations when they change
  useEffect(() => {
    const saveConversations = async () => {
      try {
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
          
          // Save to Firebase
          await Promise.all(sortedConversations.map(conv => 
            set(ref(rtdb, `users/${user?.uid || 'anonymous'}/conversations/${conv.id}`), conv)
          ));

          // Save current conversation ID
          if (currentConversation) {
            await set(ref(rtdb, `users/${user?.uid || 'anonymous'}/currentConversationId`), currentConversation.id);
          }

          console.log('Successfully saved conversations to Firebase:', {
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
  }, [conversations, currentConversation, user, isLoading]);

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
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (isElectron && conversations.length > 0) {
          // Ensure we're not saving any temporary or error messages
          const cleanedConversations = conversations.map(conv => ({
            ...conv,
            messages: conv.messages.filter(msg => 
              !(msg.role === 'system' && msg.content.includes('Response generation was cancelled'))
            )
          }));

          // Sort conversations by updatedAt before saving
          const sortedConversations = [...cleanedConversations].sort((a, b) => b.updatedAt - a.updatedAt);
          
          // Save to electron-store atomically
          await Promise.all([
            window.electron.store.set('conversations', sortedConversations),
            currentConversation && window.electron.store.set('currentConversationId', currentConversation.id)
          ]);

          console.log('Successfully saved to electron-store:', {
            conversationCount: sortedConversations.length,
            currentId: currentConversation?.id
          });
        }
      } catch (error) {
        console.error('Error saving to electron-store:', error);
      }
    };

    if (!isLoading) {
      saveConversations();
    }
  }, [conversations, currentConversation, isLoading]);

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
      isStarred: false
    };
    
    // Update state immediately
    setCurrentConversationState(newConversation);
    setConversations(prev => [newConversation, ...prev]); // Add to beginning of list
    
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electron;
    
    // Save to Firebase if authenticated and not in Electron
    if (user && !isElectron) {
      try {
        // Save to Realtime Database
        set(ref(rtdb, `users/${user.uid}/conversations/${id}`), newConversation)
          .catch(error => console.error('Error saving conversation to Realtime Database:', error));
      } catch (error) {
        console.error('Error preparing conversation for Realtime Database:', error);
      }
    } else if (isElectron) {
      // Save to electron-store
      try {
        window.electron.store.set('conversations', conversations)
          .catch(error => console.error('Error saving to electron-store:', error));
      } catch (error) {
        console.error('Error saving to electron-store:', error);
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
    const newTitle = isFirstUserMessage ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : currentConversation.title;

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

    // Save to Firebase
    try {
      const userPath = `users/${user?.uid || 'anonymous'}`;
      update(ref(rtdb, `${userPath}/conversations/${currentConversation.id}`), updatedConversation)
        .catch(error => console.error('Error updating conversation in Firebase:', error));
    } catch (error) {
      console.error('Error preparing conversation update for Firebase:', error);
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
      // Remove all conversations from Firebase
      await remove(ref(rtdb, `users/${user?.uid || 'anonymous'}/conversations`));
      
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
        console.log('Already on this conversation, ignoring switch');
        return;
      }

      console.log('Setting current conversation:', {
        id: conversation.id,
        title: conversation.title,
        messageCount: conversation.messages?.length
      });

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

      try {
        // Save to Firebase
        const userPath = `users/${user?.uid || 'anonymous'}`;
        
        // Update conversation in conversations list
        await set(ref(rtdb, `${userPath}/conversations/${conversation.id}`), updatedConversation);
        
        // Update current conversation ID
        await set(ref(rtdb, `${userPath}/currentConversationId`), updatedConversation.id);
        
        // Update conversations list after successful save
        setConversations(prev => {
          const withoutCurrent = prev.filter(conv => conv.id !== conversation.id);
          return [updatedConversation, ...withoutCurrent].sort((a, b) => b.updatedAt - a.updatedAt);
        });
        
        console.log('Successfully updated Firebase and state:', {
          id: updatedConversation.id,
          messageCount: updatedConversation.messages.length
        });
      } catch (error) {
        console.error('Failed to save to Firebase:', error);
        // Revert state changes on error
        setCurrentConversationState(currentConversation);
        throw error;
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