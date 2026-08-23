import { getApps, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, deleteUser, getAuth, signOut, type User } from "firebase/auth";
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { firebaseConfig, firebaseDb, type StudentGrade, usernameToFirebaseEmail } from "./firebase-auth";

export const TEACHER_UID = "4gDzRFRfacN8SpB9zv6iigSmQGD3";
export const MANAGEABLE_GRADES: StudentGrade[] = ["grade4", "grade5", "grade6"];
export const PRACTICAL_TEST_DEVICE_LIMIT = 1000;

export type ManagedStudent = {
  uid: string;
  username: string;
  active: boolean;
  maxDevices: number;
  allowedGrades: StudentGrade[];
  deviceCount: number;
};

export type StudentDraft = {
  username: string;
  password: string;
  maxDevices: number;
  allowedGrades: StudentGrade[];
};

function assertTeacher(teacherUid: string) {
  if (teacherUid !== TEACHER_UID) throw new Error("غير مصرح بإدارة الحسابات.");
}

function sanitizeGrades(value: unknown): StudentGrade[] {
  return Array.isArray(value) ? value.filter((grade): grade is StudentGrade => MANAGEABLE_GRADES.includes(grade as StudentGrade)) : [];
}

function asManagedStudent(uid: string, data: Record<string, unknown>): ManagedStudent {
  const devices = data.devices && typeof data.devices === "object" && !Array.isArray(data.devices) ? data.devices as Record<string, unknown> : {};
  return {
    uid,
    username: typeof data.username === "string" ? data.username : "بدون اسم",
    active: data.active === true,
    maxDevices: typeof data.maxDevices === "number" && Number.isInteger(data.maxDevices) && data.maxDevices > 0 ? data.maxDevices : 1,
    allowedGrades: sanitizeGrades(data.allowedGrades),
    deviceCount: Object.keys(devices).length,
  };
}

function provisioningAuth() {
  const app = getApps().find((item) => item.name === "teacher-provisioning") ?? initializeApp(firebaseConfig, "teacher-provisioning");
  return getAuth(app);
}

export function isTeacher(uid: string) {
  return uid === TEACHER_UID;
}

export async function listManagedStudents(teacherUid: string): Promise<ManagedStudent[]> {
  assertTeacher(teacherUid);
  const snapshot = await getDocs(collection(firebaseDb, "studentAccess"));
  return snapshot.docs
    .filter((item) => item.id !== TEACHER_UID)
    .map((item) => asManagedStudent(item.id, item.data()))
    .sort((left, right) => left.username.localeCompare(right.username));
}

export async function createManagedStudent(teacherUid: string, draft: StudentDraft) {
  assertTeacher(teacherUid);
  const username = draft.username.trim().toLowerCase();
  const allowedGrades = sanitizeGrades(draft.allowedGrades);
  if (!allowedGrades.length) throw new Error("اختر صفًا واحدًا على الأقل.");
  if (!Number.isInteger(draft.maxDevices) || draft.maxDevices < 1 || draft.maxDevices > PRACTICAL_TEST_DEVICE_LIMIT) throw new Error(`عدد الأجهزة يجب أن يكون من 1 إلى ${PRACTICAL_TEST_DEVICE_LIMIT}.`);
  if (draft.password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");

  const auth = provisioningAuth();
  let createdUser: User | null = null;
  try {
    const credential = await createUserWithEmailAndPassword(auth, usernameToFirebaseEmail(username), draft.password);
    createdUser = credential.user;
    await setDoc(doc(firebaseDb, "studentAccess", createdUser.uid), {
      username,
      active: true,
      maxDevices: draft.maxDevices,
      allowedGrades,
      devices: {},
    });
    return { uid: createdUser.uid, username };
  } catch (error) {
    if (createdUser) await deleteUser(createdUser).catch(() => undefined);
    throw error;
  } finally {
    await signOut(auth).catch(() => undefined);
  }
}

export async function updateManagedStudent(teacherUid: string, student: Pick<ManagedStudent, "uid" | "active" | "maxDevices" | "allowedGrades">) {
  assertTeacher(teacherUid);
  const allowedGrades = sanitizeGrades(student.allowedGrades);
  if (!allowedGrades.length) throw new Error("اختر صفًا واحدًا على الأقل.");
  if (!Number.isInteger(student.maxDevices) || student.maxDevices < 1 || student.maxDevices > PRACTICAL_TEST_DEVICE_LIMIT) throw new Error(`عدد الأجهزة يجب أن يكون من 1 إلى ${PRACTICAL_TEST_DEVICE_LIMIT}.`);
  await updateDoc(doc(firebaseDb, "studentAccess", student.uid), {
    active: student.active,
    maxDevices: student.maxDevices,
    allowedGrades,
  });
}

export async function clearManagedStudentDevices(teacherUid: string, studentUid: string) {
  assertTeacher(teacherUid);
  await updateDoc(doc(firebaseDb, "studentAccess", studentUid), { devices: {} });
}
