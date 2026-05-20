import { firestore } from './firebaseAdmin.js';

const USERS_COLLECTION = 'flowsense_users';
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const snapshotToUser = (doc) => {
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.name || 'User',
    email: data.email || '',
    role: data.role || 'viewer',
    banned: data.banned || false,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

export async function getUsers() {
  const snapshot = await firestore.collection(USERS_COLLECTION).get();
  return snapshot.docs.map(snapshotToUser);
}

export async function getAllUsers() {
  return getUsers();
}

export async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  const snapshot = await firestore.collection(USERS_COLLECTION)
    .where('email', '==', normalized)
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshotToUser(snapshot.docs[0]);
}

export async function findUserById(id) {
  if (!id) return null;
  const doc = await firestore.collection(USERS_COLLECTION).doc(id).get();
  return doc.exists ? snapshotToUser(doc) : null;
}

export async function createOrUpdateUser({ id, name, email, role = 'viewer', banned = false }) {
  const normalizedEmail = normalizeEmail(email);
  const userId = id || normalizedEmail;
  const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
  const now = new Date().toISOString();
  const userData = {
    name: String(name || 'User').trim() || 'User',
    email: normalizedEmail,
    role,
    banned,
    updatedAt: now,
  };

  const existing = await userRef.get();
  if (!existing.exists) {
    userData.createdAt = now;
  } else {
    const existingData = existing.data() || {};
    userData.createdAt = existingData.createdAt || now;
  }

  await userRef.set(userData, { merge: true });
  return findUserById(userId);
}

export async function updateUserRoleById(userId, role) {
  const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
  await userRef.update({ role, updatedAt: new Date().toISOString() });
  return findUserById(userId);
}

export async function banUserById(userId, banned) {
  const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
  await userRef.update({ banned, updatedAt: new Date().toISOString() });
  return findUserById(userId);
}

export async function deleteUserById(userId) {
  const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
  await userRef.delete();
  return { id: userId };
}
