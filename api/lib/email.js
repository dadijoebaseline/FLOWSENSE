import nodemailer from 'nodemailer';

const getSiteUrl = () => {
  const url = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.SITE_URL;
  return url || 'http://localhost:5173';
};

const getTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

export async function sendMagicLink(email, token) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM || `no-reply@${new URL(getSiteUrl()).hostname}`;
  const loginUrl = `${getSiteUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const html = `
    <p>Sign in to FlowSense with the link below:</p>
    <p><a href="${loginUrl}">${loginUrl}</a></p>
    <p>This link is valid for 15 minutes.</p>
  `;

  if (!transport) {
    return { sent: false, previewLink: loginUrl };
  }

  await transport.sendMail({
    to: email,
    from,
    subject: 'FlowSense sign-in link',
    html,
  });

  return { sent: true, previewLink: loginUrl };
}

export async function notifyAdminOfSignup(user) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM || `no-reply@${new URL(getSiteUrl()).hostname}`;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!transport || !adminEmail) {
    return { sent: false };
  }

  const html = `
    <p>New FlowSense signup request:</p>
    <ul>
      <li>Name: ${user.name}</li>
      <li>Email: ${user.email}</li>
      <li>Requested at: ${user.createdAt}</li>
    </ul>
  `;

  await transport.sendMail({
    to: adminEmail,
    from,
    subject: 'FlowSense signup request',
    html,
  });

  return { sent: true };
}
