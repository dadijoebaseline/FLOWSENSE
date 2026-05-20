import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

const LOGIN_TOKEN_PREFIX = 'flowsense_login_token:';
const LOGIN_TOKEN_TTL = 15 * 60; // 15 minutes

export async function createLoginToken(userId) {
  const token = uuidv4();
  await kv.set(`${LOGIN_TOKEN_PREFIX}${token}`, { userId }, { ex: LOGIN_TOKEN_TTL });
  return token;
}

export async function getLoginToken(token) {
  if (!token) return null;
  return await kv.get(`${LOGIN_TOKEN_PREFIX}${token}`);
}

export async function deleteLoginToken(token) {
  if (!token) return false;
  await kv.del(`${LOGIN_TOKEN_PREFIX}${token}`);
  return true;
}
