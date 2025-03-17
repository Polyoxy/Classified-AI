'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function ResetConversationsPage() {
  const { resetConversations, user } = useAppContext();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    if (!user) {
      setStatus('error');
      setMessage('You must be logged in to reset conversations');
      return;
    }

    try {
      setStatus('loading');
      setMessage('Deleting all conversations...');
      
      // Call the resetConversations function from AppContext
      await resetConversations();
      
      setStatus('success');
      setMessage('All conversations have been deleted successfully!');
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>Reset Conversations</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Warning:</strong> This will delete all your conversations from Firebase.</p>
        <p>This action cannot be undone!</p>
      </div>
      
      {user ? (
        <div>
          <p>Current user: {user.email}</p>
          <button 
            onClick={handleReset}
            disabled={status === 'loading'}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: status === 'loading' ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {status === 'loading' ? 'Deleting...' : 'Delete All Conversations'}
          </button>
          
          {status !== 'idle' && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem',
              backgroundColor: status === 'success' ? '#d4edda' : status === 'error' ? '#f8d7da' : '#e2e3e5',
              color: status === 'success' ? '#155724' : status === 'error' ? '#721c24' : '#383d41',
              borderRadius: '4px'
            }}>
              {message}
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          borderRadius: '4px'
        }}>
          You need to be logged in to reset conversations
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <a 
          href="/"
          style={{
            textDecoration: 'none',
            color: '#007bff'
          }}
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
} 