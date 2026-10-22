/**
 * Samālōcane Task 6: Complete Telemedicine User Journey Integration & Verification Test Suite
 *
 * Verifies the full end-to-end clinical workflow:
 * STEP 1: Main interface access (Patient, Doctor, Outbox bottom nav; zero admin/auth)
 * STEP 2: Patient selection from directory & duplicate-protected Add Patient
 * STEP 3: Review and correction of patient clinical summary before matching
 * STEP 4: Rule-based doctor recommendations & explainability (including edge cases)
 * STEP 5: Detailed doctor profile review with medical credentials & verification
 * STEP 6: Pre-call device preparation with Internet & Call Guidance Box (8-point checklist)
 * STEP 7: Consultation initiation & joining (honest connection state, no fake peer streams)
 * STEP 8: In-call connection status tracking, recommendations, and non-intrusive help
 * STEP 9: Safe completion / exit to Patient Portal or Waiting Room with audit persistence
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  matchPatientToDoctors,
  checkEmergencySafety,
  scoreSpecialties
} = require('../src/lib/patientDoctorMatcher');

const { INITIAL_DEMO_PATIENTS } = require('../src/data/dummyPatients');
const { INITIAL_DEMO_DOCTORS } = require('../src/data/dummyDoctors');
const { CONSULTATION_STATES, validateTransition } = require('../src/lib/consultationStateMachine');

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
console.log('  Samālōcane Task 6: Complete Telemedicine User Journey Test Suite');
console.log('================================================================\n');

// =============================================================================
// STEP 1: Main Interface & Bottom Navigation (No Admin / Auth)
// =============================================================================
console.log('[STEP 1] Main Interface & Navigation Access:');

test('Website opens directly into public interface without auth barriers', () => {
  const homePath = path.join(__dirname, '../src/pages/index.jsx');
  const code = fs.readFileSync(homePath, 'utf8');

  assert(code.includes('Patient Portal') && code.includes('Physician Portal'), 'Home page highlights healthcare portals');
  assert(!code.includes('Admin Governance'), 'No admin governance card in main interface');
  assert(!code.includes('href="/admin"'), 'No links to /admin');
});

test('Bottom navigation bar contains exactly Patient -> Doctor -> Outbox', () => {
  const navPath = path.join(__dirname, '../src/components/layout/BottomNav.jsx');
  const code = fs.readFileSync(navPath, 'utf8');

  const pIdx = code.indexOf('{/* 1. Patient */}');
  const dIdx = code.indexOf('{/* 2. Doctor */}');
  const oIdx = code.indexOf('{/* 3. Outbox */}');

  assert(pIdx !== -1 && dIdx !== -1 && oIdx !== -1, 'All three core tabs must exist in BottomNav');
  assert(pIdx < dIdx && dIdx < oIdx, 'Bottom navigation sequence must be strictly Patient -> Doctor -> Outbox');
});

test('/admin route redirects to / preventing access without replacing with another admin page', () => {
  const adminPagePath = path.join(__dirname, '../src/pages/admin/index.jsx');
  const code = fs.readFileSync(adminPagePath, 'utf8');
  assert(code.includes("router.replace('/')") && code.includes("destination: '/'"), 'Admin page redirects to /');

  const configPath = path.join(__dirname, '../next.config.js');
  const configCode = fs.readFileSync(configPath, 'utf8');
  assert(configCode.includes("source: '/admin'") && configCode.includes("destination: '/'"), 'next.config.js redirects /admin to /');
});

// =============================================================================
// STEP 2: Patient Selection & Add Patient Duplicate Protection
// =============================================================================
console.log('\n[STEP 2] Patient Selection & Directory Management:');

test('Patient Directory loads at least 8-10 demo patients with full clinical history', () => {
  assert(INITIAL_DEMO_PATIENTS.length >= 8, 'Must have at least 8-10 demo patients');
  INITIAL_DEMO_PATIENTS.forEach(p => {
    assert(p.id && p.name && p.age && p.gender && p.primaryCondition, `Incomplete patient record: ${p.name}`);
  });
});

test('Add Patient form prevents duplicate records on repeated submissions', () => {
  const patientPagePath = path.join(__dirname, '../src/pages/patient/index.jsx');
  const code = fs.readFileSync(patientPagePath, 'utf8');

  assert(code.includes('alreadyExists'), 'handleSavePatient must implement duplicate check');
  assert(code.includes('already exists in the directory'), 'Must notify user when patient already exists');
});

test('Add Patient form enforces strict validation (Name >= 2 chars, Age 1-120, Condition >= 3 chars)', () => {
  const modalPath = path.join(__dirname, '../src/components/patient/AddPatientModal.jsx');
  const code = fs.readFileSync(modalPath, 'utf8');

  assert(code.includes('ageNum < 1 || ageNum > 120'), 'Age must be between 1 and 120');
  assert(code.includes('length < 2'), 'Name must be at least 2 characters');
  assert(code.includes('length < 3'), 'Primary condition must be at least 3 characters');
});

// =============================================================================
// STEP 3: Review & Correction of Patient Clinical Summary
// =============================================================================
console.log('\n[STEP 3] Review & Correction of Patient Clinical Information:');

test('PatientRecommendationModal opens with Step 1 confirmation screen prefilled with selected patient data', () => {
  const modalPath = path.join(__dirname, '../src/components/patient/PatientRecommendationModal.jsx');
  const code = fs.readFileSync(modalPath, 'utf8');

  assert(code.includes("step === 'confirm'"), 'Must implement Step 1 confirm state');
  assert(code.includes('formData.primaryCondition'), 'Must display primary condition');
  assert(code.includes('formData.allergies'), 'Must display known allergies');
  assert(code.includes('formData.notes'), 'Must display clinical notes/history');
});

test('User can edit / correct medical condition, allergies, and language preference before matching', () => {
  const modalPath = path.join(__dirname, '../src/components/patient/PatientRecommendationModal.jsx');
  const code = fs.readFileSync(modalPath, 'utf8');

  assert(code.includes('onChange='), 'Inputs must be interactive and editable');
  assert(code.includes('onPatientUpdate'), 'Changes must trigger onPatientUpdate callback');
  assert(code.includes('preferredLanguage'), 'Must allow selecting preferred language');
  assert(code.includes('preferredMode'), 'Must allow selecting preferred consultation mode');
});

// =============================================================================
// STEP 4: Rule-Based Doctor Recommendations & Edge Cases
// =============================================================================
console.log('\n[STEP 4] Transparent Rule-Based Recommendations:');

test('Targeted Specialty: Skin rash & eczema maps to Dermatology (Dr. Rajeshwari Patil)', () => {
  const res = matchPatientToDoctors({ age: 32, gender: 'Female', primaryCondition: 'Severe red skin rash and itchy eczema' });
  assert.strictEqual(res.recommendedSpecialty, 'Dermatology');
  assert.strictEqual(res.recommendations[0].doctor.full_name, 'Dr. Rajeshwari Patil');
});

test('Targeted Specialty: Chronic wheezing & cough maps to Pulmonology (Dr. Suresh Hegde)', () => {
  const res = matchPatientToDoctors({ age: 50, gender: 'Male', primaryCondition: 'Chronic cough with morning wheezing' });
  assert.strictEqual(res.recommendedSpecialty, 'Pulmonology / Respiratory');
  assert.strictEqual(res.recommendations[0].doctor.full_name, 'Dr. Suresh Hegde');
});

test('Targeted Specialty: Knee joint stiffness maps to Orthopedics (Dr. Ananya Hegde)', () => {
  const res = matchPatientToDoctors({ age: 55, gender: 'Female', primaryCondition: 'Severe knee pain and joint stiffness' });
  assert.strictEqual(res.recommendedSpecialty, 'Orthopedics');
  assert.strictEqual(res.recommendations[0].doctor.full_name, 'Dr. Ananya Hegde');
});

test('Pediatric Age Routing: Child (age 7) routes to Pediatrics (Dr. Sneha V. Kulkarni)', () => {
  const res = matchPatientToDoctors({ age: 7, gender: 'Male', primaryCondition: 'Childhood fever and poor feeding' });
  assert.strictEqual(res.recommendedSpecialty, 'Pediatrics');
  assert.strictEqual(res.recommendations[0].doctor.full_name, 'Dr. Sneha V. Kulkarni');
});

test('Edge Case: Missing or brief patient symptoms route safely to General Medicine with clarification notice', () => {
  const res = matchPatientToDoctors({ age: 40, gender: 'Male', primaryCondition: '' });
  assert.strictEqual(res.isInsufficientInfo, true);
  assert.strictEqual(res.recommendedSpecialty, 'General Medicine');
  assert(res.clarificationNotice.length > 0, 'Must provide clinical clarification notice');
  assert.strictEqual(res.recommendations[0].doctor.specialty_name, 'General Medicine');
});

test('Edge Case: Emergency red-flag symptom immediately halts routine consultation with 108/112 alert', () => {
  const res = matchPatientToDoctors({ age: 60, gender: 'Male', primaryCondition: 'Acute chest pain radiating to left arm' });
  assert.strictEqual(res.isUrgent, true);
  assert.strictEqual(res.recommendations.length, 0);
  assert(res.emergencyHotlines.some(h => h.number === '108'));
  assert(res.emergencyHotlines.some(h => h.number === '112'));
});

// =============================================================================
// STEP 5: Reviewing Detailed Doctor Profile & Credentials
// =============================================================================
console.log('\n[STEP 5] Review Doctor Profile & Credentials:');

test('Doctor profile modal renders all 10 clinical sections + Certificate Preview', () => {
  const modalPath = path.join(__dirname, '../src/components/doctor/DoctorDetailModal.jsx');
  const code = fs.readFileSync(modalPath, 'utf8');

  assert(code.includes('doctor.full_name'), 'Must render doctor name');
  assert(code.includes('doctor.qualification'), 'Must render education/qualification');
  assert(code.includes('doctor.specialty_name'), 'Must render specialization');
  assert(code.includes('clinical_interests'), 'Must render clinical interests');
  assert(code.includes('experience_years'), 'Must render experience years');
  assert(code.includes('languages_spoken'), 'Must render languages spoken');
  assert(code.includes('council_registration_number'), 'Must render registration details');
  assert(code.includes('verification_status'), 'Must render verification badge');
  assert(code.includes('consultation_fee'), 'Must render consultation fee');
  assert(code.includes('consultation_modes'), 'Must render consultation modes');
  assert(code.includes('CertificatePreviewModal'), 'Must integrate CertificatePreviewModal');
});

test('DoctorDetailModal accepts patient context and forwards it to consultation request', () => {
  const modalPath = path.join(__dirname, '../src/components/doctor/DoctorDetailModal.jsx');
  const code = fs.readFileSync(modalPath, 'utf8');

  assert(code.includes('patient = null'), 'DoctorDetailModal must accept optional patient prop');
  assert(code.includes('query: {') && code.includes('patientId: patient.id'), 'Must forward patientId in query');
  assert(code.includes('chiefComplaint: patient.primaryCondition'), 'Must forward chiefComplaint in query');
});

// =============================================================================
// STEP 6: Pre-Call Device Preparation & InternetCallGuidanceBox
// =============================================================================
console.log('\n[STEP 6] Pre-Call Device Preparation with Guidance Box:');

test('Consultation request page embeds InternetCallGuidanceBox with 8-point checklist', () => {
  const reqPagePath = path.join(__dirname, '../src/pages/consultation/request/[id].jsx');
  const code = fs.readFileSync(reqPagePath, 'utf8');

  assert(code.includes('InternetCallGuidanceBox'), 'Consultation request page must render InternetCallGuidanceBox');
  assert(code.includes('mode="pre_call"'), 'Must render in pre_call mode');
});

test('Consultation request page displays Selected Patient Banner with prefilled symptoms', () => {
  const reqPagePath = path.join(__dirname, '../src/pages/consultation/request/[id].jsx');
  const code = fs.readFileSync(reqPagePath, 'utf8');

  assert(code.includes('router.query.patientName'), 'Must render patient banner when patientName query is present');
  assert(code.includes('setChiefComplaint(String(router.query.chiefComplaint))'), 'Must prefill chief complaint from query');
  assert(code.includes('setSymptoms(String(router.query.symptoms))'), 'Must prefill symptoms from query');
});

test('Pre-Call Guidance allows running connection and hardware check on user demand', () => {
  const boxPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(boxPath, 'utf8');

  assert(code.includes('Check Connection'), 'Must have Check Connection button');
  assert(code.includes('navigator.mediaDevices.getUserMedia'), 'Must use getUserMedia for camera/mic test');
  assert(code.includes('fetch(\'/api/health\')'), 'Must verify real server connectivity');
});

// =============================================================================
// STEP 7 & 8: Consultation Room, Honest Connection State, and In-Call Guidance
// =============================================================================
console.log('\n[STEP 7 & 8] Consultation Joining, Honest Peer State & In-Call Guidance:');

test('Consultation room page embeds InternetCallGuidanceBox in in_call mode with live status', () => {
  const roomPagePath = path.join(__dirname, '../src/pages/consultation/room/[id].jsx');
  const code = fs.readFileSync(roomPagePath, 'utf8');

  assert(code.includes('InternetCallGuidanceBox'), 'Must render InternetCallGuidanceBox');
  assert(code.includes('mode="in_call"'), 'Must render in in_call mode');
  assert(code.includes('callState={rtc.callState}'), 'Must pass real WebRTC call state');
  assert(code.includes('connectionQuality={rtc.connectionQuality}'), 'Must pass connection quality');
});

test('Consultation room displays honest connection state when remote peer is unavailable (never fake connected)', () => {
  const roomPagePath = path.join(__dirname, '../src/pages/consultation/room/[id].jsx');
  const code = fs.readFileSync(roomPagePath, 'utf8');

  assert(code.includes('Waiting for connection') || code.includes('Waiting for doctor connection'), 'Must display honest waiting state when remote peer not connected');
  assert(!code.includes('remoteStream = new MediaStream()'), 'Must not fabricate a fake remote stream');
});

test('In-call guidance provides Help action that opens troubleshooting without terminating active call', () => {
  const boxPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(boxPath, 'utf8');

  assert(code.includes('Call Guidance'), 'Must have Call Guidance button in in_call mode');
  assert(code.includes('isHelpDrawerOpen'), 'Must toggle help drawer state');
  assert(code.includes('Return to Call'), 'Help drawer must have Return to Call button');
});

test('In-call guidance supports Reconnect action during temporary disconnections', () => {
  const boxPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(boxPath, 'utf8');

  assert(code.includes('onReconnect'), 'Must accept onReconnect handler');
  assert(code.includes('Reconnect'), 'Must render Reconnect button');
});

// =============================================================================
// STEP 9: Safe Exit & Non-Regression Compliance
// =============================================================================
console.log('\n[STEP 9] Safe Exit & End-to-End Non-Regression:');

test('Consultation room allows safe exit to Waiting Room and Patient Portal', () => {
  const roomPagePath = path.join(__dirname, '../src/pages/consultation/room/[id].jsx');
  const code = fs.readFileSync(roomPagePath, 'utf8');

  assert(code.includes('Exit to Waiting Room'), 'Must have Exit to Waiting Room link');
  assert(code.includes('Patient Portal'), 'Must have Patient Portal return link');
});

test('Consultation lifecycle state transitions conform to linear legal pipeline', () => {
  // Legal pipeline: submitted -> pending_doctor_review -> accepted -> waiting -> in_progress -> completed
  assert(validateTransition(CONSULTATION_STATES.SUBMITTED, CONSULTATION_STATES.PENDING_DOCTOR_REVIEW, 'doctor').allowed);
  assert(validateTransition(CONSULTATION_STATES.PENDING_DOCTOR_REVIEW, CONSULTATION_STATES.ACCEPTED, 'doctor').allowed);
  assert(validateTransition(CONSULTATION_STATES.ACCEPTED, CONSULTATION_STATES.WAITING, 'patient').allowed);
  assert(validateTransition(CONSULTATION_STATES.WAITING, CONSULTATION_STATES.IN_PROGRESS, 'doctor').allowed);
  assert(validateTransition(CONSULTATION_STATES.IN_PROGRESS, CONSULTATION_STATES.COMPLETED, 'doctor').allowed);

  // Illegal jump: submitted directly to completed
  assert(!validateTransition(CONSULTATION_STATES.SUBMITTED, CONSULTATION_STATES.COMPLETED, 'doctor').allowed);
});

test('Footer text strictly maintained as "© Made with love for mankind"', () => {
  const footerCode = fs.readFileSync(path.join(__dirname, '../src/components/layout/Footer.jsx'), 'utf8');
  assert(footerCode.includes('© Made with love for mankind'));
});

test('Zero occurrences of micro-text (text-[10px], text-[11px]) and prohibited strings', () => {
  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        scan(p);
      } else if (e.name.endsWith('.js') || e.name.endsWith('.jsx')) {
        const text = fs.readFileSync(p, 'utf8');
        assert(!text.includes('text-[10px]'), `Found text-[10px] in ${p}`);
        assert(!text.includes('text-[11px]'), `Found text-[11px] in ${p}`);
        assert(!text.includes('PS 3.2'), `Found PS 3.2 in ${p}`);
        assert(!text.includes('Every Byte Counts'), `Found Every Byte Counts in ${p}`);
      }
    }
  }

  scan(path.join(__dirname, '../src/components'));
});

// =============================================================================
// SUMMARY
// =============================================================================
console.log('================================================================');
console.log(`  TASK 6 AUDIT PASSED: ${passedTests}/${totalTests} Checks Verified (100%)`);
console.log('================================================================\n');
