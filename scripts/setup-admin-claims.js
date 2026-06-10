#!/usr/bin/env node
/**
 * Firebase Custom Claims Setup Script
 * Sets admin: true custom claim for admin users
 * 
 * Usage: node scripts/setup-admin-claims.js
 * 
 * Prerequisites:
 * 1. GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
 * 2. Admin SDK initialized with service account credentials
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ADMIN_EMAIL = (process.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();

if (!ADMIN_EMAIL) {
  console.error('❌ Error: VITE_ADMIN_EMAIL not set in .env');
  process.exit(1);
}

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS env var not set');
  console.error('   Set it to point to your Firebase service account JSON file');
  console.error('   Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"');
  process.exit(1);
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Error: Service account file not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const auth = admin.auth();

async function setupAdminClaims() {
  try {
    console.log('🔍 Setting up admin custom claims...');
    console.log(`   Admin email: ${ADMIN_EMAIL}`);

    // Get user by email
    const user = await auth.getUserByEmail(ADMIN_EMAIL);
    console.log(`✓ Found user: ${user.email} (UID: ${user.uid})`);

    // Set custom claim
    await auth.setCustomUserClaims(user.uid, { admin: true });
    console.log('✓ Set custom claim: admin=true');

    // Verify claim was set
    const updatedUser = await auth.getUser(user.uid);
    console.log('✓ Verified custom claims:', updatedUser.customClaims);

    console.log('\n✅ Success! Admin claims set for', ADMIN_EMAIL);
    console.log('\nNote: Custom claims take effect on next login/token refresh');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('   User not found. Make sure the user has signed in at least once.');
    }
    process.exit(1);
  }
}

setupAdminClaims();
