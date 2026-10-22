/**
 * Samālōcane Consultation State Machine
 * Formal 9-State Lifecycle Engine with Server-Side Actor Enforcement
 */

const CONSULTATION_STATES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PENDING_DOCTOR_REVIEW: 'pending_doctor_review',
  ACCEPTED: 'accepted',
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

const TERMINAL_STATES = ['completed', 'rejected', 'cancelled'];

/**
 * Valid state transitions and allowed role permissions
 */
const TRANSITION_RULES = {
  draft: [
    { to: 'submitted', allowedRoles: ['patient'] },
    { to: 'cancelled', allowedRoles: ['patient'] }
  ],
  submitted: [
    { to: 'pending_doctor_review', allowedRoles: ['doctor', 'admin', 'system'] },
    { to: 'accepted', allowedRoles: ['doctor', 'admin'] },
    { to: 'rejected', allowedRoles: ['doctor', 'admin'], requiresReason: true },
    { to: 'cancelled', allowedRoles: ['patient', 'admin'] }
  ],
  pending_doctor_review: [
    { to: 'accepted', allowedRoles: ['doctor', 'admin'] },
    { to: 'rejected', allowedRoles: ['doctor', 'admin'], requiresReason: true },
    { to: 'cancelled', allowedRoles: ['patient', 'admin'] }
  ],
  accepted: [
    { to: 'waiting', allowedRoles: ['patient', 'doctor', 'system', 'admin'] },
    { to: 'in_progress', allowedRoles: ['doctor', 'admin'] },
    { to: 'cancelled', allowedRoles: ['patient', 'doctor', 'admin'], requiresReason: true }
  ],
  waiting: [
    { to: 'in_progress', allowedRoles: ['doctor', 'admin'] },
    { to: 'cancelled', allowedRoles: ['patient', 'doctor', 'admin'], requiresReason: true }
  ],
  in_progress: [
    { to: 'completed', allowedRoles: ['doctor', 'admin'] },
    { to: 'cancelled', allowedRoles: ['doctor', 'admin'], requiresReason: true }
  ],
  completed: [],
  rejected: [],
  cancelled: []
};

/**
 * Validates whether a state transition is legal and permitted for the actor
 */
function validateTransition(fromStatus, toStatus, actorRole, options = {}) {
  // Check if fromStatus is valid
  if (!TRANSITION_RULES[fromStatus]) {
    return {
      allowed: false,
      error: 'InvalidCurrentState',
      message: `Unknown current consultation status: '${fromStatus}'`
    };
  }

  // Check if fromStatus is terminal
  if (TERMINAL_STATES.includes(fromStatus)) {
    return {
      allowed: false,
      error: 'TerminalStateViolation',
      message: `Consultation is already in terminal state '${fromStatus}' and cannot be modified.`
    };
  }

  // Find transition rule
  const matchedRule = TRANSITION_RULES[fromStatus].find(r => r.to === toStatus);
  if (!matchedRule) {
    return {
      allowed: false,
      error: 'IllegalTransition',
      message: `Cannot transition consultation status from '${fromStatus}' directly to '${toStatus}'.`
    };
  }

  // Check actor role authorization
  if (!matchedRule.allowedRoles.includes(actorRole)) {
    return {
      allowed: false,
      error: 'UnauthorizedTransition',
      message: `Role '${actorRole}' is not permitted to transition consultation to '${toStatus}'.`
    };
  }

  // Check required reason (e.g. for rejection or cancellation)
  if (matchedRule.requiresReason && (!options.reason || !options.reason.trim())) {
    return {
      allowed: false,
      error: 'ReasonRequired',
      message: `A reason must be documented when transitioning to '${toStatus}'.`
    };
  }

  return { allowed: true };
}

/**
 * Generates an official Reference Number (e.g. SAM-2026-X8F2Q)
 */
function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SAM-${year}-${rand}`;
}

module.exports = {
  CONSULTATION_STATES,
  TERMINAL_STATES,
  TRANSITION_RULES,
  validateTransition,
  generateReferenceNumber
};

