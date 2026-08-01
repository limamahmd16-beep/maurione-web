// إعداد Firebase لتطبيق MauriOne
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZesOt5_hf4GGbe3PDTF34HZJFa2ukBlQ",
  authDomain: "maurione-cefcd.firebaseapp.com",
  projectId: "maurione-cefcd",
  storageBucket: "maurione-cefcd.firebasestorage.app",
  messagingSenderId: "173408548887",
  appId: "1:173408548887:web:b174898b8abef3cd870452",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
