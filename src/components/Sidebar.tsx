'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Conversation } from '@/types';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { update, ref, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation,
    createConversation,
    setUser,
    user,
    deleteConversation,
    addMessage
  } = useAppContext();

  const [filter, setFilter] = useState<'all' | 'starred'>('all');
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle starring a conversation
  const toggleStar = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      const updatedConversation = {
        ...conversation,
        isStarred: !conversation.isStarred,
        updatedAt: Date.now() // Add updatedAt timestamp
      };
      
      // Update in state
      setCurrentConversation(updatedConversation);
      
      // Update conversations list
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId ? updatedConversation : conv
      );
      
      // Sort by updatedAt in descending order
      updatedConversations.sort((a, b) => b.updatedAt - a.updatedAt);
      
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
          window.electron.store.set('conversations', updatedConversations)
            .catch(error => console.error('Error saving to electron-store:', error));
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
        console.log('Already on this conversation, ignoring click');
        return;
      }

      // Prevent multiple rapid clicks
      if (isProcessing) {
        console.log('Already processing a switch, ignoring click');
        return;
      }

      setIsProcessing(true);

      // Add visual feedback
      const targetElement = document.querySelector(`[data-conversation-id="${conversation.id}"]`);
      if (targetElement) {
        targetElement.classList.add('switching');
      }

      console.log('Attempting to switch to conversation:', {
        id: conversation.id,
        title: conversation.title,
        messageCount: conversation.messages?.length
      });

      await setCurrentConversation(conversation);
    } catch (error: any) {
      console.error('Error in handleConversationClick:', error);
      addMessage(`Error switching conversation: ${error.message}`, 'system');
    } finally {
      setIsProcessing(false);
      // Remove visual feedback
      const targetElement = document.querySelector(`[data-conversation-id="${conversation.id}"]`);
      if (targetElement) {
        targetElement.classList.remove('switching');
      }
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
      await signOut(auth);
      setUser(null);
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '36px',
      right: 0,
      bottom: '24px',
      width: '320px',
      backgroundColor: 'var(--bg-color)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden',
      boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Command Center Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
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

      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        style={{
          margin: '20px',
          padding: '10px',
          backgroundColor: '#2D2D2D',
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
          opacity: 1,
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#3D3D3D';
          e.currentTarget.style.borderColor = 'var(--text-color)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#2D2D2D';
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
        backgroundColor: 'var(--bg-color)',
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
          }}
        >
          Starred
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
            padding: '20px',
          }}>
            No conversations yet
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleConversationClick(conv)}
              onMouseEnter={() => setHoveredConversation(conv.id)}
              onMouseLeave={() => setHoveredConversation(null)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: currentConversation?.id === conv.id ? '#2D2D2D' : 'transparent',
                border: `1px solid ${currentConversation?.id === conv.id ? 'var(--text-color)' : 'var(--border-color)'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: 1,
                position: 'relative',
              }}
              onMouseOver={(e) => {
                if (currentConversation?.id !== conv.id) {
                  e.currentTarget.style.backgroundColor = '#2D2D2D';
                  e.currentTarget.style.borderColor = 'var(--text-color)';
                }
              }}
              onMouseOut={(e) => {
                if (currentConversation?.id !== conv.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
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
                  color: 'var(--text-color)',
                  flex: 1,
                  marginRight: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
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
                            // Find the next available conversation to switch to
                            const remainingConvs = conversations.filter(c => c.id !== conv.id);
                            if (remainingConvs.length > 0) {
                              // Switch to the most recent conversation
                              setCurrentConversation(remainingConvs[0]);
                            } else {
                              // If no conversations left, create a new one
                              createConversation();
                            }
                          }
                        }
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--text-color)',
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
                      color: 'var(--text-color)',
                      opacity: conv.isStarred ? 1 : 0.5,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={conv.isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Info and Logout */}
      <div style={{
        borderTop: '1px solid var(--border-color)',
        padding: '12px 20px',
        backgroundColor: 'var(--bg-color)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#2D2D2D',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-color)',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            {user?.email?.[0].toUpperCase() || 'A'}
          </div>
          <div style={{
            flex: 1,
            overflow: 'hidden',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-color)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.displayName || 'Agent'}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-color)',
              opacity: 0.7,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.email || 'anonymous@classified.ai'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2D2D2D',
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
            e.currentTarget.style.backgroundColor = '#3D3D3D';
            e.currentTarget.style.borderColor = 'var(--text-color)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#2D2D2D';
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
    </div>
  );
};

export default Sidebar; 