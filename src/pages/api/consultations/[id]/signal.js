const { withAuth } = require('../../../../lib/rbac');
const { 
  sendSignal, 
  receiveSignals, 
  cleanupSignaling 
} = require('../../../../lib/webrtcSignaling');

async function handler(req, res) {
  const { id } = req.query;
  const user = req.user;

  try {
    // 1. GET: Retrieve pending WebRTC signals for authenticated participant
    if (req.method === 'GET') {
      const result = await receiveSignals(id, user);
      return res.status(200).json({
        success: true,
        consultationId: result.consultationId,
        signals: result.signals
      });
    }

    // 2. POST: Transmit signaling message (offer, answer, ice_candidate, call_ready, call_ended, call_error)
    if (req.method === 'POST') {
      const { signalType, payload } = req.body || {};

      if (!signalType) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Signal type (signalType) is required.'
        });
      }

      const result = await sendSignal(id, user, signalType, payload);
      return res.status(200).json(result);
    }

    // 3. DELETE: Clean up signaling resources
    if (req.method === 'DELETE') {
      await cleanupSignaling(id);
      return res.status(200).json({
        success: true,
        message: 'Signaling session resources cleaned up successfully.'
      });
    }

    return res.status(405).json({ error: 'MethodNotAllowed' });
  } catch (err) {
    if (err.code === 'ForbiddenSessionParticipant') {
      return res.status(403).json({
        error: 'ForbiddenSessionParticipant',
        message: 'Access denied. You are not an authorized participant in this consultation.'
      });
    }
    if (err.code === 'NotFound') {
      return res.status(404).json({ error: 'NotFound', message: err.message });
    }
    if (err.code === 'InvalidSignalType' || err.code === 'InvalidSignalPayload' || err.code === 'InvalidConsultationStateForSignaling') {
      return res.status(400).json({ error: err.code, message: err.message });
    }

    console.error('[Signaling API Error]', err);
    return res.status(500).json({ error: 'SignalingError', message: err.message || 'WebRTC signaling failed.' });
  }
}

export default withAuth(handler);

