# Firebase Custom Claims Setup Guide

This guide explains how to set up Firebase custom claims for admin role management with Firestore security.

## Why Custom Claims?

Custom claims add an extra layer of security by:
- Enforcing admin privileges at the Firestore security rule level
- Ensuring only admins can read/write the users collection
- Using Firebase's built-in role system instead of email-based fallback

## Prerequisites

1. **Service Account JSON**: Download from Firebase Console
   - Go to: https://console.firebase.google.com/u/3/project/mybilltcwd/settings/serviceaccounts/adminsdk
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in project root

2. **Admin Email**: Must be set in your `.env` file
   ```
   VITE_ADMIN_EMAIL=dadijoebaseline@gmail.com
   ```

3. **User must exist in Firebase Auth**: Sign in at least once with the admin email at https://tcwdflowsense.vercel.app before running the setup

## Setup Steps

### 1. Add Dependencies

```bash
npm install firebase-admin dotenv
```

### 2. Download Service Account Key

1. Go to [Firebase Console - Service Accounts](https://console.firebase.google.com/u/3/project/mybilltcwd/settings/serviceaccounts/adminsdk)
2. Click "Node.js" tab
3. Click "Generate New Private Key"
4. Save as `serviceAccountKey.json` in project root (KEEP THIS SECRET! Add to .gitignore)

### 3. Set Environment Variable

**On Linux/Mac**:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/serviceAccountKey.json"
```

**On Windows (PowerShell)**:
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "$PWD/serviceAccountKey.json"
```

**Or use a `.env.local` file**:
```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### 4. Run Setup Script

```bash
node scripts/setup-admin-claims.js
```

**Expected output**:
```
🔍 Setting up admin custom claims...
   Admin email: dadijoebaseline@gmail.com
✓ Found user: dadijoebaseline@gmail.com (UID: xyz...)
✓ Set custom claim: admin=true
✓ Verified custom claims: { admin: true }

✅ Success! Admin claims set for dadijoebaseline@gmail.com

Note: Custom claims take effect on next login/token refresh
```

### 5. Update Firestore Security Rules

1. Go to [Firebase Console - Firestore Rules](https://console.firebase.google.com/u/3/project/mybilltcwd/firestore/rules)
2. Replace existing rules with the content from `firestore.rules`
3. Click "Publish"

### 6. Test

1. Log out from https://tcwdflowsense.vercel.app
2. Log back in with your admin email
3. Navigate to Admin Panel → Users
4. Should now see all 8 users from Firestore

## How It Works

### Client-Side (React)

1. User logs in with Google OAuth
2. `AuthContext.jsx` checks:
   - First: Firebase custom claim `admin: true` 
   - Fallback: Email matches `VITE_ADMIN_EMAIL`
3. Sets user role to `'admin'` or `'viewer'`
4. Only admins can access `/admin/users` page

### Server-Side (Firestore)

1. Admin tries to read `flowsense_users` collection
2. Firestore checks: `request.auth.token.admin == true`
3. Only grants access to users with admin custom claim

### Fallback (Before Custom Claims Setup)

- If custom claim not set yet, falls back to email-based role
- Allows time to run setup script without breaking existing functionality
- After setup, custom claim takes priority

## Troubleshooting

### "User not found" error

**Problem**: Script says user doesn't exist  
**Solution**: Sign in once at https://tcwdflowsense.vercel.app with your admin email first

### "GOOGLE_APPLICATION_CREDENTIALS env var not set"

**Problem**: Can't find service account file  
**Solution**: 
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
# Then run script
node scripts/setup-admin-claims.js
```

### "Custom claims not taking effect"

**Problem**: Still seeing old role after setup  
**Solution**: Custom claims require a new token:
1. Clear browser cookies
2. Log out and log back in
3. Or wait for automatic token refresh (1 hour)

### "Permission denied" reading Firestore

**Problem**: Firestore rules rejecting reads  
**Solution**:
1. Confirm custom claim was set: `node scripts/setup-admin-claims.js`
2. Check Firestore rules are published (green checkmark)
3. Clear browser cache and refresh

## Reverting Custom Claims

To remove admin custom claims:

```bash
node -e "
import admin from 'firebase-admin';
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.auth().setCustomUserClaims('USER_UID', null).then(() => {
  console.log('✓ Claims removed');
  process.exit(0);
});
"
```

Replace `USER_UID` with the actual Firebase UID.

## Security Notes

⚠️ **IMPORTANT**: Keep `serviceAccountKey.json` secret!
- Add to `.gitignore` (already included in default .gitignore)
- Never commit to git
- Never share publicly
- Treat like a password

## Next Steps

After setup:
- Custom claims are now primary auth method
- Email fallback is secondary (for backwards compatibility)
- Admin users can access `/admin/users` and read Firestore users list
- Firestore enforces rules at database level for extra security
