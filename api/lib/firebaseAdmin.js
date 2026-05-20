import admin from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  const credential = serviceAccountKey
    ? admin.credential.cert(JSON.parse(serviceAccountKey))
    : admin.credential.applicationDefault();

  admin.initializeApp({
    credential,
    projectId,
  });
}

export const authAdmin = admin.auth();
export const firestore = admin.firestore();
