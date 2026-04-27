import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, push, serverTimestamp, onValue, off } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBLAmXfNfrEmw3LDaR3P6mrSw-Mx8XmtDU",
  authDomain: "itecc06-a4afc.firebaseapp.com",
  databaseURL: "https://itecc06-a4afc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "itecc06-a4afc",
  storageBucket: "itecc06-a4afc.appspot.com",
  messagingSenderId: "139494914031",
  appId: "1:139494914031:web:888b4d541070c4d3f9e81a",
  measurementId: "G-S88JSZP9LE"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Hot reload can re-run initializeAuth; fallback to existing instance.
  auth = getAuth(app);
}

export {
  db,
  auth,
  ref,
  set,
  get,
  update,
  push,
  serverTimestamp,
  onValue,
  off,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
};