import { firestore } from './firebaseAdmin.js';
import { v4 as uuidv4 } from 'uuid';

const SESSION_COLLECTION = 'flowsense_sessions';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId) {
  const sessionId = `sess-${uuidv4()}`;
  const now = Date.now();
  const session = { userId, createdAt: now };
  await firestore.collection(SESSION_COLLECTION).doc(sessionId).set({
    ...session,
    updatedAt: now,
  });
  return { sessionId, session };
}

export async function getSession(sessionId) {
  if (!sessionId) return null;

  const doc = await firestore.collection(SESSION_COLLECTION).doc(sessionId).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  const age = Date.now() - data.createdAt;
  if (age > SESSION_TTL_MS) {
    await deleteSession(sessionId);
    return null;
  }

  return { userId: data.userId, createdAt: new Date(data.createdAt).toISOString() };
}

export async function deleteSession(sessionId) {
  if (!sessionId) return false;
  await firestore.collection(SESSION_COLLECTION).doc(sessionId).delete();
  return true;
}
