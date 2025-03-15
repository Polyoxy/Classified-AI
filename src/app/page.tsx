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
      {/* Scanline effect */}
      <div className="scanline"></div>
      
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
  
  // Apply theme class to body
  useEffect(() => {
    document.body.className = settings.theme === 'dark' ? 'theme-dark' : '';
    console.log('Applied theme:', settings.theme);
  }, [settings.theme]);
  
  return (
    <>
      {/* Chat container */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatContainer />
      </div>
      
      {/* Command input */}
      <CommandInput />
      
      {/* Status bar */}
      <StatusBar onOpenSettings={() => setIsSettingsOpen(true)} />
    </>
  );
};
