import { verifyFirebaseIdToken, isAdminUser } from '../lib/firebaseAuth.js';
import { findUserById, updateUserRoleById, banUserById, deleteUserById } from '../lib/userStore.js';

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const ALLOWED_ROLES = ['viewer', 'manager'];

export default async function handler(req, res) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return sendJson(res, 401, { error: 'auth_required' });

  let payload;
  try {
    payload = await verifyFirebaseIdToken(token);
  } catch (error) {
    return sendJson(res, 401, { error: 'invalid_token', message: error.message });
  }

  if (!isAdminUser({ email: payload.email, uid: payload.uid || payload.sub })) {
    return sendJson(res, 403, { error: 'forbidden' });
  }

  const { userId, role, banned } = await new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  }).catch(() => ({}));

  if (req.method === 'DELETE') {
    if (!userId) {
      return sendJson(res, 400, { error: 'userId is required' });
    }

    const targetUser = await findUserById(userId);
    if (!targetUser) {
      return sendJson(res, 404, { error: 'user_not_found' });
    }

    if (targetUser.email === payload.email || targetUser.id === (payload.uid || payload.sub)) {
      return sendJson(res, 400, { error: 'cannot_delete_self' });
    }

    if (isAdminUser({ email: targetUser.email, uid: targetUser.id })) {
      return sendJson(res, 400, { error: 'cannot_modify_admin' });
    }

    await deleteUserById(userId);
    return sendJson(res, 200, { success: true });
  }

  if (req.method !== 'PATCH') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (!userId) {
    return sendJson(res, 400, { error: 'userId is required' });
  }

  const targetUser = await findUserById(userId);
  if (!targetUser) {
    return sendJson(res, 404, { error: 'user_not_found' });
  }

  if (targetUser.email === payload.email || targetUser.id === (payload.uid || payload.sub)) {
    return sendJson(res, 400, { error: 'cannot_modify_self' });
  }

  if (isAdminUser({ email: targetUser.email, uid: targetUser.id })) {
    return sendJson(res, 400, { error: 'cannot_modify_admin' });
  }

  if (typeof banned === 'boolean') {
    await banUserById(userId, banned);
  }

  if (role !== undefined) {
    if (!ALLOWED_ROLES.includes(role)) {
      return sendJson(res, 400, { error: 'invalid_role' });
    }
    await updateUserRoleById(userId, role);
  }

  const updatedUser = await findUserById(userId);
  return sendJson(res, 200, { success: true, user: updatedUser });
}
