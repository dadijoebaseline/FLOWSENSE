import { authAdmin } from './firebaseAdmin.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ADMIN_EMAIL = normalizeEmail(process.env.VITE_ADMIN_EMAIL || '');
export const isAdminEmail = (email) => normalizeEmail(email) === ADMIN_EMAIL;

export async function verifyFirebaseIdToken(idToken) {
  if (!idToken) throw new Error('Missing Firebase ID token');
  const decoded = await authAdmin.verifyIdToken(idToken);
  if (!decoded || !decoded.uid) {
    throw new Error('Invalid Firebase ID token');
  }
  return decoded;
}
