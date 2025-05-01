import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, push, serverTimestamp } from "firebase/database";

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

export { db, ref, set, get, update, push, serverTimestamp };