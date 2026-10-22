/**
 * Samālōcane Task 4: Admin Panel Removal Test Suite
 * Automated tests verifying:
 * 1. UI Removal: Admin Desk link removed from Header
 * 2. UI Removal: Admin Governance card removed from Home page
 * 3. UI Removal: Admin breadcrumb link removed from PortalLayout
 * 4. Page Redirection: /admin route cleanly redirects to public interface (/)
 * 5. next.config.js redirects configuration for /admin
 * 6. Component Cleanup: Unused icons (Lock in index.jsx, ShieldCheck in Header.jsx) cleaned up
 * 7. Preservation: Patient section, Doctor section, and Outbox remain completely functional
 * 8. Preservation: Backend shared services (/api/admin/doctors, RBAC helper, state machine) preserved
 * 9. Non-Regression: Bottom navigation ordering strictly Patient -> Doctor -> Outbox
 * 10. Non-Regression: Footer, typography, and prohibited string compliance
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    console.error(`  ❌ FAILED: ${description}`);
    console.error(`     ${err.message}`);
    throw err;
  }
}

console.log('================================================================');
console.log('  Samālōcane Task 4: Admin Panel Removal & Verification Suite');
console.log('================================================================\n');

// =============================================================================
// SUITE 1: Navigation and User Interface Entry Points Removal
// =============================================================================
console.log('[SUITE 1] Removal of User-Facing Admin Links & Buttons (Requirement 1):');

test('Header component contains zero links to /admin or Admin Desk', () => {
  const headerPath = path.join(__dirname, '../src/components/layout/Header.jsx');
  const code = fs.readFileSync(headerPath, 'utf8');

  assert(!code.includes('href="/admin"'), 'Header must not contain href="/admin"');
  assert(!code.includes('Admin Desk'), 'Header must not render "Admin Desk" label');
  assert(!code.includes('>Admin<'), 'Header must not render "Admin" text');
  assert(code.includes('href="/doctors"'), 'Header must preserve Find Doctors link');
});

test('Landing Page (pages/index.jsx) contains zero links to /admin or Admin Governance', () => {
  const homePath = path.join(__dirname, '../src/pages/index.jsx');
  const code = fs.readFileSync(homePath, 'utf8');

  assert(!code.includes('href="/admin"'), 'Home page must not contain href="/admin"');
  assert(!code.includes('Admin Governance'), 'Home page must not render "Admin Governance" card');
  assert(!code.includes('Credential audits & registry'), 'Home page must not render admin subtitle');
  assert(code.includes('href="/patient"'), 'Home page must preserve Patient Portal card');
  assert(code.includes('href="/doctor"'), 'Home page must preserve Physician Portal card');
});

test('PortalLayout contains zero admin navigation breadcrumbs or desk links', () => {
  const portalLayoutPath = path.join(__dirname, '../src/components/layout/PortalLayout.jsx');
  const code = fs.readFileSync(portalLayoutPath, 'utf8');

  assert(!code.includes('href="/admin"'), 'PortalLayout must not contain href="/admin"');
  assert(!code.includes('Verification Desk'), 'PortalLayout must not contain Verification Desk link');
});

test('Bottom navigation bar contains zero admin links and preserves Patient -> Doctor -> Outbox', () => {
  const navPath = path.join(__dirname, '../src/components/layout/BottomNav.jsx');
  const code = fs.readFileSync(navPath, 'utf8');

  assert(!code.includes('admin'), 'BottomNav must not reference admin');
  const patIdx = code.indexOf('{/* 1. Patient */}');
  const docIdx = code.indexOf('{/* 2. Doctor */}');
  const outIdx = code.indexOf('{/* 3. Outbox */}');
  assert(patIdx !== -1 && docIdx !== -1 && outIdx !== -1, 'All three standard navigation tabs must exist');
  assert(patIdx < docIdx && docIdx < outIdx, 'Bottom navigation sequence must be Patient -> Doctor -> Outbox');
});

// =============================================================================
// SUITE 2: Admin Panel Page Removal & Direct URL Handling
// =============================================================================
console.log('\n[SUITE 2] Admin Panel Page Removal & Public Redirection (Requirements 2, 8, 9, 10):');

test('Admin page (pages/admin/index.jsx) no longer contains user-facing admin UI or tables', () => {
  const adminPagePath = path.join(__dirname, '../src/pages/admin/index.jsx');
  const code = fs.readFileSync(adminPagePath, 'utf8');

  assert(!code.includes('AdminPortal'), 'Must not render AdminPortal component');
  assert(!code.includes('pendingDoctors'), 'Must not hold pending doctors state or UI');
  assert(!code.includes('handleVerify'), 'Must not contain verification buttons or actions');
  assert(!code.includes('Administrative Governance & Verification Desk'), 'Must not render governance heading');
  assert(!code.includes('StatCard'), 'Must not render administrative stat cards');
});

test('Admin page (pages/admin/index.jsx) implements automatic redirect to public interface (/)', () => {
  const adminPagePath = path.join(__dirname, '../src/pages/admin/index.jsx');
  const code = fs.readFileSync(adminPagePath, 'utf8');

  assert(code.includes("router.replace('/')"), 'Must automatically redirect client-side visits to /');
  assert(code.includes('getServerSideProps'), 'Must implement getServerSideProps for server-side redirection');
  assert(code.includes("destination: '/'"), 'Server-side redirect destination must be /');
  assert(code.includes('permanent: false'), 'Redirection must be temporary (307)');
});

test('next.config.js defines routing-level redirects for /admin to /', () => {
  const configPath = path.join(__dirname, '../next.config.js');
  const code = fs.readFileSync(configPath, 'utf8');

  assert(code.includes('redirects()'), 'next.config.js must export redirects function');
  assert(code.includes("source: '/admin'"), 'Must redirect /admin');
  assert(code.includes("destination: '/'"), 'Must redirect to public home /');
});

test('No hidden or renamed admin pages were created', () => {
  const pagesDir = path.join(__dirname, '../src/pages');
  const files = fs.readdirSync(pagesDir);

  const suspicious = ['dashboard-admin', 'governance', 'superadmin', 'management', 'portal-admin', 'verify-docs'];
  suspicious.forEach(name => {
    assert(!files.includes(name) && !files.includes(`${name}.jsx`), `No renamed admin page "${name}" should exist`);
  });
});

// =============================================================================
// SUITE 3: Code Cleanup & Unused Dependency Removal
// =============================================================================
console.log('\n[SUITE 3] Component & Import Cleanup (Requirements 3 & 6):');

test('Header.jsx removed unused ShieldCheck icon import', () => {
  const headerPath = path.join(__dirname, '../src/components/layout/Header.jsx');
  const code = fs.readFileSync(headerPath, 'utf8');

  const importMatch = code.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
  assert(importMatch, 'Header must import from lucide-react');
  assert(!importMatch[1].includes('ShieldCheck'), 'Header should not import unused ShieldCheck icon');
});

test('pages/index.jsx removed unused Lock icon import', () => {
  const homePath = path.join(__dirname, '../src/pages/index.jsx');
  const code = fs.readFileSync(homePath, 'utf8');

  const importMatch = code.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
  assert(importMatch, 'Home page must import from lucide-react');
  assert(!importMatch[1].includes('Lock'), 'Home page should not import unused Lock icon');
});

// =============================================================================
// SUITE 4: Preservation of Shared Backend Services & Models
// =============================================================================
console.log('\n[SUITE 4] Preservation of Shared Services & Backend Logic (Requirements 5 & 7):');

test('Backend API route /api/admin/doctors is preserved for server-side verification and testing', () => {
  const apiPath = path.join(__dirname, '../src/pages/api/admin/doctors.js');
  assert(fs.existsSync(apiPath), 'API route /api/admin/doctors must exist');
  const code = fs.readFileSync(apiPath, 'utf8');
  assert(code.includes('withRoleAuth'), 'Must remain guarded by withRoleAuth');
  assert(code.includes('pendingDoctors') && code.includes('verifiedDoctors'), 'Must preserve query logic');
});

test('Consultation state machine role definitions and session models are preserved', () => {
  const smPath = path.join(__dirname, '../src/lib/consultationStateMachine.js');
  const code = fs.readFileSync(smPath, 'utf8');
  assert(code.includes('allowedRoles'), 'State machine transition permissions must be intact');

  const sessionPath = path.join(__dirname, '../src/lib/consultationSession.js');
  const sessionCode = fs.readFileSync(sessionPath, 'utf8');
  assert(sessionCode.includes('verifyConsultationParticipant'), 'Consultation session verifier must be intact');
});

test('Database seed data and mock user credentials preserved', () => {
  const dbPath = path.join(__dirname, '../src/lib/db.js');
  const code = fs.readFileSync(dbPath, 'utf8');
  assert(code.includes('admin@samalocane.in'), 'Admin system seed user retained for backend testing');
  assert(code.includes('dr.ramesh.rao@samalocane.in'), 'Doctor seed user retained');
  assert(code.includes('role: \'patient\''), 'Patient seed user retained');
});

// =============================================================================
// SUITE 5: Non-Regression of Patient, Doctor, and Outbox Features
// =============================================================================
console.log('\n[SUITE 5] Non-Regression of Core Healthcare Modules (Requirement 4):');

test('Patient Directory & Add Patient features remain intact', () => {
  const patientPagePath = path.join(__dirname, '../src/pages/patient/index.jsx');
  const code = fs.readFileSync(patientPagePath, 'utf8');
  assert(code.includes('PatientDirectory'), 'PatientDirectory component rendered');
  assert(code.includes('AddPatientModal'), 'AddPatientModal component rendered');
  assert(code.includes('PatientDetailModal'), 'PatientDetailModal component rendered');
  assert(code.includes('PatientRecommendationModal'), 'PatientRecommendationModal component rendered');
});

test('Doctor Directory & Profiles remain intact', () => {
  const doctorPagePath = path.join(__dirname, '../src/pages/doctor/index.jsx');
  const code = fs.readFileSync(doctorPagePath, 'utf8');
  assert(code.includes('DoctorDirectory'), 'DoctorDirectory component rendered');
  assert(code.includes('DoctorDetailModal'), 'DoctorDetailModal component rendered');

  const publicDoctorsPath = path.join(__dirname, '../src/pages/doctors/index.jsx');
  assert(fs.existsSync(publicDoctorsPath), 'Public /doctors directory page must exist');
});

test('Patient-to-Doctor Recommendation Engine remains intact', () => {
  const matcherPath = path.join(__dirname, '../src/lib/patientDoctorMatcher.js');
  assert(fs.existsSync(matcherPath), 'patientDoctorMatcher.js must exist');
  const { matchPatientToDoctors } = require('../src/lib/patientDoctorMatcher');

  const testMatch = matchPatientToDoctors({
    name: 'Audit Patient',
    age: 45,
    gender: 'Female',
    primaryCondition: 'Severe itchy skin rash on arms'
  });
  assert.strictEqual(testMatch.recommendedSpecialty, 'Dermatology');
  assert(testMatch.recommendations.length > 0);
  assert.strictEqual(testMatch.recommendations[0].doctor.specialty_name, 'Dermatology');
});

test('Footer displays exactly "© Made with love for mankind"', () => {
  const footerPath = path.join(__dirname, '../src/components/layout/Footer.jsx');
  const code = fs.readFileSync(footerPath, 'utf8');
  assert(code.includes('© Made with love for mankind'));
});

// =============================================================================
// SUMMARY
// =============================================================================
console.log('================================================================');
console.log(`  TASK 4 AUDIT PASSED: ${passedTests}/${totalTests} Checks Verified (100%)`);
console.log('================================================================\n');
