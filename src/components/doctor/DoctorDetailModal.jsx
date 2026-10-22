import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  X, Stethoscope, ShieldCheck, Clock, Award, Building2, 
  Languages, Video, PhoneCall, MessageSquare, Star, 
  Calendar, CheckCircle2, AlertTriangle, FileText, 
  ExternalLink, ChevronRight, User, ShieldAlert
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CertificatePreviewModal } from './CertificatePreviewModal';

export function DoctorDetailModal({ doctor, isOpen, onClose, patient = null }) {
  const router = useRouter();
  const [activeCertificate, setActiveCertificate] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !activeCertificate) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeCertificate]);

  if (!isOpen || !doctor) return null;

  const isVerified = doctor.verification_status === 'Verified';
  const isPending = doctor.verification_status === 'Pending Verification';
  const isNotVerified = doctor.verification_status === 'Not Verified';

  const avatarColorMap = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    zinc: 'bg-zinc-50 text-zinc-700 border-zinc-200'
  };

  const avatarClasses = avatarColorMap[doctor.avatar_color] || avatarColorMap.teal;

  const handleStartConsultation = () => {
    onClose();
    const targetId = doctor.doctor_user_id || doctor.id;
    if (patient) {
      router.push({
        pathname: `/consultation/request/${targetId}`,
        query: {
          patientId: patient.id,
          patientName: patient.name,
          patientAge: patient.age,
          patientGender: patient.gender,
          patientTaluka: patient.taluka,
          chiefComplaint: patient.primaryCondition,
          allergies: patient.allergies,
          symptoms: patient.notes || ''
        }
      });
    } else {
      router.push(`/consultation/request/${targetId}`);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-profile-title"
      >
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50/70 via-white to-slate-50 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-black text-xl shrink-0 shadow-xs ${avatarClasses}`}>
                {doctor.avatar_initials || 'DR'}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full uppercase tracking-wider">
                    Demo Practitioner
                  </span>
                  <Badge variant={doctor.is_available ? 'success' : 'neutral'}>
                    ● {doctor.is_available ? 'Online for Tele-Triage' : 'Currently Offline'}
                  </Badge>
                </div>

                <h2 id="doctor-profile-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {doctor.full_name}
                </h2>

                <p className="text-sm sm:text-base font-bold text-teal-700">
                  {doctor.title || doctor.specialty_name}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {doctor.qualification} • {doctor.experience_years} years clinical experience
                </p>
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
          <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800 text-sm sm:text-base">
            
            {/* Verification Status Highlight Bar */}
            <div className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isVerified 
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                : isPending 
                ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
                : 'bg-rose-50/80 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-start gap-2.5">
                {isVerified ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : isPending ? (
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-extrabold text-base">
                    {isVerified 
                      ? 'State Medical Council Accreditation Verified (Demo)' 
                      : isPending 
                      ? 'Credential Application Pending Administrative Verification' 
                      : 'Unverified Practitioner Profile (Demo Test)'}
                  </div>
                  <div className="text-xs sm:text-sm opacity-90">
                    Registration Authority: <strong>{doctor.council_name}</strong> • Reg No: <strong className="font-mono">{doctor.council_registration_number}</strong>
                  </div>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 border ${
                isVerified 
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400' 
                  : isPending 
                  ? 'bg-amber-100 text-amber-900 border-amber-400' 
                  : 'bg-rose-100 text-rose-900 border-rose-400'
              }`}>
                {doctor.verification_status}
              </span>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Consultation Fee</span>
                <p className="text-base font-extrabold text-slate-900">
                  {doctor.consultation_fee === 0 ? 'Free (Subsidized)' : `₹${doctor.consultation_fee}`}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Experience</span>
                <p className="text-base font-extrabold text-slate-900">
                  {doctor.experience_years} Years
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Supported Modes</span>
                <p className="text-xs sm:text-sm font-bold text-slate-800 capitalize">
                  {doctor.consultation_modes ? doctor.consultation_modes.join(', ') : 'Audio, Video'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Patient Rating</span>
                <p className="text-base font-extrabold text-amber-600 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{doctor.rating || 4.9}</span>
                  <span className="text-xs text-slate-500 font-normal">({doctor.review_count || 120})</span>
                </p>
              </div>
            </div>

            {/* Educational Qualifications & Institutions */}
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-600" />
                <span>Educational Qualifications & Institutions</span>
              </h3>
              <div className="space-y-2">
                {doctor.education && doctor.education.length > 0 ? (
                  doctor.education.map((edu, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <p className="font-bold text-slate-900 text-sm sm:text-base">{edu.degree}</p>
                        <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{edu.institution}</span>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full shrink-0">
                        Class of {edu.year}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">{doctor.qualification}</p>
                )}
              </div>
            </div>

            {/* Specialization & Clinical Interests */}
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>Specialization & Areas of Clinical Interest</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {doctor.clinical_interests && doctor.clinical_interests.map((interest, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold"
                  >
                    • {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages Spoken & Hospital Affiliation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-slate-400" />
                  Languages Spoken
                </span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">
                  {doctor.languages_spoken ? doctor.languages_spoken.join(', ') : 'Kannada, English'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Hospital Affiliation
                </span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">
                  {doctor.hospital_affiliation || 'Taluka Hospital Telemedicine Panel'}
                </p>
              </div>
            </div>

            {/* Biography & Consultation Approach */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Professional Biography
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {doctor.bio}
                </p>
              </div>

              {doctor.consultation_approach && (
                <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1">
                  <span className="text-xs font-extrabold uppercase text-teal-800 tracking-wider">
                    Clinical Consultation Approach
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {doctor.consultation_approach}
                  </p>
                </div>
              )}
            </div>

            {/* Consultation Availability Schedule */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Consultation Availability & Schedule</span>
              </h3>
              <div className="space-y-2">
                {doctor.schedule && doctor.schedule.map((slot, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                    <span className="font-bold text-slate-800">{slot.days}</span>
                    <span className="font-mono text-teal-800 font-bold">{slot.timing}</span>
                    <span className="text-xs text-slate-500 font-semibold uppercase">{slot.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CREDENTIALS & CERTIFICATION VERIFICATION SECTION (REQUIREMENT C) */}
            {/* ===================================================================== */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <span>Credentials & Certificate Verification</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspected medical certificates and state registration credentials (Demo Data).
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  Demo Credentials
                </span>
              </div>

              <div className="space-y-2.5">
                {doctor.certificates && doctor.certificates.length > 0 ? (
                  doctor.certificates.map((cert) => (
                    <div 
                      key={cert.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-300 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                            {cert.title}
                          </h4>
                          <Badge variant={
                            cert.status === 'Verified' ? 'success' :
                            cert.status === 'Pending Verification' ? 'warning' : 'danger'
                          }>
                            {cert.status}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600">
                          Authority: <strong>{cert.authority}</strong> • Ref: <span className="font-mono font-bold text-slate-800">{cert.reg_number}</span>
                        </p>

                        <p className="text-xs text-slate-500">
                          Issued: {cert.date_issued} • Validity: {cert.valid_until}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActiveCertificate(cert)}
                        className="shrink-0 text-xs font-bold text-teal-800 border-teal-200 hover:bg-teal-50 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span>Preview Certificate</span>
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No certificates available for this profile.</p>
                )}
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm sm:text-base font-semibold"
            >
              Close
            </Button>

            <Button
              type="button"
              variant="primary"
              disabled={!doctor.is_available && isNotVerified}
              onClick={handleStartConsultation}
              className="w-full sm:w-auto px-6 py-2.5 text-sm sm:text-base font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center gap-2 shadow-xs"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Connect with {doctor.full_name}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

        </div>
      </div>

      {/* Embedded Certificate Preview Modal */}
      {activeCertificate && (
        <CertificatePreviewModal
          certificate={activeCertificate}
          doctorName={doctor.full_name}
          isOpen={!!activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}
    </>
  );
}

