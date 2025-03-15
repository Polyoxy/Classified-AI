import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { auth, rtdb } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  sendPasswordResetEmail,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import { ref, update } from 'firebase/database';
import RegisterPage from './RegisterPage';
import ResetPasswordPage from './ResetPasswordPage';

// Define the possible authentication screens
type AuthScreen = 'login' | 'register' | 'reset-password';

// Create a mock user for offline mode
const createOfflineUser = () => {
  return {
    uid: 'offline-' + Math.random().toString(36).substring(2, 15),
    isAnonymous: true,
    displayName: 'Guest User',
    email: null,
    emailVerified: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    }
  };
};

const AuthPage: React.FC = () => {
  const { setUser, settings, updateSettings } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(settings?.theme as 'dark' | 'light' || 'dark');
  
  // Debug: Log auth state changes - only in development
  useEffect(() => {
    // Only log auth state in development mode
    if (process.env.NODE_ENV === 'development') {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? `User ${user.uid} logged in` : 'No user');
      });
      
      return () => unsubscribe();
    }
    
    // In production, still set up the listener but don't log
    const unsubscribe = auth.onAuthStateChanged(() => {});
    return () => unsubscribe();
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (currentTheme && updateSettings) {
      // Only update if the theme has actually changed from settings
      if (settings?.theme !== currentTheme) {
        updateSettings({ theme: currentTheme });
      }
      
      // Apply the theme class to the body
      document.body.className = `theme-${currentTheme}`;
    }
  }, [currentTheme, updateSettings, settings?.theme]);
  
  // Handle login with email/password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Set persistence based on "Remember me" checkbox
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      // Sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const lastLoginData = {
        lastLogin: new Date().toISOString()
      };
      
      // Update last login time in Realtime Database only
      try {
        await update(ref(rtdb, `users/${user.uid}`), lastLoginData);
      } catch (err) {
        // Only log warnings in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Could not update last login time:', err);
        }
      }
      
      // Login successful - will be handled by the auth state observer
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle guest/offline login
  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      try {
        // Try Firebase anonymous auth first
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;
        
        // Create guest user data
        const guestData = {
          uid: user.uid,
          isAnonymous: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        // Save guest data to Realtime Database
        try {
          await update(ref(rtdb, `users/${user.uid}`), guestData);
        } catch (dbErr) {
          // Only log warnings in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Could not save guest user data to database, continuing in offline mode', dbErr);
          }
        }
      } catch (authError: any) {
        // Only log warnings in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Firebase anonymous auth failed, using offline mode', authError);
        }
        
        // Create an offline user if Firebase auth fails
        const offlineUser = createOfflineUser();
        
        // Manually set user in context to bypass Firebase Auth
        setUser(offlineUser as any);
        
        // Store in localStorage to persist the session
        try {
          localStorage.setItem('offlineUser', JSON.stringify(offlineUser));
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Could not save offline user to localStorage', e);
          }
        }
      }
      
      // Anonymous login successful - will be handled by the auth state observer or the manual setUser above
    } catch (error: any) {
      console.error('Guest login error:', error);
      setError('Unable to continue as guest. Please try again or create an account.');
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
        position: 'relative',
      }}>
        {/* Theme selector */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '10px',
        }}>
          <button
            onClick={() => handleThemeChange('dark')}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '3px',
              backgroundColor: '#1E1E1E',
              border: currentTheme === 'dark' ? 
                '2px solid #333333' : 
                '1px solid #555',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Dark Theme"
          />
          <button
            onClick={() => handleThemeChange('light')}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '3px',
              backgroundColor: '#FFFFFF',
              border: currentTheme === 'light' ? 
                '2px solid #474747' : 
                '1px solid #555',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Light Theme"
          />
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
            }}>
              CLASSIFIED AI
            </h1>
            <p style={{ 
              margin: '0',
              opacity: 0.8,
              fontSize: '14px',
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
                  border: '1px solid var(--input-border)',
                  borderRadius: '4px',
                  color: 'var(--text-color)',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
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
                    border: '1px solid var(--input-border)',
                    borderRadius: '4px',
                    color: 'var(--text-color)',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
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
                    border: '1px solid var(--input-border)',
                    borderRadius: '2px',
                    marginRight: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: rememberMe ? 'var(--slider-handle)' : 'transparent',
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
                <span style={{ fontSize: '14px' }}>Remember me</span>
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
                fontFamily: 'inherit',
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
              fontFamily: 'inherit',
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
                font: 'inherit',
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
                font: 'inherit',
              }}
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        height: '30px',
        backgroundColor: 'var(--header-bg)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 15px',
        fontSize: '12px',
        color: 'var(--system-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#9e9e9e', 
              marginRight: '5px' 
            }}></div>
            <span>disconnected</span>
          </div>
        </div>
        <div>
          <span>Theme: {currentTheme}</span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 