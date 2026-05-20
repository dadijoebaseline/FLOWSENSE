import { getLoginToken, deleteLoginToken } from '../lib/tokenStore.js';
import { createSession } from '../lib/sessionStore.js';
import { findUserById } from '../lib/userStore.js';

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const token = req.url?.split('?token=')[1] || '';
  if (!token) {
    return sendJson(res, 400, { error: 'Token is required' });
  }

  try {
    const loginData = await getLoginToken(token);
    if (!loginData) {
      return sendJson(res, 401, { error: 'invalid_or_expired_token' });
    }

    const user = await findUserById(loginData.userId);
    if (!user || user.status !== 'approved') {
      return sendJson(res, 403, { error: 'user_not_approved' });
    }

    await deleteLoginToken(token);
    const { sessionId } = await createSession(user.id);
    res.setHeader('Set-Cookie', `flowsense_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (error) {
    return sendJson(res, 500, { error: 'server_error', message: error.message || 'Unexpected error' });
  }
}
