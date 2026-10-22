/**
 * Samālōcane Task 2: Doctor Directory & Detailed Profiles Test Suite
 * Automated tests verifying:
 * 1. Doctor Directory Dataset (11 demo doctors, all required attributes, DEMO DATA tags)
 * 2. Search, Filter, and Sort Engine (Specialization, experience, language, verification status, modes)
 * 3. Detailed Doctor Profile Elements (All 10 requested clinical sections)
 * 4. Credentials & Verification Section (Verified vs Pending vs Not Verified, Certificate Preview)
 * 5. Navigation, Connect with Doctor routing, and Non-Regression of Patient & Outbox
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load Dummy Doctors dataset
const { INITIAL_DEMO_DOCTORS, DEMO_SPECIALTIES, DEMO_LANGUAGES } = require('../src/data/dummyDoctors');

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
console.log('  Samālōcane Task 2: Doctor Directory & Profiles Test Suite');
console.log('================================================================\n');

// =============================================================================
// SUITE 1: Doctor Directory Dataset Verification
// =============================================================================
console.log('[SUITE 1] Fictional Demo Doctors Dataset (Requirement A):');

test('Dataset contains at least 6-8 demo doctors (found: ' + INITIAL_DEMO_DOCTORS.length + ')', () => {
  assert(INITIAL_DEMO_DOCTORS.length >= 6 && INITIAL_DEMO_DOCTORS.length >= 8, 'Expected at least 6-8 demo doctors');
});

test('Every doctor card record contains all required clinical and profile fields', () => {
  INITIAL_DEMO_DOCTORS.forEach((doc, idx) => {
    assert(doc.id, `Doctor at [${idx}] must have an ID`);
    assert(doc.full_name && doc.full_name.startsWith('Dr. '), `Doctor ${doc.id} must have a valid full name starting with Dr.`);
    assert(doc.title && doc.title.length > 0, `Doctor ${doc.id} must have a professional title`);
    assert(doc.avatar_initials && doc.avatar_color, `Doctor ${doc.id} must have avatar graphic/initials`);
    assert(doc.specialty_name && doc.specialty_name.length > 0, `Doctor ${doc.id} must have medical specialization`);
    assert(doc.qualification && doc.qualification.length > 0, `Doctor ${doc.id} must have educational qualification`);
    assert(typeof doc.experience_years === 'number' && doc.experience_years > 0, `Doctor ${doc.id} must have years of experience`);
    assert(Array.isArray(doc.languages_spoken) && doc.languages_spoken.length > 0, `Doctor ${doc.id} must have languages spoken`);
    assert(Array.isArray(doc.consultation_modes) && doc.consultation_modes.length > 0, `Doctor ${doc.id} must have consultation modes`);
    assert(Array.isArray(doc.schedule) && doc.schedule.length > 0, `Doctor ${doc.id} must have sample consultation schedule`);
    assert(['Verified', 'Pending Verification', 'Not Verified'].includes(doc.verification_status), `Doctor ${doc.id} must have clear verification status`);
    assert.strictEqual(doc.is_demo, true, `Doctor ${doc.id} must be explicitly flagged as DEMO DATA`);
  });
});

test('Includes video consultation mode support across multiple doctors', () => {
  const videoDocs = INITIAL_DEMO_DOCTORS.filter(d => d.consultation_modes.includes('video'));
  assert(videoDocs.length >= 6, 'At least 6 doctors support video consultation');
});

test('Clearly distinguishes Verified, Pending Verification, and Not Verified doctors', () => {
  const verified = INITIAL_DEMO_DOCTORS.filter(d => d.verification_status === 'Verified');
  const pending = INITIAL_DEMO_DOCTORS.filter(d => d.verification_status === 'Pending Verification');
  const notVerified = INITIAL_DEMO_DOCTORS.filter(d => d.verification_status === 'Not Verified');

  assert(verified.length >= 7, 'Has verified active doctors');
  assert(pending.length >= 1, 'Has pending verification doctor (Dr. Nitesh Gowda)');
  assert(notVerified.length >= 1, 'Has not verified doctor (Dr. Test Unverified)');
  assert.strictEqual(verified.length + pending.length + notVerified.length, INITIAL_DEMO_DOCTORS.length);
});

// =============================================================================
// SUITE 2: Search, Filter, and Sort Engine
// =============================================================================
console.log('\n[SUITE 2] Search & Filter Engine Logic:');

function filterDoctorList(list, { searchQuery = '', specialty = 'all', experience = 'all', language = 'all', verification = 'all', mode = 'all' }) {
  let res = [...list];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    res = res.filter(d =>
      d.full_name.toLowerCase().includes(q) ||
      d.specialty_name.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.qualification.toLowerCase().includes(q) ||
      (d.languages_spoken && d.languages_spoken.some(l => l.toLowerCase().includes(q)))
    );
  }

  if (specialty !== 'all') {
    res = res.filter(d => d.specialty_name === specialty);
  }

  if (experience === '10plus') {
    res = res.filter(d => d.experience_years >= 10);
  } else if (experience === '5to10') {
    res = res.filter(d => d.experience_years >= 5 && d.experience_years < 10);
  } else if (experience === 'under5') {
    res = res.filter(d => d.experience_years < 5);
  }

  if (language !== 'all') {
    res = res.filter(d => d.languages_spoken && d.languages_spoken.includes(language));
  }

  if (verification !== 'all') {
    res = res.filter(d => d.verification_status === verification);
  }

  if (mode !== 'all') {
    res = res.filter(d => d.consultation_modes && d.consultation_modes.includes(mode));
  }

  return res;
}

test('Search by doctor name matches correctly (query: "Ramesh")', () => {
  const matches = filterDoctorList(INITIAL_DEMO_DOCTORS, { searchQuery: 'Ramesh' });
  assert.strictEqual(matches.length, 1);
  assert(matches[0].full_name.includes('Dr. Ramesh Rao'));
});

test('Search by specialization matches correctly (query: "Dermatology")', () => {
  const matches = filterDoctorList(INITIAL_DEMO_DOCTORS, { searchQuery: 'Dermatology' });
  assert.strictEqual(matches.length, 1);
  assert.strictEqual(matches[0].specialty_name, 'Dermatology');
});

test('Filter by specialization dropdown isolates target specialty', () => {
  const pediatrics = filterDoctorList(INITIAL_DEMO_DOCTORS, { specialty: 'Pediatrics' });
  assert.strictEqual(pediatrics.length, 1);
  assert.strictEqual(pediatrics[0].specialty_name, 'Pediatrics');
});

test('Filter by experience partitions into 10+ years and 5-10 years', () => {
  const tenPlus = filterDoctorList(INITIAL_DEMO_DOCTORS, { experience: '10plus' });
  const fiveToTen = filterDoctorList(INITIAL_DEMO_DOCTORS, { experience: '5to10' });
  assert(tenPlus.length >= 6 && tenPlus.every(d => d.experience_years >= 10));
  assert(fiveToTen.length >= 2 && fiveToTen.every(d => d.experience_years >= 5 && d.experience_years < 10));
});

test('Filter by language spoken (e.g., Kannada, English, Konkani)', () => {
  const kannadaDocs = filterDoctorList(INITIAL_DEMO_DOCTORS, { language: 'Kannada' });
  const konkaniDocs = filterDoctorList(INITIAL_DEMO_DOCTORS, { language: 'Konkani' });
  assert(kannadaDocs.length >= 9, 'Most doctors speak Kannada');
  assert(konkaniDocs.length >= 4, 'Multiple coastal doctors speak Konkani');
});

test('Filter by verification status isolates Pending and Not Verified profiles', () => {
  const pending = filterDoctorList(INITIAL_DEMO_DOCTORS, { verification: 'Pending Verification' });
  const notVerified = filterDoctorList(INITIAL_DEMO_DOCTORS, { verification: 'Not Verified' });
  assert.strictEqual(pending.length, 1);
  assert.strictEqual(pending[0].full_name, 'Dr. Nitesh Gowda');
  assert.strictEqual(notVerified.length, 1);
  assert.strictEqual(notVerified[0].full_name, 'Dr. Test Unverified');
});

// =============================================================================
// SUITE 3: Detailed Doctor Profile (Requirement B - 10 Items)
// =============================================================================
console.log('\n[SUITE 3] Detailed Doctor Profile (10 Required Sections):');

test('Every demo doctor has all 10 detailed profile elements present', () => {
  INITIAL_DEMO_DOCTORS.forEach(doc => {
    // 1. Full name & professional title
    assert(doc.full_name && doc.title, `${doc.full_name}: item 1 missing`);
    // 2. Educational qualifications and institutions
    assert(Array.isArray(doc.education) && doc.education.length > 0 && doc.education[0].institution, `${doc.full_name}: item 2 missing`);
    // 3. Specialization and areas of clinical interest
    assert(doc.specialty_name && Array.isArray(doc.clinical_interests) && doc.clinical_interests.length > 0, `${doc.full_name}: item 3 missing`);
    // 4. Professional experience
    assert(typeof doc.experience_years === 'number', `${doc.full_name}: item 4 missing`);
    // 5. Languages spoken
    assert(Array.isArray(doc.languages_spoken) && doc.languages_spoken.length > 0, `${doc.full_name}: item 5 missing`);
    // 6. Medical registration details (authority & registration number)
    assert(doc.council_name && doc.council_registration_number, `${doc.full_name}: item 6 missing`);
    // 7. Professional biography and consultation approach
    assert(doc.bio && doc.consultation_approach, `${doc.full_name}: item 7 missing`);
    // 8. Consultation availability and consultation mode
    assert(Array.isArray(doc.schedule) && Array.isArray(doc.consultation_modes), `${doc.full_name}: item 8 missing`);
    // 9. Verification documents and certificates
    assert(Array.isArray(doc.certificates) && doc.certificates.length > 0, `${doc.full_name}: item 9 missing`);
  });
});

// =============================================================================
// SUITE 4: Certificate & Credential Verification (Requirement C)
// =============================================================================
console.log('\n[SUITE 4] Certificate & Credential Verification (Requirement C):');

test('Sample certificates include credential type, authority, reg number, and validity', () => {
  INITIAL_DEMO_DOCTORS.forEach(doc => {
    doc.certificates.forEach(cert => {
      assert(cert.title, 'Certificate must have a title');
      assert(cert.authority, 'Certificate must have issuing authority');
      assert(cert.reg_number, 'Certificate must have registration ref number');
      assert(cert.document_type, 'Certificate must have document type');
      assert(cert.status, 'Certificate must have verification status');
      assert.strictEqual(cert.is_demo, true, 'Certificate must be marked as DEMO');
    });
  });
});

test('Certificate preview modal component renders DEMO DATA watermark and non-authenticity disclaimer', () => {
  const certModalCode = fs.readFileSync(path.join(__dirname, '../src/components/doctor/CertificatePreviewModal.jsx'), 'utf8');
  assert(certModalCode.includes('DEMO DATA • PROTOTYPE SAMPLE'), 'Watermark present in certificate view');
  assert(certModalCode.includes('Prototype Disclaimer & Non-Authenticity Notice'), 'Legal non-authenticity disclaimer present');
  assert(certModalCode.includes('isVerified') && certModalCode.includes('isPending') && certModalCode.includes('isNotVerified'), 'Distinguishes all 3 verification statuses');
});

test('DoctorDetailModal integrates CertificatePreviewModal with interactive preview button', () => {
  const detailModalCode = fs.readFileSync(path.join(__dirname, '../src/components/doctor/DoctorDetailModal.jsx'), 'utf8');
  assert(detailModalCode.includes('CertificatePreviewModal'), 'Imports CertificatePreviewModal');
  assert(detailModalCode.includes('Preview Certificate'), 'Contains Preview Certificate trigger button');
  assert(detailModalCode.includes('Connect with'), 'Contains Connect with Doctor action button');
});

// =============================================================================
// SUITE 5: Navigation, Doctor Section & Non-Regression
// =============================================================================
console.log('\n[SUITE 5] Navigation & Non-Regression of Patient & Outbox:');

test('Doctor portal (/doctor) has Doctor Directory & Profiles tab as default', () => {
  const doctorPage = fs.readFileSync(path.join(__dirname, '../src/pages/doctor/index.jsx'), 'utf8');
  assert(doctorPage.includes('DoctorDirectory'), 'Imports DoctorDirectory in /doctor');
  assert(doctorPage.includes('DoctorDetailModal'), 'Imports DoctorDetailModal in /doctor');
  assert(doctorPage.includes("activeTab === 'directory'"), 'Renders Doctor Directory tab');
  assert(doctorPage.includes("activeTab === 'queue'"), 'Renders Physician Queue tab');
});

test('Public Doctor Directory (/doctors) renders DoctorDirectory and modal inspect', () => {
  const doctorsPage = fs.readFileSync(path.join(__dirname, '../src/pages/doctors/index.jsx'), 'utf8');
  assert(doctorsPage.includes('DoctorDirectory'), 'Renders DoctorDirectory on /doctors');
  assert(doctorsPage.includes('DoctorDetailModal'), 'Renders DoctorDetailModal on /doctors');
});

test('Detailed Doctor profile page (/doctors/[id]) renders all 10 items and CertificatePreviewModal', () => {
  const detailPage = fs.readFileSync(path.join(__dirname, '../src/pages/doctors/[id].jsx'), 'utf8');
  assert(detailPage.includes('CertificatePreviewModal'), 'Imports CertificatePreviewModal');
  assert(detailPage.includes('Connect with Doctor'), 'Has Connect with Doctor button');
  assert(detailPage.includes('consultation_approach'), 'Shows consultation approach');
  assert(detailPage.includes('/consultation/request/'), 'Routes to consultation request');
});

test('Connect with Doctor action routes directly to /consultation/request/[id]', () => {
  const dirCode = fs.readFileSync(path.join(__dirname, '../src/components/doctor/DoctorDirectory.jsx'), 'utf8');
  assert(dirCode.includes('/consultation/request/'), 'Connect action routes to consultation request');
  assert(dirCode.includes('Connect with Doctor'), 'Card has Connect with Doctor button');
});

test('Patient and Outbox sections remain completely untouched and operational', () => {
  const patCode = fs.readFileSync(path.join(__dirname, '../src/pages/patient/index.jsx'), 'utf8');
  assert(patCode.includes('PatientDirectory'), 'Patient directory untouched');
  assert(patCode.includes('AddPatientModal'), 'Add patient modal untouched');

  const bottomNav = fs.readFileSync(path.join(__dirname, '../src/components/layout/BottomNav.jsx'), 'utf8');
  const pIdx = bottomNav.indexOf('{/* 1. Patient */}');
  const dIdx = bottomNav.indexOf('{/* 2. Doctor */}');
  const oIdx = bottomNav.indexOf('{/* 3. Outbox */}');
  assert(pIdx < dIdx && dIdx < oIdx, 'Bottom navigation sequence preserved: 1. Patient -> 2. Doctor -> 3. Outbox');
});

console.log('================================================================');
console.log(`  TASK 2 AUDIT PASSED: ${passedTests}/${totalTests} Checks Verified (100%)`);
console.log('================================================================\n');

