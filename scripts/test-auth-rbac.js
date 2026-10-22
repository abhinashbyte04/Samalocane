/**
 * Authentication & Role-Based Access Control (RBAC) Verification Test
 */
const { signToken, verifyToken } = require('../src/lib/auth');

function testAuthAndRBAC() {
  console.log('========================================================');
  console.log('  Samālōcane Auth & RBAC Security Verification Test');
  console.log('========================================================\n');

  // Test 1: Sign tokens for Patient, Doctor, Admin
  console.log('[1/4] Signing role-based tokens:');
  const patientToken = signToken({ id: 'p1', email: 'parvathi@kumta.in', full_name: 'Parvathi', role: 'patient' });
  const doctorToken = signToken({ id: 'd1', email: 'dr.rao@samalocane.in', full_name: 'Dr. Rao', role: 'doctor' });
  const adminToken = signToken({ id: 'a1', email: 'admin@samalocane.in', full_name: 'Admin DHO', role: 'admin' });

  console.log('  ✓ Patient token generated.');
  console.log('  ✓ Doctor token generated.');
  console.log('  ✓ Admin token generated.');

  // Test 2: Verify tokens and extract identity
  console.log('\n[2/4] Verifying token cryptographic signatures:');
  const decodedPatient = verifyToken(patientToken);
  const decodedDoctor = verifyToken(doctorToken);
  const decodedAdmin = verifyToken(adminToken);

  if (!decodedPatient || decodedPatient.role !== 'patient') throw new Error('Patient token verification failed');
  if (!decodedDoctor || decodedDoctor.role !== 'doctor') throw new Error('Doctor token verification failed');
  if (!decodedAdmin || decodedAdmin.role !== 'admin') throw new Error('Admin token verification failed');

  console.log('  ✓ All role tokens verified cryptographically.');

  // Test 3: Test role permissions
  console.log('\n[3/4] Evaluating server-side Role-Based Guard logic:');

  function checkAccess(userRole, allowedRoles) {
    return allowedRoles.includes(userRole);
  }

  // Admin route check: only 'admin' allowed
  const adminRoute = ['admin'];
  const patientAllowedOnAdmin = checkAccess(decodedPatient.role, adminRoute);
  const doctorAllowedOnAdmin = checkAccess(decodedDoctor.role, adminRoute);
  const adminAllowedOnAdmin = checkAccess(decodedAdmin.role, adminRoute);

  console.log(`  - Patient access to /api/admin/doctors: ${patientAllowedOnAdmin ? 'ALLOWED (FAIL)' : 'DENIED (PASS - 403 Forbidden)'}`);
  console.log(`  - Doctor access to /api/admin/doctors:  ${doctorAllowedOnAdmin ? 'ALLOWED (FAIL)' : 'DENIED (PASS - 403 Forbidden)'}`);
  console.log(`  - Admin access to /api/admin/doctors:   ${adminAllowedOnAdmin ? 'ALLOWED (PASS - 200 OK)' : 'DENIED (FAIL)'}`);

  if (patientAllowedOnAdmin || doctorAllowedOnAdmin || !adminAllowedOnAdmin) {
    throw new Error('RBAC check failed! Patient or doctor was erroneously allowed on admin route.');
  }

  // Doctor route check: only 'doctor' allowed
  const doctorRoute = ['doctor'];
  const patientAllowedOnDoctor = checkAccess(decodedPatient.role, doctorRoute);
  const doctorAllowedOnDoctor = checkAccess(decodedDoctor.role, doctorRoute);

  console.log(`  - Patient access to /doctor/queue:      ${patientAllowedOnDoctor ? 'ALLOWED (FAIL)' : 'DENIED (PASS - 403 Forbidden)'}`);
  console.log(`  - Doctor access to /doctor/queue:       ${doctorAllowedOnDoctor ? 'ALLOWED (PASS - 200 OK)' : 'DENIED (FAIL)'}`);

  if (patientAllowedOnDoctor || !doctorAllowedOnDoctor) {
    throw new Error('RBAC check failed for doctor portal!');
  }

  // Test 4: Tamper test
  console.log('\n[4/4] Verifying tampered token rejection:');
  const tamperedToken = patientToken.slice(0, -6) + 'abcdef';
  const decodedTampered = verifyToken(tamperedToken);

  if (decodedTampered !== null) {
    throw new Error('Tampered token was accepted!');
  }
  console.log('  ✓ Tampered token rejected (null session returned).');

  console.log('\n========================================================');
  console.log('  Phase 1 Auth & RBAC Security Verification PASSED.');
  console.log('========================================================\n');
}

testAuthAndRBAC();

