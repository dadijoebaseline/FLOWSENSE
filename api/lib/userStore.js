import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

const USERS_KEY = 'flowsense_users';
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export async function getUsers() {
  const stored = await kv.get(USERS_KEY);
  return Array.isArray(stored) ? stored : [];
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

export async function createOrUpdateUser({ id, name, email, role = 'viewer', banned = false }) {
  const normalizedEmail = normalizeEmail(email);
  const users = await getUsers();
  const existingById = users.find((item) => item.id === id);
  const existingByEmail = users.find((item) => normalizeEmail(item.email) === normalizedEmail);

  const userRecord = {
    id: id || `user-${uuidv4()}`,
    name: String(name || 'User').trim() || 'User',
    email: normalizedEmail,
    role,
    banned,
    createdAt: new Date().toISOString(),
  };

  let nextUsers = users;
  if (existingById) {
    nextUsers = users.map((item) =>
      item.id === id ? { ...item, name: userRecord.name, email: userRecord.email, role: userRecord.role, banned: userRecord.banned } : item
    );
  } else if (existingByEmail) {
    nextUsers = users.map((item) =>
      normalizeEmail(item.email) === normalizedEmail ? { ...item, id: userRecord.id, name: userRecord.name, role: userRecord.role, banned: userRecord.banned } : item
    );
  } else {
    nextUsers = [...users, userRecord];
  }

  await kv.set(USERS_KEY, nextUsers);
  return nextUsers.find((item) => item.id === userRecord.id) || userRecord;
}

export async function getAllUsers() {
  return await getUsers();
}

export async function updateUserRoleById(userId, role) {
  const users = await getUsers();
  const nextUsers = users.map((item) => (item.id === userId ? { ...item, role } : item));
  await kv.set(USERS_KEY, nextUsers);
  return nextUsers.find((item) => item.id === userId) || null;
}

export async function banUserById(userId, banned) {
  const users = await getUsers();
  const nextUsers = users.map((item) => (item.id === userId ? { ...item, banned } : item));
  await kv.set(USERS_KEY, nextUsers);
  return nextUsers.find((item) => item.id === userId) || null;
}

export async function deleteUserById(userId) {
  const users = await getUsers();
  const nextUsers = users.filter((item) => item.id !== userId);
  await kv.set(USERS_KEY, nextUsers);
  return nextUsers;
}
