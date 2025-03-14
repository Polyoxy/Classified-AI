import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { ChatBubbleLeftRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const ConversationList: React.FC = () => {
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation, 
    createConversation,
    deleteConversation
  } = useAppContext();

  // Format date to display in a readable format
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Get a preview of the conversation
  const getConversationPreview = (conversation: any) => {
    const userMessages = conversation.messages.filter(
      (msg: any) => msg.role === 'user'
    );
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      return lastUserMessage.content.substring(0, 40) + 
        (lastUserMessage.content.length > 40 ? '...' : '');
    }
    return 'New conversation';
  };

  return (
    <div 
      style={{
        width: '250px',
        backgroundColor: '#1E1E1E',
        borderRight: '1px solid #474747',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #474747',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: 'bold',
          color: '#CCCCCC' 
        }}>
          Conversations
        </h2>
        <button
          onClick={createConversation}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#CCCCCC',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#333333')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="New Conversation"
        >
          <PlusIcon style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      <div style={{ 
        overflowY: 'auto', 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '4px'
      }}>
        {conversations.length === 0 ? (
          <div style={{ 
            padding: '16px', 
            textAlign: 'center',
            color: '#999999',
            fontSize: '14px'
          }}>
            No conversations yet
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setCurrentConversation(conversation)}
              style={{
                padding: '10px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: currentConversation?.id === conversation.id 
                  ? '#2D2D2D' 
                  : 'transparent',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onMouseOver={(e) => {
                if (currentConversation?.id !== conversation.id) {
                  e.currentTarget.style.backgroundColor = '#252525';
                }
              }}
              onMouseOut={(e) => {
                if (currentConversation?.id !== conversation.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                <ChatBubbleLeftRightIcon style={{ 
                  width: '16px', 
                  height: '16px',
                  color: '#AAAAAA'
                }} />
                <span style={{ 
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#CCCCCC',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {conversation.title || 'New Conversation'}
                </span>
              </div>
              
              <div style={{ 
                fontSize: '12px',
                color: '#999999',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{formatDate(conversation.createdAt)}</span>
                <span style={{ 
                  fontSize: '11px',
                  color: '#888888'
                }}>
                  {conversation.provider}/{conversation.model.split('-')[0]}
                </span>
              </div>
              
              <div style={{ 
                fontSize: '12px',
                color: '#999999',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {getConversationPreview(conversation)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList; 