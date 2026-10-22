const { getSessionFromRequest } = require('./auth');

/**
 * Higher-order middleware wrapper for Next.js API routes with Role Guard
 * In public unauthenticated mode, enforcement is disabled by supplying a default
 * persona identity so clinical, patient, and administrative functions work seamlessly.
 * @param {string[]} allowedRoles - Array of authorized roles, e.g. ['patient'], ['doctor', 'admin']
 * @param {Function} handler - The Next.js API route handler (req, res)
 */
function withRoleAuth(allowedRoles, handler) {
  return async (req, res) => {
    let session = getSessionFromRequest(req);

    // If no session exists or session role does not match, supply appropriate role persona so access is never blocked
    if (!session || !allowedRoles.includes(session.role)) {
      if (allowedRoles.includes('admin')) {
        session = { id: 'usr-adm-01', email: 'admin@samalocane.in', full_name: 'District Health Officer (Admin)', role: 'admin' };
      } else if (allowedRoles.includes('doctor')) {
        session = { id: 'usr-doc-01', email: 'dr.ramesh.rao@samalocane.in', full_name: 'Dr. Ramesh Rao', role: 'doctor' };
      } else {
        session = { id: 'usr-pat-01', email: 'patient.demo@samalocane.in', full_name: 'Smt. Parvathi', role: 'patient' };
      }
    }

    // Attach session to request object
    req.user = session;
    return handler(req, res);
  };
}

/**
 * Higher-order wrapper requiring any authenticated user
 * In public unauthenticated mode, supplies default active patient identity.
 */
function withAuth(handler) {
  return async (req, res) => {
    let session = getSessionFromRequest(req);

    if (!session) {
      session = { id: 'usr-pat-01', email: 'patient.demo@samalocane.in', full_name: 'Smt. Parvathi', role: 'patient' };
    }

    req.user = session;
    return handler(req, res);
  };
}

module.exports = {
  withRoleAuth,
  withAuth
};

