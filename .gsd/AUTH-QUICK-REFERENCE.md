# Authentication Code Quick Reference

**Purpose**: Fast lookup of authentication-related code  
**Last Updated**: 2026-06-11  
**Version**: v1.0.1

---

## File Locations

### Core Authentication

| File | Purpose | Key Code |
|------|---------|----------|
| [src/lib/AuthContext.jsx](../src/lib/AuthContext.jsx) | Main auth provider + role assignment | `getRoleFromCustomClaimsOrEmail()`, `getRoleFromFirestore()` |
| [src/lib/firebase.js](../src/lib/firebase.js) | Firebase SDK initialization | `auth`, `firestore`, `googleProvider` exports |
| [src/lib/roleAccess.js](../src/lib/roleAccess.js) | Permission matrix per role | `ROLE_PERMISSIONS` object, `getUserPermissions()` |

### UI Components

| File | Purpose | Props |
|------|---------|-------|
| [src/components/layout/AppLayout.jsx](../src/components/layout/AppLayout.jsx) | Main layout + navigation | `user`, `logout`, permission-based nav filtering |
| [src/components/ProtectedRoute.jsx](../src/components/ProtectedRoute.jsx) | Route access control | `requiredRole`, shows 403 if unauthorized |
| [src/pages/AdminUsers.jsx](../src/pages/AdminUsers.jsx) | User management panel | `user.role` must be 'admin' |

### Configuration

| File | Purpose | Variables |
|------|---------|-----------|
| [.env.local](../.env.local) | Local environment variables | `VITE_ADMIN_EMAIL`, Firebase config |
| [vercel.json](../vercel.json) | Vercel deployment config | Build settings |

---

## Key Functions

### AuthContext.jsx

#### `normalizeEmail(email)`
```javascript
// Location: Line 8
// Purpose: Normalize email for consistent comparison
// Input: "John@Gmail.Com" or "  admin@example.com  "
// Output: "john@gmail.com"

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
```

#### `getRoleFromFirestore(userEmail)`
```javascript
// Location: Lines 13-50
// Purpose: Query Firestore for user's stored role
// Returns: 'admin' | 'manager' | 'viewer' | null
// Queries:
//   1. doc(firestore, 'flowsense_users', normalizedEmail)
//   2. query(collection(...), where('email', '==', normalizedEmail))
```

#### `getRoleFromCustomClaimsOrEmail(firebaseUser, session)`
```javascript
// Location: Lines 52-72
// Purpose: Three-tier role resolution
// Priority: Custom claims → Firestore → Email matching
// Returns: 'admin' | 'manager' | 'viewer'
```

#### `fetchUserSession(idToken, firebaseUser)`
```javascript
// Location: Lines 74-95
// Purpose: Get session from backend or use Firebase user
// Returns: { success: true, user: { email, name, ... } }
// Fallback: Returns Firebase user email on 404
```

#### `syncSession(firebaseUser)`
```javascript
// Location: Lines 129-163
// Purpose: Sync Firebase user with app state
// Sets: user object with role in AuthContext
```

#### `login()`
```javascript
// Location: Lines 189-218
// Purpose: Initiate Google OAuth login
// Shows: Google popup, calls syncSession on success
```

#### `logout()`
```javascript
// Location: Lines 220-229
// Purpose: Sign out user from Firebase
// Clears: AuthContext user state
```

---

### roleAccess.js

#### `ROLE_PERMISSIONS`
```javascript
// Location: Lines 3-37
// Structure: 
// {
//   admin: { can* properties },
//   manager: { can* properties },
//   viewer: { can* properties }
// }

// Manager permissions (v1.0.1):
// - canViewAnalytics: true ✅
// - canViewDashboard: true ✅
// - canViewMap: true ✅
// - canViewAnomalyList: true ✅
// - canTriggerDetection: false ❌
```

#### `getUserPermissions(role)`
```javascript
// Location: Lines 39-42
// Purpose: Get permission object for a role
// Input: 'admin' | 'manager' | 'viewer'
// Output: Permission object with can* boolean properties
```

---

### AdminUsers.jsx

#### `fetchUsers()`
```javascript
// Location: Lines 18-69
// Purpose: Load all users from Firestore
// Method:
//   1. Try: GET /api/admin/users (backend)
//   2. Fallback: query(collection(...))
// Returns: Array of user objects
```

#### `handleUpdate(userId, updates)`
```javascript
// Location: Lines 71-126
// Purpose: Update user role, ban status, or other fields
// Methods:
//   1. Try: PATCH /api/admin/user (backend)
//   2. Fallback: updateDoc(userRef, ...)
// Updates: Firestore document + local state
```

#### `handleDelete(userId)`
```javascript
// Location: Lines 128-156
// Purpose: Delete user from Firestore
// Methods:
//   1. Try: DELETE /api/admin/user (backend)
//   2. Fallback: deleteDoc(userRef)
// Updates: Local state to remove user
```

---

## Environment Variables

### Development (.env.local)

```bash
# Admin email - gets 'admin' role
VITE_ADMIN_EMAIL=dadijoebaseline@gmail.com

# Firebase configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=flowsense-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flowsense-xxx
VITE_FIREBASE_STORAGE_BUCKET=flowsense-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

### Production (Vercel Project Settings)

- Set same `VITE_*` variables in Vercel dashboard
- Do NOT commit to git
- Required for production deployment

---

## Constants & Defaults

### Role Options

```javascript
// src/pages/AdminUsers.jsx Line 8
const ROLE_OPTIONS = ['viewer', 'manager', 'admin'];
```

### Default Permissions (Viewer)

```javascript
canViewAnalytics: false,
canViewDashboard: false,
canViewMap: true,
canViewAnomalyList: true,
canTriggerDetection: false,
```

---

## State Management

### AuthContext State

```javascript
{
  user: {
    email: "user@gmail.com",
    name: "User Name",
    role: "manager",  // ← from 3-tier resolution
    // ... other Firebase user properties
  },
  isAuthenticated: true,
  isLoadingAuth: false,
  authError: null,
  logout: () => {},
  getIdToken: () => {},
}
```

### AdminUsers State

```javascript
{
  users: [
    {
      id: "user@gmail.com",  // normalized email
      email: "user@gmail.com",
      name: "User Name",
      role: "manager",
      banned: false,
      createdAt: "2026-06-11T...",
      updatedAt: "2026-06-11T...",
    },
    // ...
  ],
  loading: false,
  message: "User updated successfully",
  error: null,
}
```

---

## Component Props & Hooks

### useAuth()

```javascript
// Usage in components
const { user, logout, getIdToken, isAuthenticated } = useAuth();

// Returns:
{
  user: User | null,           // Current logged-in user
  logout: () => Promise<void>, // Sign out function
  getIdToken: () => Promise<string> | null,  // Firebase ID token
  isAuthenticated: boolean,    // Login status
  isLoadingAuth: boolean,      // Loading state
  authError: { type, message } | null,
}
```

### Route Protection

```javascript
// In: src/components/ProtectedRoute.jsx
<ProtectedRoute requiredRole="manager">
  <AnalyticsPage />
</ProtectedRoute>

// Checks: user.role includes requiredRole permissions
// Fallback: Shows "Access denied" if unauthorized
```

---

## API Endpoints (Backend Optional)

These endpoints work if backend is deployed. Vercel static deployment falls back to Firestore.

### POST /api/auth/login
```javascript
// Request
{ email, password }

// Response (success)
{ user: { email, role, name, ... }, token }

// Response (404 on static deployment)
// Falls back to Firebase user
```

### GET /api/auth/session
```javascript
// Request: Authorization header with Bearer token
// Response (success)
{ user: { email, role, name, ... } }

// Response (404 on static deployment)
// Falls back to Firebase user
```

### GET /api/admin/users
```javascript
// Request: Authorization header (admin only)
// Response (success)
{ users: [{ id, email, name, role, banned, createdAt, updatedAt }, ...] }

// Response (404 on static deployment)
// Falls back to Firestore collection query
```

### PATCH /api/admin/user
```javascript
// Request
{ userId, role?: string, banned?: boolean }

// Response (success)
{ user: { id, email, name, role, banned, updatedAt } }

// Response (404 on static deployment)
// Falls back to Firestore updateDoc()
```

### DELETE /api/admin/user
```javascript
// Request
{ userId }

// Response (success)
{ success: true }

// Response (404 on static deployment)
// Falls back to Firestore deleteDoc()
```

---

## Common Issues & Solutions

### Manager Can't See Analytics Button

**Check**:
1. Is user role = 'manager'?
2. Is `canViewAnalytics: true` in roleAccess.js?
3. Browser cache - try hard refresh?

**Fix**:
1. Admin panel: Check/reassign user role
2. User logs out + back in
3. Check browser console for errors

### Authentication Fails

**Check**:
1. Is VITE_ADMIN_EMAIL set in .env.local?
2. Is Firebase config correct?
3. Is Google OAuth consent screen set up?

**Fix**:
```javascript
// In browser console
console.log(import.meta.env.VITE_ADMIN_EMAIL)  // Should show email
```

### Firestore Query Fails

**Check**:
1. Is user email normalized?
2. Does document exist in Firestore?
3. Are security rules blocking read?

**Fix**:
- Admin panel: Update user (triggers Firestore write)
- Wait 5 seconds
- User re-login

---

## Recent Changes (v1.0.1)

### Updated Files
- [src/lib/AuthContext.jsx](../src/lib/AuthContext.jsx) - Added Firestore queries
- [src/lib/roleAccess.js](../src/lib/roleAccess.js) - Manager now has analytics
- [src/pages/AdminUsers.jsx](../src/pages/AdminUsers.jsx) - Email normalization

### Commits
- `9831499` - Manager analytics permission
- `470b4b1` - Firestore role queries
- `c0faa2c` - Email normalization
- `bd02778` - Doc ID lookup fix
- `f235ef8` - Email field fallback query

---

## Testing Commands

### Check Admin Email

```bash
# In .env.local
echo $VITE_ADMIN_EMAIL

# Or in browser console
import.meta.env.VITE_ADMIN_EMAIL
```

### Query Firestore (Browser Console)

```javascript
// Get user
db.collection('flowsense_users').doc('user@gmail.com').get()
  .then(doc => console.log(doc.data()));

// List all users
db.collection('flowsense_users').get()
  .then(snap => snap.forEach(doc => console.log(doc.id, doc.data())));

// Update role
db.collection('flowsense_users').doc('user@gmail.com').update({ role: 'manager' });
```

