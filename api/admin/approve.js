import { parseJsonBody } from '../lib/requestUtils.js';
import { parseCookies } from '../lib/requestUtils.js';
import { getSession } from '../lib/sessionStore.js';
import { findUserById, approveUserById } from '../lib/userStore.js';

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const cookies = parseCookies(req);
  const sessionId = cookies.flowsense_session;
  if (!sessionId) return sendJson(res, 401, { error: 'auth_required' });

  const session = await getSession(sessionId);
  if (!session) return sendJson(res, 401, { error: 'auth_required' });

  const user = await findUserById(session.userId);
  if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'forbidden' });

  const { userId } = await parseJsonBody(req);
  if (!userId) {
    return sendJson(res, 400, { error: 'userId is required' });
  }

  const approved = await approveUserById(userId);
  if (!approved) {
    return sendJson(res, 404, { error: 'user_not_found' });
  }

  return sendJson(res, 200, { success: true, approved });
}
