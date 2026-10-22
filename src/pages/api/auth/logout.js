const { clearAuthCookie } = require('../../../lib/auth');

export default function handler(req, res) {
  res.setHeader('Set-Cookie', clearAuthCookie());
  res.status(200).json({ message: 'Session logged out successfully.' });
}

