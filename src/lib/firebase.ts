import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  type Firestore
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Configure Firestore with databaseId if custom partition specified
const firestoreDbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== "" 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined;

export const db: Firestore = firestoreDbId 
  ? getFirestore(app, firestoreDbId) 
  : getFirestore(app);

// Helper for Google Sign-In
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Store user basic profile in isolated users collection
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? "Journaler",
      photoURL: user.photoURL ?? null,
      lastLoginAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return user;
  } catch (error) {
    console.error("Firebase Auth Sign-In Error:", error);
    throw error;
  }
}

// Helper for Sign Out
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}
