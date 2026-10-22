const { withAuth } = require('../../../../lib/rbac');
const { query } = require('../../../../lib/db');
const { verifyConsultationParticipant } = require('../../../../lib/consultationSession');

async function handler(req, res) {
  const { id } = req.query;
  const user = req.user;

  try {
    // Participant authorization guard (IDOR / BOLA Protection)
    const { consultation, isPatient, isDoctor } = await verifyConsultationParticipant(id, user);

    // 1. GET: Retrieve consultation messages
    if (req.method === 'GET') {
      const messagesRes = await query(
        `SELECT m.*, u.full_name AS sender_name, u.role AS sender_role
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.consultation_id = $1
         ORDER BY m.server_received_at ASC`,
        [consultation.id]
      );

      return res.status(200).json({
        success: true,
        consultationId: consultation.id,
        messages: messagesRes.rows
      });
    }

    // 2. POST: Send message with Client Message UUID & Server ACK
    if (req.method === 'POST') {
      const { content, clientMsgId, messageType } = req.body || {};

      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'ValidationError', message: 'Message content cannot be empty.' });
      }

      if (!clientMsgId || typeof clientMsgId !== 'string') {
        return res.status(400).json({ error: 'ValidationError', message: 'Unique client message ID (clientMsgId) is required for delivery acknowledgement.' });
      }

      // Check if message was already processed (Deduplication)
      const existingRes = await query('SELECT * FROM messages WHERE client_msg_id = $1', [clientMsgId]);
      if (existingRes.rows.length > 0) {
        const existing = existingRes.rows[0];
        return res.status(200).json({
          ack: true,
          clientMsgId,
          messageId: existing.id,
          serverReceivedAt: existing.server_received_at,
          delivered: true,
          duplicate: true,
          message: existing
        });
      }

      // Persist to database
      const insertSql = `
        INSERT INTO messages (consultation_id, sender_id, client_msg_id, content, message_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const insertRes = await query(insertSql, [
        consultation.id,
        user.id,
        clientMsgId,
        content.trim(),
        messageType || 'text'
      ]);

      const savedMessage = insertRes.rows[0];

      // Instant Server ACK Emission
      return res.status(201).json({
        ack: true,
        clientMsgId,
        messageId: savedMessage.id,
        serverReceivedAt: savedMessage.server_received_at,
        delivered: true,
        message: {
          ...savedMessage,
          sender_name: user.full_name,
          sender_role: user.role
        }
      });
    }

    return res.status(405).json({ error: 'MethodNotAllowed' });
  } catch (err) {
    if (err.code === 'ForbiddenSessionParticipant') {
      return res.status(403).json({
        error: 'ForbiddenSessionParticipant',
        message: 'Access denied. You can only view or send messages for consultations to which you are assigned.'
      });
    }
    if (err.code === 'NotFound') {
      return res.status(404).json({ error: 'NotFound', message: err.message });
    }

    console.error('[Messages API Error]', err);
    return res.status(500).json({ error: 'MessageProcessingError', message: 'Failed to process message request.' });
  }
}

export default withAuth(handler);

