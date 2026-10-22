import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { 
  Stethoscope, ShieldCheck, ArrowLeft, PhoneCall, 
  Video, MessageSquare, Clock, Globe, Star, 
  Building2, Calendar, Languages, Award, 
  FileText, ShieldAlert, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { INITIAL_DEMO_DOCTORS } from '../../data/dummyDoctors';
import { CertificatePreviewModal } from '../../components/doctor/CertificatePreviewModal';

export default function DoctorDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCertificate, setActiveCertificate] = useState(null);

  useEffect(() => {
    if (!id) return;

    // First check rich local demo doctor dataset
    const localMatch = INITIAL_DEMO_DOCTORS.find(d => d.id === id || d.doctor_user_id === id);

    fetch(`/api/doctors/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Doctor profile not found');
        return res.json();
      })
      .then(data => {
        // Merge API data with rich credentials from dummyDoctors
        if (localMatch) {
          setDoctor({
            ...localMatch,
            ...data.doctor,
            education: localMatch.education || data.doctor.education,
            clinical_interests: localMatch.clinical_interests || data.doctor.clinical_interests,
            schedule: localMatch.schedule || data.doctor.schedule,
            certificates: localMatch.certificates || data.doctor.certificates,
            consultation_approach: localMatch.consultation_approach || data.doctor.consultation_approach,
            title: localMatch.title || data.doctor.title || data.doctor.specialty_name
          });
        } else {
          setDoctor(data.doctor);
        }
      })
      .catch(err => {
        if (localMatch) {
          setDoctor(localMatch);
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500 font-bold animate-pulse flex flex-col items-center justify-center space-y-2">
        <Stethoscope className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm text-slate-600 font-semibold">Loading practitioner credentials & verified documents...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <Alert type="danger">{error || 'Doctor not found.'}</Alert>
        <Link href="/doctors" className="inline-flex text-sm font-bold text-teal-700 hover:underline">
          ← Back to Doctor Directory
        </Link>
      </div>
    );
  }

  const initials = doctor.avatar_initials || (doctor.full_name
    ? doctor.full_name.replace('Dr. ', '').split(' ').map(n => n[0]).slice(0, 2).join('')
    : 'DR');

  const isVerified = doctor.verification_status === 'Verified' || doctor.is_verified;
  const isPending = doctor.verification_status === 'Pending Verification';
  const isNotVerified = doctor.verification_status === 'Not Verified';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Back to directory button */}
      <Link href="/doctors" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Doctor Directory</span>
      </Link>

      <Card className="space-y-6 shadow-sm border-slate-200">
        
        {/* ========================================================================= */}
        {/* 1. FULL NAME, PROFESSIONAL TITLE, AND AVATAR */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full uppercase tracking-wider">
                  Demo Profile
                </span>
                <Badge variant={doctor.is_available ? 'success' : 'neutral'}>
                  ● {doctor.is_available ? 'Online for Tele-Triage' : 'Currently Offline'}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{doctor.full_name}</h1>
              <p className="text-sm sm:text-base font-bold text-teal-700">
                {doctor.title || doctor.specialty_name}
              </p>

              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {doctor.qualification} • <strong>{doctor.experience_years} years</strong> clinical practice
              </p>

              {doctor.hospital_affiliation && (
                <p className="text-xs sm:text-sm text-slate-700 flex items-center gap-1.5 pt-0.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Hospital: <strong className="text-slate-900">{doctor.hospital_affiliation}</strong></span>
                </p>
              )}
            </div>
          </div>

          {/* 10. Clear Connect with Doctor Button */}
          <Button
            size="md"
            variant="primary"
            disabled={!doctor.is_available && isNotVerified}
            onClick={() => {
              const targetId = doctor.doctor_user_id || doctor.id;
              router.push({
                pathname: `/consultation/request/${targetId}`,
                query: {
                  ...(router.query.patientId && { patientId: router.query.patientId }),
                  ...(router.query.patientName && { patientName: router.query.patientName }),
                  ...(router.query.patientAge && { patientAge: router.query.patientAge }),
                  ...(router.query.patientGender && { patientGender: router.query.patientGender }),
                  ...(router.query.patientTaluka && { patientTaluka: router.query.patientTaluka }),
                  ...(router.query.chiefComplaint && { chiefComplaint: router.query.chiefComplaint }),
                  ...(router.query.allergies && { allergies: router.query.allergies }),
                  ...(router.query.symptoms && { symptoms: router.query.symptoms })
                }
              });
            }}
            className="shrink-0 bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Connect with Doctor</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* 6. MEDICAL REGISTRATION DETAILS & VERIFICATION STATUS */}
        {/* ========================================================================= */}
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
                Registration Authority: <strong>{doctor.council_name}</strong> • Number: <strong className="font-mono">{doctor.council_registration_number}</strong>
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
            {doctor.verification_status || (doctor.is_verified ? 'Verified' : 'Pending Verification')}
          </span>
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-xs">
              Consultation Fee
            </span>
            <div className="text-base sm:text-lg font-extrabold text-slate-900">
              {doctor.consultation_fee === 0 ? 'Free (Subsidized)' : `₹${doctor.consultation_fee}`}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-xs">
              Clinical Experience
            </span>
            <div className="text-base sm:text-lg font-extrabold text-slate-900">
              {doctor.experience_years} Years
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-xs">
              Supported Modes
            </span>
            <div className="font-bold text-slate-800 capitalize text-xs sm:text-sm">
              {doctor.consultation_modes ? doctor.consultation_modes.join(', ') : 'Audio, Video'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-xs">
              Patient Rating
            </span>
            <div className="text-base sm:text-lg font-extrabold text-amber-600 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{doctor.rating || 4.9}</span>
              <span className="text-xs text-slate-500 font-normal">({doctor.review_count || 120})</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. EDUCATIONAL QUALIFICATIONS AND INSTITUTIONS */}
        {/* ========================================================================= */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-teal-600" />
            <span>Educational Qualifications & Institutions</span>
          </h3>
          <div className="space-y-2">
            {doctor.education && doctor.education.length > 0 ? (
              doctor.education.map((edu, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <p className="font-bold text-slate-900 text-sm sm:text-base">{edu.degree}</p>
                    <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{edu.institution}</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full shrink-0">
                    Graduated {edu.year}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 font-medium">{doctor.qualification}</p>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SPECIALIZATION AND AREAS OF CLINICAL INTEREST */}
        {/* ========================================================================= */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
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

        {/* ========================================================================= */}
        {/* 5. LANGUAGES SPOKEN */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-slate-400" />
            Languages Spoken
          </span>
          <p className="font-semibold text-slate-800 text-sm sm:text-base">
            {doctor.languages_spoken ? doctor.languages_spoken.join(', ') : 'Kannada, English'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 7. PROFESSIONAL BIOGRAPHY AND CONSULTATION APPROACH */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base">
              Professional Biography
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {doctor.bio}
            </p>
          </div>

          {doctor.consultation_approach && (
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1">
              <span className="text-xs font-extrabold uppercase text-teal-800 tracking-wider">
                Clinical Consultation Approach
              </span>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                {doctor.consultation_approach}
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 8. CONSULTATION AVAILABILITY AND CONSULTATION MODE */}
        {/* ========================================================================= */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Consultation Availability & Schedule</span>
          </h3>
          <div className="space-y-2">
            {doctor.schedule && doctor.schedule.map((slot, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                <span className="font-bold text-slate-800">{slot.days}</span>
                <span className="font-mono text-teal-800 font-bold">{slot.timing}</span>
                <span className="text-xs text-slate-500 font-semibold uppercase">{slot.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 9. CERTIFICATES & CREDENTIAL VERIFICATION (REQUIREMENT C) */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>Credentials & Verification Documents</span>
              </h3>
              <p className="text-xs text-slate-500">
                Inspected medical certificates and official authority accreditation (Demo Data).
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
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-300 transition"
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

                    <p className="text-xs sm:text-sm text-slate-600">
                      Authority: <strong>{cert.authority}</strong> • Registration Ref: <span className="font-mono font-bold text-slate-800">{cert.reg_number}</span>
                    </p>

                    <p className="text-xs text-slate-500">
                      Date Issued: {cert.date_issued} • Validity: {cert.valid_until}
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
              <p className="text-xs text-slate-500">No verification certificates filed.</p>
            )}
          </div>
        </div>

        {/* Prototype Legal Disclaimer */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 leading-relaxed">
          <strong>Prototype Demo Notice:</strong> This profile and associated certificates are fictional demonstration records. Medical registration numbers are sample data. Clinical features are provided for interface demonstration only.
        </div>

      </Card>

      {/* Certificate Preview Modal */}
      {activeCertificate && (
        <CertificatePreviewModal
          certificate={activeCertificate}
          doctorName={doctor.full_name}
          isOpen={!!activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}

    </div>
  );
}
