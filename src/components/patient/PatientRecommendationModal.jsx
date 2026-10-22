import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  X, Sparkles, Stethoscope, AlertTriangle, ShieldCheck, 
  User, ArrowRight, ArrowLeft, PhoneCall, Video, MessageSquare, 
  Calendar, CheckCircle2, Siren, Star, RefreshCw, Building2, 
  Languages, Clock, ChevronRight, AlertCircle, FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { matchPatientToDoctors } from '../../lib/patientDoctorMatcher';
import { INITIAL_DEMO_DOCTORS } from '../../data/dummyDoctors';
import { DoctorDetailModal } from '../doctor/DoctorDetailModal';

export function PatientRecommendationModal({
  patient,
  isOpen,
  onClose,
  onPatientUpdate
}) {
  const router = useRouter();

  // Step 1: 'confirm' (review & edit patient details)
  // Step 2: 'results' (recommended doctors)
  const [step, setStep] = useState('confirm');

  // Editable patient data for matching
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Female',
    primaryCondition: '',
    allergies: '',
    notes: '',
    taluka: 'Kumta',
    preferredLanguage: 'Any',
    preferredMode: 'Any'
  });

  const [matchResult, setMatchResult] = useState(null);
  const [inspectDoctor, setInspectDoctor] = useState(null);

  // Sync with selected patient whenever modal opens
  useEffect(() => {
    if (patient && isOpen) {
      setFormData({
        name: patient.name || '',
        age: patient.age || '',
        gender: patient.gender || 'Female',
        primaryCondition: patient.primaryCondition || '',
        allergies: patient.allergies || 'None reported',
        notes: patient.notes || '',
        taluka: patient.taluka || 'Kumta',
        preferredLanguage: 'Any',
        preferredMode: 'Any'
      });
      setStep('confirm');
      setMatchResult(null);
    }
  }, [patient, isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !inspectDoctor) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, inspectDoctor]);

  if (!isOpen || !patient) return null;

  const handleRunMatching = (e) => {
    if (e) e.preventDefault();

    // Run deterministic transparent matcher
    const result = matchPatientToDoctors(formData, {
      preferredLanguage: formData.preferredLanguage,
      preferredMode: formData.preferredMode,
      doctorsList: INITIAL_DEMO_DOCTORS
    });

    setMatchResult(result);
    setStep('results');

    // Optionally update parent patient record if modified
    if (onPatientUpdate) {
      onPatientUpdate({
        ...patient,
        primaryCondition: formData.primaryCondition,
        allergies: formData.allergies,
        notes: formData.notes
      });
    }
  };

  const handleConnectWithDoctor = (doc) => {
    onClose();
    const targetId = doc.doctor_user_id || doc.id;
    router.push({
      pathname: `/consultation/request/${targetId}`,
      query: {
        patientId: patient.id,
        patientName: formData.name || patient.name,
        patientAge: formData.age || patient.age,
        patientGender: formData.gender || patient.gender,
        patientTaluka: formData.taluka || patient.taluka,
        chiefComplaint: formData.primaryCondition || patient.primaryCondition,
        allergies: formData.allergies || patient.allergies,
        symptoms: formData.notes || patient.notes || '',
        mode: formData.preferredMode && formData.preferredMode !== 'Any' ? formData.preferredMode.toLowerCase() : undefined
      }
    });
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recommendation-modal-title"
      >
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50/80 via-white to-slate-50 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Doctor Discovery Aid
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Rule-Based Clinical Specialty Matching
                </span>
              </div>

              <h2 id="recommendation-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-teal-600" />
                <span>Find Suitable Doctors for {formData.name}</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600">
                {step === 'confirm' 
                  ? 'Confirm or update the recorded medical information that will be used to suggest appropriate verified specialists.'
                  : 'Review suggested medical specialists based on the confirmed clinical concern.'}
              </p>
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

          {/* Modal Content */}
          <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
            
            {/* =================================================================== */}
            {/* STEP 1: CONFIRMATION & EDIT SCREEN (Requirement A) */}
            {/* =================================================================== */}
            {step === 'confirm' && (
              <form onSubmit={handleRunMatching} className="space-y-5">
                
                {/* Patient Summary Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-500">Selected Patient</span>
                    <p className="font-extrabold text-slate-900 text-base">{formData.name}</p>
                    <p className="text-xs text-slate-500">{formData.age} years • {formData.gender} • {formData.taluka}, Karnataka</p>
                  </div>

                  <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded uppercase">
                    Demo Data
                  </span>
                </div>

                {/* Primary Disease or Medical Concern */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="primary-concern" className="block text-sm sm:text-base font-semibold text-slate-800">
                      Primary Disease / Medical Concern <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-slate-500 font-medium">Used for specialty keyword matching</span>
                  </div>
                  <textarea
                    id="primary-concern"
                    rows={3}
                    value={formData.primaryCondition}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryCondition: e.target.value }))}
                    placeholder="Describe symptoms, e.g., Persistent dry cough with wheezing for 5 days..."
                    className="w-full p-3 text-sm sm:text-base rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    You can edit or expand the recorded concern to get more specific doctor suggestions.
                  </p>
                </div>

                {/* Known Allergies */}
                <div className="space-y-1.5">
                  <label htmlFor="allergies-input" className="block text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Known Drug / Food Allergies</span>
                  </label>
                  <input
                    id="allergies-input"
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                    placeholder="e.g., Penicillin (Hives) or None reported"
                    className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  />
                  <p className="text-xs text-slate-500">
                    Allergies are summarized for clinical safety; they are not used as an artificial matching shortcut.
                  </p>
                </div>

                {/* Relevant Medical History / Clinical Notes */}
                <div className="space-y-1.5">
                  <label htmlFor="notes-input" className="block text-sm sm:text-base font-semibold text-slate-800">
                    Relevant Medical History / Chronic Background (Optional)
                  </label>
                  <textarea
                    id="notes-input"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g., Hypertension for 4 years, symptoms worsen with coastal humidity..."
                    className="w-full p-3 text-sm sm:text-base rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>

                {/* Preferences: Preferred Language & Mode */}
                <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block">
                    Optional Consultation Preferences
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Preferred Language */}
                    <div className="space-y-1">
                      <label htmlFor="pref-lang" className="block text-xs sm:text-sm font-semibold text-slate-700">
                        Preferred Language
                      </label>
                      <select
                        id="pref-lang"
                        value={formData.preferredLanguage}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                        className="w-full p-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
                      >
                        <option value="Any">Any Language (All Doctors)</option>
                        <option value="Kannada">Kannada</option>
                        <option value="English">English</option>
                        <option value="Konkani">Konkani</option>
                        <option value="Tulu">Tulu</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Marathi">Marathi</option>
                      </select>
                    </div>

                    {/* Preferred Mode */}
                    <div className="space-y-1">
                      <label htmlFor="pref-mode" className="block text-xs sm:text-sm font-semibold text-slate-700">
                        Preferred Mode
                      </label>
                      <select
                        id="pref-mode"
                        value={formData.preferredMode}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredMode: e.target.value }))}
                        className="w-full p-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
                      >
                        <option value="Any">Any Mode</option>
                        <option value="video">Video Call</option>
                        <option value="audio">Audio Call (Low-Bandwidth)</option>
                        <option value="text">Text Chat</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Non-Diagnostic Aid Notice */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <strong>Notice:</strong> This doctor discovery aid provides transparent specialty recommendations. It does not provide clinical diagnosis or prescribe treatments.
                </div>

                {/* Form Actions */}
                <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm sm:text-base font-semibold"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:w-auto px-6 py-2.5 text-sm sm:text-base font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Find Recommended Doctors</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

              </form>
            )}

            {/* =================================================================== */}
            {/* STEP 2: RECOMMENDATION RESULTS (Requirement C & D) */}
            {/* =================================================================== */}
            {step === 'results' && matchResult && (
              <div className="space-y-5">
                
                {/* 1. URGENT EMERGENCY SAFETY NOTICE (Requirement D) */}
                {matchResult.isUrgent ? (
                  <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-950 space-y-4 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <Siren className="w-7 h-7 text-rose-600 animate-bounce shrink-0" />
                      <div>
                        <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-rose-900">
                          Critical Medical Emergency Detected
                        </h3>
                        <p className="text-xs text-rose-700 font-bold">{matchResult.category}</p>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-rose-900 leading-relaxed">
                      {matchResult.guidance}
                    </p>

                    <div className="p-3.5 bg-white/90 rounded-xl border border-rose-300 space-y-2 text-xs sm:text-sm">
                      <p className="font-extrabold text-rose-950">Identified trigger phrase:</p>
                      <p className="font-mono text-rose-800 bg-rose-100/60 p-2 rounded-lg font-bold">
                        "{matchResult.triggerPhrase}"
                      </p>
                      <p className="text-rose-900 font-medium pt-1">
                        Do not wait for a routine telemedicine consultation. Contact National Emergency Hotlines immediately:
                      </p>
                      <div className="flex flex-wrap gap-3 pt-1">
                        <a 
                          href="tel:108" 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white font-black rounded-xl text-sm hover:bg-rose-700 shadow-xs"
                        >
                          <PhoneCall className="w-4 h-4" /> Call 108 (Ambulance)
                        </a>
                        <a 
                          href="tel:112" 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-black rounded-xl text-sm hover:bg-slate-800 shadow-xs"
                        >
                          <PhoneCall className="w-4 h-4" /> Call 112 (National Emergency)
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setStep('confirm')}
                        className="text-xs font-bold"
                      >
                        ← Edit Stated Symptoms
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onClose();
                          router.push('/emergency');
                        }}
                        className="text-xs font-bold text-rose-800 border-rose-300"
                      >
                        View Regional Emergency PHCs &rarr;
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 2. MATCHING SUMMARY BANNER */}
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 block">
                            Recommended Clinical Specialty
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            {matchResult.recommendedSpecialty}
                            {matchResult.isFallback && (
                              <Badge variant="neutral">Primary Care Triage</Badge>
                            )}
                          </h3>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setStep('confirm')}
                          className="text-xs font-semibold flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Edit Symptoms & Re-Match</span>
                        </Button>
                      </div>

                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        {matchResult.matchExplanation}
                      </p>

                      {matchResult.isInsufficientInfo && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs sm:text-sm text-amber-900 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>{matchResult.clarificationNotice}</span>
                        </div>
                      )}
                    </div>

                    {/* 3. RECOMMENDED DOCTORS LIST (Requirement C) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700">
                          Recommended Specialists ({matchResult.recommendations.length})
                        </h4>
                        <span className="text-xs text-slate-500">
                          Ranked by specialty relevance & live availability
                        </span>
                      </div>

                      {matchResult.recommendations.map(({ doctor: doc, matchReasons }, idx) => (
                        <div 
                          key={doc.id || doc.doctor_user_id}
                          className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 transition space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-base shrink-0">
                                {doc.avatar_initials || 'DR'}
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-extrabold text-slate-900 text-base sm:text-lg">
                                    {doc.full_name}
                                  </h5>
                                  <Badge variant={doc.is_available ? 'success' : 'neutral'}>
                                    ● {doc.is_available ? 'Online Now' : 'Offline'}
                                  </Badge>
                                  <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded uppercase">
                                    Demo
                                  </span>
                                </div>

                                <p className="text-xs sm:text-sm font-bold text-teal-700">
                                  {doc.specialty_name} • {doc.qualification}
                                </p>

                                <p className="text-xs text-slate-600">
                                  {doc.experience_years} yrs exp • SMC: <strong className="font-mono">{doc.council_registration_number}</strong>
                                </p>
                              </div>
                            </div>

                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                              {doc.verification_status}
                            </span>
                          </div>

                          {/* Explanation of the Match (Requirement B & C) */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm space-y-1">
                            <span className="font-bold text-slate-700 block">Match Explanation:</span>
                            {matchReasons.map((reason, rIdx) => (
                              <p key={rIdx} className="text-slate-600 flex items-start gap-1.5">
                                <span className="text-teal-600 font-bold">•</span>
                                <span>{reason}</span>
                              </p>
                            ))}
                          </div>

                          {/* Languages, Schedule, and Modes */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                            <span>
                              Languages: <strong className="text-slate-700">{doc.languages_spoken ? doc.languages_spoken.join(', ') : 'Kannada, English'}</strong>
                            </span>
                            <span>
                              Consultation Fee: <strong className="text-slate-700">{doc.consultation_fee === 0 ? 'Free' : `₹${doc.consultation_fee}`}</strong>
                            </span>
                          </div>

                          {/* Card Action Buttons: View Profile & Connect with Doctor */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setInspectDoctor(doc)}
                              className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold"
                            >
                              <span>View Profile</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="primary"
                              disabled={!doc.is_available && doc.verification_status === 'Not Verified'}
                              onClick={() => handleConnectWithDoctor(doc)}
                              className="px-4 py-1.5 text-xs sm:text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5 shadow-xs"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Connect with Doctor</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Secondary Link to browse all other doctors */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="text-slate-600">
                        Prefer to choose another practitioner from the full directory?
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          onClose();
                          router.push('/doctors');
                        }}
                        className="text-xs font-bold text-teal-800 border-teal-200"
                      >
                        Browse All Doctors &rarr;
                      </Button>
                    </div>

                    {/* Medical Safety Disclaimer (Requirement D) */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                      <strong>Medical Safety Notice:</strong> Suggestions above are informational specialty-matching recommendations. They do not constitute an automated diagnosis, treatment plan, or drug prescription.
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setStep('confirm')}
                        className="text-xs sm:text-sm font-semibold"
                      >
                        ← Back to Clinical Summary
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={onClose}
                        className="text-xs sm:text-sm font-semibold"
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )}

              </div>
            )}

          </div>

        </div>
      </div>

      {/* Inspect Doctor Profile Modal */}
      {inspectDoctor && (
        <DoctorDetailModal
          doctor={inspectDoctor}
          patient={patient}
          isOpen={!!inspectDoctor}
          onClose={() => setInspectDoctor(null)}
        />
      )}
    </>
  );
}

