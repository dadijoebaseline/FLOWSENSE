import { parseCookies } from '../lib/requestUtils.js';
import { deleteSession } from '../lib/sessionStore.js';

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
  if (sessionId) {
    await deleteSession(sessionId);
  }

  res.setHeader('Set-Cookie', 'flowsense_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  return sendJson(res, 200, { success: true });
}
