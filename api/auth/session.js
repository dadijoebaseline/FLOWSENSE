import { parseCookies } from '../lib/requestUtils.js';
import { getSession } from '../lib/sessionStore.js';
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

  const cookies = parseCookies(req);
  const sessionId = cookies.flowsense_session;
  if (!sessionId) {
    return sendJson(res, 401, { authenticated: false });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return sendJson(res, 401, { authenticated: false });
  }

  const user = await findUserById(session.userId);
  if (!user || user.status !== 'approved') {
    return sendJson(res, 401, { authenticated: false });
  }

  return sendJson(res, 200, { authenticated: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
