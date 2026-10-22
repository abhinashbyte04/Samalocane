import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  X, User, AlertTriangle, ShieldCheck, Heart, 
  Clock, MapPin, Phone, Stethoscope, FileText, ChevronRight 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function PatientDetailModal({ patient, isOpen, onClose, onFindDoctors }) {
  const router = useRouter();

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !patient) return null;

  const hasAllergies = patient.hasAllergies;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-details-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50/70 via-white to-slate-50 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full uppercase tracking-wider">
                Demo Data
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">
                ID: {patient.id}
              </span>
            </div>

            <h2 id="patient-details-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {patient.name}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base text-slate-600 font-medium">
              <span>{patient.age} years</span>
              <span>•</span>
              <span>{patient.gender}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-teal-600" />
                {patient.taluka || 'Rural Taluka'}, Karnataka
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Allergies Highlight Box */}
          <div className={`p-4 rounded-xl border-2 transition ${
            hasAllergies 
              ? 'bg-rose-50 border-rose-300 text-rose-950' 
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}>
            <div className="flex items-center gap-2">
              {hasAllergies ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <h3 className="text-base sm:text-lg font-black">
                {hasAllergies ? 'Known Drug & Substance Allergies' : 'No Known Drug Allergies'}
              </h3>
            </div>
            <p className={`mt-1.5 text-sm sm:text-base font-bold ${hasAllergies ? 'text-rose-800' : 'text-emerald-800'}`}>
              {patient.allergies || 'None reported'}
            </p>
          </div>

          {/* Primary Condition */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Primary Medical Condition / Concern
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900">
              {patient.primaryCondition}
            </p>
          </div>

          {/* Consultation History & Status */}
          <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Consultation History
              </span>
              <Badge variant={
                patient.consultationStatus?.toLowerCase().includes('completed') ? 'success' :
                patient.consultationStatus?.toLowerCase().includes('waiting') ? 'warning' :
                patient.consultationStatus?.toLowerCase().includes('progress') ? 'brand' : 'neutral'
              }>
                {patient.consultationStatus}
              </Badge>
            </div>

            <div className="space-y-1 text-sm sm:text-base text-slate-700">
              {patient.lastConsultationDoctor && (
                <p>
                  <strong>Physician:</strong> {patient.lastConsultationDoctor}
                </p>
              )}
              {patient.lastConsultationDate && (
                <p className="text-xs sm:text-sm text-slate-500">
                  Last session date: {new Date(patient.lastConsultationDate).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Grid of Other Information: Medications, Emergency Contact, Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                Active Medications
              </span>
              <p className="text-slate-800 font-medium">
                {patient.activeMedications || 'None declared'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                Contact & Emergency
              </span>
              <p className="text-slate-800 font-medium">
                Phone: {patient.phoneNumber || 'Not provided'}
              </p>
              {patient.emergencyContact && (
                <p className="text-xs sm:text-sm text-slate-600">
                  Contact: {patient.emergencyContact}
                </p>
              )}
            </div>
          </div>

          {/* Clinical Notes */}
          {patient.notes && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                Clinical Observations / Notes
              </span>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {patient.notes}
              </p>
            </div>
          )}

          {/* Prototype Storage Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs sm:text-sm text-amber-900 leading-relaxed">
            <strong>Prototype Notice:</strong> This is a fictional demonstration record. Health details are stored in local client state for testing and evaluation purposes.
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-sm sm:text-base"
          >
            Close Record
          </Button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                onClose();
                if (onFindDoctors) onFindDoctors(patient);
              }}
              className="w-full sm:w-auto px-5 py-2 text-sm sm:text-base font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Find Suitable Doctors</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

