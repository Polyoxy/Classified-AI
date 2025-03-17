'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, TokenUsage, UserRole, AIProvider, MessageRole } from '@/types';
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

// Update the AppSettings interface in the types import
interface AppSettings {
  theme: 'light' | 'dark';
  activeProvider: 'ollama' | 'openai' | 'anthropic';
  providers: {
    [key: string]: {
      apiKey?: string;
      organization?: string;
      baseUrl?: string;
      defaultModel: string;
      models: string[];
    }
  };
  fontSize: string;
  showSystemMessages: boolean;
  temperature: number;
  systemMessage: string;
  userRole?: UserRole;
  customSystemPrompts?: Record<UserRole, string>;
}

// Update Conversation interface
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  provider: string;
  isStarred: boolean;
  temperature: number;
  systemPrompt?: string; // Keep for backward compatibility
}

// Define default settings with all required properties
const defaultSettings: AppSettings = {
  theme: 'dark',
  activeProvider: 'ollama',
  providers: {
    ollama: {
      baseUrl: 'http://localhost:11434',
      defaultModel: 'deepseek-r1:7b',
      models: ['deepseek-r1:7b']
    }
  },
  fontSize: 'medium',
  showSystemMessages: false,
  temperature: 0.7,
  userRole: 'developer',
  customSystemPrompts: {
    developer: 'You are a helpful AI assistant for developers.',
    casual: 'You are a friendly AI assistant.',
    'code-helper': 'You are a coding assistant that helps with programming tasks.'
  },
  systemMessage: `You are a helpful, accurate AI assistant. 
    
- NEVER invent or hallucinate information
- If you don't know something, say "I don't know" rather than guessing
- Keep responses clear, concise and helpful
- Respond directly to user questions
- For code requests, provide working, well-commented examples`
};

// Create a new empty conversation
const createNewConversation = (settings: AppSettings): Conversation => {
  const { activeProvider, providers, userRole, customSystemPrompts } = settings;
  const provider = providers[activeProvider];
  
  // Use default message if customSystemPrompts is undefined or the role key doesn't exist
  const systemPromptContent = userRole && customSystemPrompts && typeof customSystemPrompts === 'object' 
    ? (customSystemPrompts[userRole] || 'You are a helpful AI assistant.')
    : 'You are a helpful AI assistant.';
  
  return {
    id: uuidv4(),
    title: 'New Conversation',
    messages: [
      {
        id: uuidv4(),
        role: 'system' as MessageRole,
        content: systemPromptContent,
        timestamp: Date.now(),
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    systemPrompt: systemPromptContent,
    model: provider.defaultModel,
    provider: activeProvider,
    isStarred: false,
    temperature: settings.temperature
  };
};

interface AppContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation) => void;
  addMessage: (content: string | null, role: 'user' | 'assistant' | 'system') => void;
  createConversation: () => Conversation;
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
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
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
      await set(ref(rtdb, `users/${newUser.uid}/settings`), settings);
      
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

  // Helper function to check if user is guest/offline
  const isGuestOrOfflineUser = (userId: string): boolean => {
    // A user is a guest or offline user if:
    // 1. userId is empty or null
    // 2. userId starts with 'offline-'
    // 3. userId is 'guest-user' or 'electron-user'
    // 4. user.isAnonymous is true (added in the logic below)
    
    return !userId || 
      userId === '' ||
      userId.startsWith('offline-') || 
      userId === 'guest-user' || 
      userId === 'electron-user';
  };
  
  // Updated version of the check that includes all properties
  const isUserAuthenticated = (user: User | null): boolean => {
    if (!user) {
      console.log('User is null - not authenticated');
      return false;
    }
    
    // Log detailed user info for debugging
    console.log('Checking user authentication:', {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      isGuest: user.uid === 'guest-user',
      isElectron: user.uid === 'electron-user',
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    // A user is authenticated if:
    // 1. They have a valid uid
    // 2. They are not anonymous
    // 3. They don't have a special guest/offline uid
    
    const isAuth = (
      !!user.uid && 
      !user.isAnonymous && 
      user.uid !== 'guest-user' && 
      user.uid !== 'electron-user' && 
      !user.uid.startsWith('offline-')
    );
    
    console.log('User authentication result:', isAuth);
    return isAuth;
  };

  // Load conversations from Firebase
  const loadFromFirebase = async () => {
    if (!user || !isUserAuthenticated(user)) {
      console.log('Cannot load from Firebase - user is not authenticated');
      return;
    }
    
    // Log user details for debugging
    console.log('Loading conversations from Firebase for user:', user.uid, 'isAnonymous:', user.isAnonymous);
    
    try {
      // Clear any old cache entries
      dbCache.clear();
      
      // Get conversations reference
      const conversationsRef = ref(rtdb, `users/${user.uid}/conversations`);
      const conversationsSnapshot = await get(conversationsRef);
      
      if (conversationsSnapshot.exists()) {
        const conversationsData = conversationsSnapshot.val();
        const conversationsArray: Conversation[] = Object.values(conversationsData);
        
        // Sort by updatedAt
        conversationsArray.sort((a, b) => b.updatedAt - a.updatedAt);
        
        // Update state
        setConversations(conversationsArray);
        
        // Load the last active conversation if none is currently selected
        if (!currentConversation || conversationsArray.length > 0) {
          const savedConversationId = localStorage.getItem('currentConversationId');
          
          // Find saved conversation or use most recent
          const conversationToLoad = savedConversationId 
            ? conversationsArray.find(c => c.id === savedConversationId) 
            : conversationsArray[0];
            
          if (conversationToLoad) {
            setCurrentConversationState(conversationToLoad);
          }
        }
      } else {
        // No conversations yet - create a new one
        console.log('No conversations found in Firebase, creating new conversation');
        createConversation();
      }
    } catch (error) {
      console.error('Error loading conversations from Firebase:', error);
      // Fall back to localStorage
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const storedConversationsJson = localStorage.getItem('conversations');
      const currentConvId = localStorage.getItem('currentConversationId');
      
      if (storedConversationsJson) {
        const storedConversations = JSON.parse(storedConversationsJson) as Conversation[];
        
        if (Array.isArray(storedConversations) && storedConversations.length > 0) {
          // Sort by updatedAt in descending order
          const sortedConversations = [...storedConversations].sort((a, b) => b.updatedAt - a.updatedAt);
          
          // Update conversations state
          setConversations(sortedConversations);
          
          // Try to set the previously selected conversation as current if it exists
          if (currentConvId) {
            const selectedConv = sortedConversations.find(c => c.id === currentConvId);
            if (selectedConv) {
              setCurrentConversationState(selectedConv);
              return;
            }
          }
          
          // If no current conversation ID or it wasn't found, use the most recent
          if (sortedConversations[0]) {
            setCurrentConversationState(sortedConversations[0]);
          } else {
            // Should not happen, but create a new conversation as a fallback
            console.log('No valid conversation found in sorted list, creating new one');
            setTimeout(() => createConversation(), 100);
          }
        } else {
          // Create a new conversation if stored conversations are invalid
          console.log('Invalid stored conversations, creating new conversation');
          setTimeout(() => createConversation(), 100);
        }
      } else {
        // No stored conversations, create a new conversation
        console.log('No stored conversations, creating new conversation');
        setTimeout(() => createConversation(), 100);
      }
    } catch (localStorageError) {
      console.error('Error loading from localStorage:', localStorageError);
      // Create a fallback conversation
      setTimeout(() => createConversation(), 100);
    }
  };

  // Save conversations to database
  const saveConversations = async () => {
    if (conversations.length === 0) return;
    
    try {
      // Clean up conversations before saving
      // Remove any temporary messages or error states
      const cleanedConversations = conversations.map(conv => ({
        ...conv,
        messages: conv.messages.filter(msg => 
          !(msg.role === 'system' && msg.content.includes('Response generation was cancelled'))
        )
      }));
      
      // Always save to localStorage first as a backup
      localStorage.setItem('conversations', JSON.stringify(cleanedConversations));
      if (currentConversation) {
        localStorage.setItem('currentConversationId', currentConversation.id);
      }
      
      if (user) {
        // For guest users, we're done - we've already saved to localStorage
        if (!isUserAuthenticated(user)) {
          console.log('Guest user detected, saving to localStorage instead of Firebase');
          return;
        }
        
        // For regular users, also save to Firebase
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
          
          // Only update if we have changes
          if (Object.keys(updates).length > 0) {
            await update(ref(rtdb), updates);
          }
        } catch (dbError) {
          console.error('Error saving conversations to database:', dbError);
        }
      }
    } catch (error) {
      console.error('Error preparing conversations for save:', error);
    }
  };
  
  // Save conversations effect - optimized for Firebase free tier
  useEffect(() => {
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
          // Skip Firebase for guest users to avoid permission errors
          if (isGuestOrOfflineUser(user.uid)) {
            return; // Already saved to localStorage above
          }
          
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
  const createConversation = (): Conversation => {
    // Create a new conversation
    const newConversation = createNewConversation(settings);
    
    // Update state immediately
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationState(newConversation);
    
    // Always save to localStorage for redundancy
    saveToLocalStorage(newConversation);
    localStorage.setItem('currentConversationId', newConversation.id);

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
    
    // Always update localStorage for redundancy
    const storedConversationsJson = localStorage.getItem('conversations');
    if (storedConversationsJson) {
      try {
        const storedConversations = JSON.parse(storedConversationsJson) as Conversation[];
        localStorage.setItem('conversations', JSON.stringify(storedConversations.filter(conv => conv.id !== id)));
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }
    }
  };

  // Save a conversation 
  const saveConversation = (conversation: Conversation) => {
    try {
      // Always save to localStorage for redundancy
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
          // Try to save just this conversation
          localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation));
        }
      } else {
        localStorage.setItem('conversations', JSON.stringify([conversation]));
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  // Add a message to the current conversation
  const addMessage = (content: string | null, role: MessageRole) => {
    // Ensure content is a string and handle null/undefined
    const safeContent = typeof content === 'string' ? content : JSON.stringify(content);
    
    console.log(`Adding ${role} message:`, 
      safeContent ? (safeContent.length > 50 ? safeContent.substring(0, 50) + '...' : safeContent) : '(empty message)'
    );
    
    if (!currentConversation) {
      console.log('No current conversation, creating new one');
      // Create a new conversation if none exists
      const newConv = createConversation();
      
      // Add the message to this new conversation immediately so it doesn't get lost
      const newMessage: Message = {
        id: uuidv4(),
        role,
        content: safeContent || '',
        timestamp: Date.now(),
      };
      
      newConv.messages.push(newMessage);
      newConv.updatedAt = Date.now();
      
      // Update state
      setCurrentConversationState(newConv);
      setConversations([newConv]);
      
      // Save immediately
      localStorage.setItem('conversations', JSON.stringify([newConv]));
      localStorage.setItem('currentConversationId', newConv.id);
      
      return;
    }
    
    // Create a new message object
    const newMessage: Message = {
      id: uuidv4(),
      role,
      content: safeContent || '',
      timestamp: Date.now(),
    };
    
    // Create a new conversation with the message added
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: Date.now(),
    };
    
    // Update current conversation
    setCurrentConversationState(updatedConversation);
    
    // Update the conversations array
    const updatedConversations = conversations.map(c => 
      c.id === updatedConversation.id ? updatedConversation : c
    );
    
    setConversations(updatedConversations);
    
    // Always save to localStorage immediately to prevent message loss
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    localStorage.setItem('currentConversationId', updatedConversation.id);
    
    // For Firebase users, we'll save in a separate batched update via the saveConversations function
    // which is triggered by the useEffect that watches conversations
  };
  
  // Helper function to save a conversation to localStorage
  const saveToLocalStorage = (conversation: Conversation) => {
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
        // Try to save just this conversation
        localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation));
      }
    } else {
      localStorage.setItem('conversations', JSON.stringify([conversation]));
    }
  };

  // Update token usage
  const updateTokenUsage = (usage: Partial<TokenUsage>) => {
    setTokenUsage(prev => ({ ...prev, ...usage }));
  };

  // Update settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      // Deep merge the customSystemPrompts to avoid overriding all prompts
      // when only one prompt is updated
      const customSystemPrompts = newSettings.customSystemPrompts 
        ? { ...prev.customSystemPrompts, ...newSettings.customSystemPrompts }
        : prev.customSystemPrompts;
        
      // Deep merge the providers to avoid replacing the entire providers object
      const providers = newSettings.providers
        ? {
            ...prev.providers,
            ...Object.entries(newSettings.providers).reduce((merged, [key, value]) => ({
              ...merged,
              [key]: { ...prev.providers[key], ...value }
            }), {})
          }
        : prev.providers;
      
      return { 
        ...prev, 
        ...newSettings,
        customSystemPrompts,
        providers
      };
    });
  };

  // Reset all conversations and create a fresh one
  const resetConversations = async () => {
    try {
      // Reset state first for immediate UI response
      setConversations([]);
      setCurrentConversationState(null);
      
      // Always clear from localStorage
      localStorage.removeItem('conversations');
      localStorage.removeItem('currentConversationId');
      
      // If regular authenticated user, also clear Firebase
      if (user && user.uid && !isGuestOrOfflineUser(user.uid)) {
        try {
          // Remove all conversations from database
          await set(ref(rtdb, `users/${user.uid}/conversations`), null);
          
          // Clear cache
          dbCache.clear();
        } catch (error) {
          console.error('Error resetting conversations in Firebase:', error);
        }
      } else {
        console.log('Using localStorage only (no Firebase reset operations)');
      }
      
      // Create a new conversation
      createConversation();
    } catch (error) {
      console.error('Error resetting conversations:', error);
      // Attempt to create a new conversation even if there was an error
      createConversation();
    }
  };

  // Set current conversation
  const setCurrentConversation = async (conversation: Conversation) => {
    // Always set the conversation immediately to avoid UI lag
    setCurrentConversationState(conversation);
    
    // Check if we can use Firebase for this user
    if (user && isUserAuthenticated(user)) {
      try {
        // Create a cache key for this conversation
        const cacheKey = `conversation_${user.uid}_${conversation.id}`;
        
        // Try to get from cache first to avoid unnecessary database reads
        const cachedConv = dbCache.get(cacheKey);
        if (cachedConv) {
          console.log('Using cached conversation:', conversation.id);
          setCurrentConversationState(cachedConv);
          return;
        }
        
        // If not in cache, load from Firebase
        console.log('Loading conversation from Firebase:', conversation.id);
        const convRef = ref(rtdb, `users/${user.uid}/conversations/${conversation.id}`);
        const snapshot = await get(convRef);
        
        if (snapshot.exists()) {
          // Found in database
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
          set(convRef, conversation).catch(error => {
            console.error('Error saving conversation to database:', error);
          });
          dbCache.set(cacheKey, conversation, 60000);
        }
      } catch (error) {
        console.error('Error loading full conversation details:', error);
      }
    } else {
      console.log('Not using Firebase for this user type');
      // Try to load from localStorage
      try {
        const conversationsJson = localStorage.getItem('conversations');
        if (conversationsJson) {
          const storedConversations = JSON.parse(conversationsJson) as Conversation[];
          const storedConv = storedConversations.find(c => c.id === conversation.id);
          if (storedConv) {
            setCurrentConversationState(storedConv);
          }
        }
      } catch (error) {
        console.error('Error loading conversation from localStorage:', error);
      }
    }
  };

  // Load conversations effect - handles both Firebase and localStorage
  useEffect(() => {
    const loadConversations = async () => {
      // Skip if we're still loading or don't have a user
      if (isLoading || !user) return;

      try {
        if (user) {
          console.log('Loading conversations for user:', user.uid);
          
          // Use our new isUserAuthenticated function to determine if we should use Firebase
          if (isUserAuthenticated(user)) {
            console.log('Authenticated user detected, loading from Firebase');
            await loadFromFirebase();
          } else {
            console.log('Guest user detected, using localStorage instead of Firebase');
            loadFromLocalStorage();
          }
        } else {
          // No user, load from localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error in loadConversations:', error);
        // Fall back to localStorage in case of any errors
        loadFromLocalStorage();
      }
    };

    if (!isLoading) {
      loadConversations();
    }
  }, [isLoading, user]); // Removed currentConversation from dependencies to prevent loops

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