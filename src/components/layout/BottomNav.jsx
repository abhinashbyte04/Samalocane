import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { User, Stethoscope, CloudOff } from 'lucide-react';

/**
 * Bottom Navigation Bar
 * Houses Patient, Doctor, and Outbox in consistent, compact, touch-friendly tabs.
 */
export function BottomNav({ onOpenOutbox, pendingOutboxCount = 0, isOutboxOpen = false }) {
  const router = useRouter();

  const isPatientActive = router.pathname.startsWith('/patient');
  const isDoctorActive = router.pathname.startsWith('/doctor') && !router.pathname.startsWith('/doctors');
  const isOutboxActive = isOutboxOpen;

  return (
    <nav 
      aria-label="Bottom Primary Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md sm:max-w-lg mx-auto px-4 h-16 flex items-center justify-around gap-2">
        
        {/* 1. Patient */}
        <Link
          href="/patient"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition duration-150 group relative ${
            isPatientActive 
              ? 'text-brand-700 bg-brand-50 font-bold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
          aria-current={isPatientActive ? 'page' : undefined}
          title="Patient Portal & Health Record"
        >
          <div className="relative flex items-center justify-center">
            <User className={`w-5 h-5 transition ${isPatientActive ? 'text-brand-600 scale-105' : 'text-slate-500 group-hover:text-slate-700'}`} />
            {isPatientActive && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-semibold mt-1 tracking-tight">Patient</span>
        </Link>

        {/* 2. Doctor */}
        <Link
          href="/doctor"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition duration-150 group relative ${
            isDoctorActive 
              ? 'text-brand-700 bg-brand-50 font-bold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
          aria-current={isDoctorActive ? 'page' : undefined}
          title="Physician Clinical Workspace & Queue"
        >
          <div className="relative flex items-center justify-center">
            <Stethoscope className={`w-5 h-5 transition ${isDoctorActive ? 'text-brand-600 scale-105' : 'text-slate-500 group-hover:text-slate-700'}`} />
            {isDoctorActive && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-semibold mt-1 tracking-tight">Doctor</span>
        </Link>

        {/* 3. Outbox */}
        <button
          type="button"
          onClick={onOpenOutbox}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition duration-150 group relative ${
            isOutboxActive 
              ? 'text-brand-700 bg-brand-50 font-bold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
          aria-label={`Open Offline Outbox${pendingOutboxCount > 0 ? `, ${pendingOutboxCount} pending items` : ''}`}
          title="Offline Outbox & Mutation Queue"
        >
          <div className="relative flex items-center justify-center">
            <CloudOff className={`w-5 h-5 transition ${
              pendingOutboxCount > 0 
                ? 'text-amber-600 animate-pulse' 
                : isOutboxActive 
                ? 'text-brand-600 scale-105' 
                : 'text-slate-500 group-hover:text-slate-700'
            }`} />
            {pendingOutboxCount > 0 && (
              <span className="absolute -top-1.5 -right-3 px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-xs font-black shadow-xs">
                {pendingOutboxCount}
              </span>
            )}
            {isOutboxActive && pendingOutboxCount === 0 && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-semibold mt-1 tracking-tight">Outbox</span>
        </button>

      </div>
    </nav>
  );
}

export default BottomNav;

