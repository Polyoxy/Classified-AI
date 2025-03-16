'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';
import { Message, Conversation } from '@/types';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { update, ref } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';

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
  const isElectron = typeof window !== 'undefined' && window?.electron;

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

  // Handle logout
  const handleLogout = async () => {
    try {
      // Set the flag to prevent auto-login
      localStorage.setItem('preventAutoLogin', 'true');
      
      await signOut(auth);
      setUser(null);
      
      // Use replace instead of push for cleaner navigation
      window.location.replace('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Update messages when conversation changes
  useEffect(() => {
    try {
      const isNewConversation = currentConversation?.id !== previousConversationId.current;
      
      if (currentConversation) {
        if (!currentConversation.messages || !Array.isArray(currentConversation.messages)) {
          throw new Error('Invalid conversation: messages array is missing or invalid');
        }

        if (isNewConversation) {
          setMessages([]);
          setTimeout(() => {
            setMessages(currentConversation.messages);
          }, 50);
        } else {
          setMessages(currentConversation.messages);
        }
        
        setError(null);
        previousConversationId.current = currentConversation.id;
      } else {
        setMessages([]);
        setError(null);
        previousConversationId.current = null;
      }
    } catch (error: any) {
      console.error('Error updating messages:', error);
      setError(error?.message || 'Error loading messages');
      setMessages([]);
      addMessage(`Error loading conversation: ${error.message}`, 'system');
    }
  }, [currentConversation?.id, currentConversation?.messages, addMessage]);

  // Scroll handling
  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
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
    <div style={{
      position: 'fixed',
      top: isElectron ? '36px' : 0,
      right: 0,
      bottom: 0,
      width: '320px',
      zIndex: 100,
      transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease',
      overflow: 'hidden',
      boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.1)',
    }}>
      <Sidebar />
    </div>
  );

  const renderContent = () => {
    if (error) {
      return (
        <div 
          className="flex-1 overflow-hidden"
          style={{ 
            backgroundColor,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontFamily: 'JetBrains Mono, monospace',
            paddingTop: isElectron ? '1.5rem' : '2rem',
            paddingRight: isSidebarOpen ? '320px' : '2rem',
            paddingLeft: '2rem',
            transition: 'padding-right 0.3s ease',
          }}
        >
          <div style={{ 
            padding: '2rem',
            textAlign: 'center',
            color: '#ff6b6b'
          }}>
            <p>Error: {error}</p>
          </div>
        </div>
      );
    }

    if (!currentConversation) {
      return (
        <div 
          className="flex-1 overflow-hidden"
          style={{ 
            backgroundColor,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontFamily: 'Inter, sans-serif',
            padding: '2rem',
            paddingTop: isElectron ? '1.5rem' : '2rem',
            paddingRight: isSidebarOpen ? '320px' : '2rem',
            paddingLeft: '2rem',
            transition: 'padding-right 0.3s ease',
          }}
        >
          <div style={{
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
            color: textColor,
            opacity: 0.9,
          }}>
            <div style={{
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{
                  opacity: 0.8,
                }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <circle cx="15.5" cy="8.5" r="1.5"></circle>
                <path d="M8.5 13.5a3.5 3.5 0 0 0 7 0"></path>
              </svg>
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: settings?.theme === 'dark' ? '#e0e0e0' : '#404040',
              letterSpacing: '-0.02em',
            }}>
              Welcome to Classified AI
            </h2>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '1.5rem',
              color: settings?.theme === 'dark' ? '#b0b0b0' : '#666666',
            }}>
              I'm here to assist you with coding, debugging, and technical discussions.
            </p>
            <button
              onClick={handleNewChat}
              style={{
                padding: '12px 24px',
                backgroundColor: settings?.theme === 'dark' ? '#2D2D2D' : '#f0f0f0',
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '0 auto',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? '#3D3D3D' : '#e0e0e0';
                e.currentTarget.style.borderColor = 'var(--text-color)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? '#2D2D2D' : '#f0f0f0';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Activate Intelligence
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div 
        ref={containerRef} 
        className="chat-container"
        style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          paddingTop: isElectron ? '2.5rem' : '2rem',
          paddingRight: isSidebarOpen ? '340px' : '2rem',
          paddingLeft: '2rem',
          backgroundColor,
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
          transition: 'padding-right 0.3s ease',
          boxSizing: 'border-box',
        }}
      >
        {messages
          .filter(message => message.role !== 'system') // Filter out system messages
          .map((message, index) => (
            <MessageItem
              key={message.id || index}
              message={message}
              isThinking={isProcessing && index === messages.length - 1 && message.role === 'assistant'}
            />
          ))
        }
        <div style={{ height: '20px' }}></div> {/* Add some space at the end */}
      </div>
    );
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
    }}>
      {isElectron && <TitleBar title="CLASSIFIED AI" />}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingTop: isElectron ? '16px' : '0',
        position: 'relative',
      }}>
        {renderContent()}
      </div>
      {renderSidebar()}
    </div>
  );
};

export default ChatContainer; 