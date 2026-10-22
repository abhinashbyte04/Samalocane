import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { 
  User, Stethoscope, AlertTriangle, ShieldCheck, Heart, 
  FileText, ArrowRight, Search, PhoneCall, Video, MessageSquare, 
  Clock, CheckCircle2, ChevronRight, Activity, Sparkles, Siren,
  Users, Plus
} from 'lucide-react';
import { INITIAL_DEMO_PATIENTS } from '../../data/dummyPatients';
import { PatientDirectory } from '../../components/patient/PatientDirectory';
import { AddPatientModal } from '../../components/patient/AddPatientModal';
import { PatientDetailModal } from '../../components/patient/PatientDetailModal';
import { PatientRecommendationModal } from '../../components/patient/PatientRecommendationModal';

const QUICK_SYMPTOM_SUGGESTIONS = [
  { label: 'Fever & Dry Cough', text: 'Persistent fever and dry cough for 3 days' },
  { label: 'Skin Rash & Itching', text: 'Itchy red rash on arms and neck with scaling skin' },
  { label: 'Joint & Back Pain', text: 'Severe knee pain and stiffness in back after walking' },
  { label: 'Wheezing & Asthma', text: 'Chronic cough with wheezing and breathlessness' },
  { label: 'Child Fever', text: 'Child fever with vomiting and loss of appetite' },
  { label: 'Chest Tightness (Safety Test)', text: 'Severe acute chest pain radiating to left arm and sweating' }
];

export default function PatientDashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active sub-tab state (default: 'directory')
  const [activeTab, setActiveTab] = useState('directory');

  // Patient Directory State
  const [patients, setPatients] = useState(INITIAL_DEMO_PATIENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recommendationPatient, setRecommendationPatient] = useState(null);
  const [notification, setNotification] = useState(null);

  // Recommendation Engine State
  const [symptomInput, setSymptomInput] = useState('');
  const [preferredMode, setPreferredMode] = useState('');
  const [recommending, setRecommending] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState(null);
  const [recommendationError, setRecommendationError] = useState('');

  // Load demo patients from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('samalocane_demo_patients_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPatients(parsed);
          }
        }
      } catch (err) {
        console.warn('Could not read demo patients from localStorage:', err);
      }
    }
  }, []);

  // Sync tab with query parameter if present
  useEffect(() => {
    if (router.query.tab && ['directory', 'triage', 'consultations', 'doctors'].includes(router.query.tab)) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  const loadData = async () => {
    try {
      const [authData, profileData, docData, consultData] = await Promise.all([
        fetch('/api/auth/me').then(r => r.json()).catch(() => ({})),
        fetch('/api/patient/profile').then(r => r.json()).catch(() => ({})),
        fetch('/api/doctors?limit=4').then(r => r.json()).catch(() => ({})),
        fetch('/api/consultations').then(r => r.json()).catch(() => ({}))
      ]);

      const user = authData?.user || {
        id: 'usr-pat-01',
        email: 'patient.demo@samalocane.in',
        full_name: 'Smt. Parvathi',
        role: 'patient'
      };

      setSession(user);
      setProfile(profileData?.profile || null);
      setDoctors(docData?.doctors || []);
      setConsultations(consultData?.consultations || []);
    } catch (err) {
      console.error('[Dashboard Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save new patient handler (with duplicate protection)
  const handleSavePatient = (newPatient) => {
    setPatients((prev) => {
      const alreadyExists = prev.some(
        p => p.id === newPatient.id || 
             (p.name.trim().toLowerCase() === newPatient.name.trim().toLowerCase() && 
              p.age === newPatient.age && 
              p.taluka === newPatient.taluka)
      );

      if (alreadyExists) {
        setNotification(`A record for patient "${newPatient.name}" already exists in the directory.`);
        setTimeout(() => setNotification(null), 5000);
        return prev;
      }

      const updated = [newPatient, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('samalocane_demo_patients_v1', JSON.stringify(updated));
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }
      }
      setNotification(`Patient "${newPatient.name}" was added to the local directory successfully!`);
      setTimeout(() => setNotification(null), 6000);
      return updated;
    });
  };

  // Update existing patient handler (e.g. from recommendation modal corrections)
  const handleUpdatePatient = (updatedPatient) => {
    setPatients((prev) => {
      const updated = prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('samalocane_demo_patients_v1', JSON.stringify(updated));
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }
      }
      return updated;
    });

    if (selectedPatient && selectedPatient.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient);
    }
    if (recommendationPatient && recommendationPatient.id === updatedPatient.id) {
      setRecommendationPatient(updatedPatient);
    }
  };

  // Reset demo patients handler
  const handleResetDefaults = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('samalocane_demo_patients_v1');
      } catch (e) {}
    }
    setPatients(INITIAL_DEMO_PATIENTS);
    setNotification('Patient directory reset to initial 10 fictional demo records.');
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle Symptom Recommendation Search
  const handleGetRecommendation = async (e) => {
    if (e) e.preventDefault();
    if (!symptomInput.trim()) {
      setRecommendationError('Please describe your symptoms or select a common health concern.');
      return;
    }

    setRecommending(true);
    setRecommendationError('');
    setRecommendationResult(null);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomInput.trim(),
          consultationMode: preferredMode || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch doctor recommendations');

      setRecommendationResult(data);
    } catch (err) {
      setRecommendationError(err.message || 'Could not process recommendation. Please try again.');
    } finally {
      setRecommending(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout portalName="Patient Portal" requiredRole="patient" icon={User}>
        <div className="py-16 text-center text-slate-500 font-bold animate-pulse">
          Loading patient health dashboard...
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout 
      portalName="Patient Portal" 
      requiredRole="patient" 
      icon={User}
      actions={
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Patient</span>
        </Button>
      }
    >
      <div className="space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`pb-3 px-1 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'directory'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>Patient Directory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-extrabold">
              {patients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('triage')}
            className={`pb-3 px-1 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'triage'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Smart Specialty Triage</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consultations')}
            className={`pb-3 px-1 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'consultations'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Consultation Sessions</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              {consultations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`pb-3 px-1 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'doctors'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span>Verified Doctors</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PATIENT DIRECTORY (DEFAULT ACTIVE) */}
        {/* ========================================================================= */}
        {activeTab === 'directory' && (
          <PatientDirectory
            patients={patients}
            onAddClick={() => setIsAddModalOpen(true)}
            onPatientSelect={(patient) => setSelectedPatient(patient)}
            onFindDoctors={(patient) => setRecommendationPatient(patient)}
            onResetDefaults={handleResetDefaults}
            notification={notification}
            onClearNotification={() => setNotification(null)}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SMART SPECIALTY RECOMMENDATION & PROFILE */}
        {/* ========================================================================= */}
        {activeTab === 'triage' && (
          <div className="space-y-6">
            {/* Profile Completion Prompt if profile is missing */}
            {!profile ? (
              <Alert type="warning" title="Health Profile Incomplete">
                Please complete your baseline medical background (chronic conditions, medications, drug allergies) before consulting physicians.
                <div className="mt-2">
                  <Button size="sm" variant="primary" onClick={() => router.push('/patient/profile')}>
                    Complete Health Profile Now
                  </Button>
                </div>
              </Alert>
            ) : (
              /* Profile Summary Card with Emergency Details */
              <Card>
                <CardHeader
                  title={`Welcome, ${session?.full_name}`}
                  subtitle={`Residence: ${profile.taluka || 'Rural'} Taluka, ${profile.district || 'Karnataka'}`}
                  action={
                    <Button size="sm" variant="secondary" onClick={() => router.push('/patient/profile')}>
                      Edit Health Profile
                    </Button>
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm sm:text-base">
                  {/* Allergies Highlight */}
                  <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-1">
                    <span className="font-extrabold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      Drug Allergies
                    </span>
                    <p className="font-bold text-rose-800 text-sm sm:text-base">
                      {profile.allergies || 'No known drug allergies reported'}
                    </p>
                  </div>

                  {/* Chronic Conditions */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700">Chronic Conditions</span>
                    <p className="text-slate-700">
                      {profile.chronic_conditions && profile.chronic_conditions.length > 0 
                        ? profile.chronic_conditions.join(', ') 
                        : 'None declared'}
                    </p>
                  </div>

                  {/* Current Medications */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700">Active Medications</span>
                    <p className="text-slate-700">
                      {profile.current_medications || 'None reported'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* RECOMMENDATION ENGINE: Symptom-to-Specialty Intelligent Routing */}
            <Card className="border-teal-300 bg-gradient-to-b from-white to-teal-50/20">
              <CardHeader
                title="Smart Specialty & Doctor Recommendation"
                subtitle="Describe your symptoms to find suitable verified doctors. (Rule-based routing without AI disease diagnosis)"
                icon={Sparkles}
              />

              <form onSubmit={handleGetRecommendation} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-semibold text-slate-800">
                    What symptoms or health concerns are you experiencing?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-base p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    placeholder="e.g., Persistent dry cough and wheezing for the past 5 days with mild chest tightness..."
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                  />
                </div>

                {/* Quick symptom chips for rural usability */}
                <div className="space-y-1.5">
                  <span className="text-xs sm:text-sm font-semibold text-slate-600">Quick Examples:</span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SYMPTOM_SUGGESTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSymptomInput(item.text);
                          setRecommendationResult(null);
                        }}
                        className="text-xs sm:text-sm px-3 py-1.5 bg-white hover:bg-teal-50 hover:border-teal-400 border border-slate-200 rounded-lg text-slate-700 font-medium transition"
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Consultation Mode Preference */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-slate-700">Preferred Mode:</span>
                    <select 
                      value={preferredMode} 
                      onChange={(e) => setPreferredMode(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 font-medium"
                    >
                      <option value="">Any Mode</option>
                      <option value="audio">Audio Call (Low Bandwidth)</option>
                      <option value="video">Video Call</option>
                      <option value="text">Text Message</option>
                    </select>
                  </div>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={recommending}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                  >
                    {recommending ? 'Analyzing Keywords...' : 'Recommend Specialist'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>

              {recommendationError && (
                <div className="mt-4">
                  <Alert type="danger">{recommendationError}</Alert>
                </div>
              )}

              {/* RECOMMENDATION RESULT SECTION */}
              {recommendationResult && (
                <div className="mt-6 pt-6 border-t border-teal-200 space-y-4">
                  {recommendationResult.isUrgent ? (
                    <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-950 space-y-3 shadow-md">
                      <div className="flex items-center gap-2">
                        <Siren className="w-6 h-6 text-rose-600 animate-bounce" />
                        <h3 className="text-lg font-black uppercase tracking-wide text-rose-900">
                          Potential Medical Emergency Detected
                        </h3>
                      </div>

                      <p className="text-sm sm:text-base font-bold text-rose-800 leading-relaxed">
                        {recommendationResult.urgentDetails?.guidance || recommendationResult.message}
                      </p>

                      <div className="p-3 bg-white/80 rounded-lg border border-rose-300 space-y-2 text-sm">
                        <p className="font-extrabold text-rose-900">Trigger phrase identified:</p>
                        <p className="font-mono text-rose-700 bg-rose-100/50 p-2 rounded text-sm">
                          "{recommendationResult.urgentDetails?.triggerPhrase}"
                        </p>
                        <p className="text-rose-900 font-medium pt-1">
                          Do not wait for a telemedicine appointment. Immediately call National Emergency:
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                          <a href="tel:108" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 text-white font-black rounded-lg text-sm hover:bg-rose-700">
                            <PhoneCall className="w-4 h-4" /> Call 108 (Ambulance)
                          </a>
                          <a href="tel:112" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white font-black rounded-lg text-sm hover:bg-slate-800">
                            <PhoneCall className="w-4 h-4" /> Call 112 (Emergency)
                          </a>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-rose-800 italic">
                        {recommendationResult.disclaimer}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Specialty match explanation badge */}
                      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-700">
                              Recommended Medical Specialty
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                              {recommendationResult.primarySpecialty?.name}
                              {recommendationResult.isFallback && (
                                <Badge variant="neutral">Primary Care Triage</Badge>
                              )}
                            </h3>
                          </div>
                          
                          {recommendationResult.primarySpecialty?.matchedKeywords?.length > 0 && (
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="text-xs font-bold text-slate-500">Keywords:</span>
                              {recommendationResult.primarySpecialty.matchedKeywords.map((kw, i) => (
                                <span key={i} className="text-xs font-bold bg-white text-teal-800 px-2.5 py-0.5 rounded border border-teal-300">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                          {recommendationResult.primarySpecialty?.explanation}
                        </p>

                        {recommendationResult.secondarySpecialties?.length > 0 && (
                          <div className="pt-2 border-t border-teal-100 flex items-center gap-2 text-sm">
                            <span className="font-bold text-slate-600">Alternative Options:</span>
                            {recommendationResult.secondarySpecialties.map((sec, i) => (
                              <span key={i} className="text-xs sm:text-sm font-semibold text-teal-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                                {sec.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Non-Diagnostic Disclaimer Banner */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs sm:text-sm text-amber-900 font-medium leading-relaxed">
                        {recommendationResult.disclaimer}
                      </div>

                      {/* Recommended Doctors List */}
                      <div className="space-y-2">
                        <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700">
                          Matching Verified Specialists ({recommendationResult.eligibleDoctors?.length || 0})
                        </h4>

                        {recommendationResult.eligibleDoctors?.length === 0 ? (
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-sm text-slate-600">
                            No doctors currently online for this specialty. You may browse all verified doctors in the directory.
                            <div className="mt-2">
                              <Link href="/doctors">
                                <Button size="sm" variant="secondary">Browse Full Directory</Button>
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recommendationResult.eligibleDoctors.map((doc) => (
                              <div 
                                key={doc.doctor_user_id || doc.id} 
                                className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-teal-500 transition flex flex-col justify-between space-y-3"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h5 className="font-black text-slate-900 text-base">
                                        {doc.full_name}
                                      </h5>
                                      <p className="text-sm font-bold text-teal-700">
                                        {doc.specialty_name}
                                      </p>
                                    </div>
                                    <Badge variant={doc.is_available ? 'success' : 'neutral'}>
                                      ● {doc.is_available ? 'Available' : 'Offline'}
                                    </Badge>
                                  </div>

                                  <p className="text-xs sm:text-sm text-slate-600">
                                    {doc.qualification} • <strong>{doc.experience_years} yrs exp</strong>
                                  </p>

                                  <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-xs sm:text-sm text-emerald-900 font-semibold flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SMC: {doc.council_registration_number}
                                    </span>
                                    <span className="uppercase text-emerald-700 text-xs font-bold">{doc.council_name}</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-sm font-bold text-slate-700">
                                    {doc.consultation_fee > 0 ? `₹${doc.consultation_fee}` : 'Free'}
                                  </span>
                                  <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={() => router.push(`/consultation/request/${doc.doctor_user_id || doc.id}`)}
                                  >
                                    Request Consultation
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ACTIVE & RECENT CONSULTATIONS */}
        {/* ========================================================================= */}
        {activeTab === 'consultations' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Your Consultation Sessions
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Track waiting room queue status, doctor responses, and call history
                </p>
              </div>
              <Badge variant="brand">{consultations.length} Sessions</Badge>
            </div>

            {consultations.length === 0 ? (
              <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-2 p-6">
                <Clock className="w-8 h-8 mx-auto text-brand-600 opacity-60" />
                <p className="font-bold text-slate-800 text-base">No Consultations Yet</p>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  You do not have any pending or past consultations. Use the Smart Specialty Recommendation tool above to find a specialist or choose from the verified doctor directory.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {consultations.map(consult => (
                  <div 
                    key={consult.id} 
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono font-bold text-brand-800">
                          {consult.reference_number || consult.id}
                        </span>
                        <Badge variant={
                          consult.status === 'completed' ? 'success' :
                          consult.status === 'in_progress' ? 'brand' :
                          consult.status === 'waiting' ? 'warning' :
                          consult.status === 'rejected' ? 'danger' : 'neutral'
                        }>
                          {consult.status}
                        </Badge>
                        <span className="text-xs text-slate-600 font-mono uppercase bg-slate-100 px-2.5 py-0.5 rounded">
                          Mode: {consult.requested_mode}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-800">
                        Reason: {consult.chief_complaint}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-500">
                        Requested on {new Date(consult.created_at).toLocaleDateString()} at {new Date(consult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => router.push(`/consultation/waiting/${consult.id}`)}
                      >
                        Open Waiting Room
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: VERIFIED DOCTORS DIRECTORY PREVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'doctors' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Verified Medical Directory
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  State Medical Council verified physicians available for low-bandwidth consultation
                </p>
              </div>
              <Link href="/doctors" className="text-sm font-bold text-brand-700 hover:underline flex items-center gap-1">
                Browse Full Directory &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map(doc => (
                <Card key={doc.id} className="flex flex-col justify-between space-y-3 hover:shadow-card transition-all">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                          {doc.full_name || 'Dr. Specialist'}
                        </h3>
                        <span className="text-sm font-semibold text-brand-700">
                          {doc.specialty_name} • {doc.qualification}
                        </span>
                      </div>
                      <Badge variant={doc.is_available ? 'success' : 'neutral'}>
                        {doc.is_available ? 'Online' : 'Offline'}
                      </Badge>
                    </div>

                    {doc.hospital_affiliation && (
                      <p className="text-sm text-slate-700 font-medium">
                        Hospital: <strong className="text-slate-900">{doc.hospital_affiliation}</strong>
                      </p>
                    )}

                    <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs sm:text-sm text-emerald-900 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {doc.council_registration_number}
                      </span>
                      <span className="text-xs text-emerald-700 font-bold uppercase">{doc.council_name}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600 pt-1">
                      <span>Experience: <strong>{doc.experience_years} years</strong></span>
                      <span>Fee: <strong>{doc.consultation_fee > 0 ? `₹${doc.consultation_fee}` : 'Free'}</strong></span>
                      {doc.rating && (
                        <span className="font-bold text-amber-600">★ {doc.rating}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Modes: {doc.consultation_modes ? doc.consultation_modes.join(', ') : 'Audio, Text'}
                    </span>
                    <Button 
                      size="sm" 
                      variant="primary" 
                      disabled={!doc.is_available}
                      onClick={() => router.push(`/consultation/request/${doc.id}`)}
                    >
                      <span>Request Consultation</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADD PATIENT MODAL DIALOG */}
        {/* ========================================================================= */}
        <AddPatientModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSavePatient}
        />

        {/* ========================================================================= */}
        {/* PATIENT DETAILS MODAL DIALOG */}
        {/* ========================================================================= */}
        <PatientDetailModal
          patient={selectedPatient}
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onFindDoctors={(patient) => setRecommendationPatient(patient)}
        />

        {/* ========================================================================= */}
        {/* PATIENT RECOMMENDATION MODAL (RULE-BASED MATCHING) */}
        {/* ========================================================================= */}
        <PatientRecommendationModal
          patient={recommendationPatient}
          isOpen={!!recommendationPatient}
          onClose={() => setRecommendationPatient(null)}
          onPatientUpdate={handleUpdatePatient}
        />

      </div>
    </PortalLayout>
  );
}
