// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAV1c4QgL0DjUcsZXvwcjis20oYpk4d-fA",
  authDomain: "roommatesapp-b4640.firebaseapp.com",
  projectId: "roommatesapp-b4640",
  storageBucket: "roommatesapp-b4640.firebasestorage.app",
  messagingSenderId: "511651646669",
  appId: "1:511651646669:web:7f6b1fad0eb4d077a7ed84",
  measurementId: "G-XDRTTX89G6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);