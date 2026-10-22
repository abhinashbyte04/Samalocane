const { getSessionFromRequest } = require('../../../lib/auth');
const { query } = require('../../../lib/db');

export default async function handler(req, res) {
  let session = getSessionFromRequest(req);

  // In unauthenticated mode, supply default active patient session
  if (!session) {
    session = { id: 'usr-pat-01', email: 'patient.demo@samalocane.in', full_name: 'Smt. Parvathi', role: 'patient' };
  }

  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [session.id]);
    const user = userResult.rows[0] || session;

    let profile = null;
    if (user.role === 'patient') {
      const pResult = await query('SELECT * FROM patient_profiles WHERE user_id = $1', [user.id]);
      profile = pResult.rows[0] || null;
    } else if (user.role === 'doctor') {
      const dResult = await query('SELECT * FROM doctor_profiles WHERE user_id = $1', [user.id]);
      profile = dResult.rows[0] || null;
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      profile
    });
  } catch (err) {
    return res.status(500).json({ error: 'DatabaseError', message: err.message });
  }
}

