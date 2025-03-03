import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAYiGnMtja6l6WbriZtC_iNEd2XDmwzwiI",
  authDomain: "transportes-72b58.firebaseapp.com",
  projectId: "transportes-72b58",
  storageBucket: "transportes-72b58.firebasestorage.app",
  messagingSenderId: "86136187059",
  appId: "1:86136187059:web:5e7f7fb3846c1f72eba8c6",
  measurementId: "G-870TE9ZQ0F",
};

const firebaseApp = initializeApp(firebaseConfig);

export default firebaseApp;

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);
