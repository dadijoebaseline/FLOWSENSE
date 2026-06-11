# Authentication & Role-Based Access Control

**Date Implemented**: 2026-06-10  
**Last Updated**: 2026-06-11  
**Version**: v1.0.1 Manager Analytics Update  
**Status**: ✅ Complete and Deployed to Production

---

## Overview

FlowSense implements a three-tier role-based access control (RBAC) system with Firebase Google OAuth authentication. The system gracefully handles static deployment scenarios where backend APIs are unavailable.

---

## Authentication Flow

### 1. User Login

```
User clicks "Login with Google"
         ↓
Firebase signInWithPopup()
         ↓
Google OAuth dialog (opens in popup)
         ↓
User authenticates with Google
         ↓
Firebase returns authenticated user object
         ↓
Extract Firebase user email & ID token
         ↓
Call fetchUserSession(idToken, firebaseUser)
```

### 2. Session Verification

**Scenario A: Backend Available**
```
fetchUserSession(idToken, firebaseUser)
         ↓
POST to /api/auth/session with Bearer token
         ↓
Backend verifies token via Firebase Admin SDK
         ↓
Backend checks user database for existing role
         ↓
Return { user: { email, role, name, ... } }
```

**Scenario B: Static Deployment (No Backend)**
```
fetchUserSession(idToken, firebaseUser)
         ↓
POST to /api/auth/session returns 404
         ↓
Catch 404 → Use firebaseUser.email
         ↓
Return { user: { email: firebaseUser.email, name: firebaseUser.displayName } }
```

### 3. Role Assignment

**Three-Tier Role Resolution** (in order of priority):

```
User email received from Firebase
         ↓
Normalize email (trim, lowercase)
         ↓
Step 1: Check Firebase Custom Claims
    ├─ IF customClaims.admin === true → role: 'admin' ✓
    └─ IF customClaims.manager === true → role: 'manager' ✓
         ↓
Step 2: Query Firestore (if Step 1 fails)
    ├─ Try: doc(firestore, 'flowsense_users', normalizedEmail)
    ├─ Fallback: query collection where email == normalizedEmail
    ├─ IF found AND role in ['admin','manager','viewer'] → return role ✓
    └─ IF not found → continue to Step 3
         ↓
Step 3: Fallback to Email Matching
    ├─ IF normalizedEmail === VITE_ADMIN_EMAIL → role: 'admin' ✓
    └─ ELSE → role: 'viewer' ✓
         ↓
Store user with assigned role in AuthContext
```

**Firestore Collection** (`flowsense_users`):
```javascript
{
  [documentId: normalizedEmail]: {
    email: "user@gmail.com",
    name: "User Name",
    role: "viewer|manager|admin",
    banned: false,
    createdAt: "2026-06-11T...",
    updatedAt: "2026-06-11T..."
  }
}
```

**Priority Notes**:
1. Custom claims take precedence (for backend-managed security)
2. Firestore role overrides email matching (for admin-assigned roles)
3. Email matching is final fallback (for predetermined admins)

---

## Role Definitions

### Admin Role
**Purpose**: Full platform access + user management  
**Conditions**:
- Email matches `VITE_ADMIN_EMAIL` environment variable
- OR uid matches `ADMIN_UID` (for backend scenarios)

**Permissions**:
```javascript
{
  canViewAnalytics: true,      // ✅ Full analytics access
  canViewDashboard: true,      // ✅ Dashboard with KPIs
  canViewMap: true,            // ✅ Interactive map
  canViewAnomalyList: true,    // ✅ Anomaly table & export
  canApproveUsers: true,       // ✅ User management page
  canTriggerDetection: true    // ✅ Admin controls
}
```

**Sidebar Access**:
- Dashboard
- Analytics (5 modules)
- Map
- Anomalies
- **Users** (admin panel)

---

### Manager Role
**Purpose**: Operations team access with analytics visibility  
**Conditions**:
- Assigned by admin via admin panel (`/admin/users`)
- Stored in Firestore `flowsense_users` collection with role field
- Can be promoted from `viewer` to `manager`

**Permissions**:
```javascript
{
  canViewAnalytics: true,      // ✅ Analytics access (NEW in v1.0.1)
  canViewDashboard: true,      // ✅ Dashboard overview
  canViewMap: true,            // ✅ Interactive map
  canViewAnomalyList: true,    // ✅ Anomaly viewing
  canTriggerDetection: false   // ❌ No admin controls
}
```

**Sidebar Access**:
- Dashboard
- Analytics (all 5 modules)
- Map
- Anomalies

---

### Viewer Role
**Purpose**: Read-only access to core features  
**Conditions**:
- Default for all new users
- No admin email match

**Permissions**:
```javascript
{
  canViewAnalytics: false,     // ❌ No analytics
  canViewDashboard: false,     // ❌ No dashboard
  canViewMap: true,            // ✅ Map only
  canViewAnomalyList: true,    // ✅ Anomalies only
  canTriggerDetection: false   // ❌ No controls
}
```

**Sidebar Access**:
- Map
- Anomalies

---

## Implementation Details

### Core Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/AuthContext.jsx` | Main auth context + role assignment (3-tier) | ✅ Live |
| `src/lib/roleAccess.js` | Permission matrix per role | ✅ Live |
| `src/lib/firebase.js` | Firebase SDK + Firestore export | ✅ Live |
| `src/components/ProtectedRoute.jsx` | Route protection + fallback | ✅ Live |
| `src/components/layout/AppLayout.jsx` | Permission-based navigation | ✅ Live |
| `src/pages/AdminUsers.jsx` | Admin user management (NEW) | ✅ Live |
| `.github/instructions/custom-claims.instructions.md` | Custom claims setup guide (Optional) | 📄 Docs |
| `scripts/setup-admin-claims.js` | Custom claims setup script (Optional) | 📄 Script |
| `firestore.rules` | Firestore security rules (Optional) | 📄 Rules |

### Key Code Segments

#### 1. Admin Email Configuration
```javascript
// src/lib/AuthContext.jsx (Lines 8-9)
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ADMIN_EMAIL = normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL || '');
```

#### 2. Three-Tier Role Resolution (NEW)
```javascript
// src/lib/AuthContext.jsx (Lines 13-50)
const getRoleFromFirestore = async (userEmail) => {
  try {
    const normalizedEmail = normalizeEmail(userEmail);
    
    // Try doc lookup first
    const userRef = doc(firestore, 'flowsense_users', normalizedEmail);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && isValidRole(userSnap.data().role)) {
      return userSnap.data().role;
    }
    
    // Fallback: query collection by email field
    const q = query(collection(firestore, 'flowsense_users'), 
                   where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    if (snapshot.size > 0 && isValidRole(snapshot.docs[0].data().role)) {
      return snapshot.docs[0].data().role;
    }
  } catch (err) {
    console.debug('Could not fetch role from Firestore:', err.message);
  }
  return null;
};

const getRoleFromCustomClaimsOrEmail = async (firebaseUser, session) => {
  const userEmail = session?.user?.email || firebaseUser?.email || '';
  
  // Step 1: Check custom claims
  if (firebaseUser) {
    const idTokenResult = await firebaseUser.getIdTokenResult(true);
    if (idTokenResult.claims.admin === true) return 'admin';
    if (idTokenResult.claims.manager === true) return 'manager';
  }
  
  // Step 2: Check Firestore
  const firestoreRole = await getRoleFromFirestore(userEmail);
  if (firestoreRole) return firestoreRole;
  
  // Step 3: Check email matching
  return getRoleFromEmail(userEmail);
};
```

#### 3. Admin Panel User Management (NEW)
```javascript
// src/pages/AdminUsers.jsx
// Features:
// - Fetch all users from Firestore collection
// - Update role (viewer ↔ manager ↔ admin)
// - Ban/unban users
// - Delete users

const handleUpdate = async (userId, updates) => {
  const userRef = doc(firestore, 'flowsense_users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};
```

#### 4. Permission-Based Navigation
```javascript
// src/components/layout/AppLayout.jsx (Lines 35-45)
const navItems = [
  perms.canViewDashboard && { path: '/', label: 'Dashboard', ... },
  perms.canViewAnalytics && { path: '/analytics', label: 'Analytics', ... },
  perms.canApproveUsers && { path: '/admin/users', label: 'Users', ... },
  perms.canViewAnomalyList && { path: '/anomalies', label: 'Anomalies', ... },
  perms.canViewMap && { path: '/map', label: 'Map', ... },
].filter(Boolean);
```

#### 5. Permission Matrix
```javascript
// src/lib/roleAccess.js
export const ROLE_PERMISSIONS = {
  admin: {
    canViewAnalytics: true,
    canViewDashboard: true,
    canViewMap: true,
    canViewAnomalyList: true,
    canApproveUsers: true,
    canTriggerDetection: true,
  },
  manager: {
    canViewAnalytics: true,     // Updated in v1.0.1
    canViewDashboard: true,
    canViewMap: true,
    canViewAnomalyList: true,
    canTriggerDetection: false,
  },
  viewer: {
    canViewAnalytics: false,
    canViewDashboard: false,
    canViewMap: true,
    canViewAnomalyList: true,
    canTriggerDetection: false,
  },
};
```

---

## User Management Panel

### Admin Panel (`/admin/users`)

**Access Control**:
- ✅ Accessible only by users with `canApproveUsers: true` (admin role)
- ❌ Redirects to 403 if user is not admin

**Features**:

| Feature | Implementation |
|---------|-----------------|
| **List Users** | Fetches from Firestore `flowsense_users` collection |
| **Update Role** | Dropdown: `viewer` → `manager` → `admin` (any direction) |
| **Ban User** | Checkbox toggle, updates `banned: true/false` |
| **Delete User** | Confirmation dialog, removes user document |
| **API Fallback** | Tries `/api/admin/users` first, falls back to Firestore |

**Backend API (Optional)**:
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/user` - Update user role or ban status
- `DELETE /api/admin/user` - Delete user

**Firestore Operations** (Current Implementation):
- Updates to `flowsense_users` collection directly from browser
- Email normalized for document ID lookup
- Timestamp updated on each change

### Admin Flow

```
Admin logs in
     ↓
Gets role: 'admin' (from VITE_ADMIN_EMAIL match)
     ↓
Navigation shows "Users" link
     ↓
Clicks /admin/users
     ↓
Frontend checks role
     ├─ IF admin → load page ✓
     └─ IF not admin → show 403 ✗
     ↓
Fetches users from Firestore
     ↓
Displays table with:
  - User name, email
  - Role dropdown
  - Ban checkbox
  - Delete button
     ↓
Admin selects actions → Updates Firestore
     ↓
Users see updated roles on next login
```

---

## Environment Configuration

### Required Variables

```bash
# .env.local (development)
VITE_ADMIN_EMAIL=dadijoebaseline@gmail.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Vercel (production)
# Set all VITE_* variables in project settings
```

### Admin Email Matching

The system normalizes and matches email addresses:

1. ✅ Trim whitespace from both sides
2. ✅ Convert to lowercase
3. ✅ Compare exact strings

**Examples**:
- ✅ `dadijoebaseline@gmail.com` = `VITE_ADMIN_EMAIL=dadijoebaseline@gmail.com`
- ✅ `DadiJoeBaseline@Gmail.Com` → normalized to `dadijoebaseline@gmail.com`, matches
- ❌ `admin@gmail.com` → no match, assigned `viewer` role

### Custom Claims (Optional Security Layer)

For backend deployments, use Firebase custom claims for admin role:

```bash
# Set via scripts/setup-admin-claims.js or Firebase Console
# User document gets: { admin: true } custom claim
```

---

## Static Deployment Behavior

### Vercel (Current)

**No Backend APIs**:
- ✅ OAuth works
- ✅ Firestore read/write works
- ✅ Admin panel works (Firestore-based)
- ✅ Role assignment works (email matching + Firestore)
- ❌ No API session endpoint (not needed)

**User Flow**:
```
User logs in → Firebase OAuth → Firestore role lookup → Navigation filtered
```

---

## Firestore Security (Optional)

## Firestore Security (Optional)

### Current (No Security Rules)
- Firestore is in test mode
- Authenticated users can read/write to `flowsense_users`
- Only admin panel uses this (admin app)

### Recommended (Production)
Deploy `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /flowsense_users/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

**Deployment**:
```bash
firebase deploy --only firestore:rules
```

---

## Recent Changes (v1.0.1)

### Commits
1. **9831499** - `feat: enable analytics access for manager role`
2. **470b4b1** - `fix: query Firestore for manager role`
3. **c0faa2c** - `fix: normalize email in Firestore queries`
4. **bd02778** - `fix: use doc.id directly for Firestore updates`
5. **f235ef8** - `fix: query Firestore email field for role`

### What Changed

| Change | Before | After | Why |
|--------|--------|-------|-----|
| Manager Analytics | `false` | `true` | Operations team needs analytics |
| Role Lookup | Email only | Firestore + Email | Support existing manager users |
| Email Normalization | None | Added | Consistent document lookup |
| Admin Panel | N/A | ✅ Working | Manage users in Firestore |
| Custom Claims | N/A | Optional setup | Future security layer |

---

## Testing Checklist

### Authentication
- ✅ User can log in with Google OAuth
- ✅ Google popup opens and closes correctly
- ✅ User redirected to dashboard after login
- ✅ User can log out
- ✅ Session persists on page refresh

### Role Assignment
- ✅ Admin email gets `role: 'admin'`
- ✅ Manager emails get `role: 'manager'` from Firestore
- ✅ Other emails get `role: 'viewer'` (default)
- ✅ Email normalization works (case-insensitive, trimmed)
- ✅ Firestore query works for existing manager users

### Access Control
- ✅ Admin can access all pages (Dashboard, Analytics, Map, Anomalies, Users)
- ✅ Manager can access (Dashboard, Analytics, Map, Anomalies)
- ✅ Viewer can only access (Map, Anomalies)
- ✅ Unauthorized routes show "Access denied" message
- ✅ Navigation sidebar reflects role permissions

### Admin Panel
- ✅ Admin can access `/admin/users`
- ✅ Lists all users from Firestore
- ✅ Can change role: `viewer` ↔ `manager` ↔ `admin`
- ✅ Can ban/unban users
- ✅ Can delete users
- ✅ Changes persist after user re-login

### Console Errors
- ✅ No 404 errors after login (gracefully handled)
- ✅ No auth errors
- ⚠️ COOP warnings (browser security warnings, not blocking)

---

## Future Enhancements

### Phase 6+ (Optional)

1. **Backend API Integration**
   - Deploy `/api/auth/session` endpoint
   - Deploy `/api/admin/users` and `/api/admin/user` endpoints
   - Move Firestore writes to backend for audit logs
   - Status: 📋 **Not Required** (Firestore direct writes work for Vercel)

2. **Firebase Custom Claims**
   - Set `admin: true` or `manager: true` custom claims
   - Firestore rules require `request.auth.token.admin == true`
   - Adds security layer (server-side role enforcement)
   - Setup: Run `npm run setup:admin-claims` (requires service account key)
   - Status: 📋 **Optional** (email-based roles sufficient)

3. **Extended RBAC**
   - Add `canEditAnomalies` permission
   - Add `canExportData` permission
   - Add role-based data filtering
   - Status: 📋 **Future Enhancement**

4. **Audit Logging**
   - Log role changes in Firestore
   - Log user actions (ban, delete, etc.)
   - Status: 📋 **Future Enhancement**

5. **User Approval Workflow**
   - Auto-add new users as `pending`
   - Admin approves to assign role
   - Status: 📋 **Future Enhancement**

---

## Architecture Diagrams

### Role Assignment Flow

```
User Signs In
     ↓
Firebase OAuth
     ↓
Extract: firebaseUser.email
     ↓
Normalize: trim + lowercase
     ↓
┌────────────────────────────────┐
│ getRoleFromCustomClaimsOrEmail │
├────────────────────────────────┤
│ 1. Check customClaims          │
│    ├─ admin claim → return 'admin'
│    └─ manager claim → return 'manager'
│ 2. Query Firestore             │
│    ├─ doc lookup               │
│    └─ collection query by email│
│ 3. Email matching              │
│    ├─ matches VITE_ADMIN_EMAIL → 'admin'
│    └─ default → 'viewer'       │
└────────────────────────────────┘
     ↓
Return: 'admin' | 'manager' | 'viewer'
     ↓
Set user.role in AuthContext
     ↓
Calculate permissions from roleAccess.js
     ↓
Filter navigation + protect routes
```

### Admin Panel Flow

```
Admin User Logs In
     ↓
AuthContext assigns role: 'admin'
     ↓
Navigation shows "Users" link
     ↓
Click /admin/users
     ↓
ProtectedRoute checks canApproveUsers: true
     ├─ If true → render AdminUsers.jsx
     └─ If false → show 403
     ↓
AdminUsers fetches users
     ├─ Try: GET /api/admin/users
     └─ Fallback: query Firestore collection
     ↓
Render table:
     ├─ User info
     ├─ Role dropdown
     ├─ Ban toggle
     └─ Delete button
     ↓
Admin makes change (e.g., viewer → manager)
     ↓
Component calls handleUpdate()
     ├─ Try: PATCH /api/admin/user
     └─ Fallback: updateDoc() Firestore directly
     ↓
Firestore document updated
     ↓
On next login, user gets new role
```

---

## Debugging Guide

### Manager Users Can't Access Analytics

**Symptom**: Manager user logs in, only sees Map + Anomalies

**Diagnosis**:
1. Check browser console - any errors?
2. Check Firebase console - user email?
3. Check Firestore - does user doc exist? Is role field set?
4. Check AuthContext - does Firestore query work?

**Solution Path**:
```
1. Admin panel: Assign role to user email
2. Wait ~5 seconds
3. User logs out + logs back in
4. Check: Does /admin/users show role=manager?
5. If yes → Firestore write worked
6. If no → Check Firestore security rules
```

### Admin Can't Access Admin Panel

**Symptom**: Admin email logs in, no "Users" link

**Diagnosis**:
1. Check VITE_ADMIN_EMAIL env variable
2. Is email lowercase?
3. Any whitespace in env var?
4. Did Vercel deployment finish?

**Solution Path**:
```bash
# Check env var in Vercel
# Must be: VITE_ADMIN_EMAIL=lowercaseemail@gmail.com

# If changed:
1. Update in Vercel project settings
2. Redeploy or trigger rebuild
3. User logs out + back in
4. Check: Does "Users" link appear?
```

### Firestore Query Returns Empty

**Symptom**: User has role in Firestore but AuthContext gets 'viewer'

**Diagnosis**:
1. Is email normalized? (should be lowercase)
2. Is document ID normalized email?
3. Is there an `email` field in document?
4. Does `email` field match user's Firebase email?

**Solution**: Re-save user in admin panel (triggers normalization)
   - Superadmin role
   - Data-scoped roles (e.g., area managers)
   - Time-limited access
   - Action-level permissions (e.g., "can export data")

3. **Audit Logging**
   - Track who accessed what
   - Log role changes
   - Log user creations/deletions

4. **Team Management**
   - Team-based access control
   - Shared team resources
   - Team invitations

---

## Deployment Checklist

- ✅ `VITE_ADMIN_EMAIL` set in `.env.local`
- ✅ Firebase Google OAuth configured
- ✅ Built with `npm run build`
- ✅ Deployed to Vercel
- ✅ Environment variables added to Vercel project settings
- ✅ Admin can log in and access all features
- ✅ Other users see appropriate access restrictions
- ✅ Console clean of auth errors

---

## Related Files

- [PROJECT.md](.gsd/PROJECT.md) - Overall project status
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment instructions
- [README.md](../README.md) - User guide

---

_Last Updated: 2026-06-10 | Auth Roles v1.0.0 | Static Deployment Ready_
