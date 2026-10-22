import '../styles/globals.css';
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { BottomNav } from '../components/layout/BottomNav';
import { OfflineOutboxDrawer } from '../components/common/OfflineOutboxDrawer';
import { getOutboxForUser, syncOutboxForUser } from '../lib/indexedDbOutbox';
import { WifiOff, PhoneCall, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';

const DEFAULT_USER = {
  id: 'usr-pat-01',
  email: 'patient.demo@samalocane.in',
  full_name: 'Smt. Parvathi',
  role: 'patient'
};

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);
  const [currentUser, setCurrentUser] = useState(DEFAULT_USER);
  const [pendingOutboxCount, setPendingOutboxCount] = useState(0);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  // 1. Check user session
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          return data.user;
        }
      }
    } catch (_) {
      // Offline or network error
    }
    setCurrentUser(DEFAULT_USER);
    return DEFAULT_USER;
  }, []);

  // 2. Refresh pending outbox counter
  const refreshOutboxCount = useCallback(async (user) => {
    const targetUser = user || currentUser;
    if (!targetUser?.id) {
      setPendingOutboxCount(0);
      return;
    }
    try {
      const items = await getOutboxForUser(targetUser.id, 'pending');
      setPendingOutboxCount(items.length);
    } catch (_) {}
  }, [currentUser]);

  // 3. Register Service Worker and attach connectivity listeners
  useEffect(() => {
    // Initial online status check
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);

      // Register Service Worker
      if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then(reg => {
              console.log('[Samālōcane SW] Registered successfully with scope:', reg.scope);
            })
            .catch(err => {
              console.warn('[Samālōcane SW] Registration failed:', err);
            });
        });
      }

      // Online / Offline event listeners
      const handleOnline = async () => {
        setIsOffline(false);
        setJustReconnected(true);
        setTimeout(() => setJustReconnected(false), 5000);

        // Foreground auto-sync when network returns
        if (currentUser?.id) {
          try {
            await syncOutboxForUser(currentUser);
            await refreshOutboxCount(currentUser);
          } catch (e) {
            console.error('[Foreground Sync Error]', e);
          }
        }
      };

      const handleOffline = () => {
        setIsOffline(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [currentUser, refreshOutboxCount]);

  // 4. Update session and outbox on path change
  useEffect(() => {
    checkSession().then(user => {
      if (user) refreshOutboxCount(user);
    });
  }, [router.asPath, checkSession, refreshOutboxCount]);

  return (
    <>
      <Head>
        <title>Samālōcane — Low-Bandwidth Telemedicine for Coastal & Hill Talukas</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#0d9488" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </Head>

      {/* Global Sticky Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-bold shadow-md sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-amber-600">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-slate-950 animate-pulse" />
            <span>
              <strong>Offline Mode:</strong> Cellular data disconnected. Outbox requests will be queued locally.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pendingOutboxCount > 0 && (
              <button
                onClick={() => setIsOutboxOpen(true)}
                className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1"
              >
                <CloudOff className="w-3.5 h-3.5" />
                <span>Outbox ({pendingOutboxCount})</span>
              </button>
            )}

            <Link
              href="/emergency"
              className="px-2.5 py-1 bg-rose-700 text-white rounded-lg text-xs font-black hover:bg-rose-800 transition flex items-center gap-1 shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Emergency Calling (108)</span>
            </Link>
          </div>
        </div>
      )}

      {/* Reconnected Banner */}
      {justReconnected && !isOffline && (
        <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-bold shadow sticky top-0 z-50 flex items-center justify-between transition animate-in fade-in">
          <span>✓ Cellular connection restored. Background synchronizer active.</span>
          <button 
            onClick={() => setJustReconnected(false)}
            className="text-white/80 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 pb-16 sm:pb-20">
        <Header />
        <main className="flex-1 pb-6">
          <Component 
            {...pageProps} 
            isOffline={isOffline}
            currentUser={currentUser}
            onOutboxChanged={() => refreshOutboxCount(currentUser)}
          />
        </main>
        <Footer />
        
        {/* Bottom Primary Navigation: Patient, Doctor, Outbox */}
        <BottomNav 
          onOpenOutbox={() => setIsOutboxOpen(true)}
          pendingOutboxCount={pendingOutboxCount}
          isOutboxOpen={isOutboxOpen}
        />
      </div>

      {/* Offline Outbox Modal / Drawer */}
      <OfflineOutboxDrawer
        isOpen={isOutboxOpen}
        onClose={() => {
          setIsOutboxOpen(false);
          refreshOutboxCount(currentUser);
        }}
        currentUser={currentUser}
      />
    </>
  );
}
