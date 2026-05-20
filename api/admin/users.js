import { verifyFirebaseIdToken, isAdminEmail } from '../lib/firebaseAuth.js';
import { getAllUsers } from '../lib/userStore.js';

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
  if (!token) return sendJson(res, 401, { error: 'auth_required' });

  try {
    const payload = await verifyFirebaseIdToken(token);
    if (!isAdminEmail(payload.email)) {
      return sendJson(res, 403, { error: 'forbidden' });
    }

    const users = await getAllUsers();
    return sendJson(res, 200, { users });
  } catch (error) {
    return sendJson(res, 401, { error: 'invalid_token', message: error.message });
  }
}
