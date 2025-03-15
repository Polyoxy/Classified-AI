'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from '@/context/AppContext';
import TitleBar from '@/components/TitleBar';
import ChatContainer from '@/components/ChatContainer';
import CommandInput from '@/components/CommandInput';
import StatusBar from '@/components/StatusBar';
import SettingsModal from '@/components/SettingsModal';

// Font imports
import { Inter } from 'next/font/google';

// Define fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

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
    --border-color: #222222;
    --header-bg: #1E1E1E;
  }
  
  /* Dark theme */
  .theme-dark {
    --bg-color: #1E1E1E;
    --text-color: #CCCCCC;
    --accent-color: #569CD6;
    --accent-color-dark: #3A7CB8;
    --user-prefix-color: #608B4E;
    --ai-prefix-color: #CE9178;
    --input-bg: #f0f0f0; /* Light grey for input */
    --scrollbar-thumb: #4D4D4D;
    --button-hover: #3E3E3E;
    --border-color: #222222;
    --header-bg: #1E1E1E;
  }
  
  /* Light theme */
  .theme-light {
    --bg-color: #FFFFFF;
    --text-color: #333333;
    --accent-color: #0078D4;
    --accent-color-dark: #005A9E;
    --user-prefix-color: #107C10;
    --ai-prefix-color: #D83B01;
    --input-bg: #f0f0f0; /* Light grey for input */
    --scrollbar-thumb: #CCCCCC;
    --button-hover: #F0F0F0;
    --border-color: #DDDDDD;
    --header-bg: #F5F5F5;
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

export default function Home() {
  // Check if we're in an Electron environment
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(window.electron !== undefined);
  }, []);

  return (
    <main className={inter.variable}>
      <AppProvider>
        <App isElectron={isElectron} />
      </AppProvider>
    </main>
  );
}

const App: React.FC<{ isElectron: boolean }> = ({ isElectron }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Set up analytics
  useEffect(() => {
    const setupAnalytics = async () => {
      try {
        // Skip analytics in Electron
        if (isElectron) {
          console.log('Skipping analytics in Electron environment');
          return;
        }
        
        // Initialize analytics
        const { initAnalytics } = await import('@/lib/firebase');
        initAnalytics();
        console.log('Analytics initialized');
      } catch (error) {
        console.error('Error setting up analytics:', error);
      }
    };
    
    setupAnalytics();
  }, [isElectron]);

  return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Title bar (only for Electron) */}
      {isElectron && <TitleBar title="CLASSIFIED AI" />}
      
      {/* Main content */}
      <AppContent 
        isSettingsOpen={isSettingsOpen} 
        setIsSettingsOpen={setIsSettingsOpen} 
      />
      
      {/* Settings modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

const AppContent: React.FC<{ 
  isSettingsOpen: boolean; 
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>; 
}> = ({ 
  isSettingsOpen, 
  setIsSettingsOpen 
}) => {
  const { settings } = useAppContext();
  // Check if we're in Electron environment
  const [isElectron, setIsElectron] = useState(false);
  
  // Detect Electron environment
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron) {
      setIsElectron(true);
    }
  }, []);
  
  // Apply theme class to body
  useEffect(() => {
    // Apply the correct theme class based on the settings
    document.body.className = `theme-${settings.theme}`;
    console.log('Applied theme:', settings.theme);
  }, [settings.theme]);
  
  return (
    <>
      {/* Chat container */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        border: '1px solid var(--border-color)',
        borderTop: isElectron ? '1px solid var(--border-color)' : 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none'
      }}>
        <ChatContainer />
      </div>
      
      {/* Command input */}
      <CommandInput />
      
      {/* Status bar */}
      <StatusBar onOpenSettings={() => setIsSettingsOpen(true)} />
    </>
  );
};