/**
 * Samālōcane Progressive Web App Service Worker
 * Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas
 *
 * Cache Strategy:
 * 1. App Shell & Static Assets: Stale-While-Revalidate
 * 2. Public PHC Directory (/api/phc, /data/phc-seed.json): Network-First with Cache Fallback
 * 3. STRICT PRIVACY: Authenticated API routes (/api/auth/*, /api/patient/*, /api/consultations/*, /api/admin/*)
 *    are NEVER cached in CacheStorage to prevent cross-user leakage on shared rural devices.
 */

const CACHE_VERSION = 'samalocane-v2026.10.1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PHC_CACHE = `phc-${CACHE_VERSION}`;

// Pre-cached Public Assets & Offline App Shell
const PRECACHE_ASSETS = [
  '/',
  '/emergency',
  '/manifest.json',
  '/data/phc-seed.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Sensitive or User-Specific URL Patterns (NEVER CACHE)
const PRIVATE_PATTERNS = [
  /\/api\/auth(\/|$)/,
  /\/api\/patient(\/|$)/,
  /\/api\/consultations(\/|$)/,
  /\/api\/admin(\/|$)/,
  /\/consultation\/room(\/|$)/,
  /\/consultation\/waiting(\/|$)/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some pre-cache assets could not be loaded immediately:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name.startsWith('samalocane-') || name.startsWith('static-') || name.startsWith('phc-')) {
            if (name !== STATIC_CACHE && name !== PHC_CACHE) {
              console.log('[ServiceWorker] Purging legacy cache:', name);
              return caches.delete(name);
            }
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Non-GET requests (POST, PUT, DELETE): Always Network-Only
  if (req.method !== 'GET') {
    return;
  }

  // 2. Strict Privacy Guard: Never cache authenticated user routes or health records
  const isPrivate = PRIVATE_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isPrivate) {
    // Pass directly to network without caching
    return;
  }

  // 3. Public PHC Directory API (/api/phc or /data/phc-seed.json): Network-First with Cache Fallback
  if (url.pathname === '/api/phc' || url.pathname === '/data/phc-seed.json') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(PHC_CACHE).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          // Network failed: Serve cached PHC directory
          const cached = await caches.match(req);
          if (cached) {
            return cached;
          }
          // Secondary fallback to static seed file
          const staticSeed = await caches.match('/data/phc-seed.json');
          if (staticSeed) {
            return staticSeed;
          }
          return new Response(JSON.stringify({ facilities: [], offline: true, error: 'No cached directory available' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 4. Static Assets & App Shell: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/' ||
    url.pathname === '/emergency'
  ) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        const fetchPromise = fetch(req).then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        }).catch(() => {
          // Return cached if fetch fails
          return cachedRes;
        });

        return cachedRes || fetchPromise;
      })
    );
    return;
  }
});
