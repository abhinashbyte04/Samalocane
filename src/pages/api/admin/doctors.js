const crypto = require('crypto');
const { withRoleAuth } = require('../../../lib/rbac');
const { query, mockStore } = require('../../../lib/db');

async function handler(req, res) {
  if (req.method === 'GET') {
    const pending = mockStore.doctor_profiles
      .filter(d => !d.is_verified)
      .map(dp => {
        const u = mockStore.users.find(user => user.id === dp.user_id) || {};
        return {
          ...dp,
          full_name: u.full_name || 'Dr. Specialist',
          email: u.email || ''
        };
      });

    const verified = mockStore.doctor_profiles
      .filter(d => d.is_verified)
      .map(dp => {
        const u = mockStore.users.find(user => user.id === dp.user_id) || {};
        return {
          ...dp,
          full_name: u.full_name || 'Dr. Specialist',
          email: u.email || ''
        };
      });

    const stats = {
      totalUsers: mockStore.users.length,
      totalPatients: mockStore.users.filter(u => u.role === 'patient').length,
      verifiedDoctorsCount: verified.length,
      pendingVerificationsCount: pending.length,
      totalConsultations: mockStore.consultations.length,
      activeConsultations: mockStore.consultations.filter(c => ['submitted', 'waiting', 'in_progress', 'accepted'].includes(c.status)).length,
      completedConsultations: mockStore.consultations.filter(c => c.status === 'completed').length,
      phcCount: mockStore.phc_facilities.length
    };

    return res.status(200).json({
      pendingDoctors: pending,
      verifiedDoctors: verified,
      stats
    });
  }

  if (req.method === 'POST') {
    const { doctorId, isVerified, notes } = req.body || {};

    const doc = mockStore.doctor_profiles.find(d => d.id === doctorId || d.user_id === doctorId);
    if (!doc) {
      return res.status(404).json({ error: 'DoctorNotFound', message: 'Doctor record not found.' });
    }

    doc.is_verified = Boolean(isVerified);
    doc.verification_date = new Date().toISOString();
    doc.verified_by = req.user.id;
    doc.updated_at = new Date().toISOString();

    // Log in audit trail
    mockStore.audit_logs.push({
      id: crypto.randomUUID ? crypto.randomUUID() : 'audit-' + Date.now(),
      actor_id: req.user.id,
      action: isVerified ? 'DOCTOR_VERIFIED_BY_ADMIN' : 'DOCTOR_REJECTED_BY_ADMIN',
      target_resource: 'doctor_profiles',
      target_id: doc.id,
      metadata: { notes: notes || 'Verified via Administrative Governance Portal' },
      created_at: new Date().toISOString()
    });

    return res.status(200).json({
      message: `Doctor credentials ${isVerified ? 'VERIFIED and APPROVED' : 'REJECTED'}.`,
      doctor: doc
    });
  }

  return res.status(405).json({ error: 'MethodNotAllowed' });
}

export default withRoleAuth(['admin'], handler);

