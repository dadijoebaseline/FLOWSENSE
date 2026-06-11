# Firestore Schema & Query Patterns

**Last Updated**: 2026-06-11  
**Status**: ✅ Complete  
**Environment**: Static Deployment (Vercel)

---

## Collection: `flowsense_users`

Stores user role and profile information. Used by AuthContext for role resolution and AdminUsers panel.

### Document Structure

```javascript
{
  // Document ID: normalized email (lowercase, trimmed)
  [documentId: "user@gmail.com"]: {
    
    // Email address (normalized)
    email: "user@gmail.com",
    
    // User display name
    name: "User Name",
    
    // Role: 'admin' | 'manager' | 'viewer'
    role: "manager",
    
    // Ban status
    banned: false,
    
    // Creation timestamp (ISO format)
    createdAt: "2026-06-11T10:30:00.000Z",
    
    // Last update timestamp
    updatedAt: "2026-06-11T10:30:00.000Z"
  }
}
```

### Field Specifications

| Field | Type | Required | Mutable | Notes |
|-------|------|----------|---------|-------|
| `email` | string | ✅ Yes | ❌ No | Normalized (lowercase) |
| `name` | string | ✅ Yes | ✅ Yes | From Firebase user profile |
| `role` | enum | ✅ Yes | ✅ Yes | `'admin'` \| `'manager'` \| `'viewer'` |
| `banned` | boolean | ✅ Yes | ✅ Yes | If true, user cannot log in |
| `createdAt` | string | ✅ Yes | ❌ No | Never changes |
| `updatedAt` | string | ✅ Yes | ✅ Yes | Updated on any change |

---

## Query Patterns

### Pattern 1: Fetch by Document ID (Fast)

**Use Case**: User is logging in, we have their normalized email

```javascript
// In: src/lib/AuthContext.jsx → getRoleFromFirestore()

const normalizedEmail = normalizeEmail(userEmail);  // "john@gmail.com"
const userRef = doc(firestore, 'flowsense_users', normalizedEmail);
const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
  const userData = userSnap.data();
  if (userData.role === 'manager') {
    return 'manager';  // Fast! Single document lookup
  }
}
```

**Performance**: O(1) - Direct document lookup  
**Cost**: 1 read (if document exists)

---

### Pattern 2: Query by Email Field (Flexible)

**Use Case**: Document doesn't exist by ID, search collection

```javascript
// In: src/lib/AuthContext.jsx → getRoleFromFirestore() fallback

const normalizedEmail = normalizeEmail(userEmail);
const q = query(
  collection(firestore, 'flowsense_users'),
  where('email', '==', normalizedEmail)
);
const snapshot = await getDocs(q);

if (snapshot.size > 0) {
  const userData = snapshot.docs[0].data();
  if (userData.role === 'manager') {
    return 'manager';  // Found by email field
  }
}
```

**Performance**: O(n) - Collection scan (but Firestore indexes it)  
**Cost**: 1 read + query cost  
**Note**: Only used if document ID lookup fails

---

### Pattern 3: List All Users (Admin Panel)

**Use Case**: Admin panel loads user list

```javascript
// In: src/pages/AdminUsers.jsx → fetchUsers()

const usersCollection = collection(firestore, 'flowsense_users');
const q = query(usersCollection);
const snapshot = await getDocs(q);

const users = snapshot.docs.map(doc => ({
  id: doc.id,  // normalized email
  email: doc.data().email,
  name: doc.data().name,
  role: doc.data().role,
  banned: doc.data().banned,
  createdAt: doc.data().createdAt,
  updatedAt: doc.data().updatedAt,
}));
```

**Performance**: O(n) - Full collection scan  
**Cost**: 1 read per document in collection  
**Optimization**: Add composite index if > 1000 users

---

### Pattern 4: Update User Role (Admin Panel)

**Use Case**: Admin changes user role via dropdown

```javascript
// In: src/pages/AdminUsers.jsx → handleUpdate()

const userId = 'john@gmail.com';  // normalized email
const userRef = doc(firestore, 'flowsense_users', userId);

await updateDoc(userRef, {
  role: 'manager',  // NEW role
  updatedAt: new Date().toISOString(),
});
```

**Performance**: O(1) - Direct document update  
**Cost**: 1 write

---

### Pattern 5: Delete User (Admin Panel)

**Use Case**: Admin removes user from system

```javascript
// In: src/pages/AdminUsers.jsx → handleDelete()

const userId = 'john@gmail.com';  // normalized email
const userRef = doc(firestore, 'flowsense_users', userId);

await deleteDoc(userRef);
```

**Performance**: O(1) - Direct document delete  
**Cost**: 1 write

---

## Example Documents

### Admin User

```json
{
  "email": "admin@gmail.com",
  "name": "Admin User",
  "role": "admin",
  "banned": false,
  "createdAt": "2026-05-01T00:00:00.000Z",
  "updatedAt": "2026-06-11T10:00:00.000Z"
}
```

**Notes**:
- Email must match `VITE_ADMIN_EMAIL` for login
- Role can be set via admin panel
- Cannot be deleted by other admins

### Manager User

```json
{
  "email": "manager@example.com",
  "name": "Operations Manager",
  "role": "manager",
  "banned": false,
  "createdAt": "2026-06-01T12:30:00.000Z",
  "updatedAt": "2026-06-11T14:45:00.000Z"
}
```

**Notes**:
- Assigned by admin via panel
- Gets access to Analytics + Dashboard + Map + Anomalies
- Can be banned/deleted by admin

### Viewer User

```json
{
  "email": "viewer@example.com",
  "name": "Read-Only User",
  "role": "viewer",
  "banned": false,
  "createdAt": "2026-06-10T09:15:00.000Z",
  "updatedAt": "2026-06-10T09:15:00.000Z"
}
```

**Notes**:
- Default role for new users
- Gets access to Map + Anomalies only
- Can be promoted to manager by admin

### Banned User

```json
{
  "email": "former@example.com",
  "name": "Former Employee",
  "role": "viewer",
  "banned": true,
  "createdAt": "2026-03-01T08:00:00.000Z",
  "updatedAt": "2026-06-08T16:20:00.000Z"
}
```

**Notes**:
- Login fails if `banned: true`
- Still in collection for audit trail
- Can be un-banned by admin

---

## Email Normalization

All emails are normalized when used as document IDs or in queries:

```javascript
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
```

**Examples**:
| Input | Output |
|-------|--------|
| `John@Gmail.Com` | `john@gmail.com` |
| `  admin@example.com  ` | `admin@example.com` |
| `MANAGER@COMPANY.ORG` | `manager@company.org` |
| `user+tag@gmail.com` | `user+tag@gmail.com` |

**Critical**: Normalization must happen consistently:
- ✅ Document ID: `normalizeEmail(userEmail)`
- ✅ Query fields: `where('email', '==', normalizeEmail(userEmail))`
- ✅ Email matching: `normalizeEmail(email) === VITE_ADMIN_EMAIL`

---

## Firestore Rules (Optional)

Currently in **test mode** (open access). For production, deploy:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Authenticated users can read users collection
    match /flowsense_users/{document=**} {
      allow read: if request.auth != null;
      
      // Only custom claim admin can write
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

## Data Migration Notes

### Bulk Load Users (for future backend)

If migrating from database:

```javascript
// Batch write example
const batch = writeBatch(firestore);

users.forEach(user => {
  const normalizedEmail = normalizeEmail(user.email);
  const ref = doc(firestore, 'flowsense_users', normalizedEmail);
  batch.set(ref, {
    email: normalizedEmail,
    name: user.name,
    role: user.role || 'viewer',
    banned: user.banned || false,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString(),
  });
});

await batch.commit();
```

---

## Debugging Queries

### Check if User Document Exists

```javascript
// In browser console
const userRef = db.collection('flowsense_users').doc('user@gmail.com');
userRef.get().then(doc => {
  console.log('Exists:', doc.exists);
  if (doc.exists) console.log(doc.data());
});
```

### Query All Users

```javascript
// In browser console
db.collection('flowsense_users').get().then(snap => {
  snap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
});
```

### Find User by Email Field

```javascript
// In browser console
db.collection('flowsense_users')
  .where('email', '==', 'user@gmail.com')
  .get()
  .then(snap => {
    console.log('Found:', snap.size);
    snap.forEach(doc => console.log(doc.data()));
  });
```

---

## Performance Considerations

### Document ID vs Query

| Operation | Method | Cost | Speed |
|-----------|--------|------|-------|
| Find user by email | Doc ID lookup | 1 read | 🚀 Fast |
| Find user by email | Query collection | 1+ reads | ⚠️ Slower |
| List all users | Query collection | n reads | ⏱️ Slow |
| Update role | updateDoc() | 1 write | 🚀 Fast |
| Delete user | deleteDoc() | 1 write | 🚀 Fast |

### Recommendations

- ✅ Use **document ID lookup** in AuthContext (performance critical)
- ✅ Use **collection query** as fallback (handles edge cases)
- ✅ Use **batch operations** for bulk changes
- ⚠️ Avoid queries in auth hot path (use simple lookups)

---

## Audit Trail

For future audit logging:

```javascript
// Example audit record structure
{
  action: "role_changed",
  performedBy: "admin@gmail.com",
  targetUser: "manager@example.com",
  oldRole: "viewer",
  newRole: "manager",
  timestamp: "2026-06-11T14:45:00.000Z",
  ipAddress: "192.168.1.1"
}
```

Stored in separate `audit_logs` collection.

