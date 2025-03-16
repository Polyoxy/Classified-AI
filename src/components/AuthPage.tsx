'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useAppContext } from '@/context/AppContext';
import { auth, rtdb } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { ref, update } from 'firebase/database';
import RegisterPage from './RegisterPage';
import ResetPasswordPage from './ResetPasswordPage';
import dynamic from 'next/dynamic';

// Define the possible authentication screens
type AuthScreen = 'login' | 'register' | 'reset-password';

// Create a client-only component for elements that need browser features
const ClientOnly: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return isMounted ? <>{children}</> : null;
};

const AuthPage: React.FC = () => {
  const router = useRouter();
  const { setUser, settings, updateSettings } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(settings?.theme as 'dark' | 'light' || 'dark');
  
  // Detect client-side on first render
  useEffect(() => {
    // Clear the preventAutoLogin flag when the auth page mounts
    // This ensures we won't get redirected back to auth after login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('preventAutoLogin');
    }
  }, []);

  // Check if in Electron - if so, redirect to main app automatically
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && window.electron;
    
    if (isElectron) {
      // For Electron, create a direct user and redirect
      const electronUser = {
        uid: 'electron-user',
        displayName: 'Electron User',
        email: 'user@electron.app',
        isAnonymous: false
      };
      
      // Set user info
      setUser(electronUser as unknown as User);
      
      // Redirect to main app
      router.push('/');
    }
  }, [router, setUser]);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        // Only redirect for non-anonymous users
        console.log('Auth state changed: User logged in', user.uid);
        setUser(user);
        router.push('/');
      } else if (user && user.isAnonymous) {
        // For anonymous users, stay on auth page
        console.log('Auth state changed: Anonymous user detected on auth page');
        setUser(null); // Don't set the anonymous user in context when on auth page
      } else {
        console.log('Auth state changed: No user');
        setUser(null);
      }
    });
    
    return () => unsubscribe();
  }, [setUser, router]);

  // Apply theme when it changes
  useEffect(() => {
    if (currentTheme && updateSettings && settings?.theme !== currentTheme) {
      updateSettings({ theme: currentTheme });
      document.body.className = `theme-${currentTheme}`;
    }
  }, [currentTheme, updateSettings, settings?.theme]);
  
  // Handle login with email/password (simplified for Electron)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // For Electron, we'll create a simple local user
      const electronUser = {
        uid: 'electron-user',
        displayName: 'Electron User',
        email: email || 'user@electron.app',
        isAnonymous: false
      };
      
      // Set user info
      setUser(electronUser as unknown as User);
      
      // Save email to localStorage if remember me is checked
      if (rememberMe && email) {
        localStorage.setItem('lastLoginEmail', email);
        localStorage.setItem('rememberMe', JSON.stringify(rememberMe));
      }
      
      // Redirect to main app
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add effect to restore rememberMe preference and last login email
  useEffect(() => {
    try {
      // Restore remember me preference
      const savedRememberMe = localStorage.getItem('rememberMe');
      if (savedRememberMe !== null) {
        setRememberMe(JSON.parse(savedRememberMe));
      }
      
      // Restore last login email
      const lastEmail = localStorage.getItem('lastLoginEmail');
      if (lastEmail) {
        setEmail(lastEmail);
      }
    } catch (error) {
      console.warn('Failed to restore login preferences:', error);
    }
  }, []);
  
  // Handle guest/offline login (simplified for Electron)
  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For Electron, create a generic guest user
      const guestUser = {
        uid: 'guest-user',
        displayName: 'Guest User',
        email: 'guest@electron.app',
        isAnonymous: true
      };
      
      // Set user info
      setUser(guestUser as unknown as User);
      
      // Redirect to main app
      router.push('/');
    } catch (error: any) {
      console.error('Guest login error:', error);
      setError('Unable to continue as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle theme change
  const handleThemeChange = (theme: 'dark' | 'light') => {
    setCurrentTheme(theme);
  };
  
  // Show appropriate screen based on current state
  if (currentScreen === 'register') {
    return <RegisterPage onBackToLogin={() => setCurrentScreen('login')} />;
  }
  
  if (currentScreen === 'reset-password') {
    return <ResetPasswordPage onBackToLogin={() => setCurrentScreen('login')} />;
  }
  
  // Login screen (default)
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
        
        <ClientOnly>
          {typeof window !== 'undefined' && window.electron && (
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
          )}
        </ClientOnly>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        position: 'relative',
      }}>
        {/* Theme selector */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          fontSize: '0.75rem',
          opacity: 0.7,
          color: 'var(--text-color)',
        }}>
          <ClientOnly>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Theme:</span>
              <button
                onClick={() => setCurrentTheme('dark')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: currentTheme === 'dark' ? 'var(--accent-color)' : 'transparent',
                  color: currentTheme === 'dark' ? '#fff' : 'var(--text-color)',
                }}
              >
                Dark
              </button>
              <button
                onClick={() => setCurrentTheme('light')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: currentTheme === 'light' ? 'var(--accent-color)' : 'transparent',
                  color: currentTheme === 'light' ? '#fff' : 'var(--text-color)',
                }}
              >
                Light
              </button>
            </div>
          </ClientOnly>
        </div>

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
              CLASSIFIED AI
            </h1>
            <p style={{ 
              margin: '0',
              opacity: 0.8,
              fontSize: '14px',
              fontFamily: 'var(--font-family-sans)',
            }}>
              Enter your credentials to access the system
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
          
          {/* Login form */}
          <form onSubmit={handleLogin}>
            {/* Email field */}
            <div style={{ marginBottom: '16px' }}>
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
                className="auth-input"
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
                  fontFamily: 'var(--font-family-terminal)',
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
                    fontFamily: 'var(--font-family-terminal)',
                  }}
                  className="auth-input"
                  required
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
            
            {/* Remember me checkbox */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <div 
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '2px',
                    marginRight: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: rememberMe ? 'var(--accent-color)' : 'transparent',
                  }}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  {rememberMe && (
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: '14px', fontFamily: 'var(--font-family-terminal)' }}>Remember me</span>
              </label>
            </div>
            
            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#474747',
                color: 'var(--button-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-family-terminal)',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
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
              OR
            </span>
            <div style={{ 
              flex: 1, 
              height: '1px', 
              backgroundColor: 'var(--divider-color)',
            }} />
          </div>
          
          {/* Continue as guest button */}
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: isLoading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-family-terminal)',
              fontSize: '16px',
              marginBottom: '24px',
            }}
          >
            Continue as Guest
          </button>
          
          {/* Footer links */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '14px',
          }}>
            <button
              type="button"
              onClick={() => setCurrentScreen('register')}
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
              Create Account
            </button>
            
            <button
              type="button"
              onClick={() => setCurrentScreen('reset-password')}
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
              Forgot Password?
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

export default AuthPage; 