// components/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC7anqoPmJ4oO9WexAnsjE8mulzV1vEKcA",
  authDomain: "real-social-meet.firebaseapp.com",
  projectId: "real-social-meet",
  storageBucket: "real-social-meet.appspot.com",
  messagingSenderId: "127740805841",
  appId: "1:127740805841:web:31dbb7cc27ff8fc29bfbf0",
  measurementId: "G-B6470ZZT1Z"
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with React Native Async Storage for persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
