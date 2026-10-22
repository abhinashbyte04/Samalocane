/**
 * Samālōcane — Offline IndexedDB Outbox Engine (Phase 5)
 * 
 * Provides resilient, privacy-conscious offline storage and synchronization
 * for consultation requests and health profile updates during cellular blackouts
 * in rural coastal and hill talukas.
 * 
 * Features:
 * - Structured object store 'outbox' with status lifecycle:
 *   pending -> syncing -> synced | failed | needs_review
 * - Strict User Isolation: Outbox operations are strictly bound to authenticated userId.
 * - Idempotency: Uses clientMutationId to prevent duplicate server submissions.
 * - Exponential backoff retry logic.
 * - Supports both native browser IndexedDB and in-memory mock store for Node.js test suites.
 */

const DB_NAME = 'samalocane_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'outbox';
const MAX_ATTEMPTS = 5;

// Configurable IDB factory for cross-environment testing
let customIdbFactory = null;

export function setIdbFactory(factory) {
  customIdbFactory = factory;
}

function getIdbFactory() {
  if (customIdbFactory) return customIdbFactory;
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB;
  }
  return null;
}

// In-Memory store fallback for environments without IndexedDB (e.g. Node tests without mock)
const inMemoryOutbox = new Map();

/**
 * Open or initialize IndexedDB
 */
export function openOutboxDB() {
  const idb = getIdbFactory();
  if (!idb) {
    // Return a mock DB handle backed by inMemoryOutbox
    return Promise.resolve({ isMemoryMock: true });
  }

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_userId', 'userId', { unique: false });
        store.createIndex('by_status', 'status', { unique: false });
        store.createIndex('by_createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate unique mutation ID for idempotency
 */
export function generateMutationId() {
  const rand = Math.random().toString(36).substring(2, 9);
  return `mut_${Date.now()}_${rand}`;
}

/**
 * Queue an operation in the outbox
 * 
 * @param {Object} params
 * @param {string} params.userId - Authenticated user identifier (mandatory)
 * @param {string} params.operationType - 'CREATE_CONSULTATION' | 'UPDATE_HEALTH_PROFILE'
 * @param {string} params.endpoint - Target API URL (e.g. '/api/consultations')
 * @param {string} params.method - 'POST' | 'PUT'
 * @param {Object} params.payload - Request payload
 * @returns {Promise<Object>} Created outbox record
 */
export async function queueOperation({ userId, operationType, endpoint, method = 'POST', payload }) {
  if (!userId) {
    throw new Error('User isolation violation: userId is required to queue an outbox operation.');
  }
  if (!operationType || !['CREATE_CONSULTATION', 'UPDATE_HEALTH_PROFILE'].includes(operationType)) {
    throw new Error(`Invalid operationType: ${operationType}`);
  }
  if (!endpoint || !payload) {
    throw new Error('Endpoint and payload are required.');
  }

  const clientMutationId = generateMutationId();
  const record = {
    id: `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    clientMutationId,
    userId: String(userId),
    operationType,
    endpoint,
    method: method.toUpperCase(),
    payload,
    status: 'pending', // 'pending' | 'syncing' | 'synced' | 'failed' | 'needs_review'
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    lastAttemptAt: null,
    error: null,
    createdAt: new Date().toISOString(),
    syncedAt: null,
    serverResponse: null
  };

  const db = await openOutboxDB();
  if (db.isMemoryMock) {
    inMemoryOutbox.set(record.id, { ...record });
    return record;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(record);

    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all outbox items for a specific user (enforcing isolation)
 * 
 * @param {string} userId
 * @param {string} [statusFilter] Optional status filter
 * @returns {Promise<Array>}
 */
export async function getOutboxForUser(userId, statusFilter = null) {
  if (!userId) return [];
  const uid = String(userId);

  const db = await openOutboxDB();
  if (db.isMemoryMock) {
    const items = Array.from(inMemoryOutbox.values())
      .filter(item => item.userId === uid && (!statusFilter || item.status === statusFilter))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return items;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('by_userId');
    const req = index.getAll(uid);

    req.onsuccess = () => {
      let results = req.result || [];
      if (statusFilter) {
        results = results.filter(r => r.status === statusFilter);
      }
      results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Update an existing outbox item
 */
export async function updateOutboxItem(id, updates) {
  const db = await openOutboxDB();
  if (db.isMemoryMock) {
    const item = inMemoryOutbox.get(id);
    if (!item) return null;
    const updated = { ...item, ...updates };
    inMemoryOutbox.set(id, updated);
    return updated;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (!item) {
        resolve(null);
        return;
      }
      const updated = { ...item, ...updates };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Delete an outbox item (e.g. user cancels a queued consultation request)
 */
export async function deleteOutboxItem(id, userId) {
  const db = await openOutboxDB();
  if (db.isMemoryMock) {
    const item = inMemoryOutbox.get(id);
    if (!item || (userId && item.userId !== String(userId))) return false;
    inMemoryOutbox.delete(id);
    return true;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (!item) {
        resolve(false);
        return;
      }
      if (userId && item.userId !== String(userId)) {
        reject(new Error('Permission denied: cannot delete another user\'s outbox item.'));
        return;
      }
      const delReq = store.delete(id);
      delReq.onsuccess = () => resolve(true);
      delReq.onerror = () => reject(delReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Clear synced items for a specific user to free local storage
 */
export async function clearSyncedItems(userId) {
  if (!userId) return 0;
  const items = await getOutboxForUser(userId, 'synced');
  let count = 0;
  for (const item of items) {
    await deleteOutboxItem(item.id, userId);
    count++;
  }
  return count;
}

/**
 * Clear all in-memory mock items (useful between test runs)
 */
export function resetInMemoryStore() {
  inMemoryOutbox.clear();
}

/**
 * Calculate exponential backoff delay in milliseconds
 */
export function getRetryDelayMs(attempts) {
  // 1s, 2s, 4s, 8s, 16s... capped at 30s
  return Math.min(1000 * Math.pow(2, attempts - 1), 30000);
}

/**
 * Synchronize the outbox for the currently authenticated user
 * 
 * Enforces:
 * - Isolation: Only processes records where record.userId === currentUser.id.
 * - Idempotency: Supplies clientMutationId in headers/payload so server knows not to duplicate.
 * - Resiliency: Distinguishes between retryable network errors (remains pending/syncing)
 *   and fatal validation errors (transitions to failed or needs_review).
 * 
 * @param {Object} currentUser - Active session user { id, email, role }
 * @param {Function} [customFetch] - Optional custom fetch for node/testing
 * @returns {Promise<Object>} Summary { total, synced, failed, remaining }
 */
export async function syncOutboxForUser(currentUser, customFetch = null) {
  if (!currentUser || !currentUser.id) {
    return { error: 'No authenticated user. Synchronization aborted.' };
  }

  const userId = String(currentUser.id);
  const pendingItems = await getOutboxForUser(userId, 'pending');

  const fetcher = customFetch || (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetcher) {
    throw new Error('No fetch implementation available for outbox sync.');
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of pendingItems) {
    // Double-check isolation
    if (item.userId !== userId) {
      continue; // Skip items belonging to another user
    }

    // Check backoff timestamp
    if (item.lastAttemptAt && item.attempts > 0) {
      const delayNeeded = getRetryDelayMs(item.attempts);
      const elapsed = Date.now() - new Date(item.lastAttemptAt).getTime();
      if (elapsed < delayNeeded) {
        // Still in backoff window, skip for now
        continue;
      }
    }

    // Transition to syncing
    await updateOutboxItem(item.id, {
      status: 'syncing',
      attempts: item.attempts + 1,
      lastAttemptAt: new Date().toISOString()
    });

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Client-Mutation-ID': item.clientMutationId
      };

      const response = await fetcher(item.endpoint, {
        method: item.method,
        headers,
        body: JSON.stringify({
          ...item.payload,
          clientMutationId: item.clientMutationId
        })
      });

      let resData = null;
      try {
        resData = await response.json();
      } catch (_) {
        resData = { status: response.status, statusText: response.statusText };
      }

      if (response.ok) {
        // Successful synchronization
        await updateOutboxItem(item.id, {
          status: 'synced',
          syncedAt: new Date().toISOString(),
          serverResponse: resData,
          error: null
        });
        syncedCount++;
      } else if (response.status >= 400 && response.status < 500) {
        // Client validation error — permanent failure, do not retry blindly
        await updateOutboxItem(item.id, {
          status: 'failed',
          error: resData?.message || `Client Error (${response.status})`
        });
        failedCount++;
      } else {
        // Server 5xx error or unexpected status code
        const isExhausted = (item.attempts + 1) >= item.maxAttempts;
        await updateOutboxItem(item.id, {
          status: isExhausted ? 'failed' : 'pending',
          error: resData?.message || `Server Error (${response.status})`
        });
        if (isExhausted) failedCount++;
      }
    } catch (networkErr) {
      // Network disconnect / offline
      const isExhausted = (item.attempts + 1) >= item.maxAttempts;
      await updateOutboxItem(item.id, {
        status: isExhausted ? 'failed' : 'pending',
        error: networkErr.message || 'Network unreachable'
      });
      if (isExhausted) failedCount++;
    }
  }

  const remaining = await getOutboxForUser(userId, 'pending');

  return {
    totalEvaluated: pendingItems.length,
    synced: syncedCount,
    failed: failedCount,
    remainingPending: remaining.length
  };
}

