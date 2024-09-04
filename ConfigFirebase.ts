import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_1RHNY19lnRJSnVcVnCZPEOy5FLxRr0s",
  authDomain: "alter-cb4db.firebaseapp.com",
  projectId: "alter-cb4db",
  storageBucket: "alter-cb4db.appspot.com",
  messagingSenderId: "793249882381",
  appId: "1:793249882381:web:5674fe3ac98cbdd58fd044",
  measurementId: "G-XFC2K8PM86"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error during Google sign-in:", error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error during logout:", error);
  }
};
// const app = initializeApp(firebaseConfig);

// Export the app so it can be used elsewhere
export { app };
