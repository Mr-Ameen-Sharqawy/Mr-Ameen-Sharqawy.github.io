import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getFirestore, runTransaction } from "firebase/firestore";

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
const DEVICE_STORAGE_KEY = "vocflashcard-public-device-v1";
const allowedGradeValues = ["grade4", "grade5", "grade6"] as const;

const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
export { onAuthStateChanged };

export type StudentGrade = typeof allowedGradeValues[number];
export type StudentAccess = {
  allowedGrades: StudentGrade[];
  maxDevices: number;
  username: string;
};

export class StudentAccessError extends Error {
  constructor(readonly code: "account-disabled" | "device-limit" | "access-missing" | "no-grade") {
    super(code);
  }
}

function browserDeviceId() {
  let value = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!value) {
    value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_STORAGE_KEY, value);
  }
  return value;
}

function asGrades(value: unknown): StudentGrade[] {
  return Array.isArray(value) ? value.filter((grade): grade is StudentGrade => typeof grade === "string" && allowedGradeValues.includes(grade as StudentGrade)) : [];
}

export async function registerStudentDeviceAndLoadAccess(uid: string): Promise<StudentAccess> {
  const deviceId = browserDeviceId();
  const accessRef = doc(firebaseDb, "studentAccess", uid);

  return runTransaction(firebaseDb, async (transaction) => {
    const snapshot = await transaction.get(accessRef);
    if (!snapshot.exists()) throw new StudentAccessError("access-missing");

    const data = snapshot.data();
    if (data.active !== true) throw new StudentAccessError("account-disabled");

    const allowedGrades = asGrades(data.allowedGrades);
    if (!allowedGrades.length) throw new StudentAccessError("no-grade");

    const maxDevices = typeof data.maxDevices === "number" && Number.isInteger(data.maxDevices) && data.maxDevices > 0 ? data.maxDevices : 1;
    const devices = data.devices && typeof data.devices === "object" && !Array.isArray(data.devices) ? data.devices as Record<string, unknown> : {};
    if (!(deviceId in devices) && Object.keys(devices).length >= maxDevices) throw new StudentAccessError("device-limit");

    transaction.update(accessRef, {
      devices: {
        ...devices,
        [deviceId]: { lastSeenAt: Date.now() },
      },
    });

    return {
      allowedGrades,
      maxDevices,
      username: typeof data.username === "string" && data.username ? data.username : "طالب",
    };
  });
}

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
