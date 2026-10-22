const { withAuth } = require('../../../../lib/rbac');
const { query } = require('../../../../lib/db');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'MethodNotAllowed' });
  }

  const { id } = req.query;
  const user = req.user;

  try {
    const consultRes = await query(
      `SELECT * FROM consultations WHERE id = $1 OR reference_number = $1`,
      [id]
    );

    if (consultRes.rows.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Consultation record not found.' });
    }

    const consultation = consultRes.rows[0];

    // Ownership Authorization Guard: IDOR Protection
    const isPatient = consultation.patient_id === user.id;
    const isDoctor = consultation.doctor_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        error: 'ForbiddenParticipant',
        message: 'Access denied. You are not an authorized participant in this consultation.'
      });
    }

    // Retrieve Status Transition History
    const historyRes = await query(
      `SELECT * FROM consultation_status_history WHERE consultation_id = $1 ORDER BY created_at ASC`,
      [consultation.id]
    );

    return res.status(200).json({
      consultation,
      statusHistory: historyRes.rows
    });
  } catch (err) {
    console.error('[Consultation Detail API Error]', err);
    return res.status(500).json({ error: 'FetchError', message: 'Failed to retrieve consultation details.' });
  }
}

export default withAuth(handler);

