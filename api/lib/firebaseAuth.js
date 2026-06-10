import { authAdmin } from './firebaseAdmin.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ADMIN_EMAIL = normalizeEmail(process.env.VITE_ADMIN_EMAIL || '');
const ADMIN_UID = String(process.env.ADMIN_UID || process.env.VITE_ADMIN_UID || '').trim();

export const isAdminEmail = (email) => normalizeEmail(email) === ADMIN_EMAIL;
export const isAdminUser = ({ email, uid } = {}) => {
  if (uid && ADMIN_UID && uid === ADMIN_UID) return true;
  return isAdminEmail(email);
};

export async function verifyFirebaseIdToken(idToken) {
  if (!idToken) throw new Error('Missing Firebase ID token');
  const decoded = await authAdmin.verifyIdToken(idToken);
  if (!decoded || !decoded.uid) {
    throw new Error('Invalid Firebase ID token');
  }
  return decoded;
}
