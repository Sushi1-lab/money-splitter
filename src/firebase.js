import {
  initializeApp,
} from "firebase/app";

import {
  getAuth,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJ4F7BVnVsYHbhJJcjOl5ijkDjF3kfHIk",
  authDomain: "splitter-db.firebaseapp.com",
  projectId: "splitter-db",
  storageBucket: "splitter-db.firebasestorage.app",
  messagingSenderId: "2979940330",
  appId: "1:2979940330:web:87342368f82aac44d69493",
  measurementId: "G-973WYBXQ6S"
};

const app =
  initializeApp(
    firebaseConfig
  );

const auth =
  getAuth(app);

const db =
  getFirestore(app);

console.log(
  "🔥 FIREBASE PROJECT:",
  firebaseConfig.projectId
);

export {
  app,
  auth,
  db,
};