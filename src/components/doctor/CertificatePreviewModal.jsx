import React, { useEffect } from 'react';
import { 
  X, ShieldCheck, AlertTriangle, FileText, CheckCircle2, 
  Clock, Award, Building2, Stamp, ExternalLink, ShieldAlert
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function CertificatePreviewModal({ certificate, doctorName, isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !certificate) return null;

  const isVerified = certificate.status === 'Verified';
  const isPending = certificate.status === 'Pending Verification';
  const isNotVerified = certificate.status === 'Not Verified';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full uppercase tracking-wider">
              Demo Document
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Medical Credential Certificate
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Visual Presentation */}
        <div className="p-6 sm:p-8 bg-amber-50/20 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* Certificate Paper Frame */}
          <div className="relative bg-white border-4 border-double border-slate-300 rounded-xl p-6 sm:p-8 shadow-inner space-y-6 text-center overflow-hidden">
            
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5 rotate-[-25deg]">
              <span className="text-4xl sm:text-6xl font-black uppercase text-slate-900 tracking-widest text-center">
                DEMO DATA • PROTOTYPE SAMPLE
              </span>
            </div>

            {/* Certificate Header */}
            <div className="space-y-2 border-b-2 border-slate-200 pb-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500">
                {certificate.authority || 'State Medical Council'}
              </p>
              <h2 id="cert-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {certificate.title}
              </h2>
              <p className="text-xs font-mono font-bold text-slate-500">
                Document Type: {certificate.document_type || 'Accreditation Credential'}
              </p>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 py-2 text-slate-800">
              <p className="text-sm sm:text-base text-slate-600">
                This is to certify that fictional medical practitioner:
              </p>

              <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 underline decoration-teal-500 decoration-2 underline-offset-4">
                {doctorName}
              </div>

              <div className="max-w-md mx-auto p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Registration Ref:</span>
                  <span className="font-mono font-bold text-slate-900">{certificate.reg_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Issuing Authority:</span>
                  <span className="font-medium text-slate-900">{certificate.authority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Date of Registration:</span>
                  <span className="font-medium text-slate-900">{certificate.date_issued}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Validity:</span>
                  <span className="font-medium text-slate-900">{certificate.valid_until}</span>
                </div>
              </div>
            </div>

            {/* Seal & Status Block */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-0.5">
                <span className="text-xs text-slate-400 uppercase font-semibold">Authorized Signatory</span>
                <p className="font-serif italic text-sm font-bold text-slate-800">
                  {certificate.issuer_signature || 'Registrar'}
                </p>
              </div>

              {/* Status Stamp */}
              <div className="flex items-center gap-2">
                {isVerified && (
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 flex items-center gap-2 shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div className="text-left">
                      <div className="text-xs font-black uppercase tracking-wider">Verified Credential</div>
                      <div className="text-xs text-emerald-700">Prototype Demo Status</div>
                    </div>
                  </div>
                )}
                {isPending && (
                  <div className="px-4 py-2 rounded-xl bg-amber-50 border-2 border-amber-500 text-amber-900 flex items-center gap-2 shadow-xs">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <div className="text-left">
                      <div className="text-xs font-black uppercase tracking-wider">Pending Verification</div>
                      <div className="text-xs text-amber-700">Under Review</div>
                    </div>
                  </div>
                )}
                {isNotVerified && (
                  <div className="px-4 py-2 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-900 flex items-center gap-2 shadow-xs">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <div className="text-left">
                      <div className="text-xs font-black uppercase tracking-wider">Not Verified</div>
                      <div className="text-xs text-rose-700">Unconfirmed Sample</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Prototype Compliance Warning */}
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs sm:text-sm text-amber-950 space-y-1 leading-relaxed">
            <p className="font-extrabold flex items-center gap-1.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Prototype Disclaimer & Non-Authenticity Notice</span>
            </p>
            <p>
              This certificate is a simulated demonstration document designed for UI testing of the Samālōcane telemedicine system. Medical registration numbers are fictional and sample certificates are strictly demo data. No claim of authentic government accreditation is made.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="px-5 py-2 text-sm sm:text-base font-semibold"
          >
            Close Preview
          </Button>
        </div>

      </div>
    </div>
  );
}

