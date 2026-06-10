import admin from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const serviceAccount = serviceAccountKey ? JSON.parse(serviceAccountKey) : null;
const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  serviceAccount?.project_id;

if (!admin.apps.length) {
  if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS in your environment.'
    );
  }

  const credential = serviceAccount
    ? admin.credential.cert(serviceAccount)
    : admin.credential.applicationDefault();

  const initOptions = { credential };
  if (projectId) {
    initOptions.projectId = projectId;
  }

  admin.initializeApp(initOptions);
}

export const authAdmin = admin.auth();
export const firestore = admin.firestore();
