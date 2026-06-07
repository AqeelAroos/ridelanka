import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDTcXYdavDjwEtRxDHem8vtw7FURcJCu_Q",
  authDomain: "fir-proj1-36d47.firebaseapp.com",
  projectId: "fir-proj1-36d47",
  storageBucket: "fir-proj1-36d47.firebasestorage.app",
  messagingSenderId: "618106359202",
  appId: "1:618106359202:web:4e439e036b3a40ca84f6fb"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
