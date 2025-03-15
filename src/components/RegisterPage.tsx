import React, { useState } from 'react';
import { auth, rtdb } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';

interface RegisterPageProps {
  onBackToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Creating user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: name
      });
      
      // Create user document in Realtime Database only
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      // Save user data to Realtime Database only
      await set(ref(rtdb, `users/${user.uid}`), userData);
      
      // Registration successful
      alert('Account created successfully! You can now log in.');
      
      // Ensure we call onBackToLogin to redirect to login screen
      setIsLoading(false); // Set loading to false before redirecting
      onBackToLogin(); // Redirect immediately
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
      setIsLoading(false);
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
        
        <div 
          className="window-controls non-draggable" 
          style={{ 
            display: 'flex', 
            gap: '0.5rem',
            // @ts-ignore
            WebkitAppRegion: 'no-drag'
          }}
        >
          <div
            onClick={() => window.electron?.windowControls?.minimize()}
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
            onClick={() => window.electron?.windowControls?.maximize()}
            className="window-control maximize non-draggable"
            title="Maximize"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10b981', // green-500
              border: 'none',
              cursor: 'pointer',
            }}
          />
          
          <div
            onClick={() => window.electron?.windowControls?.close()}
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

      {/* Main content */}
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
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ 
              margin: '0 0 8px 0',
              fontSize: '32px',
              fontWeight: 'normal',
              letterSpacing: '1.5px',
              fontFamily: 'var(--font-family-mono)',
            }}>
              CREATE ACCOUNT
            </h1>
            <p style={{ 
              margin: '0',
              opacity: 0.8,
              fontSize: '14px',
              fontFamily: 'var(--font-family-sans)',
            }}>
              Create your Classified AI account
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
          
          {/* Registration form */}
          <form onSubmit={handleRegister}>
            {/* Name field */}
            <div style={{ marginBottom: '16px' }}>
              <label 
                htmlFor="name" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-family-mono)',
                }}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-color)',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-family-mono)',
                }}
                placeholder="John Doe"
                required
              />
            </div>
            
            {/* Email field */}
            <div style={{ marginBottom: '16px' }}>
              <label 
                htmlFor="email" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-family-mono)',
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
                  fontFamily: 'var(--font-family-mono)',
                }}
                placeholder="agent@example.com"
                required
              />
            </div>
            
            {/* Password field */}
            <div style={{ marginBottom: '16px' }}>
              <label 
                htmlFor="password" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-family-mono)',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-color)',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-family-mono)',
                  }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    opacity: 0.7,
                    padding: 0,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {/* Eye icon */}
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Confirm Password field */}
            <div style={{ marginBottom: '24px' }}>
              <label 
                htmlFor="confirmPassword" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-family-terminal)',
                }}
              >
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  required
                />
              </div>
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
                CONFIRM DETAILS
              </span>
              <div style={{ 
                flex: 1, 
                height: '1px', 
                backgroundColor: 'var(--divider-color)',
              }} />
            </div>
            
            {/* Create Account button */}
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
              {isLoading ? 'Creating account...' : 'Create Account'}
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

        {/* Right section - Theme info */}
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

export default RegisterPage; 