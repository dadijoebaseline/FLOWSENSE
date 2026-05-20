import { parseJsonBody } from '../lib/requestUtils.js';
import { findUserByEmail, createPendingUser } from '../lib/userStore.js';
import { notifyAdminOfSignup } from '../lib/email.js';

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
    const { name, email } = await parseJsonBody(req);
    if (!email || !name) {
      return sendResponse(res, 400, { error: 'Name and email are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      if (existing.status === 'approved') {
        return sendResponse(res, 409, { error: 'already_registered' });
      }
      return sendResponse(res, 200, { success: true, pending: true, message: 'Signup request already pending approval.' });
    }

    const user = await createPendingUser({ name, email });
    if (!user) {
      return sendResponse(res, 409, { error: 'already_registered' });
    }

    if (user.status === 'approved' && user.role === 'admin') {
      return sendResponse(res, 201, {
        success: true,
        pending: false,
        adminApproved: true,
        message: 'First signup registered as admin and approved automatically.',
      });
    }

    try {
      await notifyAdminOfSignup(user);
    } catch (notifyError) {
      console.error('Failed to notify admin of signup:', notifyError);
    }

    return sendResponse(res, 201, {
      success: true,
      pending: true,
      message: 'Signup request submitted. Admin approval is required.',
    });
  } catch (error) {
    return sendResponse(res, 500, { error: 'server_error', message: error.message || 'Unexpected error' });
  }
}
