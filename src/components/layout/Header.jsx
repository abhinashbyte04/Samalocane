import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { PhoneCall, Search } from 'lucide-react';
import { Logo } from '../common/Logo';

export function Header() {
  const router = useRouter();

  return (
    <>
      {/* Top Demonstration Notice Bar */}
      <div className="bg-brand-900 text-brand-100 text-xs sm:text-sm py-1.5 px-4 text-center border-b border-brand-800 flex items-center justify-center gap-2 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
        <span><strong>Samālōcane</strong> — Lightweight Telemedicine for Coastal & Hill Talukas</span>
        <span className="hidden md:inline text-brand-300">|</span>
        <span className="hidden md:inline text-brand-300">Offline-First PWA • WebRTC Dynamic Fallback • Verified Physician Registry</span>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Top-Left: Logo, English Brand Name & Compact Emergency PHC */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
              
              {/* Brand Logo & Name */}
              <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0" title="Samālōcane Home">
                <Logo className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl shadow-xs group-hover:opacity-90 transition shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-900 block leading-tight font-serif">
                    Samālōcane
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-brand-700 block leading-tight">
                    Rural Telemedicine
                  </span>
                </div>
              </Link>

              {/* Clean Vertical Divider */}
              <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

              {/* Compact Emergency PHC Action */}
              <Link
                href="/emergency"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition shrink-0 active:scale-95"
                title="Emergency PHC & Hospital Directory (Direct 108/112 Calling)"
              >
                <PhoneCall className="w-4 h-4 text-white animate-pulse shrink-0" />
                <span className="hidden sm:inline">Emergency PHC</span>
                <span className="sm:hidden">PHC</span>
                <span className="bg-emergency-800 text-white text-xs font-black px-1.5 py-0.5 rounded-full shrink-0">
                  108
                </span>
              </Link>

            </div>

            {/* Right: Header Navigation (Specialist Directory) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <nav className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                <Link 
                  href="/doctors" 
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    router.pathname.startsWith('/doctors') 
                      ? 'bg-brand-50 text-brand-700' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Search Verified Medical Specialists"
                >
                  <Search className="w-4 h-4 text-brand-600" />
                  <span className="hidden sm:inline">Find Doctors</span>
                  <span className="sm:hidden">Doctors</span>
                </Link>
              </nav>
            </div>

          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
