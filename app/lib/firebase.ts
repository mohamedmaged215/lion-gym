import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCFLdWL_8XkiJDWG1ONnYaDqbIOMP3weUo",
  authDomain: "lion-gym-78e59.firebaseapp.com",
  projectId: "lion-gym-78e59",
  storageBucket: "lion-gym-78e59.firebasestorage.app",
  messagingSenderId: "968912018521",
  appId: "1:968912018521:web:289b33b0a7fa27af586548",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);