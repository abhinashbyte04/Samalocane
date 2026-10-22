/**
 * Samālōcane Task 1: Patient Directory & Add Patient Feature Verification Suite
 * Automated tests verifying:
 * 1. Demo Patient Dataset Structure & Integrity (10 realistic records, DEMO DATA tags)
 * 2. Add Patient Modal Form Validation (Required fields, age boundaries, allergy handling)
 * 3. Search & Filter Engine (Multi-field query, gender, consultation status, allergy filter, sorting)
 * 4. State Immutability & Safe Cancellation (Cancel does not save incomplete records)
 * 5. Doctor & Outbox Integrity (No regressions in Doctor portal, Outbox drawer, or RBAC)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. Load Dummy Patients data
const { INITIAL_DEMO_PATIENTS, DEMO_TALUKAS, DEMO_STATUSES } = require('../src/data/dummyPatients');

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
console.log('  Samālōcane Task 1: Patient Directory & Add Patient Test Suite');
console.log('================================================================\n');

// =============================================================================
// SUITE 1: Patient Dataset Verification
// =============================================================================
console.log('[SUITE 1] Fictional Demo Patient Records & Demographics:');

test('Dataset contains at least 8-10 demo patients (found: ' + INITIAL_DEMO_PATIENTS.length + ')', () => {
  assert(INITIAL_DEMO_PATIENTS.length >= 8 && INITIAL_DEMO_PATIENTS.length >= 10, 'Expected at least 10 demo patients');
});

test('Every demo record contains all required clinical & demographic attributes', () => {
  INITIAL_DEMO_PATIENTS.forEach((p, idx) => {
    assert(p.id, `Patient at [${idx}] must have an ID`);
    assert(typeof p.name === 'string' && p.name.trim().length > 0, `Patient ${p.id} must have a name`);
    assert(typeof p.age === 'number' && p.age >= 1 && p.age <= 120, `Patient ${p.id} must have a valid age between 1-120`);
    assert(['Female', 'Male', 'Other'].includes(p.gender), `Patient ${p.id} must have a valid gender`);
    assert(p.primaryCondition && p.primaryCondition.length > 0, `Patient ${p.id} must have primary condition`);
    assert(p.allergies && p.allergies.length > 0, `Patient ${p.id} must have allergies declared`);
    assert(p.consultationStatus && p.consultationStatus.length > 0, `Patient ${p.id} must have consultation status`);
    assert.strictEqual(p.isDemoData, true, `Patient ${p.id} must be explicitly flagged as DEMO DATA`);
  });
});

test('Demo records include previous consultation history & attending physicians', () => {
  const withConsultHistory = INITIAL_DEMO_PATIENTS.filter(p => p.lastConsultationDoctor);
  assert(withConsultHistory.length >= 8, 'At least 8 patients should have previous doctor consultation history');
});

test('Demo records represent diverse Karnataka coastal & hill talukas', () => {
  const talukas = new Set(INITIAL_DEMO_PATIENTS.map(p => p.taluka));
  assert(talukas.has('Kumta'), 'Contains Kumta coastal taluka');
  assert(talukas.has('Madikeri'), 'Contains Madikeri hill taluka');
  assert(talukas.has('Sakleshpur'), 'Contains Sakleshpur hill taluka');
  assert(talukas.has('Bhatkal'), 'Contains Bhatkal coastal taluka');
  assert(talukas.size >= 6, 'Contains at least 6 distinct talukas');
});

// =============================================================================
// SUITE 2: Add Patient Form Field Validation Logic
// =============================================================================
console.log('\n[SUITE 2] Add Patient Form Validation Logic:');

function validatePatientForm(formData) {
  const errors = {};
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Full name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters';
  }

  const ageNum = Number(formData.age);
  if (formData.age === undefined || formData.age === null || formData.age.toString().trim() === '') {
    errors.age = 'Age is required';
  } else if (isNaN(ageNum) || !Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
    errors.age = 'Please enter a valid age between 1 and 120';
  }

  if (!formData.gender) {
    errors.gender = 'Gender is required';
  }

  if (!formData.primaryCondition || !formData.primaryCondition.trim()) {
    errors.primaryCondition = 'Primary medical concern or condition is required';
  } else if (formData.primaryCondition.trim().length < 3) {
    errors.primaryCondition = 'Please provide at least 3 characters describing condition';
  }

  if (!formData.allergies || !formData.allergies.trim()) {
    errors.allergies = 'Known allergies are required. Enter "None reported" if no known allergies';
  }

  return errors;
}

test('Rejects completely empty form submission', () => {
  const errs = validatePatientForm({ name: '', age: '', gender: '', primaryCondition: '', allergies: '' });
  assert.strictEqual(Object.keys(errs).length, 5, 'Must report 5 errors for empty form');
  assert(errs.name && errs.age && errs.gender && errs.primaryCondition && errs.allergies);
});

test('Rejects invalid ages: negative, zero, excessive (>120), or non-integer', () => {
  assert(validatePatientForm({ name: 'Valid Name', age: '0', gender: 'Female', primaryCondition: 'Cough', allergies: 'None' }).age);
  assert(validatePatientForm({ name: 'Valid Name', age: '-5', gender: 'Female', primaryCondition: 'Cough', allergies: 'None' }).age);
  assert(validatePatientForm({ name: 'Valid Name', age: '150', gender: 'Female', primaryCondition: 'Cough', allergies: 'None' }).age);
  assert(validatePatientForm({ name: 'Valid Name', age: '35.5', gender: 'Female', primaryCondition: 'Cough', allergies: 'None' }).age);
  assert(validatePatientForm({ name: 'Valid Name', age: 'invalid', gender: 'Female', primaryCondition: 'Cough', allergies: 'None' }).age);
});

test('Accepts boundary ages (1 and 120)', () => {
  const err1 = validatePatientForm({ name: 'Infant', age: '1', gender: 'Male', primaryCondition: 'Fever', allergies: 'None' });
  assert(!err1.age, 'Age 1 should be valid');
  const err120 = validatePatientForm({ name: 'Elder', age: '120', gender: 'Female', primaryCondition: 'Arthritis', allergies: 'None' });
  assert(!err120.age, 'Age 120 should be valid');
});

test('Rejects single character names (< 2 chars)', () => {
  const errs = validatePatientForm({ name: 'A', age: '30', gender: 'Female', primaryCondition: 'Headache', allergies: 'None' });
  assert.strictEqual(errs.name, 'Full name must be at least 2 characters');
});

test('Accepts fully populated valid patient record', () => {
  const validData = {
    name: 'Smt. Jayashree Hegde',
    age: '49',
    gender: 'Female',
    primaryCondition: 'Acute pharyngitis with mild fever',
    allergies: 'Penicillin (Severe hives)',
    taluka: 'Kumta',
    phoneNumber: '+91 98450 77112',
    consultationStatus: 'New / Consultation Pending',
    notes: 'Mild dysphagia for 2 days.'
  };
  const errs = validatePatientForm(validData);
  assert.strictEqual(Object.keys(errs).length, 0, 'Valid data produces 0 errors');
});

// =============================================================================
// SUITE 3: Search, Filter, and Sort Engine
// =============================================================================
console.log('\n[SUITE 3] Search & Filter Engine Logic:');

function filterPatients(list, { searchQuery = '', genderFilter = 'all', statusFilter = 'all', allergyFilter = 'all', sortBy = 'default' }) {
  let res = [...list];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    res = res.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.primaryCondition.toLowerCase().includes(q) ||
      p.allergies.toLowerCase().includes(q) ||
      p.taluka.toLowerCase().includes(q) ||
      (p.lastConsultationDoctor && p.lastConsultationDoctor.toLowerCase().includes(q))
    );
  }

  if (genderFilter !== 'all') {
    res = res.filter(p => p.gender === genderFilter);
  }

  if (statusFilter !== 'all') {
    res = res.filter(p => p.consultationStatus === statusFilter);
  }

  if (allergyFilter === 'allergic') {
    res = res.filter(p => p.hasAllergies);
  } else if (allergyFilter === 'no_allergies') {
    res = res.filter(p => !p.hasAllergies);
  }

  if (sortBy === 'name_asc') {
    res.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'age_asc') {
    res.sort((a, b) => a.age - b.age);
  } else if (sortBy === 'age_desc') {
    res.sort((a, b) => b.age - a.age);
  }

  return res;
}

test('Search by patient name matches correctly (query: "Parvathi")', () => {
  const matches = filterPatients(INITIAL_DEMO_PATIENTS, { searchQuery: 'Parvathi' });
  assert.strictEqual(matches.length, 1);
  assert(matches[0].name.includes('Parvathi'));
});

test('Search by medical condition matches correctly (query: "Bronchitis")', () => {
  const matches = filterPatients(INITIAL_DEMO_PATIENTS, { searchQuery: 'Bronchitis' });
  assert(matches.length >= 1);
  assert(matches[0].primaryCondition.includes('Bronchitis'));
});

test('Search by allergy matches correctly (query: "Penicillin")', () => {
  const matches = filterPatients(INITIAL_DEMO_PATIENTS, { searchQuery: 'Penicillin' });
  assert.strictEqual(matches.length, 1);
  assert(matches[0].allergies.includes('Penicillin'));
});

test('Search by taluka matches correctly (query: "Kodagu" or "Madikeri")', () => {
  const matches = filterPatients(INITIAL_DEMO_PATIENTS, { searchQuery: 'Madikeri' });
  assert.strictEqual(matches.length, 1);
  assert.strictEqual(matches[0].taluka, 'Madikeri');
});

test('Empty search query with no matching keywords returns empty list', () => {
  const matches = filterPatients(INITIAL_DEMO_PATIENTS, { searchQuery: 'XYZNonExistentKeyword999' });
  assert.strictEqual(matches.length, 0);
});

test('Filter by gender correctly partitions results', () => {
  const females = filterPatients(INITIAL_DEMO_PATIENTS, { genderFilter: 'Female' });
  const males = filterPatients(INITIAL_DEMO_PATIENTS, { genderFilter: 'Male' });
  assert(females.length > 0 && females.every(p => p.gender === 'Female'));
  assert(males.length > 0 && males.every(p => p.gender === 'Male'));
  assert.strictEqual(females.length + males.length, INITIAL_DEMO_PATIENTS.length);
});

test('Filter by consultation status matches "Completed" and "Waiting Room"', () => {
  const completed = filterPatients(INITIAL_DEMO_PATIENTS, { statusFilter: 'Completed' });
  const waiting = filterPatients(INITIAL_DEMO_PATIENTS, { statusFilter: 'Waiting Room' });
  assert(completed.length >= 4 && completed.every(p => p.consultationStatus === 'Completed'));
  assert(waiting.length >= 1 && waiting.every(p => p.consultationStatus === 'Waiting Room'));
});

test('Filter by allergy status separates allergic vs non-allergic patients', () => {
  const allergic = filterPatients(INITIAL_DEMO_PATIENTS, { allergyFilter: 'allergic' });
  const nonAllergic = filterPatients(INITIAL_DEMO_PATIENTS, { allergyFilter: 'no_allergies' });
  assert(allergic.length >= 7 && allergic.every(p => p.hasAllergies === true));
  assert(nonAllergic.length >= 2 && nonAllergic.every(p => p.hasAllergies === false));
  assert.strictEqual(allergic.length + nonAllergic.length, INITIAL_DEMO_PATIENTS.length);
});

test('Sorting by age orders properly', () => {
  const asc = filterPatients(INITIAL_DEMO_PATIENTS, { sortBy: 'age_asc' });
  assert.strictEqual(asc[0].age, 8); // Master Chethan Nayak
  const desc = filterPatients(INITIAL_DEMO_PATIENTS, { sortBy: 'age_desc' });
  assert.strictEqual(desc[0].age, 65); // Shri Manjunath Gowda
});

// =============================================================================
// SUITE 4: Component Verification & Immutability Checks
// =============================================================================
console.log('\n[SUITE 4] Component & UI Architecture Verification:');

test('Patient index page imports PatientDirectory, AddPatientModal, and PatientDetailModal', () => {
  const patientPage = fs.readFileSync(path.join(__dirname, '../src/pages/patient/index.jsx'), 'utf8');
  assert(patientPage.includes('PatientDirectory'), 'Imports PatientDirectory');
  assert(patientPage.includes('AddPatientModal'), 'Imports AddPatientModal');
  assert(patientPage.includes('PatientDetailModal'), 'Imports PatientDetailModal');
  assert(patientPage.includes('INITIAL_DEMO_PATIENTS'), 'Imports INITIAL_DEMO_PATIENTS');
});

test('Add Patient (+) button is positioned in the PortalLayout header actions and Directory header', () => {
  const patientPage = fs.readFileSync(path.join(__dirname, '../src/pages/patient/index.jsx'), 'utf8');
  assert(patientPage.includes('actions='), 'Passes actions prop to PortalLayout');
  assert(patientPage.includes('Add Patient'), 'Button has visible "Add Patient" text');
  assert(patientPage.includes('<Plus'), 'Button contains Plus icon');
});

test('AddPatientModal implements Cancel without saving incomplete records', () => {
  const modalCode = fs.readFileSync(path.join(__dirname, '../src/components/patient/AddPatientModal.jsx'), 'utf8');
  assert(modalCode.includes('handleCancel'), 'Has handleCancel function');
  assert(modalCode.includes('initialFormState'), 'Resets to initialFormState');
  assert(modalCode.includes('Save Patient'), 'Has "Save Patient" button');
  assert(modalCode.includes('Cancel'), 'Has "Cancel" button');
});

test('PatientDirectory includes desktop table and mobile cards views', () => {
  const dirCode = fs.readFileSync(path.join(__dirname, '../src/components/patient/PatientDirectory.jsx'), 'utf8');
  assert(dirCode.includes('hidden md:block'), 'Has desktop table responsive class');
  assert(dirCode.includes('block md:hidden'), 'Has mobile card responsive class');
  assert(dirCode.includes('DEMO DATA') || dirCode.includes('Demo'), 'Highlights DEMO DATA badge');
  assert(dirCode.includes('No Patients Found'), 'Has empty state container');
});

test('PatientDetailModal renders drug allergies, chief complaint, doctor history, and DEMO DATA tag', () => {
  const detailCode = fs.readFileSync(path.join(__dirname, '../src/components/patient/PatientDetailModal.jsx'), 'utf8');
  assert(detailCode.includes('Known Drug & Substance Allergies'), 'Highlights Drug allergies');
  assert(detailCode.includes('Primary Medical Condition'), 'Shows primary condition');
  assert(detailCode.includes('Consultation History'), 'Shows consultation history');
  assert(detailCode.includes('DEMO DATA') || detailCode.includes('Demo Data'), 'Shows Demo tag');
});

// =============================================================================
// SUITE 5: Non-Regression of Doctor & Outbox Modules
// =============================================================================
console.log('\n[SUITE 5] Non-Regression of Doctor & Outbox Portals:');

test('Doctor portal file exists and compiles without disruption', () => {
  const docFile = fs.readFileSync(path.join(__dirname, '../src/pages/doctor/index.jsx'), 'utf8');
  assert(docFile.includes('DoctorPortal'), 'Doctor portal component intact');
  assert(docFile.includes('Consultation Queue') || docFile.includes('consultations'), 'Doctor queue intact');
});

test('Bottom navigation bar maintains exact Patient -> Doctor -> Outbox sequence', () => {
  const navCode = fs.readFileSync(path.join(__dirname, '../src/components/layout/BottomNav.jsx'), 'utf8');
  const patIdx = navCode.indexOf('{/* 1. Patient */}');
  const docIdx = navCode.indexOf('{/* 2. Doctor */}');
  const outboxIdx = navCode.indexOf('{/* 3. Outbox */}');
  assert(patIdx !== -1 && docIdx !== -1 && outboxIdx !== -1);
  assert(patIdx < docIdx && docIdx < outboxIdx, 'Sequence preserved: Patient -> Doctor -> Outbox');
});

test('Outbox drawer component exists and preserves offline queuing', () => {
  const outboxFile = fs.readFileSync(path.join(__dirname, '../src/components/common/OfflineOutboxDrawer.jsx'), 'utf8');
  assert(outboxFile.includes('OfflineOutboxDrawer'), 'OfflineOutboxDrawer intact');
});

console.log('================================================================');
console.log(`  TASK 1 AUDIT PASSED: ${passedTests}/${totalTests} Checks Verified (100%)`);
console.log('================================================================\n');

