import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCT-2rFzIT5wYQJ5ZLMlynMcIhnaLxWqvU",
  authDomain: "ai-safety-dashboard.firebaseapp.com",
  projectId: "ai-safety-dashboard",
  storageBucket: "ai-safety-dashboard.firebasestorage.app",
  messagingSenderId: "608408118860",
  appId: "1:608408118860:web:9ca240b3827e949e13f6e9",
  databaseURL: "https://ai-safety-dashboard-default-rtdb.firebaseio.com"
};

export const app      = initializeApp(firebaseConfig);
export const rtdb     = getDatabase(app);    // Realtime Database — blackspots + user_reports
export const storage  = getStorage(app);     // Firebase Storage — report images
export const db       = getFirestore(app);   // Firestore — reserved / future use
