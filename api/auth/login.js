import { parseJsonBody } from '../lib/requestUtils.js';
import { findUserByEmail } from '../lib/userStore.js';
import { createLoginToken } from '../lib/tokenStore.js';
import { sendMagicLink } from '../lib/email.js';

const sendResponse = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { email } = await parseJsonBody(req);
    if (!email) {
      return sendResponse(res, 400, { error: 'Email is required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return sendResponse(res, 404, { error: 'user_not_registered' });
    }

    if (user.status !== 'approved') {
      return sendResponse(res, 403, { error: 'signup_pending' });
    }

    const token = await createLoginToken(user.id);
    const result = await sendMagicLink(user.email, token);
    return sendResponse(res, 200, {
      success: true,
      message: 'Magic link created. Check your email.',
      previewLink: result.previewLink,
      emailSent: result.sent,
    });
  } catch (error) {
    return sendResponse(res, 500, { error: 'server_error', message: error.message || 'Unexpected error' });
  }
}
