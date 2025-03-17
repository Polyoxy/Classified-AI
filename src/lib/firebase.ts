import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Analytics is typically not used in Electron apps, but included for completeness
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNOiqkEgmEo7CIJ2LUS6wO8fAmPwhLTgQ",
  authDomain: "classified-ai.firebaseapp.com",
  projectId: "classified-ai",
  databaseURL: "https://classified-ai-default-rtdb.firebaseio.com",
  storageBucket: "classified-ai.firebasestorage.app",
  messagingSenderId: "470759227763",
  appId: "1:470759227763:web:f62c50762a220b49f2c506",
  measurementId: "G-Y3E1LPM4PD"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);

// Check if we're in Electron environment
const isElectron = typeof window !== 'undefined' && window.electron;

// Set persistence to local for better user experience
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Initialize Realtime Database (more cost effective for the free tier)
export const rtdb = getDatabase(app);

// Initialize Firestore (use sparingly to stay within free tier limits)
export const db = getFirestore(app);

// Initialize Analytics conditionally
export const initAnalytics = async () => {
  // Skip analytics in Electron
  if (isElectron) {
    console.log('Analytics disabled in Electron environment');
    return null;
  }
  
  if (typeof window !== 'undefined') {
    try {
      const isAnalyticsSupported = await isSupported();
      if (isAnalyticsSupported) {
        return getAnalytics(app);
      }
    } catch (error) {
      console.error('Analytics not supported:', error);
    }
  }
  return null;
};

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