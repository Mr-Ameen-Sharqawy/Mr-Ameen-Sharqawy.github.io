import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2DspjY_SmVWTyl4GmlV25mv3RvJlu778",
  authDomain: "vocabulary-479b7.firebaseapp.com",
  projectId: "vocabulary-479b7",
  storageBucket: "vocabulary-479b7.firebasestorage.app",
  messagingSenderId: "872231679220",
  appId: "1:872231679220:web:41ccbdd1d687738a791aa1",
  measurementId: "G-QQCR291M70",
};

const STUDENT_EMAIL_DOMAIN = "students.vocflashcard.app";

export const firebaseAuth = getAuth(initializeApp(firebaseConfig));
export { onAuthStateChanged };

export function usernameToFirebaseEmail(username: string) {
  const normalized = username.trim().toLowerCase().replace(/\s+/g, ".");
  if (!/^[a-z0-9._-]{3,32}$/.test(normalized)) {
    throw new Error("اكتب اسم مستخدم من 3 إلى 32 حرفًا أو رقمًا إنجليزيًا.");
  }
  return `${normalized}@${STUDENT_EMAIL_DOMAIN}`;
}

export function usernameFromFirebaseEmail(email: string | null) {
  const suffix = `@${STUDENT_EMAIL_DOMAIN}`;
  return email?.endsWith(suffix) ? email.slice(0, -suffix.length) : "طالب";
}

export async function signInWithUsername(username: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, usernameToFirebaseEmail(username), password);
}

export async function signOutStudent() {
  return signOut(firebaseAuth);
}
