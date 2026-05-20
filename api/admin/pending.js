import { parseCookies } from '../lib/requestUtils.js';
import { getSession } from '../lib/sessionStore.js';
import { findUserById, getPendingUsers } from '../lib/userStore.js';

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const cookies = parseCookies(req);
  const sessionId = cookies.flowsense_session;
  if (!sessionId) return sendJson(res, 401, { error: 'auth_required' });

  const session = await getSession(sessionId);
  if (!session) return sendJson(res, 401, { error: 'auth_required' });

  const user = await findUserById(session.userId);
  if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'forbidden' });

  const pendingUsers = await getPendingUsers();
  return sendJson(res, 200, { pendingUsers });
}
