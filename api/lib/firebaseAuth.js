import { decodeProtectedHeader, importX509, jwtVerify } from 'jose';

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts = null;
let certsExpiry = 0;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ADMIN_EMAIL = normalizeEmail(process.env.VITE_ADMIN_EMAIL || '');
export const isAdminEmail = (email) => normalizeEmail(email) === ADMIN_EMAIL;

async function getFirebaseCerts() {
  const now = Date.now();
  if (cachedCerts && certsExpiry > now) {
    return cachedCerts;
  }

  const response = await fetch(FIREBASE_CERTS_URL);
  if (!response.ok) {
    throw new Error('Unable to fetch Firebase certs');
  }

  const cacheControl = response.headers.get('cache-control');
  if (cacheControl) {
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    if (maxAgeMatch) {
      certsExpiry = now + Number(maxAgeMatch[1]) * 1000;
    }
  }

  cachedCerts = await response.json();
  return cachedCerts;
}

export async function verifyFirebaseIdToken(idToken) {
  if (!idToken) throw new Error('Missing Firebase ID token');
  if (!FIREBASE_PROJECT_ID) throw new Error('Firebase project ID is not configured');

  const header = decodeProtectedHeader(idToken);
  const certs = await getFirebaseCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error('Firebase cert not found');
  }

  const key = await importX509(cert, header.alg);
  const { payload } = await jwtVerify(idToken, key, {
    issuer: FIREBASE_ISSUER,
    audience: FIREBASE_PROJECT_ID,
  });

  if (!payload.sub) {
    throw new Error('Invalid Firebase ID token payload');
  }

  return payload;
}
