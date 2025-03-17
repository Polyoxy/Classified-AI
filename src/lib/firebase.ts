import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence as firebasePersistence, browserLocalPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
// Analytics is typically not used in Electron apps, but included for completeness
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);

// Check if we're in Electron environment
const isElectron = typeof window !== 'undefined' && window.electron;

// Set persistence to local for better user experience
try {
  firebasePersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error('Error setting persistence:', error);
    });
} catch (error) {
  console.error('Error with persistence:', error);
}

// Initialize Realtime Database (more cost effective for the free tier)
export const rtdb = getDatabase(app);

// Set up analytics if supported
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(error => {
    console.warn('Analytics not supported:', error);
  });
}

export { analytics };

// Helper function to cache data in memory to reduce database reads
export const setupCaching = () => {
  const cache = new Map();
  
  return {
    set: (key: string, data: any, expiresInMs = 60000) => {
      cache.set(key, {
        data,
        expiry: Date.now() + expiresInMs
      });
    },
    get: (key: string) => {
      const item = cache.get(key);
      if (!item) return null;
      
      if (item.expiry < Date.now()) {
        cache.delete(key);
        return null;
      }
      
      return item.data;
    },
    invalidate: (key: string) => {
      cache.delete(key);
    },
    clear: () => {
      cache.clear();
    }
  };
};

// Create a cache instance
export const dbCache = setupCaching();

export default app; 