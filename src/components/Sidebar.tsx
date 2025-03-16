'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Conversation } from '@/types';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { 
    user, 
    setUser, 
    conversations, 
    currentConversation, 
    setCurrentConversation,
    createConversation,
    isSidebarOpen
  } = useAppContext();

  const [filter, setFilter] = useState<'all' | 'starred'>('all');

  // Handle starring a conversation
  const toggleStar = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      const updatedConversation = {
        ...conversation,
        isStarred: !conversation.isStarred
      };
      // Update in the conversations list
      const updatedConversations = conversations.map(conv =>
        conv.id === conversationId ? updatedConversation : conv
      );
      setCurrentConversation(updatedConversation);
      // TODO: Add persistence logic here
    }
  };

  // Handle switching to a conversation
  const handleConversationClick = (conversation: any) => {
    setCurrentConversation(conversation);
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
      // Sign out from Firebase
      await signOut(auth);
      // Clear user from context
      setUser(null);
      // Redirect to auth page
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '36px', // Below the header
      right: isSidebarOpen ? '0' : '-320px', // Hide off-screen when closed
      bottom: '24px', // Above the status bar
      width: '320px',
      backgroundColor: 'var(--bg-color)',
      borderLeft: '1px solid var(--border-color)',
      transition: 'right 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          backgroundColor: 'var(--text-color)',
          color: 'var(--bg-color)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'opacity 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
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
        padding: '20px',
      }}>
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => handleConversationClick(conv)}
            style={{
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: currentConversation?.id === conv.id ? 'var(--bg-color)' : 'transparent',
              border: `1px solid ${currentConversation?.id === conv.id ? 'var(--text-color)' : 'var(--border-color)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              if (currentConversation?.id !== conv.id) {
                e.currentTarget.style.backgroundColor = 'var(--bg-color)';
                e.currentTarget.style.opacity = '0.8';
              }
            }}
            onMouseOut={(e) => {
              if (currentConversation?.id !== conv.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.opacity = '1';
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
              }}>
                {conv.title || 'New Chat'}
              </div>
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
                  color: conv.isStarred ? 'var(--text-color)' : 'var(--text-color)',
                  opacity: conv.isStarred ? 1 : 0.5,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={conv.isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-color)',
              opacity: 0.7,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {conv.messages[conv.messages.length - 1]?.content.slice(0, 50) || 'No messages yet'}...
            </div>
          </div>
        ))}
      </div>

      {/* User Info Section (Bottom) */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-color)',
        marginTop: 'auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 600,
            color: 'var(--text-color)',
          }}>
            {user?.displayName || 'Anonymous User'}
          </div>
          <div style={{ 
            fontSize: '12px',
            color: 'var(--text-color)',
            opacity: 0.7,
          }}>
            {user?.email || 'No email'}
          </div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--secondary-bg)';
              e.currentTarget.style.borderColor = 'var(--text-color)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 