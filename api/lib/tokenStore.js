import { firestore } from './firebaseAdmin.js';
import { v4 as uuidv4 } from 'uuid';

const LOGIN_TOKEN_COLLECTION = 'flowsense_login_tokens';
const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function createLoginToken(userId) {
  const token = uuidv4();
  const now = Date.now();
  await firestore.collection(LOGIN_TOKEN_COLLECTION).doc(token).set({
    userId,
    createdAt: now,
  });
  return token;
}

export async function getLoginToken(token) {
  if (!token) return null;

  const doc = await firestore.collection(LOGIN_TOKEN_COLLECTION).doc(token).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  const age = Date.now() - data.createdAt;
  if (age > LOGIN_TOKEN_TTL_MS) {
    await deleteLoginToken(token);
    return null;
  }

  return { userId: data.userId };
}

export async function deleteLoginToken(token) {
  if (!token) return false;
  await firestore.collection(LOGIN_TOKEN_COLLECTION).doc(token).delete();
  return true;
}
