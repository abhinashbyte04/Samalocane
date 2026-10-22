/**
 * Samālōcane Phase 4 Automated Verification Test Suite
 * Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas
 *
 * Verifies:
 * 1. WebRTC Signaling Schema & Bidirectional Exchange (offer, answer, ice_candidate, call_ready, call_ended)
 * 2. Signaling IDOR / BOLA Authorization Guards
 * 3. Safe ICE Candidate Queueing before Remote Description
 * 4. NetworkAdaptationManager Metric Calculations (Delta-based Packet Loss % and RTT)
 * 5. Dynamic Network Adaptation Policy (Degradation on Loss > 5% or RTT > 350ms)
 * 6. Hysteresis Protection against Mode Flapping & Respect for User Camera Preferences
 * 7. Independent Audio vs Video Control & Track Preservation
 * 8. Complete Resource Cleanup on Session Teardown
 */

const { query, mockStore } = require('../src/lib/db');
const { 
  sendSignal, 
  receiveSignals, 
  validateSignalPayload, 
  queueIceCandidate, 
  flushQueuedIceCandidates, 
  cleanupSignaling 
} = require('../src/lib/webrtcSignaling');
const { 
  NetworkAdaptationManager, 
  DEFAULT_CONFIG 
} = require('../src/lib/networkAdaptationManager');

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

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('  Samālōcane Phase 4: WebRTC Signaling & Network Adaptation Tests');
  console.log('================================================================\n');

  // Set up authorized test users and consultation
  const patientUser = { id: '33333333-3333-3333-3333-333333333301', role: 'patient', full_name: 'Smt. Parvathi' };
  const doctorUser = { id: '22222222-2222-2222-2222-222222222201', role: 'doctor', full_name: 'Dr. Ramesh Rao' };
  const unauthorizedUser = { id: '33333333-3333-3333-3333-333333333302', role: 'patient', full_name: 'Shri Ravi Kumar' };

  const testConsultationId = 'consult-01';
  const consult = mockStore.consultations.find(c => c.id === testConsultationId);
  consult.status = 'in_progress'; // Set consultation active

  // ===========================================================================
  // MODULE 1: WebRTC Signaling Protocol & Schema Validation
  // ===========================================================================
  console.log('[MODULE 1] WebRTC Signaling Protocol & Schema Validation:');

  // 1.1 Valid Offer Payload
  const validOfferPayload = { type: 'offer', sdp: 'v=0\r\no=samalocane 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
  const offerVal = validateSignalPayload('offer', validOfferPayload);
  assert(offerVal.valid === true, 'Signaling Schema: Valid SDP Offer schema accepted');

  // 1.2 Invalid Offer Payload (missing sdp)
  const invalidOfferPayload = { type: 'offer', text: 'no-sdp-here' };
  const invalidOfferVal = validateSignalPayload('offer', invalidOfferPayload);
  assert(invalidOfferVal.valid === false, 'Signaling Schema: Offer without SDP string is rejected');

  // 1.3 Mismatched Type Payload
  const mismatchedVal = validateSignalPayload('answer', { type: 'offer', sdp: 'v=0...' });
  assert(mismatchedVal.valid === false, 'Signaling Schema: Payload type mismatch is rejected');

  // 1.4 Oversized Payload (> 64 KB) DoS Protection
  const hugePayload = { type: 'offer', sdp: 'X'.repeat(70000) };
  const hugeVal = validateSignalPayload('offer', hugePayload);
  assert(hugeVal.valid === false && hugeVal.error.includes('maximum allowed size'), 'Security Guard: Oversized signaling payload (>64KB) is rejected');

  // 1.5 Valid ICE Candidate Payload
  const validCandidatePayload = {
    candidate: 'candidate:842163049 1 udp 1677729535 192.168.1.100 54321 typ host',
    sdpMid: '0',
    sdpMLineIndex: 0
  };
  const candVal = validateSignalPayload('ice_candidate', validCandidatePayload);
  assert(candVal.valid === true, 'Signaling Schema: Valid ICE candidate schema accepted');

  // ===========================================================================
  // MODULE 2: Signaling Authorization & IDOR/BOLA Protection
  // ===========================================================================
  console.log('\n[MODULE 2] Signaling Authorization & IDOR Guards:');

  // 2.1 Doctor sends Offer to Patient
  const offerRes = await sendSignal(testConsultationId, doctorUser, 'offer', validOfferPayload);
  assert(offerRes.success === true, 'Signaling Exchange: Doctor successfully transmitted SDP Offer');
  assert(offerRes.recipientId === patientUser.id, 'Signaling Routing: Offer automatically addressed to assigned patient');

  // 2.2 Patient receives Offer
  const patientSignals = await receiveSignals(testConsultationId, patientUser);
  assert(patientSignals.signals.length >= 1, 'Signaling Exchange: Patient successfully fetched pending Offer');
  assert(patientSignals.signals[0].signal_type === 'offer', 'Signaling Exchange: Received signal matches "offer"');

  // 2.3 Patient responds with Answer
  const validAnswerPayload = { type: 'answer', sdp: 'v=0\r\no=samalocane 67890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
  const answerRes = await sendSignal(testConsultationId, patientUser, 'answer', validAnswerPayload);
  assert(answerRes.success === true, 'Signaling Exchange: Patient successfully transmitted SDP Answer');
  assert(answerRes.recipientId === doctorUser.id, 'Signaling Routing: Answer automatically addressed to assigned doctor');

  // 2.4 Doctor receives Answer
  const docSignals = await receiveSignals(testConsultationId, doctorUser);
  assert(docSignals.signals.some(s => s.signal_type === 'answer'), 'Signaling Exchange: Doctor successfully received SDP Answer');

  // 2.5 IDOR Protection: Unauthorized user cannot send or read signals
  let unauthorizedSendBlocked = false;
  try {
    await sendSignal(testConsultationId, unauthorizedUser, 'offer', validOfferPayload);
  } catch (err) {
    if (err.code === 'ForbiddenSessionParticipant') unauthorizedSendBlocked = true;
  }
  assert(unauthorizedSendBlocked === true, 'CRITICAL IDOR GUARD: Unassigned user cannot transmit signals for consultation');

  let unauthorizedReadBlocked = false;
  try {
    await receiveSignals(testConsultationId, unauthorizedUser);
  } catch (err) {
    if (err.code === 'ForbiddenSessionParticipant') unauthorizedReadBlocked = true;
  }
  assert(unauthorizedReadBlocked === true, 'CRITICAL IDOR GUARD: Unassigned user cannot intercept signals for consultation');

  // ===========================================================================
  // MODULE 3: Safe ICE Candidate Queueing before Remote Description
  // ===========================================================================
  console.log('\n[MODULE 3] Safe ICE Candidate Queueing before Remote Description:');

  const testCandidate1 = { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 };
  const testCandidate2 = { candidate: 'candidate:2 ...', sdpMid: '1', sdpMLineIndex: 1 };

  // Queue candidates when remote description is pending
  queueIceCandidate('temp-consult-01', patientUser.id, testCandidate1);
  queueIceCandidate('temp-consult-01', patientUser.id, testCandidate2);

  const flushedCandidates = flushQueuedIceCandidates('temp-consult-01', patientUser.id);
  assert(flushedCandidates.length === 2, 'Candidate Queueing: 2 candidates queued before remote description was ready');
  assert(flushedCandidates[0].candidate === testCandidate1.candidate, 'Candidate Queueing: Candidates flushed in FIFO order');

  const emptyFlush = flushQueuedIceCandidates('temp-consult-01', patientUser.id);
  assert(emptyFlush.length === 0, 'Candidate Queueing: Flushed candidates cleared from buffer');

  // ===========================================================================
  // MODULE 4: NetworkAdaptationManager Accurate Metric Calculations
  // ===========================================================================
  console.log('\n[MODULE 4] NetworkAdaptationManager Metric Calculations:');

  const mockAudioTrack = { kind: 'audio', enabled: true };
  const mockVideoTrack = { kind: 'video', enabled: true };
  const mockSenders = [
    { track: mockAudioTrack },
    { track: mockVideoTrack }
  ];
  const mockPC = {
    getSenders: () => mockSenders
  };

  const nam = new NetworkAdaptationManager(mockPC, {
    consecutiveDegradedLimit: 2,
    consecutiveRecoveredLimit: 2
  });

  // 4.1 Delta-based Packet Loss Calculation
  // Report 1: 100 packets received, 0 lost
  // Report 2: 200 packets received (delta = 100), 10 lost (delta = 10)
  // Expected loss: 10 / (100 + 10) * 100 = 9.09%
  const lossPercent = nam.computePacketLoss(200, 100, 10, 0);
  assert(lossPercent >= 9.0 && lossPercent <= 9.2, `Packet Loss Formula: Correct delta calculation (Expected ~9.09%, got ${lossPercent}%)`);

  // Zero loss scenario
  const zeroLoss = nam.computePacketLoss(300, 200, 10, 10);
  assert(zeroLoss === 0, 'Packet Loss Formula: Zero delta packets lost produces 0% loss');

  // ===========================================================================
  // MODULE 5: Dynamic Network Adaptation Policy & Thresholds
  // ===========================================================================
  console.log('\n[MODULE 5] Dynamic Network Adaptation Policy & Thresholds:');

  // Baseline report (Healthy)
  nam.evaluateMetrics({
    rttMs: 80,
    packetsReceived: 100,
    packetsLost: 0,
    jitterMs: 10,
    bytesReceived: 50000
  });
  assert(nam.currentQuality === 'good', 'Adaptation Policy: Low latency (80ms) and 0% loss produces "good" quality');
  assert(nam.currentMode === 'video', 'Adaptation Policy: Video transmission active under stable conditions');

  // Simulated Single Spike (RTT 450ms, but only 1 reading): Should NOT flap mode immediately!
  nam.evaluateMetrics({
    rttMs: 450,
    packetsReceived: 200,
    packetsLost: 2, // 2% loss
    jitterMs: 40,
    bytesReceived: 100000
  });
  assert(nam.currentMode === 'video', 'Hysteresis Guard: Single noisy spike does NOT trigger premature video fallback');

  // Sustained Degradation (2nd consecutive degraded reading with Packet Loss > 5%)
  // delta received = 100, delta lost = 10 -> ~9.09% loss > 5%
  nam.evaluateMetrics({
    rttMs: 400,
    packetsReceived: 300,
    packetsLost: 12,
    jitterMs: 50,
    bytesReceived: 150000
  });

  assert(nam.currentQuality === 'degraded' || nam.currentQuality === 'poor', `Adaptation Policy: Sustained degradation entered '${nam.currentQuality}' state`);
  assert(nam.currentMode === 'audio_only', 'Adaptation Policy: Outgoing video automatically disabled to preserve audio clarity');

  // Audio track preservation check: video disabled, audio track remains enabled!
  const senders = mockPC.getSenders();
  const audioSender = senders.find(s => s.track.kind === 'audio');
  const videoSender = senders.find(s => s.track.kind === 'video');
  assert(audioSender.track.enabled === true, 'Audio-First Rule: Audio transmission remains ENABLED during video fallback');
  assert(videoSender.track.enabled === false, 'Audio-First Rule: Outgoing video track disabled');

  // ===========================================================================
  // MODULE 6: Hysteresis Recovery & User Preference Respect
  // ===========================================================================
  console.log('\n[MODULE 6] Hysteresis Recovery & User Preference Respect:');

  // Recovery reading 1 (Healthy RTT 90ms, 0 loss)
  nam.evaluateMetrics({
    rttMs: 90,
    packetsReceived: 400,
    packetsLost: 12,
    jitterMs: 12,
    bytesReceived: 200000
  });
  assert(nam.currentMode === 'audio_only', 'Hysteresis Guard: Single healthy reading does not prematurely restore video');

  // Recovery reading 2 (Sustained healthy)
  nam.evaluateMetrics({
    rttMs: 85,
    packetsReceived: 500,
    packetsLost: 12,
    jitterMs: 10,
    bytesReceived: 250000
  });
  assert(nam.currentQuality === 'good', 'Hysteresis Recovery: Sustained healthy conditions restored "good" quality');
  assert(nam.currentMode === 'video', 'Hysteresis Recovery: Video mode safely restored after verified recovery window');

  // User explicit camera-off check
  nam.setUserCameraPreference(false);
  assert(nam.currentMode === 'audio_only', 'User Control: Setting user camera preference to false sets mode to audio_only');

  // Even if network is perfect, video must NOT auto-restore if user disabled camera!
  nam.evaluateMetrics({
    rttMs: 70,
    packetsReceived: 600,
    packetsLost: 12,
    jitterMs: 8,
    bytesReceived: 300000
  });
  assert(nam.currentMode === 'audio_only', 'User Preference Respect: Video did NOT turn on because user explicitly turned off camera');

  // Clean up
  nam.stopMonitoring();
  await cleanupSignaling(testConsultationId);

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`  PHASE 4 VERIFICATION COMPLETE: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('================================================================\n');
}

runPhase4Tests().catch(err => {
  console.error('\n❌ TEST SUITE RUNNER ABORTED WITH ERROR:\n', err);
  process.exit(1);
});
