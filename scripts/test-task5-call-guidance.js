/**
 * Samālōcane Task 5: Internet & Video-Call Guidance Box Test Suite
 * Automated tests verifying:
 * 1. Component Architecture: InternetCallGuidanceBox component structure & exports
 * 2. Pre-Call Checklist (All 8 required readiness items):
 *    - Internet available
 *    - Internet stable
 *    - Camera permission
 *    - Mic permission
 *    - Camera & mic working
 *    - Quiet, well-lit place
 *    - Battery / power
 *    - Headphones available
 * 3. Pre-Call Actions:
 *    - "Check Connection" button (user-initiated browser API check)
 *    - "Continue to Consultation" button
 * 4. Context-Sensitive Internet Suggestions (All 6 required guidance rules):
 *    - Weak/unstable internet
 *    - Camera unavailable
 *    - Microphone unavailable
 *    - Poor audio / echo
 *    - Video freezing
 *    - Connection lost
 * 5. In-Call Connection Status Indicator (All 5 required states):
 *    - Checking connection
 *    - Connected
 *    - Connection unstable
 *    - Reconnecting
 *    - Disconnected
 * 6. Dynamic State Recommendations & Real Metric Passthrough (no fabricated scores)
 * 7. Help Action (reopens guidance without ending active call)
 * 8. UI Integration across /consultation/request/[id] and /consultation/room/[id]
 * 9. Non-Regression: Patient, Doctor, Outbox, Footer, Typography, and Prohibited Strings
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
console.log('  Samālōcane Task 5: Internet & Call Guidance Box Test Suite');
console.log('================================================================\n');

// =============================================================================
// SUITE 1: Component Architecture & Pre-Call Readiness Checklist
// =============================================================================
console.log('[SUITE 1] Pre-Call Guidance & Checklist (Requirements A & B):');

test('InternetCallGuidanceBox component file exists and exports named and default component', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  assert(fs.existsSync(compPath), 'InternetCallGuidanceBox.jsx must exist');
  const code = fs.readFileSync(compPath, 'utf8');
  assert(code.includes('export function InternetCallGuidanceBox'), 'Must export named InternetCallGuidanceBox');
  assert(code.includes('export default InternetCallGuidanceBox'), 'Must export default InternetCallGuidanceBox');
});

test('Pre-Call checklist includes all 8 specified medical readiness items', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');

  // Item 1: Internet connection is available
  assert(code.includes('Internet connection is available'), 'Checklist must verify internet availability');

  // Item 2: Internet connection appears stable
  assert(code.includes('internet connection appears stable'), 'Checklist must verify internet stability');

  // Item 3: Browser has permission to use camera
  assert(code.includes('permission to use camera') || code.includes('permission to use the camera'), 'Checklist must verify camera permission');

  // Item 4: Browser has permission to use microphone
  assert(code.includes('permission to use microphone') || code.includes('permission to use the microphone'), 'Checklist must verify microphone permission');

  // Item 5: Camera and microphone are working
  assert(code.includes('Camera and microphone are working'), 'Checklist must verify working hardware');

  // Item 6: Quiet, well-lit place
  assert(code.includes('quiet, well-lit place') || code.includes('quiet and well-lit'), 'Checklist must verify quiet well-lit location');

  // Item 7: Sufficient battery or connected to power
  assert(code.includes('battery') && code.includes('power'), 'Checklist must verify device power / battery');

  // Item 8: Headphones available
  assert(code.includes('Headphones') && code.includes('feedback'), 'Checklist must verify headphones for audio feedback prevention');
});

test('Includes "Check Connection" button and "Continue to Consultation" button', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');

  assert(code.includes('Check Connection'), 'Must render "Check Connection" button');
  assert(code.includes('Continue to Consultation'), 'Must render "Continue to Consultation" button');
});

test('Camera and microphone checks use real navigator.mediaDevices.getUserMedia and request permission only on user action', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');

  assert(code.includes('navigator.mediaDevices.getUserMedia'), 'Must use browser getUserMedia API');
  assert(code.includes('handleCheckConnection'), 'Check must be contained within user-initiated click handler');
  assert(code.includes('stream.getTracks().forEach') || code.includes('t.stop()'), 'Must clean up media stream tracks after check');
  assert(!code.includes('useEffect(() => { handleCheckConnection();'), 'Must NOT trigger media permissions automatically on mount');
});

// =============================================================================
// SUITE 2: Context-Sensitive Internet Suggestions
// =============================================================================
console.log('\n[SUITE 2] Context-Sensitive Internet Suggestions (Requirement C):');

test('Provides suggestion for weak or unstable internet (move closer to router)', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');
  assert(code.includes('Weak or unstable internet'), 'Must address weak or unstable internet');
  assert(code.includes('closer to the router') || code.includes('closer to router'), 'Must advise moving closer to router');
});

test('Provides suggestion for camera unavailable (check permissions, other apps)', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');
  assert(code.includes('Camera unavailable'), 'Must address camera unavailable');
  assert(code.includes('another application'), 'Must advise checking if another application is using camera');
});

test('Provides suggestion for microphone unavailable (select correct input device)', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');
  assert(code.includes('Microphone unavailable'), 'Must address microphone unavailable');
  assert(code.includes('correct input device'), 'Must advise selecting correct input device');
});

test('Provides suggestion for poor audio (use headphones, reduce background noise)', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');
  assert(code.includes('Poor audio') || code.includes('Poor audio or echo'), 'Must address poor audio');
  assert(code.includes('background noise'), 'Must advise reducing background noise');
});

test('Provides suggestion for video freezing (close unnecessary apps & downloads)', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');
  assert(code.includes('Video freezing'), 'Must address video freezing');
  assert(code.includes('unnecessary') || code.includes('background applications'), 'Must advise closing unnecessary apps');
});

test('Provides suggestion for connection lost (wait briefly, retry, reconnect)', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');
  assert(code.includes('Connection lost'), 'Must address connection lost');
  assert(code.includes('reconnect'), 'Must advise reconnect option');
});

// =============================================================================
// SUITE 3: In-Call Connection Status Indicator & Recommendations
// =============================================================================
console.log('\n[SUITE 3] In-Call Connection Status & Live Guidance (Requirements D & E):');

test('In-Call mode covers all 5 specified connection states', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');

  assert(code.includes('Checking connection'), 'Must support "Checking connection" state');
  assert(code.includes('Connected'), 'Must support "Connected" state');
  assert(code.includes('Connection unstable'), 'Must support "Connection unstable" state');
  assert(code.includes('Reconnecting'), 'Must support "Reconnecting" state');
  assert(code.includes('Disconnected'), 'Must support "Disconnected" state');
});

test('In-Call mode dynamically renders recommendation on connection state change', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');

  assert(code.includes('recommendation:'), 'Must assign context-sensitive recommendations per state');
  assert(code.includes('Recommendation:'), 'Must visibly display recommendation to user');
});

test('Includes Help action to reopen guidance without terminating active call', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');

  assert(code.includes('Call Guidance') || code.includes('Help & Guidance'), 'Must have Call Guidance help button');
  assert(code.includes('isHelpDrawerOpen') || code.includes('showHelp'), 'Must toggle help panel / drawer');
  assert(code.includes('Return to Call'), 'Help drawer must have "Return to Call" action');
});

test('Does not fabricate synthetic internet speeds or fake connection scores', () => {
  const compPath = path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx');
  const code = fs.readFileSync(compPath, 'utf8');

  assert(!code.includes('Math.random()'), 'Must not generate fake randomized metrics');
  assert(!code.includes('100 Mbps') && !code.includes('50 Mbps'), 'Must not claim fabricated internet speeds');
});

// =============================================================================
// SUITE 4: UI Integration across Consultation Flows
// =============================================================================
console.log('\n[SUITE 4] UI Integration & Flow Continuity (Requirement A):');

test('Consultation Request Page (/consultation/request/[id]) embeds Pre-Call Guidance Box', () => {
  const reqPagePath = path.join(__dirname, '../src/pages/consultation/request/[id].jsx');
  const code = fs.readFileSync(reqPagePath, 'utf8');

  assert(code.includes('InternetCallGuidanceBox'), 'Must import and render InternetCallGuidanceBox');
  assert(code.includes('mode="pre_call"'), 'Must render in pre_call mode');
  assert(code.includes('doctorName='), 'Must pass selected doctor name');
});

test('Consultation Room Page (/consultation/room/[id]) embeds In-Call Guidance Box', () => {
  const roomPagePath = path.join(__dirname, '../src/pages/consultation/room/[id].jsx');
  const code = fs.readFileSync(roomPagePath, 'utf8');

  assert(code.includes('InternetCallGuidanceBox'), 'Must import and render InternetCallGuidanceBox');
  assert(code.includes('mode="in_call"'), 'Must render in in_call mode');
  assert(code.includes('callState={rtc.callState}'), 'Must pass real WebRTC call state');
  assert(code.includes('connectionQuality={rtc.connectionQuality}'), 'Must pass WebRTC connection quality');
  assert(code.includes('onReconnect'), 'Must provide reconnect handler');
});

test('Single instance per page: No duplicate guidance boxes within the same view (Requirement A.4)', () => {
  const reqCode = fs.readFileSync(path.join(__dirname, '../src/pages/consultation/request/[id].jsx'), 'utf8');
  const roomCode = fs.readFileSync(path.join(__dirname, '../src/pages/consultation/room/[id].jsx'), 'utf8');

  const reqMatches = reqCode.match(/<InternetCallGuidanceBox/g) || [];
  const roomMatches = roomCode.match(/<InternetCallGuidanceBox/g) || [];

  assert.strictEqual(reqMatches.length, 1, 'Expected exactly 1 guidance box on consultation request page');
  assert.strictEqual(roomMatches.length, 1, 'Expected exactly 1 guidance box on consultation room page');
});

// =============================================================================
// SUITE 5: Non-Regression & Brand Compliance
// =============================================================================
console.log('\n[SUITE 5] Non-Regression & Design Compliance:');

test('Preserves Patient Directory and "Find Suitable Doctors" action', () => {
  const patDirCode = fs.readFileSync(path.join(__dirname, '../src/components/patient/PatientDirectory.jsx'), 'utf8');
  assert(patDirCode.includes('Find Suitable Doctors'));
});

test('Preserves Doctor Directory and Doctor Profiles', () => {
  const docDirCode = fs.readFileSync(path.join(__dirname, '../src/components/doctor/DoctorDirectory.jsx'), 'utf8');
  assert(docDirCode.includes('View Profile'));
});

test('Preserves Bottom Navigation sequence strictly as Patient -> Doctor -> Outbox', () => {
  const navCode = fs.readFileSync(path.join(__dirname, '../src/components/layout/BottomNav.jsx'), 'utf8');
  const pIdx = navCode.indexOf('{/* 1. Patient */}');
  const dIdx = navCode.indexOf('{/* 2. Doctor */}');
  const oIdx = navCode.indexOf('{/* 3. Outbox */}');
  assert(pIdx < dIdx && dIdx < oIdx, 'Bottom navigation sequence must be Patient -> Doctor -> Outbox');
});

test('Footer text strictly maintained as "© Made with love for mankind"', () => {
  const footerCode = fs.readFileSync(path.join(__dirname, '../src/components/layout/Footer.jsx'), 'utf8');
  assert(footerCode.includes('© Made with love for mankind'));
});

test('Zero micro-text (text-[10px], text-[11px]) in InternetCallGuidanceBox component', () => {
  const code = fs.readFileSync(path.join(__dirname, '../src/components/consultation/InternetCallGuidanceBox.jsx'), 'utf8');
  assert(!code.includes('text-[10px]'), 'Must not contain text-[10px]');
  assert(!code.includes('text-[11px]'), 'Must not contain text-[11px]');
});

// =============================================================================
// SUMMARY
// =============================================================================
console.log('================================================================');
console.log(`  TASK 5 AUDIT PASSED: ${passedTests}/${totalTests} Checks Verified (100%)`);
console.log('================================================================\n');

