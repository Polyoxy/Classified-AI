import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, Conversation, Message, TokenUsage, UserRole, AIProvider } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
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
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  userRole: 'developer',
  temperature: 0.7,
  customSystemPrompts: { ...DEFAULT_SYSTEM_PROMPTS },
  providers: {
    openai: {
      provider: 'openai',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      defaultModel: 'gpt-3.5-turbo',
    },
    ollama: {
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
      models: ['llama3', 'mistral', 'codellama'],
      defaultModel: 'llama3',
    },
    deepseek: {
      provider: 'deepseek',
      models: ['deepseek-coder', 'deepseek-chat'],
      defaultModel: 'deepseek-chat',
    },
  },
  activeProvider: 'openai',
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
  isLoading: boolean;
  changeModel: (model: string) => void;
  resetConversations: () => void;
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
        
        // If we're in Electron, we can use local storage instead of requiring Firebase auth
        if (isElectron) {
          // Skip Firebase auth in Electron environment
          setIsLoading(false);
          return () => {};
        }
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setUser(user);
            setIsLoading(false);
          } else {
            // Sign in anonymously if no user is authenticated
            signInAnonymously(auth)
              .then((result) => {
                setUser(result.user);
                setIsLoading(false);
              })
              .catch((error) => {
                console.error('Error signing in anonymously:', error);
                // Continue without Firebase auth if it fails
                setIsLoading(false);
              });
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Firebase auth error:', error);
        // Continue without Firebase if it fails
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
          // Try to load from Firebase first (only if not in Electron)
          const settingsRef = doc(db, 'users', user.uid, 'settings', 'appSettings');
          const unsubscribe = onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
              const storedSettings = doc.data() as AppSettings;
              setSettings(prev => ({ ...prev, ...storedSettings }));
            }
          });
          
          return () => unsubscribe();
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
          // Load from Firebase (only if not in Electron)
          const conversationsRef = collection(db, 'users', user.uid, 'conversations');
          const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedConversations: Conversation[] = [];
            snapshot.forEach((doc) => {
              const conversation = doc.data() as Conversation;
              
              // Clean any welcome messages from the conversation
              cleanWelcomeMessages(conversation);
              
              loadedConversations.push(conversation);
            });
            
            setConversations(loadedConversations);
            
            // Set the most recent conversation as current if available
            if (loadedConversations.length > 0 && !currentConversation) {
              setCurrentConversation(loadedConversations[0]);
            } else if (loadedConversations.length === 0) {
              // Create a new conversation if none exists
              const newConv = createNewConversation(settings);
              setConversations([newConv]);
              setCurrentConversation(newConv);
              
              // Save to Firebase
              try {
                // Convert the conversation to a plain object for Firestore
                const firestoreData = JSON.parse(JSON.stringify(newConv));
                setDoc(doc(conversationsRef, newConv.id), firestoreData)
                  .catch(error => console.error('Error saving conversation to Firebase:', error));
              } catch (error) {
                console.error('Error preparing conversation for Firebase:', error);
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
  }, [user, settings, isLoading, currentConversation]);

  // Save settings to Firebase or electron-store when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        // Check if we're in Electron environment
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (user && !isElectron) {
          // Save to Firebase (only if not in Electron)
          await setDoc(doc(db, 'users', user.uid, 'settings', 'appSettings'), settings);
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
        // Convert the conversation to a plain object for Firestore
        const firestoreData = JSON.parse(JSON.stringify(conversation));
        setDoc(doc(db, 'users', user.uid, 'conversations', conversation.id), firestoreData)
          .catch(error => console.error('Error saving conversation to Firebase:', error));
      } catch (error) {
        console.error('Error preparing conversation for Firebase:', error);
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
    const newConversation = createNewConversation(settings);
    
    // No longer adding initial welcome message
    
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    
    // Save to Firebase or electron-store
    saveConversation(newConversation);
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
      deleteDoc(doc(db, 'users', user.uid, 'conversations', id))
        .catch(error => console.error('Error deleting conversation from Firebase:', error));
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

    const newMessage: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: Date.now(),
    };

    const updatedConversation: Conversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: Date.now(),
    };

    setCurrentConversation(updatedConversation);
    setConversations(prev => 
      prev.map(conv => conv.id === currentConversation.id ? updatedConversation : conv)
    );
    
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electron;
    
    // Update in Firebase if authenticated and not in Electron
    if (user && !isElectron) {
      try {
        // Convert the conversation to a plain object for Firestore
        const firestoreData = JSON.parse(JSON.stringify(updatedConversation));
        updateDoc(doc(db, 'users', user.uid, 'conversations', currentConversation.id), firestoreData)
          .catch(error => console.error('Error updating conversation in Firebase:', error));
      } catch (error) {
        console.error('Error preparing conversation update for Firebase:', error);
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
        const conversationsRef = collection(db, 'users', user.uid, 'conversations');
        const q = query(conversationsRef);
        const snapshot = await getDocs(q);
        
        // Delete each conversation
        const deletePromises = snapshot.docs.map(doc => 
          deleteDoc(doc.ref).catch(error => 
            console.error(`Error deleting conversation ${doc.id} from Firebase:`, error)
          )
        );
        
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error resetting conversations in Firebase:', error);
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
    isLoading,
    changeModel,
    resetConversations,
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