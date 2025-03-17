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

  const inputStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    color: 'var(--text-color)',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-family-terminal)',
  } as const;

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#474747',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: isLoading ? 'wait' : 'pointer',
    fontFamily: 'var(--font-family-terminal)',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '24px',
  } as const;

  const linkButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#474747',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'none',
    fontFamily: 'var(--font-family-terminal)',
  } as const;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
              fontFamily: 'var(--font-family-sans)',
            }}>
              Enter your email to receive a password reset link
            </p>
          </div>
          
          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '16px',
              color: 'var(--error-color)',
              border: '1px solid var(--error-color)',
              borderRadius: '4px',
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              padding: '10px',
              marginBottom: '16px',
              color: '#52c41a',
              border: '1px solid #52c41a',
              borderRadius: '4px',
            }}>
              Password reset email sent! Please check your inbox.
            </div>
          )}
          
          <form onSubmit={handleResetPassword}>
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
                style={inputStyle}
                placeholder="agent@example.com"
                required
              />
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              margin: '20px 0',
            }}>
              <div style={{ 
                flex: 1, 
                height: '1px', 
                backgroundColor: 'var(--divider-color)',
              }} />
              <span style={{ 
                padding: '0 10px', 
                color: 'var(--text-color)', 
                opacity: 0.7,
              }}>
                VERIFY EMAIL
              </span>
              <div style={{ 
                flex: 1, 
                height: '1px', 
                backgroundColor: 'var(--divider-color)',
              }} />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              style={buttonStyle}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '14px',
          }}>
            <button
              type="button"
              onClick={onBackToLogin}
              style={linkButtonStyle}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>

      <div style={{
        height: '24px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--header-bg)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        fontSize: '12px',
        color: 'var(--text-color)',
        fontFamily: 'var(--font-family-terminal)',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px' 
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
          }} />
          Agent::X1-7R4C3
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span>Classified-AI by The Shine</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 