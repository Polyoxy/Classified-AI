'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import ChatContainer from '@/components/ChatContainer';
import CommandInput from '@/components/CommandInput';
import StatusBar from '@/components/StatusBar';
import SettingsModal from '@/components/SettingsModal';
import AuthPage from '@/components/AuthPage';

// Font imports
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';

// Define fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// Add CSS variables
const globalStyles = `
  /* Font imports */
  @import url('https://fonts.googleapis.com/css2?family=VT323&family=Source+Code+Pro:wght@400;700&family=Courier+Prime:wght@400;700&display=swap');
  
  /* Animation keyframes */
  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Font variables */
  :root {
    --font-terminal: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', monospace;
    --font-general: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  
  :root {
    /* Dark theme (default) */
    --bg-color: #1E1E1E;
    --text-color: #CCCCCC;
    --accent-color: #333333;
    --accent-color-dark: #252525;
    --user-prefix-color: #608B4E;
    --ai-prefix-color: #CE9178;
    --input-bg: #f0f0f0; /* Light grey for input */
    --input-border: #2A2A2A;
    --scrollbar-thumb: #4D4D4D;
    --button-hover: #3E3E3E;
    --border-color: #222222;
    --header-bg: #1E1E1E;
    --modal-bg: #2D2D2D;
    --modal-border: #333333;
    --slider-handle: #474747;
    --system-color: #999999;
    --link-color: #474747; /* Dark grey links */
    --button-bg: #474747; /* Dark grey button */
    --button-text: #FFFFFF; /* White text on buttons */
    --divider-color: #333333; /* Divider color */
  }
  
  /* Dark theme */
  .theme-dark {
    --bg-color: #121212; /* Dark black background */
    --text-color: #e9ecef; /* Light text */
    --accent-color: #aaaaaa; /* Light gray accent color */
    --accent-rgb: 170, 170, 170; /* RGB value of accent color */
    --user-prefix-color: #cccccc; /* Light gray for user prefix */
    --ai-prefix-color: #aaaaaa; /* Light gray for AI prefix */
    --input-bg: #1a1a1a; /* Darker input background */
    --input-border: #343a40; /* Dark border for inputs */
    --scrollbar-thumb: #4D4D4D;
    --button-hover: #212529;
    --border-color: #343a40; /* Slightly lighter border */
    --header-bg: #1a1a1a;
    --modal-bg: #1a1a1a;
    --modal-border: #343a40;
    --slider-handle: #aaaaaa; /* Gray accent for slider */
    --system-color: #b0bec5;
    --link-color: #cccccc; /* Light gray links */
    --button-bg: #aaaaaa; /* Gray button */
    --button-text: #121212; /* Dark text on buttons */
    --divider-color: #343a40; /* Divider color */
    --success-color: #10b981; /* Green for success status */
    --error-color: #ef5350; /* Red for error status */
    --warning-color: #f59e0b; /* Orange for warning status */
    --secondary-bg: #1a1a1a;
    --code-bg: #1e1e1e;
  }
  
  /* Light theme (default) */
  .theme-light {
    --bg-color: #f8f9fa;
    --text-color: #212529;
    --accent-color: #505050; /* Dark gray accent color */
    --accent-rgb: 80, 80, 80; /* RGB value of accent color */
    --user-prefix-color: #505050; /* Dark gray for user prefix */
    --ai-prefix-color: #505050; /* Dark gray for AI prefix */
    --input-bg: #ffffff; /* White input background */
    --input-border: #ced4da; /* Light grey border for inputs */
    --scrollbar-thumb: #CCCCCC;
    --button-hover: #e9ecef;
    --border-color: #dee2e6;
    --header-bg: #ffffff;
    --modal-bg: #ffffff;
    --modal-border: #dee2e6;
    --slider-handle: #505050; /* Dark gray accent */
    --system-color: #607d8b;
    --link-color: #333333; /* Dark gray links */
    --button-bg: #505050; /* Dark gray button */
    --button-text: #ffffff; /* White text on buttons */
    --divider-color: #e9ecef; /* Divider color */
    --success-color: #10b981; /* Green for success status */
    --error-color: #ef4444; /* Red for error status */
    --warning-color: #f59e0b; /* Orange for warning status */
    --secondary-bg: #f5f5f5;
    --code-bg: #f5f5f5;
  }
  
  body {
    margin: 0;
    padding: 0;
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: var(--font-terminal);
    font-size: 14px;
    line-height: 1.6;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  * {
    font-family: var(--font-terminal);
  }

  p, div.description, .help-text {
    font-family: var(--font-general);
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

  // Add button styles
  .terminal-button {
    padding: 0.5rem 1rem;
    background-color: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    font-family: var(--font-terminal);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .terminal-button:hover {
    background-color: var(--button-hover);
    border-color: var(--accent-color);
  }

  .terminal-button-primary {
    padding: 0.5rem 1rem;
    background-color: var(--accent-color);
    border: 1px solid var(--accent-color);
    color: var(--bg-color);
    font-family: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .terminal-button-primary:hover {
    background-color: var(--accent-color-dark);
    border-color: var(--accent-color-dark);
  }

  // Add form input styles
  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: var(--text-color);
    font-family: var(--font-mono);
  }

  .form-select, .form-input {
    width: 100%;
    padding: 0.5rem;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
  }

  .form-select:focus, .form-input:focus {
    outline: none;
    border-color: var(--accent-color);
  }

  .space-y-6 > * {
    margin-bottom: 1.5rem;
  }
`;

export default function Home() {
  return (
    <main className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <style jsx global>{globalStyles}</style>
      <App />
    </main>
  );
}

// Welcome page component to show initially
const WelcomePage: React.FC<{
  onStartChat: () => void;
}> = ({ onStartChat }) => {
  const { settings } = useAppContext();
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: 'var(--bg-color)',
    }}>
      {/* Logo/Icon */}
      <div style={{
        fontSize: '64px',
        marginBottom: '30px',
        color: settings?.theme === 'dark' ? '#aaa' : '#666',
        backgroundColor: settings?.theme === 'dark' ? 'rgba(170, 170, 170, 0.1)' : 'rgba(120, 120, 120, 0.1)',
        width: '120px',
        height: '120px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 40px',
        border: `1px solid ${settings?.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}>
        {/* AI Chat Response Icon */}
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M8 9h.01"></path>
          <path d="M12 9h.01"></path>
          <path d="M16 9h.01"></path>
        </svg>
      </div>
      
      {/* Title */}
      <h1 style={{ 
        fontSize: '42px',
        color: settings?.theme === 'dark' ? '#e0e0e0' : '#333',
        fontWeight: 600,
        marginBottom: '24px',
        letterSpacing: '0.5px',
      }}>
        Welcome to Classified AI
      </h1>
      
      {/* Description */}
      <p style={{ 
        fontSize: '18px',
        maxWidth: '600px',
        marginBottom: '40px',
        color: settings?.theme === 'dark' ? '#aaaaaa' : '#666666',
        lineHeight: 1.6,
      }}>
        Your intelligent assistant for coding, learning, and creative tasks. 
        Start a conversation to explore what Classified AI can do for you.
      </p>
      
      {/* Activate Intelligence Button */}
      <button 
        onClick={onStartChat}
        style={{
          padding: '14px 32px',
          fontSize: '18px',
          backgroundColor: settings?.theme === 'dark' ? 'rgba(170, 170, 170, 0.15)' : 'rgba(80, 80, 80, 0.07)',
          color: settings?.theme === 'dark' ? '#d0d0d0' : '#333',
          border: `1px solid ${settings?.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          boxShadow: settings?.theme === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = settings?.theme === 'dark' ? '0 6px 16px rgba(0, 0, 0, 0.2)' : '0 6px 16px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? 'rgba(170, 170, 170, 0.2)' : 'rgba(80, 80, 80, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = settings?.theme === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? 'rgba(170, 170, 170, 0.15)' : 'rgba(80, 80, 80, 0.07)';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"></path>
          <path d="M12 5l7 7-7 7"></path>
        </svg>
        Activate Intelligence
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { user, isLoading, settings, createConversation } = useAppContext();

  // Create offline user if needed
  useEffect(() => {
    if (!isLoading && !user) {
      try {
        // Check if we already have an offline user
        const offlineUserJson = localStorage.getItem('offlineUser');
        if (!offlineUserJson) {
          // Create a new offline user
          const offlineUser = {
            uid: `offline-${Date.now()}`,
            displayName: 'Guest User',
            email: 'guest@classified.ai',
            isAnonymous: true,
            photoURL: null,
          };
          
          // Save to localStorage
          localStorage.setItem('offlineUser', JSON.stringify(offlineUser));
          console.log('Created offline user for guest access');
        }
      } catch (error) {
        console.error('Error creating offline user:', error);
      }
    }
  }, [isLoading, user]);

  // Check for preventAutoLogin flag on mount
  useEffect(() => {
    // If we're on the main app page but have preventAutoLogin set, redirect to auth
    if (!isLoading && typeof window !== 'undefined') {
      const preventAutoLogin = localStorage.getItem('preventAutoLogin') === 'true';
      if (preventAutoLogin) {
        localStorage.removeItem('preventAutoLogin');
        // Redirect to auth page if not already there
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }
    }
  }, [isLoading]);

  // Set up analytics
  useEffect(() => {
    // Setup analytics when component mounts if not in electron
    const setupAnalytics = async () => {
      try {
        // Import analytics, which is already initialized
        await import('@/lib/firebase');
        console.log('Analytics setup complete');
      } catch (error) {
        console.error('Error setting up analytics:', error);
      }
    };
    
    if (typeof window !== 'undefined' && !window.electron) {
      setupAnalytics();
    }
  }, []);

  // Check for offline user
  useEffect(() => {
    if (!user && !isLoading) {
      try {
        const offlineUserJson = localStorage.getItem('offlineUser');
        if (offlineUserJson) {
          const offlineUser = JSON.parse(offlineUserJson);
          // Only log when actually restoring a user
          console.log('Restoring offline user session:', offlineUser.uid);
        }
      } catch (error) {
        console.error('Error checking for offline user:', error);
      }
    }
  }, [user, isLoading]);

  // Function to handle starting a chat from the welcome page
  const handleStartChat = () => {
    // Create a new conversation
    createConversation();
    // Show the chat
    setShowChat(true);
  };

  // While authentication is loading, show a loading state
  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', fontSize: '24px' }}>Loading...</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>Checking authentication state...</div>
        </div>
      </div>
    );
  }

  // If no user, show the auth page
  if (!user) {
    return <AuthPage />;
  }

  // User is authenticated, show either welcome page or chat
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden',
      margin: '0 auto',
      maxWidth: '100%',
    }}>
      {showChat ? (
        <>
          {/* Main content */}
          <AppContent
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={() => setIsSettingsOpen(!isSettingsOpen)} 
          />
          
          {/* Settings modal */}
          {isSettingsOpen && (
            <SettingsModal 
              isOpen={true}
              onClose={() => setIsSettingsOpen(false)} 
            />
          )}
        </>
      ) : (
        <WelcomePage onStartChat={handleStartChat} />
      )}
    </div>
  );
};

const AppContent: React.FC<{ 
  isSettingsOpen: boolean; 
  setIsSettingsOpen: () => void; 
}> = ({ 
  isSettingsOpen, 
  setIsSettingsOpen 
}) => {
  const { settings, isSidebarOpen } = useAppContext();
  
  return (
    <>
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        border: '1px solid var(--border-color)',
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        marginRight: isSidebarOpen ? '320px' : '0',
        transition: 'margin-right 0.3s ease',
        marginBottom: '82px', // Add space for CommandInput + StatusBar
      }}>
        <ChatContainer />
      </div>
      
      <div style={{
        position: 'fixed',
        bottom: '40px', // Increased from 32px to add more space above StatusBar
        left: 0,
        right: isSidebarOpen ? '320px' : 0,
        transition: 'right 0.3s ease',
        zIndex: 100,
      }}>
        <CommandInput />
      </div>
      
      <StatusBar onOpenSettings={setIsSettingsOpen} />
    </>
  );
};