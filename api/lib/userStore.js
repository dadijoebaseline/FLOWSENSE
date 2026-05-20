import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

const USERS_KEY = 'flowsense_users';
const DEFAULT_USERS = [
  {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'viewer',
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export async function getUsers() {
  const stored = await kv.get(USERS_KEY);
  if (!stored) {
    await kv.set(USERS_KEY, DEFAULT_USERS);
    return DEFAULT_USERS;
  }

  const hasRealAdmin = stored.some(
    (item) => item.role === 'admin' && item.status === 'approved' && !(item.id === 'admin-user' && item.email === 'admin@flowsense.app')
  );

  if (!hasRealAdmin) {
    const cleaned = stored.filter(
      (item) => !(item.id === 'admin-user' && item.email === 'admin@flowsense.app')
    );
    if (cleaned.length !== stored.length) {
      await kv.set(USERS_KEY, cleaned);
      return cleaned;
    }
  }

  return stored;
}

export async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  const users = await getUsers();
  return users.find((item) => normalizeEmail(item.email) === normalized) || null;
}

export async function findUserById(id) {
  const users = await getUsers();
  return users.find((item) => item.id === id) || null;
}

export async function createPendingUser({ name, email }) {
  const users = await getUsers();
  const existing = users.find((item) => normalizeEmail(item.email) === normalizeEmail(email));
  if (existing) return null;

  const hasAdmin = users.some((item) => item.role === 'admin' && item.status === 'approved');
  const isFirstSignup = !hasAdmin;
  const newUser = {
    id: `user-${uuidv4()}`,
    name: String(name || 'New User').trim() || 'New User',
    email: normalizeEmail(email),
    role: isFirstSignup ? 'admin' : 'viewer',
    status: isFirstSignup ? 'approved' : 'pending',
    createdAt: new Date().toISOString(),
  };
  const nextUsers = [...users, newUser];
  await kv.set(USERS_KEY, nextUsers);
  return newUser;
}

export async function approveUserById(userId) {
  const users = await getUsers();
  const nextUsers = users.map((item) =>
    item.id === userId ? { ...item, status: 'approved' } : item
  );
  await kv.set(USERS_KEY, nextUsers);
  return nextUsers.find((item) => item.id === userId) || null;
}

export async function getPendingUsers() {
  const users = await getUsers();
  return users.filter((item) => item.status === 'pending');
}
