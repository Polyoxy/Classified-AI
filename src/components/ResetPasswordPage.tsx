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
  
  // Handle window controls
  const handleMinimize = () => {
    if (window.electron?.windowControls) {
      window.electron.windowControls.minimize();
    }
  };

  const handleClose = () => {
    if (window.electron?.windowControls) {
      window.electron.windowControls.close();
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)',
    }}>
      {/* Title bar with window controls */}
      <div 
        className="terminal-header draggable" 
        style={{
          padding: '0.5rem 1rem',
          borderBottom: '2px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--header-bg)',
          height: '36px',
          boxSizing: 'border-box',
          // @ts-ignore
          WebkitAppRegion: 'drag', // Make the title bar draggable in Electron
        }}
      >
        <div className="terminal-title" style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {/* Terminal icon SVG */}
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
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          <span style={{
            fontWeight: 'bold',
            letterSpacing: '1px',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
          }}>
            CLASSIFIED AI
          </span>
        </div>
        <div className="window-controls" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          // @ts-ignore
          WebkitAppRegion: 'no-drag'
        }}>
          <div
            onClick={handleMinimize}
            className="window-control minimize non-draggable"
            title="Minimize"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b', // amber-500
              border: 'none',
              cursor: 'pointer',
            }}
          />
          <div
            onClick={handleClose}
            className="window-control close non-draggable"
            title="Close"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ef4444', // red-500
              border: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        position: 'relative',
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
              fontFamily: 'var(--font-family-sans)',
            }}>
              Enter your email to receive a password reset link
            </p>
          </div>
          
          {/* Error message */}
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
          
          {/* Success message */}
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

            {/* OR divider */}
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
            
            {/* Send Reset Email button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
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
              }}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          
          {/* Footer links */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '14px',
          }}>
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

      {/* Status bar */}
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
        {/* Left section - Hello Agent with status */}
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
            marginRight: '6px',
          }} />
          Agent::X1-7R4C3
        </div>

        {/* Right section */}
        <div style={{ 
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span>Classified-AI by The Shine</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 