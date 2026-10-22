const { query } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'MethodNotAllowed' });
  }

  try {
    const {
      search,
      specialty,
      mode,
      availableOnly,
      sortBy = 'experience', // 'experience' | 'fee_asc' | 'fee_desc' | 'name'
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Base query: Strictly enforces is_verified = TRUE on the backend!
    let sql = `
      SELECT 
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
        dp.is_verified
      FROM users u
      JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE dp.is_verified = TRUE
    `;

    const params = [];

    // Search by Name or Specialty
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (u.full_name ILIKE $${params.length} OR dp.specialty_name ILIKE $${params.length})`;
    }

    // Filter by Specialty
    if (specialty && specialty.trim()) {
      params.push(`%${specialty.trim()}%`);
      sql += ` AND dp.specialty_name ILIKE $${params.length}`;
    }

    // Filter by Consultation Mode
    if (mode && ['audio', 'video', 'text'].includes(mode.toLowerCase())) {
      params.push(mode.toLowerCase());
      sql += ` AND $${params.length} = ANY(dp.consultation_modes)`;
    }

    // Filter by Availability
    if (availableOnly === 'true' || availableOnly === true) {
      sql += ` AND dp.is_available = TRUE`;
    }

    // Sorting logic
    if (sortBy === 'fee_asc') {
      sql += ` ORDER BY dp.consultation_fee ASC, dp.experience_years DESC`;
    } else if (sortBy === 'fee_desc') {
      sql += ` ORDER BY dp.consultation_fee DESC, dp.experience_years DESC`;
    } else if (sortBy === 'name') {
      sql += ` ORDER BY u.full_name ASC`;
    } else {
      // Default: online available first, then experience
      sql += ` ORDER BY dp.is_available DESC, dp.experience_years DESC`;
    }

    const result = await query(sql, params);
    let allMatches = result.rows;

    // Apply combined filters in mock environment if needed
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allMatches = allMatches.filter(d => 
        (d.full_name && d.full_name.toLowerCase().includes(q)) ||
        (d.specialty_name && d.specialty_name.toLowerCase().includes(q))
      );
    }

    if (specialty && specialty.trim()) {
      const s = specialty.trim().toLowerCase();
      allMatches = allMatches.filter(d => 
        d.specialty_name && d.specialty_name.toLowerCase().includes(s)
      );
    }

    if (mode) {
      allMatches = allMatches.filter(d => 
        d.consultation_modes && d.consultation_modes.includes(mode.toLowerCase())
      );
    }

    if (availableOnly === 'true' || availableOnly === true) {
      allMatches = allMatches.filter(d => d.is_available);
    }

    // Pagination slice
    const totalCount = allMatches.length;
    const paginatedDoctors = allMatches.slice(offset, offset + limitNum);

    return res.status(200).json({
      doctors: paginatedDoctors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      },
      disclaimer: 'All listed practitioners have been verified against State Medical Council registration credentials. Demo doctors are explicitly tagged.'
    });
  } catch (err) {
    console.error('[Doctors API Error]', err);
    return res.status(500).json({ error: 'DatabaseError', message: 'Failed to retrieve doctor directory.' });
  }
}
