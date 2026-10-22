const crypto = require('crypto');

let jwtLib = null;
let cookieLib = null;

try {
  jwtLib = require('jsonwebtoken');
} catch (e) {
  // Built-in fallback below
}

try {
  cookieLib = require('cookie');
} catch (e) {
  // Built-in fallback below
}

const JWT_SECRET = process.env.JWT_SECRET || 'samalocane_default_jwt_secret_32_characters_long_entropy';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Sign JWT token using jsonwebtoken or built-in HMAC SHA-256 fallback
 */
function signToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    exp: user.exp !== undefined ? user.exp : Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  };

  if (jwtLib) {
    return jwtLib.sign(payload, JWT_SECRET);
  }

  // Native HMAC-SHA256 JWT generator
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token using jsonwebtoken or built-in HMAC SHA-256 fallback
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  if (jwtLib) {
    try {
      return jwtLib.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  // Native HMAC-SHA256 JWT verifier
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Extract authenticated session from Next.js API request
 */
function getSessionFromRequest(req) {
  if (!req || !req.headers) return null;

  // 1. Check cookies
  let cookies = {};
  if (req.headers.cookie) {
    if (cookieLib) {
      cookies = cookieLib.parse(req.headers.cookie);
    } else {
      req.headers.cookie.split(';').forEach(c => {
        const [k, v] = c.trim().split('=');
        if (k && v) cookies[k] = decodeURIComponent(v);
      });
    }
    if (cookies.token) {
      const decoded = verifyToken(cookies.token);
      if (decoded) return decoded;
    }
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) return decoded;
  }

  return null;
}

/**
 * Create HTTP-only cookie header string
 */
function createAuthCookie(token) {
  const isProd = process.env.NODE_ENV === 'production';
  if (cookieLib) {
    return cookieLib.serialize('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });
  }
  return `token=${encodeURIComponent(token)}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Lax`;
}

/**
 * Clear session cookie header string
 */
function clearAuthCookie() {
  if (cookieLib) {
    return cookieLib.serialize('token', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0)
    });
  }
  return 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax';
}

module.exports = {
  signToken,
  verifyToken,
  getSessionFromRequest,
  createAuthCookie,
  clearAuthCookie
};

