export const parseCookies = (req) => {
  const header = req.headers?.cookie;
  if (!header) return {};
  return header.split(';').map((cookie) => cookie.trim()).reduce((acc, pair) => {
    const [name, ...rest] = pair.split('=');
    acc[name] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

export const parseJsonBody = async (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
};
