import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { User, Stethoscope, ShieldCheck, Heart, ArrowLeft } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function PortalLayout({ children, portalName, requiredRole, icon: Icon = User, actions }) {
  const router = useRouter();

  const roleColors = {
    patient: 'brand',
    doctor: 'success',
    admin: 'danger'
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Portal Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-teal-700 flex items-center gap-1 transition">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <span className="text-slate-300">•</span>
            <Badge variant={roleColors[requiredRole] || 'neutral'}>
              {requiredRole.toUpperCase()} PORTAL
            </Badge>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Icon className="w-7 h-7 text-teal-600" />
              <span>{portalName}</span>
            </h1>
            {actions && (
              <div className="flex items-center">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Portal Breadcrumbs / Links */}
        <div className="flex items-center gap-2 text-sm font-semibold">
          {requiredRole === 'patient' && (
            <>
              <Link href="/patient" className={`px-3.5 py-1.5 rounded-lg transition ${router.pathname === '/patient' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                Dashboard
              </Link>
              <Link href="/patient/profile" className={`px-3.5 py-1.5 rounded-lg transition ${router.pathname === '/patient/profile' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                Health Record
              </Link>
            </>
          )}

          {requiredRole === 'doctor' && (
            <>
              <Link href="/doctor" className={`px-3.5 py-1.5 rounded-lg transition ${router.pathname === '/doctor' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                Consultation Queue
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}

