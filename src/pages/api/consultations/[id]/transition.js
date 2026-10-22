const { withAuth } = require('../../../../lib/rbac');
const { query, mockStore } = require('../../../../lib/db');
const { validateTransition } = require('../../../../lib/consultationStateMachine');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'MethodNotAllowed' });
  }

  const { id } = req.query;
  const { toStatus, reason } = req.body || {};
  const user = req.user;

  if (!toStatus) {
    return res.status(400).json({ error: 'ValidationError', message: 'Target status (toStatus) is required.' });
  }

  try {
    // 1. Fetch consultation record
    const consultRes = await query(
      `SELECT * FROM consultations WHERE id = $1 OR reference_number = $1`,
      [id]
    );

    if (consultRes.rows.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Consultation record not found.' });
    }

    const consultation = consultRes.rows[0];

    // 2. Ownership Authorization: Prevent unauthorized actors from changing status
    const isPatient = consultation.patient_id === user.id;
    const isDoctor = consultation.doctor_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        error: 'ForbiddenParticipant',
        message: 'Access denied. You are not a participant in this consultation session.'
      });
    }

    // Role-specific check: Patient cannot trigger doctor-controlled transitions and vice versa
    if (user.role === 'patient' && !isPatient) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only manage your own consultation requests.' });
    }
    if (user.role === 'doctor' && !isDoctor && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only manage consultations assigned to your account.' });
    }

    // 3. State Machine Validation
    const validation = validateTransition(consultation.status, toStatus, user.role, { reason });
    if (!validation.allowed) {
      return res.status(400).json({
        error: validation.error,
        message: validation.message
      });
    }

    // 4. Update Consultation Record
    const previousStatus = consultation.status;
    consultation.status = toStatus;
    consultation.updated_at = new Date().toISOString();

    if (toStatus === 'cancelled') {
      consultation.cancellation_reason = reason || 'Cancelled by user';
    } else if (toStatus === 'rejected') {
      consultation.rejection_reason = reason || 'Doctor unavailable';
    } else if (toStatus === 'in_progress') {
      consultation.started_at = consultation.started_at || new Date().toISOString();
    } else if (toStatus === 'completed') {
      consultation.ended_at = new Date().toISOString();
    }

    // Update in mock store
    const mockIndex = mockStore.consultations.findIndex(c => c.id === consultation.id);
    if (mockIndex >= 0) {
      mockStore.consultations[mockIndex] = { ...consultation };
    }

    // 5. Append to Consultation Status History
    const historyEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'hist-' + Date.now(),
      consultation_id: consultation.id,
      from_status: previousStatus,
      to_status: toStatus,
      actor_id: user.id,
      actor_role: user.role,
      reason: reason || null,
      created_at: new Date().toISOString()
    };
    mockStore.consultation_status_history.push(historyEntry);

    // If real PostgreSQL is active, execute database update
    await query(
      `UPDATE consultations SET status = $1, cancellation_reason = $2, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [toStatus, consultation.cancellation_reason, consultation.rejection_reason, consultation.id]
    );

    await query(
      `INSERT INTO consultation_status_history (consultation_id, from_status, to_status, actor_id, actor_role, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [consultation.id, previousStatus, toStatus, user.id, user.role, reason || null]
    );

    return res.status(200).json({
      message: `Consultation status successfully transitioned to '${toStatus}'.`,
      consultation,
      transition: historyEntry
    });
  } catch (err) {
    console.error('[Transition API Error]', err);
    return res.status(500).json({ error: 'TransitionFailed', message: 'Failed to update consultation status.' });
  }
}

export default withAuth(handler);
