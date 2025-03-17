'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, Conversation, Message, TokenUsage, UserRole, AIProvider } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { auth, rtdb, dbCache } from '@/lib/firebase';
import {
  ref,
  onValue,
  set,
  push,
  update,
  remove,
  get,
  query,
  orderByChild,
  limitToLast,
  startAfter
} from 'firebase/database';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
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
  
  const welcomeMessage = `
# Welcome to Classified AI! 👋

I'm here to help you with:
- Coding assistance and debugging
- Technical explanations
- Project planning and architecture
- Learning new technologies

## Quick Tips:
- Be specific in your questions
- Provide context when sharing code
- Ask follow-up questions for clarification

How can I assist you today?`;
  
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
        content: welcomeMessage,
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
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  signOut: () => Promise<void>;
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

  // Authentication functions
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Initialize user data in Realtime Database
      const newUser = userCredential.user;
      
      // Create user profile 
      await set(ref(rtdb, `users/${newUser.uid}/profile`), {
        email: newUser.email,
        displayName: displayName || email.split('@')[0],
        createdAt: Date.now()
      });
      
      // Initialize user settings
      await set(ref(rtdb, `users/${newUser.uid}/settings`), DEFAULT_SETTINGS);
      
      return newUser;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      // Clear local cache
      dbCache.clear();
      // Reset state
      setUser(null);
      setConversations([]);
      setCurrentConversationState(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log('User is signed in:', firebaseUser.uid);
        setUser(firebaseUser);
        
        // Check if user profile exists, create if not
        const userProfileRef = ref(rtdb, `users/${firebaseUser.uid}/profile`);
        const profileSnapshot = await get(userProfileRef);
        
        if (!profileSnapshot.exists()) {
          // Create user profile if it doesn't exist
          await set(userProfileRef, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            createdAt: Date.now()
          });
        }
      } else {
        // User is signed out
        console.log('No user is signed in');
        setUser(null);
        
        // Load from localStorage for non-authenticated users
        try {
          const storedSettingsJson = localStorage.getItem('settings');
          if (storedSettingsJson) {
            setSettings(prev => ({ 
              ...prev, 
              ...JSON.parse(storedSettingsJson) 
            }));
          }
        } catch (error) {
          console.error('Error loading settings from localStorage:', error);
        }
      }
      
      // Auth state is now resolved
      setIsLoading(false);
    });
    
    // Return the unsubscribe function to clean up the observer
    return () => unsubscribe();
  }, []);

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

  // Load conversations effect - optimized for Firebase free tier
  useEffect(() => {
    const loadConversations = async () => {
      try {
        if (user) {
          console.log('Loading conversations for user:', user.uid);
          // If we have a user, try to load conversations from Firebase with pagination
          const cacheKey = `conversations_${user.uid}`;
          
          // Check cache first to reduce database reads
          const cachedConversations = dbCache.get(cacheKey);
          if (cachedConversations && cachedConversations.length > 0) {
            console.log('Using cached conversations:', cachedConversations.length);
            setConversations(cachedConversations);
            
            // Set the most recent conversation as current if available
            if (!currentConversation && cachedConversations.length > 0) {
              setCurrentConversationState(cachedConversations[0]);
            }
            return;
          }
          
          // Load conversations with pagination (limit to last 20 for free tier efficiency)
          console.log('Fetching conversations from Firebase');
          const conversationsRef = query(
            ref(rtdb, `users/${user.uid}/conversations`),
            orderByChild('updatedAt'),
            limitToLast(30) // Increased limit to get more conversations
          );
          
          // Set up a one-time listener to minimize bandwidth usage
          const snapshot = await get(conversationsRef);
          
          if (snapshot.exists()) {
            // Convert the object to an array and sort by updatedAt
            const conversationsData = snapshot.val();
            // Make sure we have valid IDs in our conversations
            const conversationsArray = Object.entries(conversationsData).map(([id, convData]) => {
              const conv = convData as Conversation;
              // Ensure ID is included in the conversation object
              if (!conv.id || conv.id !== id) {
                conv.id = id;
              }
              return conv;
            });
            
            const sortedConversations = conversationsArray.sort((a, b) => b.updatedAt - a.updatedAt);
            console.log('Loaded conversations from Firebase:', sortedConversations.length);
            
            // Update state
            setConversations(sortedConversations);
            
            // Update cache to reduce future reads
            dbCache.set(cacheKey, sortedConversations, 60000); // Cache for 1 minute
            
            // Set the most recent conversation as current if available
            if (!currentConversation && sortedConversations.length > 0) {
              setCurrentConversationState(sortedConversations[0]);
              
              // Pre-cache this conversation to avoid loading delay
              const fullConvKey = `conversation_${user.uid}_${sortedConversations[0].id}`;
              dbCache.set(fullConvKey, sortedConversations[0], 300000); // Cache for 5 minutes
            }
          } else {
            console.log('No conversations found, creating new one');
            // No conversations found, create a new one
            const newConv = createNewConversation(settings);
            setConversations([newConv]);
            setCurrentConversationState(newConv);
            
            // Save to database
            const newConvRef = ref(rtdb, `users/${user.uid}/conversations/${newConv.id}`);
            await set(newConvRef, newConv);
            
            // Update cache
            dbCache.set(cacheKey, [newConv], 60000);
          }
        } else {
          // No user, load from localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        // Fall back to localStorage
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      try {
        const storedConversationsJson = localStorage.getItem('conversations');
        
        if (storedConversationsJson) {
          const storedConversations = JSON.parse(storedConversationsJson) as Conversation[];
          
          if (Array.isArray(storedConversations) && storedConversations.length > 0) {
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
            
            // Save to localStorage
            localStorage.setItem('conversations', JSON.stringify([newConv]));
          }
        } else {
          // No stored conversations, create a new one
          const newConv = createNewConversation(settings);
          setConversations([newConv]);
          setCurrentConversationState(newConv);
          
          // Save to localStorage
          localStorage.setItem('conversations', JSON.stringify([newConv]));
        }
      } catch (localStorageError) {
        console.error('Error loading from localStorage:', localStorageError);
        // Create a fallback conversation if loading fails
        const newConv = createNewConversation(settings);
        setConversations([newConv]);
        setCurrentConversationState(newConv);
      }
    };

    if (!isLoading) {
      loadConversations();
    }
  }, [isLoading, settings, currentConversation, user]);

  // Save conversations effect - optimized for Firebase free tier
  useEffect(() => {
    const saveConversations = async () => {
      if (isLoading || conversations.length === 0) return;
      
      try {
        // Ensure we're not saving any temporary or error messages
        const cleanedConversations = conversations.map(conv => ({
          ...conv,
          messages: conv.messages.filter(msg => 
            !(msg.role === 'system' && msg.content.includes('Response generation was cancelled'))
          )
        }));
        
        if (user) {
          // Save to Firebase if user is authenticated - batch update
          try {
            // Only update conversations that have changed to reduce writes
            const updates: Record<string, any> = {};
            
            for (const conv of cleanedConversations) {
              // Check if we need to update this conversation
              const cacheKey = `conversation_${user.uid}_${conv.id}`;
              const cachedConv = dbCache.get(cacheKey);
              
              if (!cachedConv || cachedConv.updatedAt !== conv.updatedAt) {
                // Update if not in cache or has changed
                updates[`users/${user.uid}/conversations/${conv.id}`] = conv;
                
                // Update cache
                dbCache.set(cacheKey, conv, 60000); // Cache for 1 minute
              }
            }
            
            // Only send updates if there are changes to save
            if (Object.keys(updates).length > 0) {
              await update(ref(rtdb), updates);
            }
          } catch (dbError) {
            console.error('Error saving conversations to database:', dbError);
            // Fall back to localStorage if database save fails
            localStorage.setItem('conversations', JSON.stringify(cleanedConversations));
          }
        } else {
          // Save to localStorage if no user
          localStorage.setItem('conversations', JSON.stringify(cleanedConversations));
        }
        
        // Save current conversation ID if it exists
        if (currentConversation) {
          localStorage.setItem('currentConversationId', currentConversation.id);
        }
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
    };

    // Debounce saving to reduce database writes (free tier optimization)
    const timeoutId = setTimeout(() => {
      if (!isLoading) {
        saveConversations();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [conversations, currentConversation, isLoading, user]);

  // Update settings save effect
  useEffect(() => {
    const saveSettings = async () => {
      if (isLoading) return;
      
      try {
        // Save settings to localStorage for all users
        localStorage.setItem('settings', JSON.stringify(settings));
        
        // Save to user's profile if authenticated
        if (user) {
          try {
            const cacheKey = `settings_${user.uid}`;
            const cachedSettings = dbCache.get(cacheKey);
            
            // Only update if settings have changed
            if (!cachedSettings || JSON.stringify(cachedSettings) !== JSON.stringify(settings)) {
              await set(ref(rtdb, `users/${user.uid}/settings`), settings);
              
              // Update cache
              dbCache.set(cacheKey, settings, 300000); // Cache for 5 minutes
            }
          } catch (dbError) {
            console.error('Error saving settings to database:', dbError);
          }
        }
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    // Debounce settings saves
    const timeoutId = setTimeout(() => {
      if (!isLoading) {
        saveSettings();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [settings, isLoading, user]);

  // Create a new conversation
  const createConversation = () => {
    // Create an effective system prompt to reduce hallucinations
    const systemPrompt = `You are a helpful, accurate AI assistant. 
    
    - NEVER invent or hallucinate information
    - If you don't know something, say "I don't know" rather than guessing
    - Keep responses clear, concise and helpful
    - Respond directly to user questions
    - For code requests, provide working, well-commented examples`;
    
    const welcomeMessage = `
# Welcome to Classified AI! 👋

I'm here to help you with:
- Coding assistance and debugging
- Technical explanations
- Project planning and architecture
- Learning new technologies

## Quick Tips:
- Be specific in your questions
- Provide context when sharing code
- Ask follow-up questions for clarification

How can I assist you today?`;
    
    const newConversation: Conversation = {
      id: uuidv4(),
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
          content: welcomeMessage,
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
    
    // Save to database if user is authenticated
    if (user) {
      set(ref(rtdb, `users/${user.uid}/conversations/${newConversation.id}`), newConversation)
        .catch(error => console.error('Error saving to database:', error));
      
      // Update cache
      dbCache.set(`conversation_${user.uid}_${newConversation.id}`, newConversation, 60000);
      
      // Invalidate conversations list cache
      dbCache.invalidate(`conversations_${user.uid}`);
    } else {
      // Save to localStorage
      localStorage.setItem('conversations', JSON.stringify([newConversation, ...conversations]));
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
    
    // Delete from database if user is authenticated
    if (user) {
      remove(ref(rtdb, `users/${user.uid}/conversations/${id}`))
        .catch(error => console.error('Error removing from database:', error));
      
      // Remove from cache
      dbCache.invalidate(`conversation_${user.uid}_${id}`);
      
      // Invalidate conversations list cache
      dbCache.invalidate(`conversations_${user.uid}`);
    } else {
      // Update localStorage
      const storedConversationsJson = localStorage.getItem('conversations');
      if (storedConversationsJson) {
        try {
          const storedConversations = JSON.parse(storedConversationsJson) as Conversation[];
          localStorage.setItem('conversations', JSON.stringify(storedConversations.filter(conv => conv.id !== id)));
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }
      }
    }
  };

  // Save a conversation 
  const saveConversation = (conversation: Conversation) => {
    try {
      if (user) {
        // Save to database if user is authenticated
        update(ref(rtdb, `users/${user.uid}/conversations/${conversation.id}`), conversation)
          .catch(error => console.error('Error saving conversation to database:', error));
        
        // Update cache
        dbCache.set(`conversation_${user.uid}_${conversation.id}`, conversation, 60000);
      } else {
        // Otherwise save to localStorage
        const conversationsJson = localStorage.getItem('conversations');
        if (conversationsJson) {
          try {
            const conversations = JSON.parse(conversationsJson) as Conversation[];
            const updatedConversations = conversations.map(conv => 
              conv.id === conversation.id ? conversation : conv
            );
            localStorage.setItem('conversations', JSON.stringify(updatedConversations));
          } catch (error) {
            console.error('Error updating conversation in localStorage:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
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

    // Save to database or localStorage
    if (user) {
      // Update in database
      const convPath = `users/${user.uid}/conversations/${updatedConversation.id}`;
      update(ref(rtdb, convPath), updatedConversation)
        .then(() => {
          console.log('Message saved to database');
          // Update cache
          dbCache.set(`conversation_${user.uid}_${updatedConversation.id}`, updatedConversation, 60000);
          // Invalidate conversations list cache to ensure it's refreshed next time
          dbCache.invalidate(`conversations_${user.uid}`);
        })
        .catch(error => console.error('Error saving message to database:', error));
    } else {
      // Save to localStorage
      const conversationsJson = localStorage.getItem('conversations');
      if (conversationsJson) {
        try {
          const conversations = JSON.parse(conversationsJson) as Conversation[];
          const updatedConversations = conversations.map(conv => 
            conv.id === updatedConversation.id ? updatedConversation : conv
          );
          localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        } catch (error) {
          console.error('Error updating conversation in localStorage:', error);
        }
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

  // Reset all conversations and create a fresh one
  const resetConversations = async () => {
    try {
      if (user) {
        // Remove all conversations from database
        await set(ref(rtdb, `users/${user.uid}/conversations`), null);
        
        // Clear cache
        dbCache.clear();
      } else {
        // Clear from localStorage
        localStorage.removeItem('conversations');
        localStorage.removeItem('currentConversationId');
      }
      
      // Reset state
      setConversations([]);
      setCurrentConversationState(null);
      
      // Create a new conversation
      createConversation();
    } catch (error) {
      console.error('Error resetting conversations:', error);
    }
  };

  // Set current conversation
  const setCurrentConversation = async (conversation: Conversation) => {
    console.log('Setting current conversation:', conversation.id);
    
    // First update the state immediately for better UX
    setCurrentConversationState(conversation);
    
    // Save current conversation ID to localStorage for persistence
    localStorage.setItem('currentConversationId', conversation.id);
    
    // Load full conversation details from Firebase if user is logged in
    if (user) {
      try {
        // Check cache first
        const cacheKey = `conversation_${user.uid}_${conversation.id}`;
        const cachedConv = dbCache.get(cacheKey);
        
        if (cachedConv) {
          // If we already have a cached version that's recent, use it
          console.log('Using cached conversation data');
          if (JSON.stringify(cachedConv) !== JSON.stringify(conversation)) {
            setCurrentConversationState(cachedConv);
          }
        } else {
          // Not in cache, fetch from Firebase
          console.log('Fetching full conversation from Firebase');
          const convRef = ref(rtdb, `users/${user.uid}/conversations/${conversation.id}`);
          const snapshot = await get(convRef);
          
          if (snapshot.exists()) {
            const fullConversation = snapshot.val() as Conversation;
            
            // Ensure the ID is set correctly
            if (!fullConversation.id) {
              fullConversation.id = conversation.id;
            }
            
            // Set in state
            setCurrentConversationState(fullConversation);
            
            // Update in conversations list if needed
            setConversations(prev => 
              prev.map(conv => 
                conv.id === fullConversation.id ? fullConversation : conv
              )
            );
            
            // Update cache
            dbCache.set(cacheKey, fullConversation, 60000);
          } else {
            // If not in database, save this conversation data to ensure it exists
            console.log('Conversation not found in database, saving current data');
            await set(convRef, conversation);
            dbCache.set(cacheKey, conversation, 60000);
          }
        }
      } catch (error) {
        console.error('Error loading full conversation details:', error);
      }
    }
  };

  const value = {
    user,
    loading: isLoading,
    signIn,
    signUp,
    signOut,
    setUser,
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    createConversation,
    updateConversation: saveConversation,
    deleteConversation,
    settings,
    setSettings,
    updateSettings,
    isSidebarOpen,
    setIsSidebarOpen,
    isProcessing,
    setIsProcessing,
    tokenUsage,
    updateTokenUsage,
    connectionStatus,
    setConnectionStatus,
    isLoading,
    changeModel,
    resetConversations,
    addMessage
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};