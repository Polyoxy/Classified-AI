'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';
import { Message } from '@/types';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { update, ref } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import Sidebar from './Sidebar';

// Add custom styles for better mobile responsiveness
const customStyles = `
  @media (max-width: 767px) {
    .chat-messages-container {
      padding: 1rem !important;
      padding-bottom: 120px !important; /* Extra space for command input and status bar */
    }
    
    .sidebar-toggle {
      top: 10px !important;
      right: 10px !important;
    }
  }
`;

const ChatContainer: React.FC = () => {
  const { 
    currentConversation, 
    settings, 
    addMessage, 
    conversations,
    setCurrentConversation,
    createConversation,
    setUser,
    user,
    isSidebarOpen,
    setIsSidebarOpen,
    isProcessing
  } = useAppContext();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const backgroundColor = settings?.theme === 'dark' ? '#121212' : '#f8f8f8';
  const textColor = settings?.theme === 'dark' ? '#a0a0a0' : '#666666';
  const previousConversationId = useRef<string | null>(null);

  // Toggle star for a conversation
  const toggleStar = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      const updatedConversation = {
        ...conversation,
        isStarred: !conversation.isStarred,
        updatedAt: Date.now()
      };
      
      setCurrentConversation(updatedConversation);
      
      if (user) {
        try {
          update(ref(rtdb, `users/${user.uid}/conversations/${conversationId}`), updatedConversation)
            .catch(error => console.error('Error updating conversation in Realtime Database:', error));
        } catch (error) {
          console.error('Error preparing conversation update for Realtime Database:', error);
        }
      }
    }
  };

  // Handle creating a new chat
  const handleNewChat = () => {
    createConversation();
  };

  // Ensure messages stay current with conversation
  useEffect(() => {
    if (!currentConversation) return;
    
    // Set current messages from conversation
    setMessages(currentConversation.messages);
    
    // Reset error state when switching conversation
    setError(null);
    
  }, [currentConversation]);

  // Handle error cases when there's no current conversation
  useEffect(() => {
    if (conversations.length === 0) {
      setError('No conversations available. Create a new chat to get started.');
      return;
    }

    if (!currentConversation && conversations.length > 0) {
      // Wait for initialization to complete
      const timer = setTimeout(() => {
        setError('Please select or create a conversation to continue.');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentConversation, conversations]);

  // Scroll to bottom when messages change
  const scrollToBottom = (smooth = true) => {
    if (!containerRef.current) return;
    
    const scrollOptions: ScrollIntoViewOptions = {
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    };
    
    containerRef.current.scrollIntoView(scrollOptions);
  };

  useEffect(() => {
    scrollToBottom(false);
    const timer = setTimeout(() => {
      scrollToBottom(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      scrollToBottom(false);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  // Add listener for sidebar toggle
  useEffect(() => {
    const handleResize = () => {
      // Close sidebar on small screens
      if (window.innerWidth < 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen, setIsSidebarOpen]);

  // Render sidebar content
  const renderSidebar = () => (
    <div className="sidebar-open" style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '320px',
      maxWidth: '100%', // Allow full width on mobile
      zIndex: 1000, 
      transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease',
      overflow: 'hidden',
      boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.1)',
      backgroundColor: settings?.theme === 'dark' ? '#121212' : '#f8f8f8',
    }}>
      <Sidebar />
    </div>
  );

  const renderContent = () => {
    if (error) {
      return (
        <div 
          className="flex-1 overflow-hidden chat-container"
          style={{ 
            backgroundColor,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontFamily: 'JetBrains Mono, monospace',
            paddingTop: '1rem',
            paddingLeft: '2rem',
            paddingBottom: '2rem',
            paddingRight: isSidebarOpen ? '320px' : '2rem',
            transition: 'padding-right 0.3s ease',
          }}
        >
          <div style={{ 
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '600px',
          }}>
            {/* Welcome Icon */}
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              color: settings?.theme === 'dark' ? '#aaa' : '#666',
              backgroundColor: settings?.theme === 'dark' ? 'rgba(170, 170, 170, 0.1)' : 'rgba(120, 120, 120, 0.1)',
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 30px',
              border: `1px solid ${settings?.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <circle cx="15.5" cy="8.5" r="1.5"></circle>
                <path d="M12 16c1.5 0 3-1 3-3"></path>
                <path d="M9 16c-1.5 0-3-1-3-3"></path>
              </svg>
            </div>
            
            {/* Welcome Title */}
            <h1 style={{ 
              fontSize: '32px',
              color: settings?.theme === 'dark' ? '#e0e0e0' : '#333',
              fontWeight: 600,
              marginBottom: '16px',
              letterSpacing: '0.5px',
            }}>
              Welcome to Classified AI
            </h1>
            
            {/* Description */}
            <p style={{ 
              fontSize: '16px',
              color: settings?.theme === 'dark' ? '#b0b0b0' : '#666',
              marginBottom: '40px',
              lineHeight: 1.6,
            }}>
              I'm here to assist you with coding, debugging, and technical discussions.
            </p>
            
            {/* Activate Intelligence Button */}
            <button 
              onClick={() => createConversation()}
              style={{
                backgroundColor: settings?.theme === 'dark' ? 'rgba(170, 170, 170, 0.15)' : 'rgba(80, 80, 80, 0.07)',
                color: settings?.theme === 'dark' ? '#d0d0d0' : '#333',
                border: `1px solid ${settings?.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '0 auto',
                transition: 'all 0.2s ease',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: settings?.theme === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? 'rgba(170, 170, 170, 0.2)' : 'rgba(80, 80, 80, 0.12)';
                e.currentTarget.style.boxShadow = settings?.theme === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? 'rgba(170, 170, 170, 0.15)' : 'rgba(80, 80, 80, 0.07)';
                e.currentTarget.style.boxShadow = settings?.theme === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
              Activate Intelligence
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <style>{customStyles}</style>
        <div 
          className="flex-1 overflow-auto chat-messages-container"
          style={{ 
            backgroundColor,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem',
            paddingTop: '1rem',
            paddingBottom: '110px', /* Increased padding to make room for command input and status bar */
            height: 'calc(100% - 60px)', /* Adjust for title bar */
            overflowY: 'auto',
            marginRight: isSidebarOpen ? '320px' : '0',
            transition: 'margin-right 0.3s ease',
            position: 'relative',
            zIndex: 60,
          }}
          ref={containerRef}
        >
          {messages.filter(msg => settings.showSystemMessages || msg.role !== 'system').map((message, index) => (
            <MessageItem 
              key={message.id || index} 
              message={message} 
            />
          ))}
          
          {isProcessing && (
            <MessageItem 
              message={{ 
                id: 'thinking', 
                role: 'assistant', 
                content: '', 
                timestamp: Date.now() 
              }} 
              isThinking={true} 
            />
          )}
        </div>
      </>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Title bar */}
      <div className="title-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1.25rem',
        backgroundColor: settings?.theme === 'dark' ? 'rgba(18, 18, 18, 0.8)' : 'rgba(245, 245, 245, 0.8)',
        borderBottom: `1px solid ${settings?.theme === 'dark' ? 'rgba(51, 51, 51, 0.7)' : 'rgba(221, 221, 221, 0.7)'}`,
        color: settings?.theme === 'dark' ? '#b0b0b0' : '#505050',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: 600,
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {currentConversation ? 
              (currentConversation.title || 'New Conversation') : 
              'Classified AI'}
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => createConversation()}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.7)' : 'rgba(100, 100, 100, 0.7)',
              opacity: 0.7,
              transition: 'all 0.2s ease',
            }}
            title="New Chat"
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? 'rgba(40, 40, 40, 0.5)' : 'rgba(230, 230, 230, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              backgroundColor: isSidebarOpen 
                ? settings?.theme === 'dark' ? 'rgba(60, 60, 60, 0.7)' : 'rgba(210, 210, 210, 0.7)'
                : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.8)' : 'rgba(100, 100, 100, 0.8)',
              opacity: isSidebarOpen ? '1' : '0.7',
              transition: 'all 0.2s ease',
              boxShadow: isSidebarOpen ? (settings?.theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)') : 'none',
            }}
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '1';
              if (!isSidebarOpen) {
                e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? 'rgba(40, 40, 40, 0.5)' : 'rgba(230, 230, 230, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (!isSidebarOpen) {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
        </div>
      </div>
      
      {renderContent()}
      {renderSidebar()}
    </div>
  );
};

export default ChatContainer; 