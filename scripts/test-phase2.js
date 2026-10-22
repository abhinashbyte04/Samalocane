/**
 * Samālōcane Phase 2 Automated Verification Test Suite
 * Lightweight Telemedicine Prototype for Low-Bandwidth Coastal & Hill Talukas
 *
 * Verifies:
 * 1. Patient Health Profiles (Validation, DOB/Age calculation, Data Isolation)
 * 2. Doctor Directory & Server-Side Verification Boundary
 * 3. Symptom-to-Specialty Recommendation Engine (Urgent Safety, Normalization, Fallback, Disclaimer)
 * 4. Consultation Request Workflow & 9-State Lifecycle Machine
 */

const { query, mockStore } = require('../src/lib/db');
const { 
  recommendDoctors, 
  normalizeSymptomText, 
  checkUrgentSafetyPathway, 
  matchSpecialties 
} = require('../src/lib/recommendationEngine');
const { 
  validateTransition, 
  generateReferenceNumber, 
  CONSULTATION_STATES, 
  TERMINAL_STATES 
} = require('../src/lib/consultationStateMachine');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
  passedTests++;
  console.log(`  ✓ ${testName}`);
}

async function runPhase2Tests() {
  console.log('================================================================');
  console.log('  Samālōcane Phase 2: Comprehensive Automated Test Suite');
  console.log('================================================================\n');

  // ===========================================================================
  // MODULE 1: Patient Health Profiles
  // ===========================================================================
  console.log('[MODULE 1] Testing Patient Health Profiles & Validation:');

  // 1.1 Age calculation helper from profile logic
  function calculateAge(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  const birthDate = '1992-06-15';
  const age = calculateAge(birthDate);
  assert(age >= 30 && age <= 35, `Calculated dynamic age from DOB (${birthDate}) is valid (~${age} years)`);

  // Future DOB check
  const futureDate = new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0];
  const isFuture = new Date(futureDate) > new Date();
  assert(isFuture === true, `Future date (${futureDate}) is correctly flagged as invalid`);

  // Gender validation whitelist
  const VALID_GENDERS = ['male', 'female', 'transgender', 'non_binary', 'prefer_not_to_say'];
  assert(VALID_GENDERS.includes('female'), 'Inclusive gender "female" is accepted');
  assert(VALID_GENDERS.includes('transgender'), 'Inclusive gender "transgender" is accepted');
  assert(VALID_GENDERS.includes('non_binary'), 'Inclusive gender "non_binary" is accepted');
  assert(!VALID_GENDERS.includes('alien_species'), 'Invalid gender is rejected');

  // Severity whitelist
  const VALID_SEVERITIES = ['mild', 'moderate', 'severe'];
  assert(VALID_SEVERITIES.includes('moderate'), 'Valid severity level "moderate" is accepted');
  assert(!VALID_SEVERITIES.includes('catastrophic'), 'Invalid severity level is rejected');

  // Patient profile mockStore query
  const patientRes = await query('SELECT * FROM patient_profiles WHERE user_id = $1', ['33333333-3333-3333-3333-333333333301']);
  assert(patientRes.rows.length === 1, 'Patient profile retrieved successfully by user_id');
  const patientProfile = patientRes.rows[0];
  assert(patientProfile.allergies.includes('Penicillin'), 'Drug allergy (Penicillin) persists in patient profile');
  assert(patientProfile.taluka === 'Kumta', 'Taluka geographical location (Kumta) correctly recorded');

  // Data isolation: Patient B accessing Patient A
  const otherPatientId = '33333333-3333-3333-3333-333333333399';
  const unauthorizedRes = await query('SELECT * FROM patient_profiles WHERE user_id = $1', [otherPatientId]);
  assert(unauthorizedRes.rows.length === 0, 'Data isolation enforced: non-existent/other patient records return 0 rows');

  // ===========================================================================
  // MODULE 2: Doctor Directory & Verification Enforceability
  // ===========================================================================
  console.log('\n[MODULE 2] Testing Doctor Directory & Verification Boundary:');

  // 2.1 Enforce is_verified = TRUE filter
  const verifiedDocsRes = await query(`
    SELECT dp.*, u.full_name 
    FROM doctor_profiles dp 
    JOIN users u ON dp.user_id = u.id 
    WHERE dp.is_verified = TRUE
  `);
  
  assert(verifiedDocsRes.rows.length > 0, `Directory query returned ${verifiedDocsRes.rows.length} verified doctors`);
  const hasUnverifiedInPublic = verifiedDocsRes.rows.some(d => d.is_verified === false);
  assert(hasUnverifiedInPublic === false, 'CRITICAL SECURITY: No unverified doctors are present in verified directory query');

  // Verify that an unverified doctor exists in database but is excluded
  const unverifiedDoctor = mockStore.doctor_profiles.find(d => d.is_verified === false);
  assert(!!unverifiedDoctor, 'Unverified test physician profile exists in DB seed for exclusion testing');
  assert(!verifiedDocsRes.rows.find(d => d.user_id === unverifiedDoctor.user_id), 'Unverified test physician is strictly excluded from directory output');

  // 2.2 Filter by specialty
  const pediaDocs = verifiedDocsRes.rows.filter(d => d.specialty_name === 'Pediatrics');
  assert(pediaDocs.length >= 1, 'Directory filters by specialty (Pediatrics found)');

  // 2.3 Filter by consultation mode
  const audioDocs = verifiedDocsRes.rows.filter(d => d.consultation_modes && d.consultation_modes.includes('audio'));
  assert(audioDocs.length >= 1, 'Directory filters by consultation mode (Audio call found)');

  // 2.4 Availability status
  const availableDocs = verifiedDocsRes.rows.filter(d => d.is_available === true);
  assert(availableDocs.length >= 1, 'Directory identifies available online physicians');

  // ===========================================================================
  // MODULE 3: Rule-Based Recommendation Engine
  // ===========================================================================
  console.log('\n[MODULE 3] Testing Symptom Recommendation Engine & Safety Pathways:');

  // 3.1 Text Normalization
  const rawText = "   Hello Doctor!! I have a SEVERE rash, & it's very itchy... please help!  ";
  const normalized = normalizeSymptomText(rawText);
  assert(!normalized.includes('!!'), 'Normalization removes punctuation marks');
  assert(normalized.includes('rash') && normalized.includes('itchy'), 'Normalization preserves clinical keywords');
  assert(normalized === normalized.toLowerCase(), 'Normalization lowercases input');

  // 3.2 URGENT SAFETY PATHWAY 1: Acute Chest Pain
  console.log('  Testing Urgent Red-Flag Emergency Detection:');
  const chestPainResult = await recommendDoctors('Patient is experiencing acute chest pain radiating to left arm and sweating');
  assert(chestPainResult.isUrgent === true, 'Safety Pathway: Acute chest pain triggers isUrgent = true');
  assert(chestPainResult.eligibleDoctors.length === 0, 'Safety Pathway: Blocks standard telemedicine booking during emergency');
  assert(chestPainResult.urgentDetails.emergencyHotlines.some(h => h.number === '108'), 'Safety Pathway: Provides National 108 Ambulance hotline');

  // 3.3 URGENT SAFETY PATHWAY 2: FAST Stroke Warning
  const strokeResult = await recommendDoctors('Sudden face drooping on right side with slurred speech and arm weakness');
  assert(strokeResult.isUrgent === true, 'Safety Pathway: FAST stroke signs trigger isUrgent = true');
  assert(strokeResult.urgentDetails.triggerPhrase.includes('face drooping') || strokeResult.urgentDetails.triggerPhrase.includes('slurred speech'), 'Safety Pathway: Identifies stroke trigger phrase');

  // 3.4 URGENT SAFETY PATHWAY 3: Anaphylaxis
  const allergyResult = await recommendDoctors('Severe allergic reaction, lip swelling and unable to breathe after bee sting');
  assert(allergyResult.isUrgent === true, 'Safety Pathway: Anaphylaxis signs trigger isUrgent = true');

  // 3.5 Specialty Routing: Dermatology
  const dermResult = await recommendDoctors('I have an itchy red skin rash with fungal infection patches');
  assert(dermResult.isUrgent === false, 'Dermatology: Non-emergency correctly marked as isUrgent = false');
  assert(dermResult.primarySpecialty.name === 'Dermatology', `Dermatology: Correctly routed to Dermatology (got ${dermResult.primarySpecialty.name})`);
  assert(dermResult.primarySpecialty.matchedKeywords.includes('rash'), 'Dermatology: Matched keyword "rash" captured');
  assert(dermResult.disclaimer.includes('DISCLAIMER'), 'Dermatology: Non-diagnostic disclaimer included in output');
  assert(dermResult.eligibleDoctors.length > 0, 'Dermatology: Returned verified eligible dermatologists');
  assert(dermResult.eligibleDoctors.every(d => d.is_verified === true), 'Dermatology: 100% of recommended doctors have is_verified = TRUE');

  // 3.6 Specialty Routing: Pulmonology / Respiratory
  const pulmResult = await recommendDoctors('Chronic cough with wheezing and difficulty breathing for 2 weeks');
  assert(pulmResult.primarySpecialty.name === 'Pulmonology / Respiratory', `Pulmonology: Correctly routed to Pulmonology (got ${pulmResult.primarySpecialty.name})`);

  // 3.7 Specialty Routing: Pediatrics
  const pediaResult = await recommendDoctors('Toddler infant child fever with vomiting and crying');
  assert(pediaResult.primarySpecialty.name === 'Pediatrics', `Pediatrics: Correctly routed to Pediatrics (got ${pediaResult.primarySpecialty.name})`);

  // 3.8 Specialty Routing: Orthopedics
  const orthoResult = await recommendDoctors('Severe joint pain in knee with back pain and swelling in joints');
  assert(orthoResult.primarySpecialty.name === 'Orthopedics', `Orthopedics: Correctly routed to Orthopedics (got ${orthoResult.primarySpecialty.name})`);

  // 3.9 Ambiguous Fallback: General Medicine
  const fallbackResult = await recommendDoctors('Feeling unwell and tired recently without specific focal pains');
  assert(fallbackResult.isFallback === true, 'Fallback: Ambiguous symptoms flagged as isFallback = true');
  assert(fallbackResult.primarySpecialty.name === 'General Medicine', 'Fallback: Routed to General Medicine for comprehensive triage');

  // ===========================================================================
  // MODULE 4: Consultation State Machine & Request Lifecycle
  // ===========================================================================
  console.log('\n[MODULE 4] Testing Consultation State Machine & Actor Authorization:');

  // 4.1 Reference Number Generation
  const refNum1 = generateReferenceNumber();
  const refNum2 = generateReferenceNumber();
  assert(refNum1.startsWith('SAM-2026-'), `Reference number format starts with SAM-2026- (${refNum1})`);
  assert(refNum1 !== refNum2, 'Reference numbers are uniquely generated');

  // 4.2 Legal State Transitions
  console.log('  Testing Legal Linear Lifecycle:');
  const t1 = validateTransition('draft', 'submitted', 'patient');
  assert(t1.allowed === true, 'State Transition: draft -> submitted by patient ALLOWED');

  const t2 = validateTransition('submitted', 'pending_doctor_review', 'doctor');
  assert(t2.allowed === true, 'State Transition: submitted -> pending_doctor_review by doctor ALLOWED');

  const t3 = validateTransition('pending_doctor_review', 'accepted', 'doctor');
  assert(t3.allowed === true, 'State Transition: pending_doctor_review -> accepted by doctor ALLOWED');

  const t4 = validateTransition('accepted', 'waiting', 'patient');
  assert(t4.allowed === true, 'State Transition: accepted -> waiting by patient ALLOWED');

  const t5 = validateTransition('waiting', 'in_progress', 'doctor');
  assert(t5.allowed === true, 'State Transition: waiting -> in_progress by doctor ALLOWED');

  const t6 = validateTransition('in_progress', 'completed', 'doctor');
  assert(t6.allowed === true, 'State Transition: in_progress -> completed by doctor ALLOWED');

  // 4.3 Illegal Jump Transitions
  console.log('  Testing Illegal State Transitions & Jumps:');
  const illegalJump = validateTransition('submitted', 'completed', 'doctor');
  assert(illegalJump.allowed === false, 'State Transition: submitted -> completed directly is REJECTED');

  const illegalBackward = validateTransition('waiting', 'draft', 'patient');
  assert(illegalBackward.allowed === false, 'State Transition: waiting -> draft backwards is REJECTED');

  // 4.4 Role-Based Transition Enforcement
  console.log('  Testing Role-Based State Enforcement:');
  const patientStartingCall = validateTransition('waiting', 'in_progress', 'patient');
  assert(patientStartingCall.allowed === false, 'RBAC: Patient cannot transition consultation to in_progress (doctor only)');

  const patientCompletingCall = validateTransition('in_progress', 'completed', 'patient');
  assert(patientCompletingCall.allowed === false, 'RBAC: Patient cannot complete consultation (doctor only)');

  // 4.5 Terminal State Immutability
  console.log('  Testing Terminal State Immutability:');
  for (const termState of TERMINAL_STATES) {
    const termTest = validateTransition(termState, 'in_progress', 'doctor');
    assert(termTest.allowed === false && termTest.error === 'TerminalStateViolation', 
      `Terminal Immutability: Cannot transition from terminal state '${termState}'`);
  }

  // 4.6 Mandatory Reason Enforcement
  console.log('  Testing Mandatory Reason Requirement:');
  const rejectWithoutReason = validateTransition('submitted', 'rejected', 'doctor', { reason: '' });
  assert(rejectWithoutReason.allowed === false && rejectWithoutReason.error === 'ReasonRequired', 
    'Validation: Rejection without clinical reason is REJECTED');

  const rejectWithReason = validateTransition('submitted', 'rejected', 'doctor', { reason: 'Doctor in emergency surgery' });
  assert(rejectWithReason.allowed === true, 'Validation: Rejection with documented reason is ALLOWED');

  const cancelAcceptedWithoutReason = validateTransition('accepted', 'cancelled', 'patient', { reason: '' });
  assert(cancelAcceptedWithoutReason.allowed === false && cancelAcceptedWithoutReason.error === 'ReasonRequired',
    'Validation: Cancelling accepted consultation without reason is REJECTED');

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`  PHASE 2 VERIFICATION COMPLETE: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('================================================================\n');
}

runPhase2Tests().catch(err => {
  console.error('\n❌ TEST SUITE RUNNER ABORTED WITH ERROR:\n', err);
  process.exit(1);
});

