const { query } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'MethodNotAllowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ValidationError', message: 'Doctor ID is required.' });
  }

  try {
    const result = await query(
      `SELECT 
        u.id AS doctor_user_id,
        u.full_name,
        u.email,
        u.avatar_url,
        dp.id AS profile_id,
        dp.qualification,
        dp.specialty_name,
        dp.council_registration_number,
        dp.council_name,
        dp.registration_year,
        dp.experience_years,
        dp.bio,
        dp.consultation_fee,
        dp.languages_spoken,
        dp.is_available,
        dp.consultation_modes,
        dp.is_verified,
        dp.verification_date
       FROM users u
       JOIN doctor_profiles dp ON u.id = dp.user_id
       WHERE (u.id = $1 OR dp.id = $1)`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Doctor profile not found.' });
    }

    const doctor = result.rows[0];

    return res.status(200).json({
      doctor,
      verificationNotice: doctor.is_verified
        ? `Verified by State Medical Council (${doctor.council_name}: ${doctor.council_registration_number})`
        : 'Credentials pending administrative council verification.'
    });
  } catch (err) {
    console.error('[Doctor Detail API Error]', err);
    return res.status(500).json({ error: 'DatabaseError', message: 'Failed to retrieve doctor profile.' });
  }
}

