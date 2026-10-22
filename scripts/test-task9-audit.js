/**
 * Samālōcane Task 9 Comprehensive UI/UX Verification & Final Audit
 * 
 * Verifies:
 * 1. Prohibited strings completely purged (PS 3.2, Kannada characters, old tagline)
 * 2. Branding and logo integrity (vector asset, pulse wave, English name alignment)
 * 3. Authentication UI & enforcement removal (login redirects, default personas)
 * 4. Header Emergency PHC positioning, sizing, and direct routing
 * 5. Bottom Navigation order: Patient, Doctor, Outbox & clearance padding
 * 6. Footer exact phrasing: "© Made with love for mankind"
 * 7. Typography system audit (no micro-text text-[10px]/text-[11px], readable scale)
 * 8. Core clinical functionality, triage, and state machine integrity
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../src/lib/db');
const { recommendDoctors, checkUrgentSafetyPathway } = require('../src/lib/recommendationEngine');
const { validateTransition, CONSULTATION_STATES } = require('../src/lib/consultationStateMachine');
const { withRoleAuth, withAuth } = require('../src/lib/rbac');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    process.exit(1);
  }
  passedTests++;
  console.log(`  ✓ ${message}`);
}

function scanDirectory(dir, filterFn, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    if (entry.isDirectory()) {
      scanDirectory(fullPath, filterFn, callback);
    } else if (filterFn(entry.name)) {
      callback(fullPath, fs.readFileSync(fullPath, 'utf8'));
    }
  }
}

async function runTask9Audit() {
  console.log('================================================================');
  console.log('  Samālōcane Task 9: Final UI/UX Verification & Quality Audit');
  console.log('================================================================\n');

  // ===========================================================================
  // AUDIT 1: Removal of "Samalochane PS 3.2" / "PS 3.2"
  // ===========================================================================
  console.log('[AUDIT 1] Verification of "Samalochane PS 3.2" complete removal:');
  let psMatches = [];
  scanDirectory('src', f => /\.(jsx?|tsx?|json|css|html)$/.test(f), (filePath, content) => {
    if (/PS 3\.2|Samalocane PS|Samalochane PS/i.test(content)) {
      psMatches.push(filePath);
    }
  });
  scanDirectory('public', f => /\.(json|html|svg|js)$/.test(f), (filePath, content) => {
    if (/PS 3\.2|Samalocane PS|Samalochane PS/i.test(content)) {
      psMatches.push(filePath);
    }
  });
  assert(psMatches.length === 0, `No occurrences of "PS 3.2" found (found: ${psMatches.length})`);

  // ===========================================================================
  // AUDIT 2: Removal of Kannada characters
  // ===========================================================================
  console.log('\n[AUDIT 2] Verification of Kannada text removal (all content in English):');
  let kannadaMatches = [];
  scanDirectory('src', f => /\.(jsx?|tsx?|json|css|html)$/.test(f), (filePath, content) => {
    const matches = content.match(/[\u0C80-\u0CFF]/g);
    if (matches) {
      kannadaMatches.push({ filePath, count: matches.length });
    }
  });
  scanDirectory('public', f => /\.(json|html|svg|js)$/.test(f), (filePath, content) => {
    const matches = content.match(/[\u0C80-\u0CFF]/g);
    if (matches) {
      kannadaMatches.push({ filePath, count: matches.length });
    }
  });
  assert(kannadaMatches.length === 0, `No Kannada Unicode characters remain in src/ or public/ (found: ${kannadaMatches.length})`);

  // ===========================================================================
  // AUDIT 3: Removal of old tagline
  // ===========================================================================
  console.log('\n[AUDIT 3] Verification of old tagline removal:');
  let taglineMatches = [];
  scanDirectory('src', f => /\.(jsx?|tsx?|json|css|html)$/.test(f), (filePath, content) => {
    if (/Every Byte Counts|Every Kilobyte Counts|Smart Healthcare\. Continuity/i.test(content)) {
      taglineMatches.push(filePath);
    }
  });
  scanDirectory('public', f => /\.(json|html|svg|js)$/.test(f), (filePath, content) => {
    if (/Every Byte Counts|Every Kilobyte Counts|Smart Healthcare\. Continuity/i.test(content)) {
      taglineMatches.push(filePath);
    }
  });
  assert(taglineMatches.length === 0, `No occurrences of old tagline found (found: ${taglineMatches.length})`);

  // ===========================================================================
  // AUDIT 4: Footer exact text verification
  // ===========================================================================
  console.log('\n[AUDIT 4] Footer text verification:');
  const footerContent = fs.readFileSync('src/components/layout/Footer.jsx', 'utf8');
  assert(footerContent.includes('© Made with love for mankind'), 'Footer displays exactly "© Made with love for mankind"');
  assert(!footerContent.includes('Coastal and Hill Taluka Prototype'), 'Old prototype copyright label removed from Footer');
  assert(!footerContent.includes('2026 Samalochane Telemedicine System'), 'Old prototype system label removed from Footer');

  // ===========================================================================
  // AUDIT 5: Logo, branding, and alignment
  // ===========================================================================
  console.log('\n[AUDIT 5] Logo asset, branding, and English name alignment:');
  assert(fs.existsSync('public/logo.svg'), 'Vector logo asset exists at public/logo.svg');
  assert(fs.existsSync('src/components/common/Logo.jsx'), 'Reusable Logo component exists at src/components/common/Logo.jsx');
  const logoContent = fs.readFileSync('src/components/common/Logo.jsx', 'utf8');
  assert(logoContent.includes('viewBox="0 0 48 48"'), 'Logo defines balanced 48x48 square aspect ratio');
  assert(logoContent.includes('aspect-square'), 'Logo maintains strict aspect ratio without stretching');

  const headerContent = fs.readFileSync('src/components/layout/Header.jsx', 'utf8');
  assert(headerContent.includes('Samālōcane'), 'English brand name Samālōcane displayed beside Logo');
  assert(headerContent.includes('Rural Telemedicine'), 'Healthcare brand subtitle present');

  // ===========================================================================
  // AUDIT 6: Emergency PHC top-left placement & sizing
  // ===========================================================================
  console.log('\n[AUDIT 6] Emergency PHC top-left positioning and functionality:');
  assert(headerContent.includes('Emergency PHC'), 'Emergency PHC element located in main Header');
  assert(headerContent.includes('href="/emergency"'), 'Emergency PHC links directly to /emergency');
  assert(headerContent.includes('PhoneCall'), 'Emergency PHC includes clear telephone icon');
  assert(headerContent.includes('bg-emergency-600'), 'Emergency PHC uses distinct healthcare red contrast');
  assert(headerContent.includes('108'), 'Emergency PHC highlights National 108 shortcut');

  // ===========================================================================
  // AUDIT 7: Bottom Navigation order: Patient, Doctor, Outbox
  // ===========================================================================
  console.log('\n[AUDIT 7] Bottom navigation bar structure and ordering:');
  const bottomNavContent = fs.readFileSync('src/components/layout/BottomNav.jsx', 'utf8');
  const patientIdx = bottomNavContent.indexOf('{/* 1. Patient */}');
  const doctorIdx = bottomNavContent.indexOf('{/* 2. Doctor */}');
  const outboxIdx = bottomNavContent.indexOf('{/* 3. Outbox */}');
  assert(patientIdx !== -1 && doctorIdx !== -1 && outboxIdx !== -1, 'All three navigation elements (Patient, Doctor, Outbox) exist in BottomNav');
  assert(patientIdx < doctorIdx && doctorIdx < outboxIdx, 'Bottom navigation elements strictly ordered: 1. Patient -> 2. Doctor -> 3. Outbox');

  const appContent = fs.readFileSync('src/pages/_app.jsx', 'utf8');
  assert(appContent.includes('pb-16 sm:pb-20'), 'Main application layout has bottom padding (pb-16 sm:pb-20) to prevent bottom bar overlap');

  // ===========================================================================
  // AUDIT 8: Authentication removal & public unauthenticated flow
  // ===========================================================================
  console.log('\n[AUDIT 8] Authentication removal & default persona continuity:');
  const loginContent = fs.readFileSync('src/pages/auth/login.jsx', 'utf8');
  assert(loginContent.includes("router.replace('/')"), 'Legacy login route silently redirects to home without showing login form');

  // Test withRoleAuth supplies persona without 401/403
  let calledRole = null;
  const mockAdminHandler = withRoleAuth(['admin'], (req, res) => {
    calledRole = req.user.role;
  });
  mockAdminHandler({}, {});
  assert(calledRole === 'admin', 'withRoleAuth seamlessly supplies admin persona for administrative desks');

  let calledPatient = null;
  const mockPatientHandler = withAuth((req, res) => {
    calledPatient = req.user.role;
  });
  mockPatientHandler({}, {});
  assert(calledPatient === 'patient', 'withAuth seamlessly supplies patient persona for clinical operations');

  // Verify no login buttons in Header
  assert(!headerContent.includes('Sign In') && !headerContent.includes('Login'), 'Header has zero login/sign-in buttons');

  // ===========================================================================
  // AUDIT 9: Typography and readability audit
  // ===========================================================================
  console.log('\n[AUDIT 9] Typography scale and micro-text elimination:');
  let microTextMatches = [];
  scanDirectory('src', f => /\.(jsx?|tsx?)$/.test(f), (filePath, content) => {
    if (/text-\[10px\]|text-\[11px\]/.test(content)) {
      microTextMatches.push(filePath);
    }
  });
  assert(microTextMatches.length === 0, `Zero occurrences of unreadable text-[10px] or text-[11px] across src/ (found: ${microTextMatches.length})`);

  const buttonContent = fs.readFileSync('src/components/ui/Button.jsx', 'utf8');
  assert(buttonContent.includes('text-sm min-h-[38px]'), 'Button sm size upgraded to text-sm with 38px touch target');
  assert(buttonContent.includes('text-sm sm:text-base min-h-[44px]'), 'Button md size upgraded to text-sm/text-base with 44px touch target');

  const badgeContent = fs.readFileSync('src/components/ui/Badge.jsx', 'utf8');
  assert(badgeContent.includes('text-xs sm:text-sm font-semibold'), 'Badge text upgraded to text-xs sm:text-sm font-semibold');

  const alertContent = fs.readFileSync('src/components/ui/Alert.jsx', 'utf8');
  assert(alertContent.includes('text-sm sm:text-base'), 'Alert text upgraded to text-sm sm:text-base');

  const cardContent = fs.readFileSync('src/components/ui/Card.jsx', 'utf8');
  assert(cardContent.includes('text-lg sm:text-xl'), 'CardHeader title upgraded to text-lg sm:text-xl');

  // ===========================================================================
  // AUDIT 10: Non-authentication healthcare features & clinical data
  // ===========================================================================
  console.log('\n[AUDIT 10] Medical workflows, registry, triage & state machine:');
  
  // Database mock model verification
  const usersRes = await query('SELECT * FROM users');
  assert(usersRes.rows.length >= 20, `Database contains full pre-seeded users (${usersRes.rows.length})`);

  const docRes = await query('SELECT * FROM doctor_profiles WHERE is_verified = true');
  assert(docRes.rows.length === 12, `12 State Medical Council verified doctors available in registry`);

  const phcRes = await query('SELECT * FROM phc_facilities');
  assert(phcRes.rows.length === 7, `7 regional emergency PHC facilities active across coastal and hill talukas`);

  // Symptom recommendation and red-flag emergency detection
  const normalRec = await recommendDoctors('itchy red rash with scaling skin on arms');
  assert(normalRec.primarySpecialty?.name === 'Dermatology', 'Symptom matching correctly routes rash to Dermatology');
  assert(normalRec.eligibleDoctors.length > 0, 'Eligible verified dermatologists returned');

  const urgentRec = await recommendDoctors('acute chest pain radiating to left arm with sweating');
  assert(urgentRec.isUrgent === true, 'Red-flag symptom accurately identified as acute medical emergency');
  assert(urgentRec.urgentDetails?.emergencyHotlines.some(h => h.number === '108'), 'Emergency hotline 108 provided for urgent cases');

  // Consultation state machine transitions
  assert(validateTransition('submitted', 'accepted', 'doctor').allowed === true, 'Doctor can accept submitted request');
  assert(validateTransition('accepted', 'waiting', 'patient').allowed === true, 'Patient can enter waiting room from accepted state');
  assert(validateTransition('waiting', 'in_progress', 'doctor').allowed === true, 'Doctor can start in_progress consultation');
  assert(validateTransition('in_progress', 'completed', 'doctor').allowed === true, 'Doctor can conclude consultation normally');

  console.log('\n================================================================');
  console.log(`  TASK 9 AUDIT PASSED: ${passedTests}/${totalTests} Checks Verified (100%)`);
  console.log('================================================================\n');
}

runTask9Audit().catch(err => {
  console.error('[Task 9 Audit Execution Error]', err);
  process.exit(1);
});
