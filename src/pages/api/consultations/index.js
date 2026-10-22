const { withAuth } = require('../../../lib/rbac');
const { query } = require('../../../lib/db');
const { generateReferenceNumber, CONSULTATION_STATES } = require('../../../lib/consultationStateMachine');

async function handler(req, res) {
  const user = req.user;

  // 1. POST: Patient submits a new consultation request
  if (req.method === 'POST') {
    if (user.role !== 'patient') {
      return res.status(403).json({
        error: 'ForbiddenRole',
        message: 'Only registered patients can initiate consultation requests.'
      });
    }

    try {
      const { doctorId, requestedMode, chiefComplaint, symptoms, scheduledAt, slotId } = req.body || {};

      if (!doctorId || typeof doctorId !== 'string') {
        return res.status(400).json({ error: 'ValidationError', message: 'Doctor ID is required.' });
      }

      if (!chiefComplaint || typeof chiefComplaint !== 'string' || !chiefComplaint.trim()) {
        return res.status(400).json({ error: 'ValidationError', message: 'Primary reason / chief complaint is required.' });
      }

      const mode = (requestedMode || 'audio').toLowerCase();
      if (!['audio', 'video', 'text'].includes(mode)) {
        return res.status(400).json({ error: 'ValidationError', message: 'Consultation mode must be audio, video, or text.' });
      }

      // Verify doctor exists and is verified
      const docRes = await query('SELECT * FROM doctor_profiles WHERE user_id = $1 OR id = $1', [doctorId]);
      if (docRes.rows.length === 0) {
        return res.status(404).json({ error: 'DoctorNotFound', message: 'Selected doctor record was not found.' });
      }

      const doctorProfile = docRes.rows[0];
      if (!doctorProfile.is_verified) {
        return res.status(400).json({
          error: 'UnverifiedDoctor',
          message: 'Cannot request consultation with unverified doctor credentials.'
        });
      }

      // Check mode support
      if (doctorProfile.consultation_modes && !doctorProfile.consultation_modes.includes(mode)) {
        return res.status(400).json({
          error: 'ModeNotSupported',
          message: `Dr. ${doctorProfile.full_name || 'Specialist'} does not support '${mode}' mode. Supported: ${doctorProfile.consultation_modes.join(', ')}`
        });
      }

      // Generate official Reference Number
      const referenceNumber = generateReferenceNumber();

      // Insert consultation record
      const insertSql = `
        INSERT INTO consultations (
          reference_number, patient_id, doctor_id, status, requested_mode,
          chief_complaint, symptoms, scheduled_at, slot_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const consultRes = await query(insertSql, [
        referenceNumber,
        user.id,
        doctorProfile.user_id,
        CONSULTATION_STATES.SUBMITTED,
        mode,
        chiefComplaint.trim(),
        symptoms ? symptoms.trim() : '',
        scheduledAt || null,
        slotId || null
      ]);

      const newConsultation = consultRes.rows[0];

      // Record initial state transition in history
      await query(
        `INSERT INTO consultation_status_history (
          consultation_id, from_status, to_status, actor_id, actor_role, reason
        )
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          newConsultation.id,
          CONSULTATION_STATES.DRAFT,
          CONSULTATION_STATES.SUBMITTED,
          user.id,
          'patient',
          'Initial request submitted by patient'
        ]
      );

      return res.status(201).json({
        message: 'Consultation request submitted successfully.',
        referenceNumber,
        consultation: newConsultation
      });
    } catch (err) {
      console.error('[Consultation POST Error]', err);
      return res.status(500).json({ error: 'RequestFailed', message: 'Failed to create consultation request.' });
    }
  }

  // 2. GET: List consultation requests for current user
  if (req.method === 'GET') {
    try {
      let sql = 'SELECT * FROM consultations';
      const params = [];

      if (user.role === 'patient') {
        sql += ' WHERE patient_id = $1';
        params.push(user.id);
      } else if (user.role === 'doctor') {
        sql += ' WHERE doctor_id = $1';
        params.push(user.id);
      }
      // Admins see all

      sql += ' ORDER BY created_at DESC';

      const result = await query(sql, params);
      return res.status(200).json({ consultations: result.rows });
    } catch (err) {
      console.error('[Consultation GET Error]', err);
      return res.status(500).json({ error: 'FetchFailed', message: 'Failed to retrieve consultations.' });
    }
  }

  return res.status(405).json({ error: 'MethodNotAllowed' });
}

export default withAuth(handler);

