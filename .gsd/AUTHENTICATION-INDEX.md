# Authentication System Documentation Index

**Project**: FlowSense  
**Version**: v1.0.1  
**Last Updated**: 2026-06-11  
**Status**: ✅ Complete

---

## Overview

FlowSense implements a comprehensive **three-tier role-based access control (RBAC)** system built on **Firebase Google OAuth** and **Firestore**. The system is designed for **static deployments** (Vercel) with optional backend integration.

### Key Features

- ✅ **Google OAuth** - Simple authentication via Google
- ✅ **Three Roles** - Admin, Manager, Viewer with distinct permissions
- ✅ **Dynamic Role Assignment** - Admin panel for managing user roles
- ✅ **Firestore Integration** - User roles stored and queried from Firestore
- ✅ **Email Normalization** - Consistent email handling across the system
- ✅ **Permission Matrix** - Granular feature access control
- ✅ **Static Deployment** - Works without backend on Vercel
- ✅ **Security Ready** - Optional custom claims and Firestore rules

---

## Documentation Files

### 1. **AUTH-IMPLEMENTATION.md** (Main Reference)
**Purpose**: Comprehensive authentication architecture and implementation  
**Contains**:
- Overview of auth flow
- Role definitions with permissions
- Three-tier role resolution algorithm
- Implementation details and code snippets
- Environment configuration
- Static deployment behavior
- Security considerations
- Testing checklist
- Debugging guide
- Future enhancements

**When to Read**: Starting point for understanding the entire system

---

### 2. **FIRESTORE-SCHEMA.md** (Data Structure Reference)
**Purpose**: Firestore collection structure, query patterns, and data model  
**Contains**:
- `flowsense_users` collection schema
- Field specifications and constraints
- Five query patterns with code examples
- Example documents for each role
- Email normalization rules
- Optional Firestore security rules
- Performance considerations
- Debugging queries
- Bulk migration guide

**When to Read**: Understanding how user data is stored and queried

---

### 3. **AUTH-QUICK-REFERENCE.md** (Fast Lookup)
**Purpose**: Quick index of all authentication code locations and functions  
**Contains**:
- File locations with line numbers
- Function signatures and purposes
- State management structure
- Component props and hooks
- API endpoints documentation
- Constants and defaults
- Common issues and solutions
- Testing commands

**When to Read**: Looking up specific code or debugging issues

---

## Quick Start

### For Developers

1. **Understanding the System**
   - Read: [AUTH-IMPLEMENTATION.md](#auth-implementationmd-main-reference) sections 1-3
   - Read: [FIRESTORE-SCHEMA.md](#firestore-schemamd-data-structure-reference) schema section

2. **Working with Code**
   - Read: [AUTH-QUICK-REFERENCE.md](#auth-quick-referencemd-fast-lookup) file locations
   - Reference: Function signatures in quick reference
   - Code: [src/lib/AuthContext.jsx](../src/lib/AuthContext.jsx)

3. **Testing**
   - Read: [AUTH-IMPLEMENTATION.md](#auth-implementationmd-main-reference) testing checklist
   - Commands: [AUTH-QUICK-REFERENCE.md](#auth-quick-referencemd-fast-lookup) testing section

### For Administrators

1. **Managing Users**
   - Go to: https://tcwdflowsense.vercel.app/admin/users
   - Required: Admin email in `VITE_ADMIN_EMAIL`
   - Can do: Change roles, ban/unban, delete users

2. **Assigning Manager Role**
   - Admin panel → select user → role dropdown → manager
   - Click save
   - Manager user will have analytics access on next login

3. **Troubleshooting**
   - User can't access page? Check: Admin panel role assignment
   - Admin can't access admin panel? Check: VITE_ADMIN_EMAIL matches login email
   - Read: [AUTH-IMPLEMENTATION.md](#auth-implementationmd-main-reference) debugging guide

---

## Role Permissions Matrix

### Admin
```
✅ Dashboard    ✅ Analytics    ✅ Map    ✅ Anomalies    ✅ Users Panel
✅ Full Access  ✅ All 5 modules ✅ Interactive ✅ View & Export ✅ Manage Roles
```

### Manager (NEW in v1.0.1)
```
✅ Dashboard    ✅ Analytics    ✅ Map    ✅ Anomalies    ❌ Users Panel
⏱️ Overview only ✅ All 5 modules ✅ Interactive ✅ View & Export ❌ No admin access
```

### Viewer
```
❌ Dashboard    ❌ Analytics    ✅ Map    ✅ Anomalies    ❌ Users Panel
❌ No access    ❌ No access    ✅ Interactive ✅ View only    ❌ No admin access
```

---

## Architecture Flow

```
┌─────────────────────────────────────────────────┐
│ User Accesses App                               │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│ AuthContext: onAuthStateChanged(firebaseUser)  │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│ getRoleFromCustomClaimsOrEmail()                 │
│ ├─ Step 1: Check custom claims                 │
│ ├─ Step 2: Query Firestore by email            │
│ └─ Step 3: Check VITE_ADMIN_EMAIL match        │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│ Assign role: 'admin' | 'manager' | 'viewer'    │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│ roleAccess.js: Get permissions for role        │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│ AppLayout: Filter navigation based on perms    │
│ └─ Dashboard? Map? Anomalies? Analytics? Users?│
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│ ProtectedRoute: Verify route access            │
│ └─ Allow or show 403 "Access Denied"           │
└─────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── lib/
│   ├── AuthContext.jsx          ← Main auth + role resolution
│   ├── roleAccess.js            ← Permission matrix
│   └── firebase.js              ← Firebase initialization
├── components/
│   ├── layout/
│   │   └── AppLayout.jsx        ← Navigation + role checking
│   ├── ProtectedRoute.jsx       ← Route protection
│   └── UserNotRegisteredError.jsx
└── pages/
    ├── AdminUsers.jsx           ← User management panel
    └── ...other pages

.gsd/
├── AUTH-IMPLEMENTATION.md       ← This directory
├── FIRESTORE-SCHEMA.md
└── AUTH-QUICK-REFERENCE.md

scripts/
└── setup-admin-claims.js        ← Optional custom claims setup
```

---

## Key Commits

| Commit | Date | Change | Impact |
|--------|------|--------|--------|
| 9831499 | 2026-06-11 | Manager analytics permission | Managers can now see analytics |
| 470b4b1 | 2026-06-11 | Query Firestore for roles | Support existing manager users |
| c0faa2c | 2026-06-11 | Email normalization | Consistent lookups |
| bd02778 | 2026-06-11 | Use doc.id directly | Proper document updates |
| f235ef8 | 2026-06-11 | Email field fallback | Find users by email field |
| 1d78db3 | 2026-06-11 | Documentation update | Complete auth docs |
| 490dc68 | 2026-06-11 | Firestore schema docs | Data structure reference |
| 299dc5f | 2026-06-11 | Quick reference guide | Code lookup guide |

---

## Environment Setup

### Development

```bash
# .env.local
VITE_ADMIN_EMAIL=your-email@gmail.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Production (Vercel)

Set all `VITE_*` variables in Vercel project settings.

---

## Testing the System

### Test Login as Admin

1. Ensure your email is set to `VITE_ADMIN_EMAIL`
2. Click "Login with Google"
3. Use your Google account
4. Should have access to: Dashboard, Analytics, Map, Anomalies, Users
5. Should see "Users" link in left sidebar

### Test Login as Manager

1. Have an admin assign yourself the "manager" role
2. Log out and back in
3. Should have access to: Dashboard, Analytics, Map, Anomalies
4. Should NOT see "Users" link

### Test Login as Viewer

1. Create new user (default role is viewer)
2. Log in with that account
3. Should only see: Map, Anomalies
4. Should NOT see: Dashboard, Analytics, Users

---

## Troubleshooting Matrix

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Can't log in | OAuth not configured | Check Firebase console |
| Admin can't access admin panel | Email doesn't match VITE_ADMIN_EMAIL | Update .env and redeploy |
| Manager can't see Analytics | Role not set in Firestore | Admin panel: reassign role |
| No "Users" link in nav | User not admin role | Check AuthContext role resolution |
| 404 on /api endpoints | No backend deployed | Expected on Vercel, falls back to Firestore |
| Firestore query fails | Email not normalized | Check document ID in Firestore |

**Full Guide**: See AUTH-IMPLEMENTATION.md → Debugging Guide

---

## Future Roadmap

- [ ] Backend API integration (optional)
- [ ] Firebase custom claims deployment (optional)
- [ ] Audit logging (future phase)
- [ ] User approval workflow (future phase)
- [ ] Extended RBAC with more granular permissions (future phase)
- [ ] SSO integration (future phase)

---

## Support

### Questions?

1. **Code questions** → See [AUTH-QUICK-REFERENCE.md](AUTH-QUICK-REFERENCE.md)
2. **Data questions** → See [FIRESTORE-SCHEMA.md](FIRESTORE-SCHEMA.md)
3. **Architecture questions** → See [AUTH-IMPLEMENTATION.md](AUTH-IMPLEMENTATION.md)
4. **Not found** → Check latest commit messages

### Issues?

1. Check [AUTH-IMPLEMENTATION.md](AUTH-IMPLEMENTATION.md#debugging-guide)
2. Search browser console for errors
3. Verify environment variables
4. Check Firestore collection in Firebase console

---

## Document Metadata

- **Total Pages**: ~80 pages of documentation
- **Code Examples**: 50+
- **Diagrams**: 10+
- **Query Patterns**: 5
- **Last Updated**: 2026-06-11
- **Version**: v1.0.1
- **Status**: ✅ Production Ready

