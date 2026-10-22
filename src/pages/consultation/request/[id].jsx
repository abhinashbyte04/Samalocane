import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { 
  Stethoscope, ShieldCheck, ArrowLeft, PhoneCall, Video, 
  MessageSquare, Clock, CheckCircle2, CloudOff, AlertTriangle, User
} from 'lucide-react';
import { queueOperation } from '../../../lib/indexedDbOutbox';
import { InternetCallGuidanceBox } from '../../../components/consultation/InternetCallGuidanceBox';

export default function ConsultationRequestPage({ currentUser, isOffline, onOutboxChanged }) {
  const router = useRouter();
  const { id: doctorId } = router.query;

  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [requestedMode, setRequestedMode] = useState('audio');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [queuedNotice, setQueuedNotice] = useState(null);

  useEffect(() => {
    if (!doctorId) return;
    fetch(`/api/doctors/${doctorId}`)
      .then(res => res.json())
      .then(data => {
        if (data.doctor) {
          setDoctor(data.doctor);
          if (data.doctor.consultation_modes && data.doctor.consultation_modes.length > 0) {
            setRequestedMode(data.doctor.consultation_modes[0]);
          }
        }
      })
      .catch(err => {
        console.warn('Could not fetch doctor details online:', err);
      })
      .finally(() => setLoadingDoctor(false));
  }, [doctorId]);

  // Sync prefilled data from query parameters (from patient selection & recommendation workflow)
  useEffect(() => {
    if (router.query.chiefComplaint) {
      setChiefComplaint(String(router.query.chiefComplaint));
    }
    if (router.query.symptoms) {
      setSymptoms(String(router.query.symptoms));
    }
    if (router.query.mode && ['audio', 'video', 'text'].includes(String(router.query.mode).toLowerCase())) {
      setRequestedMode(String(router.query.mode).toLowerCase());
    }
  }, [router.query.chiefComplaint, router.query.symptoms, router.query.mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) {
      setErrorMsg('Please describe your primary health concern / reason for consultation.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setQueuedNotice(null);

    const payload = {
      doctorId,
      requestedMode,
      chiefComplaint: chiefComplaint.trim(),
      symptoms: symptoms.trim()
    };

    // If already offline, queue directly into IndexedDB Outbox
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      try {
        const userId = currentUser?.id || 'demo_patient';
        await queueOperation({
          userId,
          operationType: 'CREATE_CONSULTATION',
          endpoint: '/api/consultations',
          method: 'POST',
          payload
        });
        setQueuedNotice('You are offline. Your consultation request has been safely queued in your local Outbox and will automatically synchronize when cellular signal is restored.');
        if (onOutboxChanged) onOutboxChanged();
      } catch (queueErr) {
        setErrorMsg(`Failed to save offline: ${queueErr.message}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit consultation request');

      // Successfully created: redirect to waiting room
      router.push(`/consultation/waiting/${data.consultation.id}`);
    } catch (err) {
      // If network failure occurred mid-flight, offer offline queue fallback
      if (err.name === 'TypeError' || err.message.includes('fetch') || !navigator.onLine) {
        try {
          const userId = currentUser?.id || 'demo_patient';
          await queueOperation({
            userId,
            operationType: 'CREATE_CONSULTATION',
            endpoint: '/api/consultations',
            method: 'POST',
            payload
          });
          setQueuedNotice('Network disconnected during submission. Your consultation request has been safely saved in your local Outbox and will automatically synchronize when connection returns.');
          if (onOutboxChanged) onOutboxChanged();
        } catch (queueErr) {
          setErrorMsg(`Network failed and could not queue offline: ${queueErr.message}`);
        }
      } else {
        setErrorMsg(err.message || 'Request failed. Please verify your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDoctor && !doctor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-500 font-bold animate-pulse">
        Loading doctor details...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      <Link href="/doctors" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700 transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Request Medical Consultation
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Step 1 of 2: Specify your reason and consultation mode before submitting to the physician.
        </p>
      </div>

      {queuedNotice && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-2">
          <div className="flex items-center gap-2">
            <CloudOff className="w-5 h-5 text-amber-700 shrink-0" />
            <h4 className="font-extrabold text-base">Saved to Offline Outbox</h4>
          </div>
          <p className="text-sm leading-relaxed font-medium">
            {queuedNotice}
          </p>
          <div className="pt-2 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => router.push('/patient')}>
              Return to Patient Portal
            </Button>
          </div>
        </div>
      )}

      {errorMsg && (
        <Alert type="danger">{errorMsg}</Alert>
      )}

      {/* Selected Doctor Summary Card */}
      {doctor && (
        <Card className="flex items-center justify-between gap-4 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center font-bold">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{doctor.full_name}</h3>
              <p className="text-sm text-brand-700 font-semibold">{doctor.specialty_name}</p>
              <p className="text-xs sm:text-sm text-slate-600">{doctor.qualification} • Reg: {doctor.council_registration_number}</p>
            </div>
          </div>
          <Badge variant={doctor.is_available ? 'success' : 'neutral'}>
            ● {doctor.is_available ? 'Online' : 'Offline'}
          </Badge>
        </Card>
      )}

      {/* Selected Patient Information Summary Banner */}
      {router.query.patientName && (
        <Card className="bg-teal-50/70 border-teal-200 p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              Patient Details for this Consultation
            </span>
            <Badge variant="brand">Selected Patient</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700 pt-1">
            <span className="font-extrabold text-slate-900 text-base">{router.query.patientName}</span>
            {router.query.patientAge && <span>Age: <strong>{router.query.patientAge} yrs</strong></span>}
            {router.query.patientGender && <span>Gender: <strong>{router.query.patientGender}</strong></span>}
            {router.query.patientTaluka && <span>Taluka: <strong>{router.query.patientTaluka}</strong></span>}
            {router.query.allergies && (
              <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs font-semibold">
                Allergies: {router.query.allergies}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Internet & Call Guidance Box (Requirement A, B, C, E) */}
      <InternetCallGuidanceBox
        mode="pre_call"
        doctorName={doctor?.full_name || 'Consulting Physician'}
        onContinue={() => {
          const formEl = document.getElementById('consultation-request-form');
          if (formEl) {
            formEl.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Request Form */}
      {!queuedNotice && (
        <Card>
          <form id="consultation-request-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">
                1. Choose Consultation Mode
              </label>
              <div className="grid grid-cols-3 gap-2.5 text-sm">
                <button
                  type="button"
                  onClick={() => setRequestedMode('audio')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition ${
                    requestedMode === 'audio' 
                      ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-2xs' 
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <PhoneCall className="w-5 h-5 text-brand-600" />
                  <span className="text-sm font-bold">Audio Call</span>
                  <span className="text-xs text-brand-700 font-normal">Recommended (Low Data)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestedMode('video')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition ${
                    requestedMode === 'video' 
                      ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-2xs' 
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Video className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold">Video Call</span>
                  <span className="text-xs text-slate-500 font-normal">Requires 4G / WiFi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestedMode('text')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition ${
                    requestedMode === 'text' 
                      ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-2xs' 
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-bold">Text Chat</span>
                  <span className="text-xs text-slate-500 font-normal">Edge / 2G Resilient</span>
                </button>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">
                2. Primary Health Concern / Chief Complaint *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Skin rash on forearms with intense itching for 3 days"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            {/* Symptoms Details */}
            <div className="space-y-1.5">
              <label className="block text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">
                3. Additional Symptoms or Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Detail onset, any previous medicines taken, or trigger factors..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Submission and Safety Reminder */}
            <Alert type="info">
              Your request will be submitted directly to Dr. {doctor?.full_name || 'the physician'}. Once accepted, you will enter the waiting room.
            </Alert>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/doctors')}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>{submitting ? 'Submitting Request...' : 'Submit Consultation Request'}</span>
              </Button>
            </div>

          </form>
        </Card>
      )}

    </div>
  );
}
