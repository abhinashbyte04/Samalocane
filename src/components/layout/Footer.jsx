import React from 'react';
import { ShieldCheck, Wifi } from 'lucide-react';
import { Logo } from '../common/Logo';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-8 pb-12 sm:pb-16 border-t border-slate-800 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-white font-extrabold text-base">
              <Logo className="w-6 h-6 rounded-md shrink-0 shadow-xs" />
              <span className="font-serif tracking-tight text-lg">Samālōcane</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-sm">
              Lightweight Telemedicine Platform for Low-Bandwidth Coastal & Hill Talukas.
              Built on React, Next.js, and PostgreSQL with robust offline continuity and server-side RBAC.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold flex items-center gap-1.5 text-sm sm:text-base">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Medical Governance
            </h4>
            <p className="text-slate-400 leading-relaxed text-sm">
              All consulting doctors must have verifiable State Medical Council credentials verified by district health administrators.
              Doctor recommendations match specialties; the platform never independently diagnoses disease.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold flex items-center gap-1.5 text-sm sm:text-base">
              <Wifi className="w-4 h-4 text-teal-400" />
              Emergency Notice
            </h4>
            <p className="text-slate-400 leading-relaxed text-sm">
              In life-threatening situations, call 108 or 112 directly. Emergency contacts invoke native cellular telephone calls without requiring internet connectivity.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-5 text-center text-sm text-slate-400 font-medium">
          <span>© Made with love for mankind</span>
        </div>

      </div>
    </footer>
  );
}

