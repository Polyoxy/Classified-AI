import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import MessageItem from './MessageItem';
import { Message, Conversation } from '@/types';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { update, ref } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import TitleBar from './TitleBar';

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
    setIsSidebarOpen
  } = useAppContext();
  
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'starred'>('all');
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Handle switching to a conversation
  const handleConversationClick = async (conversation: Conversation) => {
    try {
      if (currentConversation?.id === conversation.id || isProcessing) {
        return;
      }

      setIsProcessing(true);
      await setCurrentConversation(conversation);
    } catch (error: any) {
      console.error('Error in handleConversationClick:', error);
      addMessage(`Error switching conversation: ${error.message}`, 'system');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle creating a new chat
  const handleNewChat = () => {
    createConversation();
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Filter conversations based on current filter
  const filteredConversations = conversations.filter(conv => 
    filter === 'all' || (filter === 'starred' && conv.isStarred)
  );

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

  // Render sidebar content
  const renderSidebar = () => (
    <div style={{
      position: 'fixed',
      top: isElectron ? '36px' : 0,
      right: 0,
      bottom: 0,
      width: '320px',
      backgroundColor: settings?.theme === 'dark' ? '#1a1a1a' : '#ffffff',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease',
      overflow: 'hidden',
      boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Command Center Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: settings?.theme === 'dark' ? '#1a1a1a' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 600,
            color: 'var(--text-color)',
          }}>
            Command Center
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-color)',
            cursor: 'pointer',
            padding: '4px',
            opacity: 0.8,
            transition: 'opacity 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        style={{
          margin: '20px',
          padding: '10px',
          backgroundColor: settings?.theme === 'dark' ? '#2D2D2D' : '#f0f0f0',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New Chat
      </button>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 20px',
        backgroundColor: settings?.theme === 'dark' ? '#1a1a1a' : '#ffffff',
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${filter === 'all' ? 'var(--text-color)' : 'transparent'}`,
            color: 'var(--text-color)',
            opacity: filter === 'all' ? 1 : 0.7,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilter('starred')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${filter === 'starred' ? 'var(--text-color)' : 'transparent'}`,
            color: 'var(--text-color)',
            opacity: filter === 'starred' ? 1 : 0.7,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          Starred
        </button>
      </div>

      {/* Conversations List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        backgroundColor: settings?.theme === 'dark' ? '#1a1a1a' : '#ffffff',
      }}>
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => handleConversationClick(conv)}
            onMouseEnter={() => setHoveredConversation(conv.id)}
            onMouseLeave={() => setHoveredConversation(null)}
            style={{
              padding: '10px',
              marginBottom: '5px',
              borderRadius: '4px',
              backgroundColor: currentConversation?.id === conv.id 
                ? 'var(--accent-color)'
                : hoveredConversation === conv.id
                ? settings?.theme === 'dark' ? '#2D2D2D' : '#f0f0f0'
                : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: currentConversation?.id === conv.id
                ? '#fff'
                : 'var(--text-color)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {conv.title || 'New Conversation'}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(conv.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: conv.isStarred ? '#FFD700' : 'var(--text-color)',
                opacity: hoveredConversation === conv.id || conv.isStarred ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={conv.isStarred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          margin: '10px 20px',
          padding: '10px',
          backgroundColor: 'transparent',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? '#2D2D2D' : '#f0f0f0';
          e.currentTarget.style.borderColor = 'var(--text-color)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Logout
      </button>
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
              Start New Chat
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
          paddingTop: isElectron ? '2rem' : '2rem',
          backgroundColor,
        }}
      >
        {messages
          .filter(message => message.role !== 'system') // Filter out system messages
          .map((message, index) => (
            <MessageItem
              key={message.id || index}
              message={message}
            />
          ))
        }
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
    }}>
      {isElectron && <TitleBar title="CLASSIFIED AI" />}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingTop: isElectron ? '16px' : '0',
      }}>
        {renderContent()}
      </div>
      {renderSidebar()}
    </div>
  );
};

export default ChatContainer; 