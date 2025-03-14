declare module 'firebase' {
  import { FirebaseApp } from 'firebase/app';
  import { Auth, User } from 'firebase/auth';
  import { Firestore } from 'firebase/firestore';
  import { Analytics } from 'firebase/analytics';
  
  export interface Firebase {
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    analytics: Analytics;
  }
  
  export * from 'firebase/app';
  export * from 'firebase/auth';
  export * from 'firebase/firestore';
  export * from 'firebase/storage';
  export * from 'firebase/analytics';
} 