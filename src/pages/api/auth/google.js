const { signToken, createAuthCookie } = require('../../../lib/auth');
const { query } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'MethodNotAllowed' });
  }

  try {
    const { email, role, full_name } = req.body || {};

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'ValidationError', message: 'Email is required for authentication.' });
    }

    // Role assignment: restrict admin elevation!
    // Users cannot register themselves as admin.
    const userRole = role === 'doctor' ? 'doctor' : 'patient';

    // Check if user exists in database
    const existing = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const newUserId = crypto.randomUUID ? crypto.randomUUID() : 'usr-' + Date.now();
      const fullName = full_name || email.split('@')[0];

      // Persist new user in database
      const insertUserRes = await query(
        'INSERT INTO users (id, email, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [newUserId, email, fullName, userRole]
      );
      user = insertUserRes.rows[0] || {
        id: newUserId,
        email,
        full_name: fullName,
        role: userRole,
        is_active: true,
        created_at: new Date().toISOString()
      };

      // If registered as doctor, ensure profile is initialized with is_verified = false
      if (userRole === 'doctor') {
        await query(
          `INSERT INTO doctor_profiles (user_id, is_verified, is_available) VALUES ($1, $2, $3)`,
          [newUserId, false, false]
        );
      }
    }

    // Sign session token and set HTTP-only cookie
    const token = signToken(user);
    const cookieHeader = createAuthCookie(token);

    res.setHeader('Set-Cookie', cookieHeader);
    return res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Auth Error]', err);
    return res.status(500).json({ error: 'InternalServerError', message: 'Authentication processing failed.' });
  }
}

