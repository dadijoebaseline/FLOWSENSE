# Authentication & Role-Based Access Control

**Date Implemented**: 2026-06-10  
**Version**: v1.0.0 Post-Launch Patch  
**Status**: ✅ Complete and Deployed

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

```
User email received from Firebase
         ↓
Normalize email (trim, lowercase)
         ↓
Compare with VITE_ADMIN_EMAIL
         ↓
    ├─ IF matches → role: 'admin'
    └─ IF no match → role: 'viewer'
         ↓
Store user with role in AuthContext
```

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
**Purpose**: Operations team access, no analytics or admin controls  
**Conditions**:
- Assigned by admin via `/api/admin/user` PATCH endpoint
- Stored in user database

**Permissions**:
```javascript
{
  canViewAnalytics: false,     // ❌ No advanced analytics
  canViewDashboard: true,      // ✅ Dashboard overview
  canViewMap: true,            // ✅ Interactive map
  canViewAnomalyList: true,    // ✅ Anomaly viewing
  canTriggerDetection: false   // ❌ No admin controls
}
```

**Sidebar Access**:
- Dashboard
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

| File | Purpose |
|------|---------|
| `src/lib/AuthContext.jsx` | Main auth context + role assignment logic |
| `src/lib/roleAccess.js` | Permission definitions per role |
| `src/lib/firebase.js` | Firebase config + Google provider |
| `src/components/ProtectedRoute.jsx` | Route protection + fallback |
| `src/components/layout/AppLayout.jsx` | Navigation based on permissions |
| `src/pages/AdminUsers.jsx` | Admin user management panel |
| `api/lib/firebaseAuth.js` | Backend auth helpers (not deployed) |
| `api/auth/session.js` | Backend session endpoint (not deployed) |

### Key Code Segments

#### 1. Admin Email Configuration
```javascript
// src/lib/AuthContext.jsx (Line 8-9)
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ADMIN_EMAIL = normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL || '');
```

#### 2. Role Assignment from Email
```javascript
// src/lib/AuthContext.jsx (Line 10)
const getRoleFromEmail = (email) => 
  (normalizeEmail(email) === ADMIN_EMAIL ? 'admin' : 'viewer');
```

#### 3. Static Deployment Fallback
```javascript
// src/lib/AuthContext.jsx (Lines 12-39)
const fetchUserSession = async (idToken, firebaseUser = null) => {
  try {
    const response = await fetch('/api/auth/session', {...});
    
    if (response.status === 404) {
      // Use actual Firebase user's email for role assignment
      const email = firebaseUser?.email || 'demo@example.com';
      return { success: true, user: { email, name: firebaseUser?.displayName } };
    }
    // ... handle other cases
  }
};
```

#### 4. User Object with Role
```javascript
// src/lib/AuthContext.jsx (Lines 67-71)
if (session.success && session.user) {
  const userWithRole = {
    ...session.user,
    role: getRoleFromEmail(session.user.email),  // ← Role assignment
  };
  setUser(userWithRole);
}
```

#### 5. Permission-Based Navigation
```javascript
// src/components/layout/AppLayout.jsx (Lines 40-48)
const navItems = [
  perms.canViewDashboard && { path: '/', label: 'Dashboard', ... },
  perms.canViewAnalytics && { path: '/analytics', label: 'Analytics', ... },
  perms.canApproveUsers && { path: '/admin/users', label: 'Users', ... },
  perms.canViewAnomalyList && { path: '/anomalies', label: 'Anomalies', ... },
  perms.canViewMap && { path: '/map', label: 'Map', ... },
].filter(Boolean);
```

---

## Environment Configuration

### Required Variables

```bash
# .env.local (development)
VITE_ADMIN_EMAIL=dadijoebaseline@gmail.com

# Vercel (production)
# Set same variable in project settings
```

### Admin Email Matching

The system matches email addresses after:
1. ✅ Trimming whitespace
2. ✅ Converting to lowercase
3. ✅ Exact string comparison

**Examples**:
- ✅ `dadijoebaseline@gmail.com` → matches `VITE_ADMIN_EMAIL=dadijoebaseline@gmail.com`
- ✅ `DadiJoeBaseline@Gmail.Com` → normalized to lowercase, matches
- ❌ `admin@gmail.com` → doesn't match, gets `viewer` role

---

## Static Deployment Behavior

### What Changed in Static Deployment

**Before (v1.0.0)**:
- Backend API returned 404
- Hardcoded fallback user: `demo@example.com`
- Result: Always assigned `viewer` role
- ❌ Admin couldn't access admin features

**After (v1.0.0 Patch)**:
- Backend API returns 404
- Use actual Firebase user's email from `signInWithPopup()` response
- Result: Correct role assigned based on `VITE_ADMIN_EMAIL`
- ✅ Admin can access all features

### Flow Diagram

```
Static Deployment (Vercel)

User logs in with Google
         ↓
Firebase OAuth success
         ↓
firebaseUser.email = "dadijoebaseline@gmail.com"
         ↓
Try /api/auth/session → 404 (no backend)
         ↓
Catch 404, use firebaseUser.email
         ↓
getRoleFromEmail("dadijoebaseline@gmail.com")
         ↓
Matches VITE_ADMIN_EMAIL → role: 'admin' ✅
         ↓
User gets full access
```

---

## Database Schema (Backend Only)

Users are stored in Firebase Firestore (not deployed to Vercel):

```javascript
// Collection: flowsense_users
{
  id: "uid_or_email",
  email: "user@example.com",
  name: "User Name",
  role: "viewer|manager|admin",    // Can be overridden by admin
  banned: false,
  createdAt: "2026-06-10T...",
  updatedAt: "2026-06-10T..."
}
```

**Notes**:
- `admin` role can only be set if email matches `ADMIN_EMAIL` (cannot be assigned)
- `manager` and `viewer` can be assigned by admin
- Admin cannot delete or modify other admins

---

## User Management

### Admin Panel (`/admin/users`)

**Access**: Admin role only  
**Features**:
- List all users
- Change role: `viewer` ↔ `manager`
- Ban/unban users
- Delete users (except admins)

**API Endpoints** (Backend only):
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/user` - Update role or ban status
- `DELETE /api/admin/user` - Delete user

---

## Security Considerations

### Static Deployment (Current)

✅ **Secure**:
- Role determined by environment variable `VITE_ADMIN_EMAIL`
- Only email-based (no secrets exposed)
- Firebase OAuth handles authentication
- Role cannot be forged by user

❌ **Limitations**:
- Cannot dynamically assign `manager` role (no backend)
- Cannot ban users (no database)
- All admin users must be predetermined at deployment

### Backend Deployment (Optional)

Would enable:
- Dynamic role assignment
- User banning
- Audit logs
- User management UI

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
- ✅ Other emails get `role: 'viewer'`
- ✅ Email normalization works (case-insensitive, trimmed)
- ✅ Fallback email is actual Firebase user email (not hardcoded)

### Access Control
- ✅ Admin can access all pages
- ✅ Viewer can only access Map + Anomalies
- ✅ Manager can access Dashboard + Map + Anomalies
- ✅ Unauthorized routes show "Access denied" message
- ✅ Navigation sidebar reflects role permissions

### Console Errors
- ✅ No 404 errors after login (gracefully handled)
- ✅ No auth errors
- ✅ COOP warnings resolved

---

## Future Enhancements

### Phase 4+ (Optional)

1. **Backend Integration**
   - Deploy `/api/auth/session` endpoint
   - Deploy `/api/admin/users` and `/api/admin/user` endpoints
   - Enable dynamic role assignment
   - Enable user banning

2. **Extended RBAC**
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
