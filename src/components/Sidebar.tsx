'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Conversation } from '@/types';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { update, ref } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

const Sidebar: React.FC = () => {
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation,
    createConversation,
    setUser,
    user,
    deleteConversation,
    addMessage,
    settings,
    setIsSidebarOpen
  } = useAppContext();

  const [filter, setFilter] = useState<'all' | 'starred'>('all');
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isElectron = typeof window !== 'undefined' && window?.electron;

  // Handle starring a conversation
  const toggleStar = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      const updatedConversation = {
        ...conversation,
        isStarred: !conversation.isStarred,
        updatedAt: Date.now()
      };
      
      // Update in state
      setCurrentConversation(updatedConversation);
      
      // Check if we're in Electron environment
      const isElectron = typeof window !== 'undefined' && window.electron;
      
      // Update in Firebase if authenticated and not in Electron
      if (user && !isElectron) {
        try {
          // Update in Realtime Database
          update(ref(rtdb, `users/${user.uid}/conversations/${conversationId}`), updatedConversation)
            .catch(error => console.error('Error updating conversation in Realtime Database:', error));
        } catch (error) {
          console.error('Error preparing conversation update for Realtime Database:', error);
        }
      } else if (isElectron) {
        // Update in electron-store
        try {
          window.electron.store.set('conversations', conversations.map(conv => 
            conv.id === conversationId ? updatedConversation : conv
          )).catch(error => console.error('Error saving to electron-store:', error));
        } catch (error) {
          console.error('Error saving to electron-store:', error);
        }
      }
    }
  };

  // Handle switching to a conversation
  const handleConversationClick = async (conversation: Conversation) => {
    try {
      // Prevent switching if already on this conversation
      if (currentConversation?.id === conversation.id) {
        return;
      }

      // Prevent multiple rapid clicks
      if (isProcessing) {
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

  // Filter conversations based on current filter
  const filteredConversations = conversations.filter(conv => 
    filter === 'all' || (filter === 'starred' && conv.isStarred)
  );

  // Handle logout
  const handleLogout = async () => {
    try {
      // Set the flag to prevent auto-login regardless of environment
      localStorage.setItem('preventAutoLogin', 'true');
      
      // Wait for signout to complete
      await signOut(auth);
      
      // Clear user state
      setUser(null);
      
      // For web version, redirect to auth page
      if (!isElectron) {
        // Force a full page reload to ensure clean state
        window.location.replace('/auth');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-color)',
      borderLeft: '1px solid var(--border-color)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: settings?.theme === 'dark' ? 'rgba(25, 25, 25, 0.9)' : 'rgba(245, 245, 245, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 600,
              color: 'var(--text-color)',
              letterSpacing: '0.4px',
              fontFamily: 'Inter, sans-serif',
            }}>
              Command Center
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              color: 'var(--text-color)',
              opacity: 0.7,
              transition: 'opacity 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              padding: '10px 16px',
              margin: '0 0 8px 0',
              backgroundColor: 'var(--accent-color)',
              color: 'var(--button-text)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.2px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover-color)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-color)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 20px',
          backgroundColor: 'var(--bg-color)',
          boxShadow: settings?.theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${filter === 'all' ? 'var(--accent-color)' : 'transparent'}`,
              color: filter === 'all' ? 'var(--accent-color)' : 'var(--text-color)',
              opacity: filter === 'all' ? 1 : 0.7,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === 'all' ? 600 : 500,
              transition: 'all 0.2s ease',
              letterSpacing: '0.3px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            All Chats
          </button>
          <button
            onClick={() => setFilter('starred')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${filter === 'starred' ? 'var(--accent-color)' : 'transparent'}`,
              color: filter === 'starred' ? 'var(--accent-color)' : 'var(--text-color)',
              opacity: filter === 'starred' ? 1 : 0.7,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === 'starred' ? 600 : 500,
              transition: 'all 0.2s ease',
              letterSpacing: '0.3px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Favorites
          </button>
        </div>

        {/* Conversations List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: 'var(--bg-color)',
        }}>
          {filteredConversations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'var(--text-color)',
              opacity: 0.7,
              padding: '40px 20px',
              fontSize: '14px',
              fontStyle: 'italic',
              fontFamily: 'Inter, sans-serif',
            }}>
              {filter === 'all' ? 'No conversations yet' : 'No favorite chats yet'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                data-conversation-id={conv.id}
                onClick={() => handleConversationClick(conv)}
                onMouseEnter={() => setHoveredConversation(conv.id)}
                onMouseLeave={() => setHoveredConversation(null)}
                style={{
                  padding: '14px',
                  marginBottom: '10px',
                  backgroundColor: currentConversation?.id === conv.id 
                    ? 'var(--accent-color)'
                    : hoveredConversation === conv.id 
                      ? settings?.theme === 'dark' ? 'rgba(40, 40, 45, 0.7)' : 'rgba(240, 240, 240, 0.7)'
                      : 'transparent',
                  border: `1px solid ${currentConversation?.id === conv.id ? 'var(--accent-color)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: 1,
                  position: 'relative',
                  boxShadow: currentConversation?.id === conv.id 
                    ? '0 2px 8px rgba(0, 0, 0, 0.15)' 
                    : hoveredConversation === conv.id 
                      ? '0 1px 5px rgba(0, 0, 0, 0.1)' 
                      : 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseOver={(e) => {
                  if (currentConversation?.id !== conv.id) {
                    e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? 'rgba(40, 40, 45, 0.7)' : 'rgba(240, 240, 240, 0.7)';
                    e.currentTarget.style.borderColor = 'var(--text-color)';
                    e.currentTarget.style.boxShadow = '0 1px 5px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentConversation?.id !== conv.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: currentConversation?.id === conv.id ? '#fff' : 'var(--text-color)',
                    flex: 1,
                    marginRight: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.2px',
                  }}>
                    {conv.title || 'New Chat'}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                  }}>
                    {hoveredConversation === conv.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deleteConversation) {
                            deleteConversation(conv.id);
                            if (currentConversation?.id === conv.id) {
                              // If no conversations left, create a new one
                              if (conversations.length <= 1) {
                                createConversation();
                              } else {
                                // Find the next available conversation to switch to
                                const remainingConvs = conversations.filter(c => c.id !== conv.id);
                                // Switch to the most recent conversation
                                setCurrentConversation(remainingConvs[0]);
                              }
                            }
                          }
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: currentConversation?.id === conv.id ? '#fff' : 'var(--text-color)',
                          opacity: 0.7,
                          transition: 'opacity 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(conv.id);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: currentConversation?.id === conv.id ? '#fff' : 'var(--text-color)',
                        opacity: conv.isStarred ? 1 : 0.5,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={conv.isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Display a snippet of the last message or the date */}
                {conv.messages && conv.messages.length > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: currentConversation?.id === conv.id ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                    opacity: 0.8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '4px',
                  }}>
                    {new Date(conv.updatedAt || Date.now()).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* User Info and Logout */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-color)',
          background: settings?.theme === 'dark' ? 'linear-gradient(180deg, rgba(25, 25, 25, 0.8) 0%, rgba(25, 25, 25, 1) 100%)' : 'linear-gradient(180deg, rgba(245, 245, 245, 0.8) 0%, rgba(245, 245, 245, 1) 100%)',
          boxShadow: settings?.theme === 'dark' ? '0 -2px 8px rgba(0, 0, 0, 0.1)' : '0 -2px 8px rgba(0, 0, 0, 0.03)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-color)',
              border: '2px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              fontFamily: 'Inter, sans-serif',
            }}>
              {user?.email?.[0].toUpperCase() || 'A'}
            </div>
            <div style={{
              flex: 1,
              overflow: 'hidden',
            }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '0.3px',
                fontFamily: 'Inter, sans-serif',
              }}>
                {user?.displayName || 'Command Agent'}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-color)',
                opacity: 0.7,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '2px',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.2px',
              }}>
                {user?.email || 'agent@classified.ai'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: settings?.theme === 'dark' ? 'rgba(25, 25, 25, 0.8)' : 'rgba(245, 245, 245, 0.8)',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.2px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? 'rgba(39, 39, 39, 0.9)' : 'rgba(230, 230, 230, 0.9)';
              e.currentTarget.style.borderColor = 'var(--text-color)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? 'rgba(25, 25, 25, 0.8)' : 'rgba(245, 245, 245, 0.8)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
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
      </div>
    </div>
  );
};

export default Sidebar; 