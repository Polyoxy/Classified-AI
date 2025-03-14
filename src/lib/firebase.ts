import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Analytics is typically not used in Electron apps, but included for completeness
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNOiqkEgmEo7CIJ2LUS6wO8fAmPwhLTgQ",
  authDomain: "classified-ai.firebaseapp.com",
  projectId: "classified-ai",
  storageBucket: "classified-ai.firebasestorage.app",
  messagingSenderId: "470759227763",
  appId: "1:470759227763:web:f62c50762a220b49f2c506",
  measurementId: "G-Y3E1LPM4PD"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics conditionally (only in browser environment, not in Electron)
export const initAnalytics = async () => {
  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && window.electron;
  
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

export default app; 