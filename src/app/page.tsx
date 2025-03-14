'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AppProvider } from '@/context/AppContext';
import TitleBar from '@/components/TitleBar';
import ThemeSelector from '@/components/ThemeSelector';
import ConversationList from '@/components/ConversationList';
import ChatContainer from '@/components/ChatContainer';
import CommandInput from '@/components/CommandInput';
import StatusBar from '@/components/StatusBar';
import SettingsModal from '@/components/SettingsModal';
import { useAppContext } from '@/context/AppContext';
import { callAI } from '@/lib/aiService';
import { initAnalytics } from '@/lib/firebase';

// Add CSS variables
const globalStyles = `
  /* Font imports */
  @import url('https://fonts.googleapis.com/css2?family=VT323&family=Source+Code+Pro:wght@400;700&family=Courier+Prime:wght@400;700&display=swap');
  
  :root {
    /* Dark theme (default) */
    --bg-color: #1E1E1E;
    --text-color: #CCCCCC;
    --accent-color: #569CD6;
    --accent-color-dark: #3A7CB8;
    --user-prefix-color: #608B4E;
    --ai-prefix-color: #CE9178;
    --input-bg: #2D2D2D;
    --scrollbar-thumb: #4D4D4D;
    --button-hover: #3E3E3E;
    --border-color: #333;
  }
  
  /* Green theme */
  .theme-green {
    --bg-color: #000000;
    --text-color: #33FF33;
    --accent-color: #00CC00;
    --accent-color-dark: #00AA00;
    --user-prefix-color: #00FF00;
    --ai-prefix-color: #33FF33;
    --input-bg: #0A1A0A;
    --scrollbar-thumb: #1A5A1A;
    --button-hover: #0F2F0F;
    --border-color: #33FF33;
  }
  
  /* Amber theme */
  .theme-amber {
    --bg-color: #2D1B00;
    --text-color: #FFB000;
    --accent-color: #FFC133;
    --accent-color-dark: #EAA700;
    --user-prefix-color: #FF9000;
    --ai-prefix-color: #FFB000;
    --input-bg: #3D2B10;
    --scrollbar-thumb: #5D3B20;
    --button-hover: #4D2B10;
    --border-color: #915900;
  }
  
  body {
    margin: 0;
    padding: 0;
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: 'Courier Prime', 'Source Code Pro', 'VT323', 'Courier New', monospace !important;
    font-size: 14px;
    line-height: 1.6;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  * {
    font-family: 'Courier Prime', 'Source Code Pro', 'VT323', 'Courier New', monospace;
  }
  
  .chat-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .chat-container::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb);
    border-radius: 3px;
  }

  .message {
    margin-bottom: 16px;
    white-space: pre-wrap;
  }
  
  .user-message .prefix {
    color: var(--user-prefix-color);
  }
  
  .ai-message .prefix {
    color: var(--ai-prefix-color);
  }
  
  .prefix {
    font-weight: bold;
    user-select: none;
  }

  .typing-indicator.active {
    visibility: visible;
    display: inline-block;
  }
`;

// Main App Component
const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Initialize Firebase Analytics
  useEffect(() => {
    const setupAnalytics = async () => {
      try {
        // Check if we're in Electron environment
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        // Skip analytics in Electron
        if (isElectron) {
          console.log('Firebase Analytics disabled in Electron environment');
          return;
        }
        
        await initAnalytics();
        console.log('Firebase Analytics initialized');
      } catch (error) {
        console.error('Error initializing Firebase Analytics:', error);
      }
    };
    
    setupAnalytics();
  }, []);
  
  return (
    <AppProvider>
      <style jsx global>{globalStyles}</style>
      <AppContent 
        isSettingsOpen={isSettingsOpen} 
        setIsSettingsOpen={setIsSettingsOpen} 
      />
      <Toaster position="top-right" />
    </AppProvider>
  );
};

// App Content Component (uses AppContext)
const AppContent: React.FC<{
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
}> = ({ isSettingsOpen, setIsSettingsOpen }) => {
  const {
    settings,
    currentConversation,
    addMessage,
    isProcessing,
    setIsProcessing,
    updateTokenUsage,
    setConnectionStatus,
  } = useAppContext();

  // Apply theme class to body
  useEffect(() => {
    document.body.className = `theme-${settings.theme}`;
    
    // Apply font size
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
  }, [settings.theme, settings.fontSize]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!currentConversation) return;
    
    // Add user message to conversation
    addMessage(content, 'user');
    
    // Set processing state
    setIsProcessing(true);
    setConnectionStatus('connected');
    
    try {
      // Get provider config
      const provider = settings.providers[currentConversation.provider];
      const apiKey = provider.apiKey;
      const baseUrl = provider.baseUrl;
      
      // Call AI service
      const tokenUsage = await callAI(
        currentConversation.messages,
        currentConversation.model,
        currentConversation.provider,
        apiKey,
        baseUrl,
        settings.temperature,
        (response) => {
          if (!response.done) {
            // Update AI message in real-time as it streams
            addMessage(response.content, 'assistant');
          }
        }
      );
      
      // Update token usage
      updateTokenUsage(tokenUsage);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error calling AI:', error);
      setConnectionStatus('error');
      
      // Add error message
      addMessage(
        `Error: ${error instanceof Error ? error.message : 'Failed to communicate with AI service'}`,
        'system'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle clearing the chat
  const handleClearChat = () => {
    if (currentConversation) {
      // Keep only the system message
      const systemMessage = currentConversation.messages.find(
        (msg) => msg.role === 'system'
      );
      
      if (systemMessage) {
        // Reset conversation to just the system message
        addMessage('Chat cleared.', 'system');
      }
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)',
      fontFamily: "'Courier Prime', 'Source Code Pro', 'VT323', 'Courier New', monospace",
      fontSize: '14px',
      lineHeight: '1.6',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <TitleBar title="CLASSIFIED AI" />
      
      <ChatContainer />
      
      <CommandInput
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        onClearChat={handleClearChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <StatusBar onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
