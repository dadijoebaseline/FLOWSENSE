import { verifyFirebaseIdToken, isAdminUser } from '../lib/firebaseAuth.js';
import { findUserByEmail, createOrUpdateUser } from '../lib/userStore.js';

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) {
    return sendJson(res, 401, { authenticated: false, error: 'auth_required' });
  }

  try {
    const payload = await verifyFirebaseIdToken(token);
    const email = payload.email || '';
    if (!email) {
      return sendJson(res, 401, { authenticated: false, error: 'invalid_token' });
    }

    const existingUser = await findUserByEmail(email);
    const role = existingUser?.role || (isAdminUser({ email, uid: payload.uid || payload.sub }) ? 'admin' : 'viewer');
    const banned = existingUser?.banned || false;

    const user = await createOrUpdateUser({
      id: payload.uid || payload.sub,
      name: payload.name || 'User',
      email,
      role,
      banned,
    });

    if (user.banned) {
      return sendJson(res, 403, { authenticated: false, error: 'banned' });
    }

    return sendJson(res, 200, {
      authenticated: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, banned: user.banned },
    });
  } catch (error) {
    return sendJson(res, 401, { authenticated: false, error: 'invalid_token', message: error.message });
  }
}
