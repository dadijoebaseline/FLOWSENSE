import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

const SESSION_PREFIX = 'flowsense_session:';
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId) {
  const sessionId = `sess-${uuidv4()}`;
  const session = { userId, createdAt: new Date().toISOString() };
  await kv.set(`${SESSION_PREFIX}${sessionId}`, session, { ex: SESSION_TTL });
  return { sessionId, session };
}

export async function getSession(sessionId) {
  if (!sessionId) return null;
  return await kv.get(`${SESSION_PREFIX}${sessionId}`);
}

export async function deleteSession(sessionId) {
  if (!sessionId) return false;
  await kv.del(`${SESSION_PREFIX}${sessionId}`);
  return true;
}
