/**
 * Samālōcane WebRTC Signaling Coordinator
 * Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas
 *
 * Implements:
 * 1. Validated signaling schema (offer, answer, ice_candidate, call_ready, call_ended, call_error)
 * 2. Strict IDOR / BOLA Authorization (Caller must be assigned doctor or patient)
 * 3. Bidirectional SDP negotiation and ICE candidate exchange
 * 4. Safe ICE candidate queueing when remote description is pending
 * 5. Resource cleanup on call completion or termination
 */

const { query } = require('./db');
const { verifyConsultationParticipant } = require('./consultationSession');

const ALLOWED_SIGNAL_TYPES = [
  'offer',
  'answer',
  'ice_candidate',
  'call_ready',
  'call_ended',
  'call_error'
];

const MAX_PAYLOAD_BYTES = 65536; // 64 KB max payload size

// In-memory ICE candidate queue for candidates arriving before remote description
// Structure: { [consultationId]: { [recipientId]: [candidates] } }
const pendingIceQueues = new Map();

/**
 * Validates signaling payload structure according to WebRTC specifications
 */
function validateSignalPayload(signalType, payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Signaling payload must be a non-null JSON object.' };
  }

  const payloadSize = Buffer.byteLength(JSON.stringify(payload), 'utf8');
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    return { valid: false, error: `Signaling payload exceeds maximum allowed size of ${MAX_PAYLOAD_BYTES} bytes.` };
  }

  if (signalType === 'offer' || signalType === 'answer') {
    if (!payload.sdp || typeof payload.sdp !== 'string') {
      return { valid: false, error: `Invalid ${signalType}: payload must contain a valid 'sdp' string.` };
    }
    if (payload.type !== signalType) {
      return { valid: false, error: `Invalid ${signalType}: payload.type must match '${signalType}'.` };
    }
  }

  if (signalType === 'ice_candidate') {
    if (!payload.candidate && payload.candidate !== '') {
      return { valid: false, error: 'Invalid ice_candidate: payload must contain a candidate object or empty end-of-candidates string.' };
    }
  }

  return { valid: true };
}

/**
 * Sends a WebRTC signaling message between authorized consultation participants
 */
async function sendSignal(consultationId, user, signalType, payload) {
  if (!ALLOWED_SIGNAL_TYPES.includes(signalType)) {
    const err = new Error(`Unsupported signaling type: '${signalType}'. Allowed: ${ALLOWED_SIGNAL_TYPES.join(', ')}`);
    err.code = 'InvalidSignalType';
    throw err;
  }

  // Validate participant authorization (IDOR / BOLA Protection)
  const { consultation, isPatient, isDoctor } = await verifyConsultationParticipant(consultationId, user);

  // Consultations must be accepted or active to exchange signaling
  const validStatuses = ['accepted', 'waiting', 'in_progress'];
  if (!validStatuses.includes(consultation.status)) {
    const err = new Error(`Cannot exchange signaling for consultation in '${consultation.status}' state.`);
    err.code = 'InvalidConsultationStateForSignaling';
    throw err;
  }

  // Determine recipient: Patient sends to Doctor, Doctor sends to Patient
  const recipientId = isPatient ? consultation.doctor_id : consultation.patient_id;

  // Validate payload
  const validation = validateSignalPayload(signalType, payload);
  if (!validation.valid) {
    const err = new Error(validation.error);
    err.code = 'InvalidSignalPayload';
    throw err;
  }

  // Handle call_ended cleanup
  if (signalType === 'call_ended') {
    await cleanupSignaling(consultation.id);
  }

  // Persist signaling message
  const insertSql = `
    INSERT INTO consultation_signals (
      consultation_id, sender_id, recipient_id, signal_type, payload
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const insertRes = await query(insertSql, [
    consultation.id,
    user.id,
    recipientId,
    signalType,
    payload
  ]);

  return {
    success: true,
    signalId: insertRes.rows[0]?.id,
    signalType,
    senderId: user.id,
    recipientId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Retrieves pending signaling messages for the caller and marks them delivered
 */
async function receiveSignals(consultationId, user, options = {}) {
  // Validate participant authorization
  const { consultation } = await verifyConsultationParticipant(consultationId, user);

  // Fetch undelivered signals targeted to this user
  const selectSql = `
    SELECT * FROM consultation_signals 
    WHERE consultation_id = $1 AND recipient_id = $2 AND delivered = FALSE
    ORDER BY created_at ASC
  `;

  const signalsRes = await query(selectSql, [consultation.id, user.id]);
  const signals = signalsRes.rows;

  if (signals.length > 0 && options.markDelivered !== false) {
    // Mark signals as delivered
    await query(
      `UPDATE consultation_signals SET delivered = TRUE WHERE consultation_id = $1 AND recipient_id = $2`,
      [consultation.id, user.id]
    );
  }

  return {
    consultationId: consultation.id,
    recipientId: user.id,
    signals
  };
}

/**
 * Enqueue an ICE candidate when remote description is not yet set
 */
function queueIceCandidate(consultationId, recipientId, candidate) {
  if (!pendingIceQueues.has(consultationId)) {
    pendingIceQueues.set(consultationId, new Map());
  }
  const consultQueue = pendingIceQueues.get(consultationId);
  if (!consultQueue.has(recipientId)) {
    consultQueue.set(recipientId, []);
  }
  consultQueue.get(recipientId).push(candidate);
}

/**
 * Dequeue and return all pending ICE candidates once remote description is set
 */
function flushQueuedIceCandidates(consultationId, recipientId) {
  if (!pendingIceQueues.has(consultationId)) return [];
  const consultQueue = pendingIceQueues.get(consultationId);
  if (!consultQueue.has(recipientId)) return [];

  const candidates = consultQueue.get(recipientId);
  consultQueue.set(recipientId, []);
  return candidates;
}

/**
 * Clean up signaling messages and candidate queues for a consultation
 */
async function cleanupSignaling(consultationId) {
  pendingIceQueues.delete(consultationId);
  await query('DELETE FROM consultation_signals WHERE consultation_id = $1', [consultationId]);
}

module.exports = {
  ALLOWED_SIGNAL_TYPES,
  validateSignalPayload,
  sendSignal,
  receiveSignals,
  queueIceCandidate,
  flushQueuedIceCandidates,
  cleanupSignaling
};

