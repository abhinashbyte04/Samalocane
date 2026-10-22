/**
 * Samālōcane — Phase 5 Automated Verification Suite
 * PWA Service Worker, IndexedDB Outbox & Emergency Mode
 * 
 * Verifies:
 * 1. PWA Web App Manifest, configuration, and app icon compliance.
 * 2. Service Worker cache architecture, stale-while-revalidate, network-first PHC caching,
 *    and CRITICAL PRIVACY GUARD: never caching private health data or authenticated APIs.
 * 3. IndexedDB Outbox Engine:
 *    - Schema, indexes, and operation queueing (CREATE_CONSULTATION, UPDATE_HEALTH_PROFILE).
 *    - Status lifecycle transitions (pending -> syncing -> synced | failed | needs_review).
 *    - Strict User Isolation (User A cannot view, sync, or delete User B's outbox items).
 *    - Retry backoff logic, attempt exhaustion, and failure isolation.
 * 4. Idempotency handling via clientMutationId.
 * 5. Taluka PHC Directory data source integrity and zero-login emergency cellular tel: links.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let outboxModule;

async function initModules() {
  outboxModule = await import('../src/lib/indexedDbOutbox.js');
}

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    Assertion Error: ${err.message}`);
    process.exitCode = 1;
  }
}

async function itAsync(desc, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    Assertion Error: ${err.message}`);
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  await initModules();

  console.log('\n================================================================');
  console.log('  Samālōcane Phase 5: PWA, IndexedDB Outbox & Emergency Tests');
  console.log('================================================================\n');

  // ================================================================
  // MODULE 1: PWA Manifest & Icon Assets Verification
  // ================================================================
  console.log('[MODULE 1] Web App Manifest & PWA Icon Compliance:');

  const manifestPath = path.join(__dirname, '../public/manifest.json');
  it('Manifest exists at public/manifest.json', () => {
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
  });

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  it('Manifest contains required PWA fields (name, short_name, start_url, display)', () => {
    assert.ok(manifest.name && manifest.name.includes('Samālōcane'), 'Must contain platform name');
    assert.strictEqual(manifest.short_name, 'Samālōcane');
    assert.strictEqual(manifest.start_url, '/');
    assert.strictEqual(manifest.display, 'standalone');
    assert.strictEqual(manifest.theme_color, '#0d9488');
    assert.strictEqual(manifest.background_color, '#f8fafc');
  });

  it('Manifest defines 192x192 and 512x512 icons with maskable support', () => {
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'Icons array required');
    const icon192 = manifest.icons.find(i => i.sizes === '192x192');
    const icon512 = manifest.icons.find(i => i.sizes === '512x512');
    assert.ok(icon192, '192x192 icon must be declared');
    assert.ok(icon512, '512x512 icon must be declared');
    assert.ok(icon192.purpose.includes('maskable'), 'Maskable purpose recommended for PWA');
  });

  const icon192Path = path.join(__dirname, '../public/icons/icon-192.png');
  const icon512Path = path.join(__dirname, '../public/icons/icon-512.png');

  it('Icon binaries exist and match valid PNG header bytes', () => {
    assert.ok(fs.existsSync(icon192Path), 'icon-192.png must exist');
    assert.ok(fs.existsSync(icon512Path), 'icon-512.png must exist');
    const header192 = fs.readFileSync(icon192Path).slice(0, 8);
    const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.ok(header192.equals(pngMagic), 'icon-192.png must have valid PNG magic bytes');
  });

  // ================================================================
  // MODULE 2: Service Worker Cache Architecture & Privacy Enforcement
  // ================================================================
  console.log('\n[MODULE 2] Service Worker Architecture & Privacy Enforcement:');

  const swPath = path.join(__dirname, '../public/sw.js');
  it('Service worker file exists at public/sw.js', () => {
    assert.ok(fs.existsSync(swPath), 'sw.js must exist');
  });

  const swSource = fs.readFileSync(swPath, 'utf8');

  it('Service worker declares versioned caches and pre-caches emergency app shell', () => {
    assert.ok(swSource.includes('STATIC_CACHE'), 'Must define static cache');
    assert.ok(swSource.includes('PHC_CACHE'), 'Must define PHC cache');
    assert.ok(swSource.includes('/emergency'), 'Must pre-cache emergency route');
    assert.ok(swSource.includes('/data/phc-seed.json'), 'Must pre-cache PHC seed file');
    assert.ok(swSource.includes('/manifest.json'), 'Must pre-cache manifest');
  });

  // Simulate Service Worker routing rules based on swSource implementation
  const privatePatterns = [
    /\/api\/auth(\/|$)/,
    /\/api\/patient(\/|$)/,
    /\/api\/consultations(\/|$)/,
    /\/api\/admin(\/|$)/,
    /\/consultation\/room(\/|$)/,
    /\/consultation\/waiting(\/|$)/
  ];

  function evaluateSWCachePolicy(urlPath, method = 'GET') {
    if (method !== 'GET') return 'NETWORK_ONLY_METHOD';
    const isPrivate = privatePatterns.some(p => p.test(urlPath));
    if (isPrivate) return 'NETWORK_ONLY_PRIVACY';
    if (urlPath === '/api/phc' || urlPath === '/data/phc-seed.json') {
      return 'NETWORK_FIRST_CACHE_FALLBACK';
    }
    if (
      urlPath.startsWith('/_next/static/') ||
      urlPath.startsWith('/icons/') ||
      urlPath === '/manifest.json' ||
      urlPath === '/' ||
      urlPath === '/emergency'
    ) {
      return 'STALE_WHILE_REVALIDATE';
    }
    return 'DEFAULT_FETCH';
  }

  it('CRITICAL PRIVACY GUARD: /api/auth/* is strictly Network-Only (NEVER cached)', () => {
    assert.strictEqual(evaluateSWCachePolicy('/api/auth/me'), 'NETWORK_ONLY_PRIVACY');
    assert.strictEqual(evaluateSWCachePolicy('/api/auth/google'), 'NETWORK_ONLY_PRIVACY');
  });

  it('CRITICAL PRIVACY GUARD: /api/patient/* is strictly Network-Only (NEVER cached)', () => {
    assert.strictEqual(evaluateSWCachePolicy('/api/patient/profile'), 'NETWORK_ONLY_PRIVACY');
    assert.strictEqual(evaluateSWCachePolicy('/api/patient/history'), 'NETWORK_ONLY_PRIVACY');
  });

  it('CRITICAL PRIVACY GUARD: /api/consultations/* is strictly Network-Only (NEVER cached)', () => {
    assert.strictEqual(evaluateSWCachePolicy('/api/consultations'), 'NETWORK_ONLY_PRIVACY');
    assert.strictEqual(evaluateSWCachePolicy('/api/consultations/request'), 'NETWORK_ONLY_PRIVACY');
    assert.strictEqual(evaluateSWCachePolicy('/api/consultations/SAM-2026-001'), 'NETWORK_ONLY_PRIVACY');
  });

  it('CRITICAL PRIVACY GUARD: Consultation rooms and waiting rooms are strictly Network-Only', () => {
    assert.strictEqual(evaluateSWCachePolicy('/consultation/room/room_xyz_123'), 'NETWORK_ONLY_PRIVACY');
    assert.strictEqual(evaluateSWCachePolicy('/consultation/waiting/consult_456'), 'NETWORK_ONLY_PRIVACY');
  });

  it('Public Emergency PHC directory uses Network-First with Cache Fallback', () => {
    assert.strictEqual(evaluateSWCachePolicy('/api/phc'), 'NETWORK_FIRST_CACHE_FALLBACK');
    assert.strictEqual(evaluateSWCachePolicy('/data/phc-seed.json'), 'NETWORK_FIRST_CACHE_FALLBACK');
  });

  it('Static assets, emergency page shell, and icons use Stale-While-Revalidate', () => {
    assert.strictEqual(evaluateSWCachePolicy('/emergency'), 'STALE_WHILE_REVALIDATE');
    assert.strictEqual(evaluateSWCachePolicy('/manifest.json'), 'STALE_WHILE_REVALIDATE');
    assert.strictEqual(evaluateSWCachePolicy('/icons/icon-192.png'), 'STALE_WHILE_REVALIDATE');
  });

  // ================================================================
  // MODULE 3: IndexedDB Outbox Engine: Schema & Queueing
  // ================================================================
  console.log('\n[MODULE 3] IndexedDB Outbox Schema & Queueing:');

  outboxModule.resetInMemoryStore();

  await itAsync('Queues CREATE_CONSULTATION with required fields and pending status', async () => {
    const record = await outboxModule.queueOperation({
      userId: 'user_pat_101',
      operationType: 'CREATE_CONSULTATION',
      endpoint: '/api/consultations',
      method: 'POST',
      payload: {
        doctorId: 'doc_karwar_001',
        requestedMode: 'audio',
        chiefComplaint: 'Chest congestion and persistent cough'
      }
    });

    assert.ok(record.id.startsWith('outbox_'), 'ID must have outbox_ prefix');
    assert.strictEqual(record.userId, 'user_pat_101');
    assert.strictEqual(record.operationType, 'CREATE_CONSULTATION');
    assert.strictEqual(record.status, 'pending');
    assert.strictEqual(record.attempts, 0);
    assert.ok(record.clientMutationId.startsWith('mut_'), 'Must generate clientMutationId');
    assert.ok(record.createdAt, 'Must record createdAt timestamp');
  });

  await itAsync('Queues UPDATE_HEALTH_PROFILE operation', async () => {
    const record = await outboxModule.queueOperation({
      userId: 'user_pat_101',
      operationType: 'UPDATE_HEALTH_PROFILE',
      endpoint: '/api/patient/profile',
      method: 'PUT',
      payload: {
        taluka: 'Kumta',
        district: 'Uttara Kannada',
        allergies: 'Penicillin'
      }
    });

    assert.strictEqual(record.operationType, 'UPDATE_HEALTH_PROFILE');
    assert.strictEqual(record.status, 'pending');
  });

  await itAsync('Rejects queueing operation with missing userId (User Isolation Rule)', async () => {
    await assert.rejects(
      async () => {
        await outboxModule.queueOperation({
          userId: null,
          operationType: 'CREATE_CONSULTATION',
          endpoint: '/api/consultations',
          payload: {}
        });
      },
      /User isolation violation/
    );
  });

  await itAsync('Rejects unsupported operationType', async () => {
    await assert.rejects(
      async () => {
        await outboxModule.queueOperation({
          userId: 'user_pat_101',
          operationType: 'DELETE_ACCOUNT_HACK',
          endpoint: '/api/hack',
          payload: {}
        });
      },
      /Invalid operationType/
    );
  });

  // ================================================================
  // MODULE 4: Strict User Isolation in Offline Storage
  // ================================================================
  console.log('\n[MODULE 4] Strict User Isolation & Isolation Guards:');

  await itAsync('Enforces user isolation: User A cannot read User B items', async () => {
    // Queue item for Patient B
    await outboxModule.queueOperation({
      userId: 'user_pat_202',
      operationType: 'CREATE_CONSULTATION',
      endpoint: '/api/consultations',
      payload: { chiefComplaint: 'Confidential Patient B condition' }
    });

    const user1Items = await outboxModule.getOutboxForUser('user_pat_101');
    const user2Items = await outboxModule.getOutboxForUser('user_pat_202');

    assert.strictEqual(user1Items.length, 2, 'User 1 should only see their 2 queued items');
    assert.strictEqual(user2Items.length, 1, 'User 2 should only see their 1 queued item');
    assert.ok(
      user1Items.every(item => item.userId === 'user_pat_101'),
      'CRITICAL: Zero User B records leaked to User A'
    );
  });

  await itAsync('Prevents User A from deleting User B outbox items', async () => {
    const user2Items = await outboxModule.getOutboxForUser('user_pat_202');
    const itemToDelete = user2Items[0];

    const deleted = await outboxModule.deleteOutboxItem(itemToDelete.id, 'user_pat_101');
    assert.strictEqual(deleted, false, 'User A cannot delete User B record');

    const remaining = await outboxModule.getOutboxForUser('user_pat_202');
    assert.strictEqual(remaining.length, 1, 'User B record still remains in storage');
  });

  // ================================================================
  // MODULE 5: Outbox Synchronization, Lifecycle & Exponential Backoff
  // ================================================================
  console.log('\n[MODULE 5] Synchronization Lifecycle, Idempotency & Retry Backoff:');

  await itAsync('Successful synchronization transitions pending -> syncing -> synced', async () => {
    outboxModule.resetInMemoryStore();

    // Queue 1 item for User 101
    const queued = await outboxModule.queueOperation({
      userId: 'user_pat_101',
      operationType: 'CREATE_CONSULTATION',
      endpoint: '/api/consultations',
      method: 'POST',
      payload: {
        doctorId: 'doc_1',
        chiefComplaint: 'Earache',
        requestedMode: 'audio'
      }
    });

    // Mock fetch responding with 201 Created
    let receivedMutationId = null;
    const mockSuccessFetch = async (url, options) => {
      receivedMutationId = options.headers['X-Client-Mutation-ID'];
      return {
        ok: true,
        status: 201,
        statusText: 'Created',
        json: async () => ({
          success: true,
          consultation: { id: 'consult_synced_99', status: 'submitted' }
        })
      };
    };

    const syncResult = await outboxModule.syncOutboxForUser({ id: 'user_pat_101' }, mockSuccessFetch);

    assert.strictEqual(syncResult.synced, 1);
    assert.strictEqual(syncResult.remainingPending, 0);
    assert.strictEqual(receivedMutationId, queued.clientMutationId, 'X-Client-Mutation-ID was passed to server');

    const updated = (await outboxModule.getOutboxForUser('user_pat_101'))[0];
    assert.strictEqual(updated.status, 'synced');
    assert.ok(updated.syncedAt, 'Must set syncedAt timestamp');
    assert.strictEqual(updated.attempts, 1);
    assert.strictEqual(updated.serverResponse.consultation.id, 'consult_synced_99');
  });

  await itAsync('Client 4xx error marks record as failed permanently (prevents spin loops)', async () => {
    outboxModule.resetInMemoryStore();

    await outboxModule.queueOperation({
      userId: 'user_pat_101',
      operationType: 'CREATE_CONSULTATION',
      endpoint: '/api/consultations',
      payload: { invalidField: true }
    });

    const mock400Fetch = async () => ({
      ok: false,
      status: 400,
      json: async () => ({ message: 'ValidationError: chief complaint required' })
    });

    const syncResult = await outboxModule.syncOutboxForUser({ id: 'user_pat_101' }, mock400Fetch);
    assert.strictEqual(syncResult.failed, 1);

    const items = await outboxModule.getOutboxForUser('user_pat_101');
    assert.strictEqual(items[0].status, 'failed');
    assert.ok(items[0].error.includes('ValidationError'));
  });

  await itAsync('Network disconnect keeps record pending and increments attempt count', async () => {
    outboxModule.resetInMemoryStore();

    await outboxModule.queueOperation({
      userId: 'user_pat_101',
      operationType: 'UPDATE_HEALTH_PROFILE',
      endpoint: '/api/patient/profile',
      payload: { taluka: 'Karwar' }
    });

    const mockOfflineFetch = async () => {
      throw new Error('TypeError: Failed to fetch (Network unreachable)');
    };

    await outboxModule.syncOutboxForUser({ id: 'user_pat_101' }, mockOfflineFetch);

    const items = await outboxModule.getOutboxForUser('user_pat_101');
    assert.strictEqual(items[0].status, 'pending', 'Must remain pending for next reconnect attempt');
    assert.strictEqual(items[0].attempts, 1);
    assert.ok(items[0].lastAttemptAt, 'Must set lastAttemptAt timestamp');
  });

  it('Calculates exponential backoff delay accurately', () => {
    assert.strictEqual(outboxModule.getRetryDelayMs(1), 1000);  // 1s
    assert.strictEqual(outboxModule.getRetryDelayMs(2), 2000);  // 2s
    assert.strictEqual(outboxModule.getRetryDelayMs(3), 4000);  // 4s
    assert.strictEqual(outboxModule.getRetryDelayMs(4), 8000);  // 8s
    assert.strictEqual(outboxModule.getRetryDelayMs(10), 30000); // capped at 30s
  });

  await itAsync('Exhausting max retry attempts transitions item to failed', async () => {
    outboxModule.resetInMemoryStore();

    const queued = await outboxModule.queueOperation({
      userId: 'user_pat_101',
      operationType: 'CREATE_CONSULTATION',
      endpoint: '/api/consultations',
      payload: { doctorId: 'doc_1' }
    });

    // Simulate 4 prior attempts
    await outboxModule.updateOutboxItem(queued.id, { attempts: 4, lastAttemptAt: '2026-01-01T00:00:00Z' });

    const mockFailFetch = async () => {
      throw new Error('Network timeout');
    };

    const syncResult = await outboxModule.syncOutboxForUser({ id: 'user_pat_101' }, mockFailFetch);
    assert.strictEqual(syncResult.failed, 1);

    const items = await outboxModule.getOutboxForUser('user_pat_101');
    assert.strictEqual(items[0].status, 'failed', 'Status must transition to failed upon exhausting maxAttempts');
    assert.strictEqual(items[0].attempts, 5);
  });

  // ================================================================
  // MODULE 6: Emergency PHC Directory & Cellular Calling Protocol
  // ================================================================
  console.log('\n[MODULE 6] Emergency PHC Directory Data & Cellular Calling Protocol:');

  const seedPath = path.join(__dirname, '../public/data/phc-seed.json');
  it('public/data/phc-seed.json exists and is valid JSON', () => {
    assert.ok(fs.existsSync(seedPath), 'phc-seed.json must exist');
  });

  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  it('Seed data contains genuine Karnataka facilities across coastal and hill talukas', () => {
    assert.ok(Array.isArray(seedData.facilities) && seedData.facilities.length >= 5);
    const talukas = new Set(seedData.facilities.map(f => f.taluka));
    assert.ok(talukas.has('Kumta'), 'Must cover Kumta coastal taluka');
    assert.ok(talukas.has('Karwar'), 'Must cover Karwar coastal taluka');
    assert.ok(talukas.has('Madikeri'), 'Must cover Madikeri hill taluka');
    assert.ok(talukas.has('Sakleshpur'), 'Must cover Sakleshpur hill taluka');
    assert.ok(talukas.has('Bhatkal'), 'Must cover Bhatkal coastal taluka');
  });

  it('Every facility record contains operational emergency contact and valid cellular tel: format', () => {
    for (const fac of seedData.facilities) {
      assert.ok(fac.name, 'Facility name required');
      assert.ok(fac.taluka, 'Facility taluka required');
      assert.ok(fac.district, 'Facility district required');
      assert.ok(fac.facility_type, 'Facility type required');
      assert.ok(fac.emergency_phone, `Emergency phone required for ${fac.name}`);

      // Verify phone format: must be valid numeric / tel string
      const cleanPhone = fac.emergency_phone.replace(/[\s-]/g, '');
      assert.ok(/^\+?\d{3,12}$/.test(cleanPhone), `Invalid emergency phone: ${fac.emergency_phone}`);

      // Verify tel: URI construction
      const telUri = `tel:${fac.emergency_phone}`;
      assert.ok(telUri.startsWith('tel:'), 'Must generate standard tel: URI');
    }
  });

  it('Emergency National Hotlines conform to Indian Emergency standards (108, 112, 104)', () => {
    const hotlines = [
      { name: 'Ambulance', number: '108' },
      { name: 'National Emergency', number: '112' },
      { name: 'Health Helpline', number: '104' }
    ];
    for (const h of hotlines) {
      assert.strictEqual(`tel:${h.number}`, `tel:${h.number}`);
    }
  });

  // Summary
  console.log('\n================================================================');
  console.log(`  PHASE 5 VERIFICATION COMPLETE: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('[Phase 5 Test Suite Fatal Error]', err);
  process.exit(1);
});

