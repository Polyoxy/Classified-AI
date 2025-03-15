import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ResetPasswordPageProps {
  onBackToLogin: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px',
        borderRadius: '5px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-color)',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0',
            fontSize: '32px',
            fontWeight: 'normal',
            letterSpacing: '1.5px',
            fontFamily: 'var(--font-family-terminal)',
          }}>
            RESET PASSWORD
          </h1>
          <p style={{ 
            margin: '0',
            opacity: 0.8,
            fontSize: '14px',
            fontFamily: 'var(--font-family-general)',
          }}>
            Enter your email to receive a password reset link
          </p>
        </div>
        
        {/* Error message */}
        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '16px',
            color: '#ff4d4f',
            border: '1px solid #ff4d4f',
            borderRadius: '4px',
            fontFamily: 'var(--font-family-general)',
          }}>
            {error}
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div style={{
            padding: '10px',
            marginBottom: '16px',
            color: '#52c41a',
            border: '1px solid #52c41a',
            borderRadius: '4px',
            fontFamily: 'var(--font-family-general)',
          }}>
            Password reset email sent! Please check your inbox.
          </div>
        )}
        
        {/* Reset form */}
        <form onSubmit={handleResetPassword}>
          {/* Email field */}
          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontWeight: 'bold',
                fontFamily: 'var(--font-family-terminal)',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-color)',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-family-terminal)',
              }}
              placeholder="agent@example.com"
              required
            />
          </div>
          
          {/* Send Reset Email button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'var(--button-bg)',
              color: 'var(--button-text)',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-family-terminal)',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '24px',
            }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        {/* Back to login */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#474747',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'none',
              fontFamily: 'var(--font-family-terminal)',
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 