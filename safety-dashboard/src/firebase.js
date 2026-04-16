import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCT-2rFzIT5wYQJ5ZLMlynMcIhnaLxWqvU",
  authDomain: "ai-safety-dashboard.firebaseapp.com",
  projectId: "ai-safety-dashboard",
  storageBucket: "ai-safety-dashboard.firebasestorage.app",
  messagingSenderId: "608408118860",
  appId: "1:608408118860:web:9ca240b3827e949e13f6e9"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
