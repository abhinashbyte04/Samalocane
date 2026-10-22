const { withAuth } = require('../../../../lib/rbac');
const { 
  getOrCreateSession, 
  joinSession, 
  heartbeatSession, 
  leaveSession, 
  completeSession,
  verifyConsultationParticipant 
} = require('../../../../lib/consultationSession');

async function handler(req, res) {
  const { id } = req.query;
  const user = req.user;

  try {
    // 1. GET: Inspect session status and presence
    if (req.method === 'GET') {
      const { session, consultation } = await getOrCreateSession(id, user);
      const isPatient = consultation.patient_id === user.id;

      return res.status(200).json({
        success: true,
        session,
        participant: {
          role: isPatient ? 'patient' : 'doctor',
          isSelfPresent: isPatient ? session.patient_present : session.doctor_present,
          isPeerPresent: isPatient ? session.doctor_present : session.patient_present
        }
      });
    }

    // 2. POST: Join consultation session
    if (req.method === 'POST') {
      const { mode } = req.body || {};
      const { session, consultation } = await joinSession(id, user, { mode });
      const isPatient = consultation.patient_id === user.id;

      return res.status(200).json({
        success: true,
        message: 'Successfully joined consultation session.',
        session,
        participant: {
          role: isPatient ? 'patient' : 'doctor',
          isSelfPresent: true,
          isPeerPresent: isPatient ? session.doctor_present : session.patient_present
        }
      });
    }

    // 3. PUT: Heartbeat, connection tier report, and mode change
    if (req.method === 'PUT') {
      const { connectionTier, activeMode } = req.body || {};
      const result = await heartbeatSession(id, user, { connectionTier, activeMode });

      return res.status(200).json({
        success: true,
        session: result.session,
        peerStatus: result.peerStatus
      });
    }

    // 4. DELETE: Disconnect or conclude session
    if (req.method === 'DELETE') {
      const { action } = req.body || {};
      if (action === 'complete') {
        const completed = await completeSession(id, user);
        return res.status(200).json({ success: true, message: 'Consultation session concluded.', session: completed });
      }

      const left = await leaveSession(id, user);
      return res.status(200).json({ success: true, message: 'Disconnected from consultation session.', session: left });
    }

    return res.status(405).json({ error: 'MethodNotAllowed' });
  } catch (err) {
    if (err.code === 'ForbiddenSessionParticipant') {
      return res.status(403).json({
        error: 'ForbiddenSessionParticipant',
        message: err.message
      });
    }
    if (err.code === 'NotFound') {
      return res.status(404).json({ error: 'NotFound', message: err.message });
    }
    if (err.code === 'InvalidConsultationStateForSession') {
      return res.status(400).json({ error: err.code, message: err.message });
    }

    console.error('[Session API Error]', err);
    return res.status(500).json({ error: 'SessionError', message: err.message || 'Consultation session failed.' });
  }
}

export default withAuth(handler);

