/**
 * Samālōcane Task 3: Patient-to-Doctor Recommendation Engine Test Suite
 * Automated tests verifying:
 * 1. Patient Selection & Confirmation Data Retrieval (Age, Gender, Concern, Allergies, History)
 * 2. Ability to Edit / Correct Information before matching
 * 3. Transparent, Rule-Based Matching Logic:
 *    - Concern to Doctor Specialization matching
 *    - Pediatric Age-based routing (Age <= 14 -> Pediatrics)
 *    - Doctor Availability, Consultation Mode, and Language preference weighting
 *    - Vague/unsupported inputs routing to General Medicine with clarification notice
 *    - Non-discrimination check: Gender & allergies not used as biased shortcuts
 * 4. Medical Safety & Emergency Red-Flag Interception (108 / 112 routing)
 * 5. Explainability: Clear understandable reasons generated for every doctor match
 * 6. UI & Integration: PatientRecommendationModal, PatientDirectory actions, PatientDetailModal action
 * 7. Non-Regression & Code Quality (Typography, prohibited strings, routing)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  matchPatientToDoctors,
  checkEmergencySafety,
  scoreSpecialties,
  URGENT_EMERGENCY_TRIGGERS,
  SPECIALTY_RULES
} = require('../src/lib/patientDoctorMatcher');

const { INITIAL_DEMO_DOCTORS } = require('../src/data/dummyDoctors');
const { INITIAL_DEMO_PATIENTS } = require('../src/data/dummyPatients');

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
console.log('  Samālōcane Task 3: Patient-to-Doctor Recommendations Test Suite');
console.log('================================================================\n');

// =============================================================================
// SUITE 1: Medical Safety & Emergency Red-Flag Interception
// =============================================================================
console.log('[SUITE 1] Medical Safety & Emergency Red-Flag Interception (Requirement C):');

test('Urgent Emergency Triggers cover cardiac, respiratory, stroke FAST, severe trauma, anaphylaxis', () => {
  assert(URGENT_EMERGENCY_TRIGGERS.length >= 5, 'Expected at least 5 emergency trigger categories');
  const categories = URGENT_EMERGENCY_TRIGGERS.map(c => c.category);
  assert(categories.some(c => c.includes('Cardiovascular') || c.includes('Heart Attack')));
  assert(categories.some(c => c.includes('Respiratory Distress')));
  assert(categories.some(c => c.includes('Stroke') || c.includes('FAST')));
  assert(categories.some(c => c.includes('Trauma') || c.includes('Bleeding')));
  assert(categories.some(c => c.includes('Anaphylaxis')));
});

test('Acute chest pain radiating is immediately intercepted with emergency alert and 108/112 routing', () => {
  const patient = {
    name: 'Emergency Test Patient',
    age: 58,
    gender: 'Male',
    primaryCondition: 'Acute chest pain radiating to left arm with cold sweats',
    allergies: 'None',
    notes: 'Began 30 minutes ago'
  };

  const result = matchPatientToDoctors(patient);
  assert.strictEqual(result.isUrgent, true, 'Result must be flagged isUrgent=true');
  assert.strictEqual(result.recommendations.length, 0, 'No routine consultations should be recommended');
  assert(result.emergencyHotlines.some(h => h.number === '108'), 'Must include 108 ambulance hotline');
  assert(result.emergencyHotlines.some(h => h.number === '112'), 'Must include 112 emergency helpline');
  assert(result.guidance.includes('108') || result.guidance.includes('112'), 'Guidance must instruct immediate emergency action');
});

test('Severe respiratory distress (unable to breathe) triggers immediate emergency guidance', () => {
  const patient = {
    name: 'Severe Dyspnea Patient',
    age: 42,
    gender: 'Female',
    primaryCondition: 'Unable to breathe and gasping for air',
    allergies: 'None'
  };

  const result = matchPatientToDoctors(patient);
  assert.strictEqual(result.isUrgent, true);
  assert(result.guidance.toLowerCase().includes('respiratory distress'));
});

test('FAST stroke signs (sudden facial drooping and slurred speech) trigger immediate emergency routing', () => {
  const patient = {
    name: 'Stroke Signs Patient',
    age: 65,
    gender: 'Male',
    primaryCondition: 'Sudden facial drooping and slurred speech since 20 minutes',
    allergies: 'None'
  };

  const result = matchPatientToDoctors(patient);
  assert.strictEqual(result.isUrgent, true);
  assert(result.category.toLowerCase().includes('stroke'));
});

// =============================================================================
// SUITE 2: Patient Selection & Data Retrieval
// =============================================================================
console.log('\n[SUITE 2] Patient Selection & Data Confirmation (Requirement A):');

test('Existing demo patients dataset contains complete profiles with age, gender, condition, allergies', () => {
  assert(INITIAL_DEMO_PATIENTS.length >= 8, 'Expected at least 8-10 demo patients');
  INITIAL_DEMO_PATIENTS.forEach(p => {
    assert(p.id, `Patient must have an ID: ${p.name}`);
    assert(typeof p.age === 'number', `Patient ${p.name} must have a valid age`);
    assert(p.gender === 'Female' || p.gender === 'Male' || p.gender === 'Other');
    assert(p.primaryCondition, `Patient ${p.name} must have a primary condition`);
    assert(p.allergies !== undefined, `Patient ${p.name} must have allergies field`);
  });
});

test('PatientDirectory component accepts onFindDoctors prop and triggers handler', () => {
  const compPath = path.join(__dirname, '../src/components/patient/PatientDirectory.jsx');
  const code = fs.readFileSync(compPath, 'utf8');
  assert(code.includes('onFindDoctors'), 'PatientDirectory must declare onFindDoctors prop');
  assert(code.includes('Find Suitable Doctors') || code.includes('Find Doctors'), 'Must render Find Suitable Doctors action');
  assert(code.includes('onClick={() => onFindDoctors(patient)}'), 'Must invoke onFindDoctors with patient record');
});

test('PatientDetailModal component includes Find Suitable Doctors action', () => {
  const modalPath = path.join(__dirname, '../src/components/patient/PatientDetailModal.jsx');
  const code = fs.readFileSync(modalPath, 'utf8');
  assert(code.includes('onFindDoctors'), 'PatientDetailModal must receive onFindDoctors');
  assert(code.includes('Find Suitable Doctors'), 'Modal footer must include Find Suitable Doctors button');
});

test('PatientRecommendationModal implements Step 1 confirmation and editing form', () => {
  const recModalPath = path.join(__dirname, '../src/components/patient/PatientRecommendationModal.jsx');
  const code = fs.readFileSync(recModalPath, 'utf8');
  assert(code.includes('step === \'confirm\''), 'Must implement step === confirm state');
  assert(code.includes('step === \'results\''), 'Must implement step === results state');
  assert(code.includes('formData.primaryCondition'), 'Must bind primary medical condition input');
  assert(code.includes('formData.allergies'), 'Must bind allergies input');
  assert(code.includes('onPatientUpdate'), 'Must support updating patient record when edited');
});

// =============================================================================
// SUITE 3: Transparent, Rule-Based Matching Algorithm
// =============================================================================
console.log('\n[SUITE 3] Transparent Rule-Based Matching (Requirement B):');

test('Dermatology Matching: Skin rash, eczema, itching maps to Dr. Rajeshwari Patil', () => {
  const patient = {
    name: 'Rash Test Patient',
    age: 34,
    gender: 'Female',
    primaryCondition: 'Severe itchy red rash and eczema patches on arms',
    allergies: 'None'
  };

  const result = matchPatientToDoctors(patient);
  assert.strictEqual(result.isUrgent, false);
  assert.strictEqual(result.recommendedSpecialty, 'Dermatology');
  assert(result.recommendations.length > 0);
  assert.strictEqual(result.recommendations[0].doctor.specialty_name, 'Dermatology');
  assert.strictEqual(result.recommendations[0].doctor.full_name, 'Dr. Rajeshwari Patil');
  assert(result.recommendations[0].matchReasons.some(r => r.includes('Dermatology')));
});

test('Pulmonology Matching: Chronic cough, wheezing, asthma maps to Dr. Suresh Hegde', () => {
  const patient = {
    name: 'Respiratory Test Patient',
    age: 48,
    gender: 'Male',
    primaryCondition: 'Chronic cough with morning wheezing and breathlessness',
    allergies: 'Penicillin'
  };

  const result = matchPatientToDoctors(patient);
  assert.strictEqual(result.isUrgent, false);
  assert.strictEqual(result.recommendedSpecialty, 'Pulmonology / Respiratory');
  assert.strictEqual(result.recommendations[0].doctor.full_name, 'Dr. Suresh Hegde');
});

test('Orthopedics Matching: Knee pain, joint stiffness, sprain maps to Dr. Ananya Hegde', () => {
  const patient = {
    name: 'Joint Test Patient',
    age: 52,
    gender: 'Female',
    primaryCondition: 'Severe knee pain and joint stiffness while walking',
    allergies: 'Sulfa drugs'
  };

  const result = matchPatientToDoctors(patient);
  assert.strictEqual(result.isUrgent, false);
  assert.strictEqual(result.recommendedSpecialty, 'Orthopedics');
  assert.strictEqual(result.recommendations[0].doctor.full_name, 'Dr. Ananya Hegde');
});

test('Cardiology Matching: High blood pressure and palpitations maps to Dr. Manjunath Bhat', () => {
  const patient = {
    name: 'Hypertension Patient',
    age: 61,
    gender: 'Male',
    primaryCondition: 'Chronic hypertension, high blood pressure readings, and occasional palpitations',
    allergies: 'None'
  };

  const result = matchPatientToDoctors(patient);
  assert.strictEqual(result.isUrgent, false);
  assert.strictEqual(result.recommendedSpecialty, 'Cardiology');
  assert.strictEqual(result.recommendations[0].doctor.full_name, 'Dr. Manjunath Bhat');
});

test('Pediatric Age Consideration: Child (age <= 14) with general illness routes to Pediatrics', () => {
  const childPatient = {
    name: 'Master Aarav',
    age: 8,
    gender: 'Male',
    primaryCondition: 'Fever with loss of appetite and mild cough',
    allergies: 'None'
  };

  const result = matchPatientToDoctors(childPatient);
  assert.strictEqual(result.isUrgent, false);
  assert.strictEqual(result.recommendedSpecialty, 'Pediatrics');
  assert.strictEqual(result.recommendations[0].doctor.full_name, 'Dr. Sneha V. Kulkarni');
  assert(result.recommendations[0].matchReasons.some(r => r.includes('Child Health') || r.includes('0–14 years') || r.includes('Pediatrics')));
});

test('Language Preference Weighting: Fluency bonus boosts matching doctor score', () => {
  const patient = {
    name: 'Language Test Patient',
    age: 40,
    gender: 'Female',
    primaryCondition: 'Skin rash and itching',
    allergies: 'None'
  };

  const resultWithoutPref = matchPatientToDoctors(patient);
  const resultWithKannada = matchPatientToDoctors(patient, { preferredLanguage: 'Kannada' });

  const docNoPref = resultWithoutPref.recommendations.find(r => r.doctor.full_name === 'Dr. Rajeshwari Patil');
  const docWithPref = resultWithKannada.recommendations.find(r => r.doctor.full_name === 'Dr. Rajeshwari Patil');

  assert(docWithPref.matchScore > docNoPref.matchScore, 'Preferred language match must award bonus score');
  assert(docWithPref.matchReasons.some(r => r.includes('Language Match') && r.includes('Kannada')));
});

test('Consultation Mode Weighting: Video consultation preference awards matching bonus', () => {
  const patient = {
    name: 'Video Pref Patient',
    age: 45,
    gender: 'Male',
    primaryCondition: 'Recurrent joint pain in knees',
    allergies: 'None'
  };

  const resultVideo = matchPatientToDoctors(patient, { preferredMode: 'Video' });
  const orthoDoc = resultVideo.recommendations.find(r => r.doctor.full_name === 'Dr. Ananya Hegde');
  assert(orthoDoc.matchReasons.some(r => r.includes('Mode Supported') && r.includes('Video')));
});

test('Vague / Minimal Health Concerns route responsibly to General Medicine with clarification', () => {
  const vaguePatient = {
    name: 'Vague Patient',
    age: 30,
    gender: 'Female',
    primaryCondition: '',
    allergies: 'None',
    notes: ''
  };

  const result = matchPatientToDoctors(vaguePatient);
  assert.strictEqual(result.isUrgent, false);
  assert.strictEqual(result.isInsufficientInfo, true);
  assert.strictEqual(result.recommendedSpecialty, 'General Medicine');
  assert(result.clarificationNotice.length > 10, 'Must provide clarification notice');
  assert(result.recommendations.length > 0);
  assert.strictEqual(result.recommendations[0].doctor.specialty_name, 'General Medicine');
});

test('Fairness / Non-Discrimination: Gender and allergies do not affect specialty match', () => {
  const malePatient = {
    name: 'Patient A',
    age: 40,
    gender: 'Male',
    primaryCondition: 'Severe itchy skin rash',
    allergies: 'Penicillin'
  };

  const femalePatient = {
    name: 'Patient B',
    age: 40,
    gender: 'Female',
    primaryCondition: 'Severe itchy skin rash',
    allergies: 'Aspirin'
  };

  const resA = matchPatientToDoctors(malePatient);
  const resB = matchPatientToDoctors(femalePatient);

  assert.strictEqual(resA.recommendedSpecialty, resB.recommendedSpecialty);
  assert.strictEqual(resA.recommendations[0].doctor.full_name, resB.recommendations[0].doctor.full_name);
  assert.strictEqual(resA.recommendations[0].matchScore, resB.recommendations[0].matchScore);
});

// =============================================================================
// SUITE 4: Explainability & Recommendation Output Format
// =============================================================================
console.log('\n[SUITE 4] Explainability & Recommendation Output Format (Requirement B & D):');

test('Every recommendation contains clear, explainable match reasons', () => {
  const patient = INITIAL_DEMO_PATIENTS[0]; // e.g., Shridhar Bhat (Hypertension & Type 2 Diabetes)
  const result = matchPatientToDoctors(patient);

  assert(result.matchExplanation, 'Must output an overarching match rationale');
  assert(result.recommendations.length > 0, 'Must provide recommendations');

  result.recommendations.forEach(rec => {
    assert(rec.doctor, 'Must contain doctor object');
    assert(rec.doctor.full_name, 'Must contain doctor full name');
    assert(rec.doctor.specialty_name, 'Must contain specialty');
    assert(rec.doctor.experience_years !== undefined, 'Must contain experience');
    assert(rec.doctor.verification_status, 'Must contain verification status');
    assert(Array.isArray(rec.matchReasons) && rec.matchReasons.length > 0, 'Must have at least one clear match reason');
  });
});

test('Recommended doctors list prioritizes verified accredited practitioners', () => {
  const patient = {
    name: 'General Patient',
    age: 38,
    gender: 'Male',
    primaryCondition: 'Fever and body aches for two days',
    allergies: 'None'
  };

  const result = matchPatientToDoctors(patient);
  // Highest scored doctor should have Verified status
  assert.strictEqual(result.recommendations[0].doctor.verification_status, 'Verified');
});

// =============================================================================
// SUITE 5: UI Integration in Patient Dashboard & Navigation
// =============================================================================
console.log('\n[SUITE 5] UI Integration & Non-Regression:');

test('Patient Dashboard (/patient) wires up PatientRecommendationModal with handlers', () => {
  const pagePath = path.join(__dirname, '../src/pages/patient/index.jsx');
  const code = fs.readFileSync(pagePath, 'utf8');

  assert(code.includes('PatientRecommendationModal'), 'Must import and render PatientRecommendationModal');
  assert(code.includes('recommendationPatient'), 'Must maintain recommendationPatient state');
  assert(code.includes('setRecommendationPatient'), 'Must update recommendationPatient on action click');
  assert(code.includes('handleUpdatePatient'), 'Must have handleUpdatePatient persistence handler');
});

test('PatientRecommendationModal contains View Profile and Connect with Doctor actions', () => {
  const modalPath = path.join(__dirname, '../src/components/patient/PatientRecommendationModal.jsx');
  const code = fs.readFileSync(modalPath, 'utf8');

  assert(code.includes('View Profile') || code.includes('Inspect Profile'), 'Must render View Profile button');
  assert(code.includes('Connect with Doctor'), 'Must render Connect with Doctor button');
  assert(code.includes('DoctorDetailModal'), 'Must integrate DoctorDetailModal for inspecting profile');
  assert(code.includes('/consultation/request/'), 'Must route to /consultation/request/[id]');
});

test('Non-regression check: Patient, Doctor, and Outbox remain in exact bottom navigation sequence', () => {
  const navPath = path.join(__dirname, '../src/components/layout/BottomNav.jsx');
  const code = fs.readFileSync(navPath, 'utf8');

  const patIdx = code.indexOf('{/* 1. Patient */}');
  const docIdx = code.indexOf('{/* 2. Doctor */}');
  const outIdx = code.indexOf('{/* 3. Outbox */}');

  assert(patIdx !== -1, 'BottomNavigation must contain Patient element');
  assert(docIdx !== -1, 'BottomNavigation must contain Doctor element');
  assert(outIdx !== -1, 'BottomNavigation must contain Outbox element');
  assert(patIdx < docIdx && docIdx < outIdx, 'Bottom navigation sequence must be Patient -> Doctor -> Outbox');
});

test('Footer displays exactly "© Made with love for mankind"', () => {
  const footerPath = path.join(__dirname, '../src/components/layout/Footer.jsx');
  const code = fs.readFileSync(footerPath, 'utf8');
  assert(code.includes('© Made with love for mankind'), 'Footer must contain exact required string');
  assert(!code.includes('PS 3.2'), 'Footer must not contain PS 3.2');
  assert(!code.includes('Every Byte Counts'), 'Footer must not contain Every Byte Counts');
});

test('Zero occurrences of prohibited strings across all src components', () => {
  function scanDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      const fullPath = path.join(dir, f.name);
      if (f.isDirectory()) {
        scanDir(fullPath);
      } else if (f.name.endsWith('.js') || f.name.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert(!content.includes('PS 3.2'), `Prohibited 'PS 3.2' found in ${fullPath}`);
        assert(!content.includes('Every Byte Counts'), `Prohibited 'Every Byte Counts' found in ${fullPath}`);
      }
    }
  }

  scanDir(path.join(__dirname, '../src/components'));
});

// =============================================================================
// SUMMARY
// =============================================================================
console.log('================================================================');
console.log(`  TASK 3 AUDIT PASSED: ${passedTests}/${totalTests} Checks Verified (100%)`);
console.log('================================================================\n');
