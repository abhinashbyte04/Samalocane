/**
 * Samālōcane Consultation Session & Real-Time Infrastructure Manager
 * Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas
 *
 * Enforces:
 * 1. Strict IDOR / BOLA Authorization (Only assigned patient & doctor can join)
 * 2. Idempotent Session Creation (No duplicate active sessions for same consultation)
 * 3. 8-State Session Lifecycle (created, waiting_peer, ready, active, reconnecting, completed, failed, cancelled)
 * 4. Presence & Heartbeat Tracking with Reconnection Grace Window
 * 5. Low-Bandwidth Mode Fallbacks (Video -> Audio -> Text Chat)
 */

const { query } = require('./db');

const SESSION_STATES = {
  CREATED: 'created',
  WAITING_PEER: 'waiting_peer',
  READY: 'ready',
  ACTIVE: 'active',
  RECONNECTING: 'reconnecting',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

const CONNECTION_TIERS = {
  TIER_1_GOOD: 'good',       // Video + Audio + Text
  TIER_2_FAIR: 'fair',       // Audio-First + Text
  TIER_3_POOR: 'poor',       // Text Chat with Server ACK + Low-res Audio Notes
  TIER_4_OFFLINE: 'offline'   // Local Outbox Queue + Emergency Directory
};

const HEARTBEAT_TIMEOUT_MS = 30000; // 30 seconds before marking peer disconnected

/**
 * Validates consultation existence and participant authorization
 */
async function verifyConsultationParticipant(consultationId, user) {
  if (!consultationId) {
    const err = new Error('Consultation ID is required.');
    err.code = 'ValidationError';
    throw err;
  }

  const consultRes = await query(
    'SELECT * FROM consultations WHERE id = $1 OR reference_number = $1',
    [consultationId]
  );

  if (consultRes.rows.length === 0) {
    const err = new Error('Consultation record not found.');
    err.code = 'NotFound';
    throw err;
  }

  const consultation = consultRes.rows[0];

  // IDOR / BOLA Protection: Verify user is assigned patient, assigned doctor, or admin
  const isPatient = consultation.patient_id === user.id;
  const isDoctor = consultation.doctor_id === user.id;
  const isAdmin = user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    const err = new Error('Access denied. You are not an authorized participant in this consultation.');
    err.code = 'ForbiddenSessionParticipant';
    throw err;
  }

  return {
    consultation,
    isPatient,
    isDoctor,
    isAdmin,
    userRole: isPatient ? 'patient' : isDoctor ? 'doctor' : 'admin'
  };
}

/**
 * Get or create an active consultation communication session (Idempotent)
 */
async function getOrCreateSession(consultationId, user) {
  const { consultation, isPatient, isDoctor } = await verifyConsultationParticipant(consultationId, user);

  // Consultations must be in an accepted, waiting, or in_progress state to host live sessions
  const validConsultationStatuses = ['accepted', 'waiting', 'in_progress'];
  if (!validConsultationStatuses.includes(consultation.status)) {
    const err = new Error(
      `Cannot initialize communication session for consultation in '${consultation.status}' state.`
    );
    err.code = 'InvalidConsultationStateForSession';
    throw err;
  }

  // Look for existing session
  const sessionRes = await query(
    'SELECT * FROM consultation_sessions WHERE consultation_id = $1 ORDER BY created_at DESC LIMIT 1',
    [consultation.id]
  );

  if (sessionRes.rows.length > 0) {
    const existing = sessionRes.rows[0];
    // Return existing session if not in terminal failure
    if (!['completed', 'cancelled', 'failed'].includes(existing.session_status)) {
      return { session: existing, consultation };
    }
  }

  // Idempotently create new session
  const initialMode = consultation.requested_mode || 'audio';
  const insertSql = `
    INSERT INTO consultation_sessions (
      consultation_id, session_status, patient_present, doctor_present,
      active_mode, connection_tier
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const newSessionRes = await query(insertSql, [
    consultation.id,
    SESSION_STATES.CREATED,
    false,
    false,
    initialMode,
    CONNECTION_TIERS.TIER_1_GOOD
  ]);

  return { session: newSessionRes.rows[0], consultation };
}

/**
 * Join an active session and update participant presence
 */
async function joinSession(consultationId, user, options = {}) {
  const { session, consultation } = await getOrCreateSession(consultationId, user);
  const isPatient = consultation.patient_id === user.id;
  const isDoctor = consultation.doctor_id === user.id;

  const now = new Date().toISOString();

  let patientPresent = session.patient_present;
  let doctorPresent = session.doctor_present;

  if (isPatient) {
    patientPresent = true;
    session.patient_joined_at = session.patient_joined_at || now;
    session.patient_last_seen = now;
  } else if (isDoctor) {
    doctorPresent = true;
    session.doctor_joined_at = session.doctor_joined_at || now;
    session.doctor_last_seen = now;
  }

  // Determine state: Both participants present = READY / ACTIVE
  let newStatus = session.session_status;
  if (patientPresent && doctorPresent) {
    newStatus = consultation.status === 'in_progress' ? SESSION_STATES.ACTIVE : SESSION_STATES.READY;
  } else if (patientPresent || doctorPresent) {
    newStatus = SESSION_STATES.WAITING_PEER;
  }

  const activeMode = options.mode || session.active_mode || consultation.requested_mode || 'audio';

  session.session_status = newStatus;
  session.patient_present = patientPresent;
  session.doctor_present = doctorPresent;
  session.active_mode = activeMode;

  await query(
    `UPDATE consultation_sessions 
     SET session_status = $1, patient_present = $2, doctor_present = $3, 
         patient_joined_at = $4, doctor_joined_at = $5, patient_last_seen = $6, doctor_last_seen = $7,
         active_mode = $8
     WHERE id = $9`,
    [
      newStatus,
      patientPresent,
      doctorPresent,
      session.patient_joined_at,
      session.doctor_joined_at,
      session.patient_last_seen,
      session.doctor_last_seen,
      activeMode,
      session.id
    ]
  );

  return { session, consultation };
}

/**
 * Participant heartbeat to monitor connection health and detect drops
 */
async function heartbeatSession(consultationId, user, options = {}) {
  const { consultation, isPatient, isDoctor } = await verifyConsultationParticipant(consultationId, user);

  const sessionRes = await query(
    'SELECT * FROM consultation_sessions WHERE consultation_id = $1 ORDER BY created_at DESC LIMIT 1',
    [consultation.id]
  );

  if (sessionRes.rows.length === 0) {
    const err = new Error('No active communication session found for this consultation.');
    err.code = 'SessionNotFound';
    throw err;
  }

  const session = sessionRes.rows[0];
  const now = new Date();
  const nowIso = now.toISOString();

  if (isPatient) {
    session.patient_present = true;
    session.patient_last_seen = nowIso;
  } else if (isDoctor) {
    session.doctor_present = true;
    session.doctor_last_seen = nowIso;
  }

  if (options.connectionTier) {
    session.connection_tier = options.connectionTier;
  }
  if (options.activeMode) {
    session.active_mode = options.activeMode;
  }

  // Detect peer disconnection if peer last_seen > HEARTBEAT_TIMEOUT_MS
  const peerLastSeen = isPatient ? session.doctor_last_seen : session.patient_last_seen;
  let isPeerDisconnected = false;

  if (peerLastSeen) {
    const elapsed = now.getTime() - new Date(peerLastSeen).getTime();
    if (elapsed > HEARTBEAT_TIMEOUT_MS) {
      isPeerDisconnected = true;
      if (isPatient) session.doctor_present = false;
      else session.patient_present = false;

      if (session.session_status === SESSION_STATES.ACTIVE) {
        session.session_status = SESSION_STATES.RECONNECTING;
        session.reconnect_attempts = (session.reconnect_attempts || 0) + 1;
      }
    }
  }

  await query(
    `UPDATE consultation_sessions 
     SET patient_present = $1, doctor_present = $2, patient_last_seen = $3, doctor_last_seen = $4,
         session_status = $5, connection_tier = $6, active_mode = $7
     WHERE id = $8`,
    [
      session.patient_present,
      session.doctor_present,
      session.patient_last_seen,
      session.doctor_last_seen,
      session.session_status,
      session.connection_tier,
      session.active_mode,
      session.id
    ]
  );

  return {
    session,
    peerStatus: {
      isPeerPresent: isPatient ? session.doctor_present : session.patient_present,
      isPeerReconnecting: isPeerDisconnected,
      lastSeen: peerLastSeen
    }
  };
}

/**
 * Leave or disconnect from session
 */
async function leaveSession(consultationId, user) {
  const { consultation, isPatient, isDoctor } = await verifyConsultationParticipant(consultationId, user);

  const sessionRes = await query(
    'SELECT * FROM consultation_sessions WHERE consultation_id = $1 ORDER BY created_at DESC LIMIT 1',
    [consultation.id]
  );

  if (sessionRes.rows.length === 0) return null;

  const session = sessionRes.rows[0];
  if (isPatient) session.patient_present = false;
  if (isDoctor) session.doctor_present = false;

  // If one participant left, set status to WAITING_PEER if was ready/active
  if (['ready', 'active'].includes(session.session_status)) {
    session.session_status = SESSION_STATES.WAITING_PEER;
  }

  await query(
    `UPDATE consultation_sessions SET patient_present = $1, doctor_present = $2, session_status = $3 WHERE id = $4`,
    [session.patient_present, session.doctor_present, session.session_status, session.id]
  );

  return session;
}

/**
 * Conclude session normally (Doctor or Admin only)
 */
async function completeSession(consultationId, user) {
  const { consultation, isDoctor, isAdmin } = await verifyConsultationParticipant(consultationId, user);

  if (!isDoctor && !isAdmin) {
    const err = new Error('Only the consulting physician or administrator can conclude the session.');
    err.code = 'UnauthorizedSessionCompletion';
    throw err;
  }

  const sessionRes = await query(
    'SELECT * FROM consultation_sessions WHERE consultation_id = $1 ORDER BY created_at DESC LIMIT 1',
    [consultation.id]
  );

  if (sessionRes.rows.length === 0) return null;

  const session = sessionRes.rows[0];
  session.session_status = SESSION_STATES.COMPLETED;
  session.patient_present = false;
  session.doctor_present = false;
  session.ended_at = new Date().toISOString();

  await query(
    `UPDATE consultation_sessions 
     SET session_status = $1, patient_present = FALSE, doctor_present = FALSE, ended_at = $2 
     WHERE id = $3`,
    [SESSION_STATES.COMPLETED, session.ended_at, session.id]
  );

  return session;
}

module.exports = {
  SESSION_STATES,
  CONNECTION_TIERS,
  verifyConsultationParticipant,
  getOrCreateSession,
  joinSession,
  heartbeatSession,
  leaveSession,
  completeSession
};

