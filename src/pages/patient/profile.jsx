import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { User, AlertTriangle, Save, Heart, CheckCircle2, CloudOff } from 'lucide-react';
import { queueOperation } from '../../lib/indexedDbOutbox';

export default function PatientProfilePage({ currentUser, isOffline, onOutboxChanged }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    dob: '',
    gender: 'Female',
    phoneNumber: '',
    taluka: 'Kumta',
    district: 'Uttara Kannada',
    chronicConditions: [],
    currentMedications: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const commonConditions = [
    'Diabetes Type 2',
    'Hypertension',
    'Asthma / Bronchitis',
    'Thyroid Disorder',
    'Cardiac History',
    'None'
  ];

  useEffect(() => {
    fetch('/api/patient/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setFormData({
            dob: data.profile.dob || '',
            gender: data.profile.gender || 'Female',
            phoneNumber: data.profile.phone_number || '',
            taluka: data.profile.taluka || 'Kumta',
            district: data.profile.district || 'Uttara Kannada',
            chronicConditions: data.profile.chronic_conditions || [],
            currentMedications: data.profile.current_medications || '',
            allergies: data.profile.allergies || '',
            emergencyContactName: data.profile.emergency_contact_name || '',
            emergencyContactPhone: data.profile.emergency_contact_phone || ''
          });
        }
      })
      .catch(err => console.warn('Could not load profile online:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggleCondition = (cond) => {
    if (cond === 'None') {
      setFormData(prev => ({ ...prev, chronicConditions: ['None'] }));
      return;
    }
    setFormData(prev => {
      const filtered = prev.chronicConditions.filter(c => c !== 'None');
      return {
        ...prev,
        chronicConditions: filtered.includes(cond) 
          ? filtered.filter(c => c !== cond) 
          : [...filtered, cond]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    // If offline, queue in IndexedDB Outbox
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      try {
        const userId = currentUser?.id || 'demo_patient';
        await queueOperation({
          userId,
          operationType: 'UPDATE_HEALTH_PROFILE',
          endpoint: '/api/patient/profile',
          method: 'PUT',
          payload: formData
        });
        setStatusMessage({
          type: 'warning',
          text: 'You are currently offline. Health profile updates have been queued in your local Outbox and will synchronize automatically when signal returns.'
        });
        if (onOutboxChanged) onOutboxChanged();
        setTimeout(() => router.push('/patient'), 1500);
      } catch (err) {
        setStatusMessage({ type: 'danger', text: `Failed to save offline: ${err.message}` });
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update record');

      setStatusMessage({ type: 'success', text: 'Health profile updated successfully. Redirecting to dashboard...' });
      setTimeout(() => router.push('/patient'), 1200);
    } catch (err) {
      if (err.name === 'TypeError' || err.message.includes('fetch') || !navigator.onLine) {
        try {
          const userId = currentUser?.id || 'demo_patient';
          await queueOperation({
            userId,
            operationType: 'UPDATE_HEALTH_PROFILE',
            endpoint: '/api/patient/profile',
            method: 'PUT',
            payload: formData
          });
          setStatusMessage({
            type: 'warning',
            text: 'Network disconnected during save. Changes saved to your local Outbox and will synchronize automatically once reconnected.'
          });
          if (onOutboxChanged) onOutboxChanged();
          setTimeout(() => router.push('/patient'), 1500);
        } catch (queueErr) {
          setStatusMessage({ type: 'danger', text: `Failed to save: ${queueErr.message}` });
        }
      } else {
        setStatusMessage({ type: 'danger', text: err.message || 'Failed to save profile.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout portalName="Health Profile & Medical Background" requiredRole="patient" icon={Heart}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Diagnostic disclaimer banner */}
        <Alert type="info" title="Clinical Purpose">
          This record provides essential clinical background for consulting doctors. Samālōcane does not independently diagnose diseases. In emergency situations, dial 108 immediately.
        </Alert>

        {statusMessage && (
          <Alert type={statusMessage.type}>
            {statusMessage.text}
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Demographics */}
            <div className="space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">
                1. Basic Information & Taluka
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other / Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">Taluka (Coastal / Hill)</label>
                  <select
                    value={formData.taluka}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    {['Kumta', 'Karwar', 'Bhatkal', 'Ankola', 'Honnavar', 'Madikeri', 'Somwarpet', 'Sakleshpur', 'Sirsi'].map(t => (
                      <option key={t} value={t}>{t} Taluka</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">Mobile Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">
                2. Chronic Conditions
              </h3>
              <div className="flex flex-wrap gap-2">
                {commonConditions.map(cond => {
                  const isSelected = formData.chronicConditions.includes(cond);
                  return (
                    <button
                      type="button"
                      key={cond}
                      onClick={() => toggleCondition(cond)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition ${
                        isSelected 
                          ? 'bg-teal-600 border-teal-600 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{cond}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Critical Allergies Box in High Contrast Red */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2">
                <label className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-rose-900 uppercase">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Known Drug Allergies (Prominently Flagged for Doctors)
                </label>
                <p className="text-xs sm:text-sm text-rose-700">
                  Please list any adverse reactions to medicines (e.g., Penicillin, Sulfa, Aspirin).
                </p>
                <input
                  type="text"
                  placeholder="e.g. Penicillin causes severe hives; No known drug allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full bg-white border border-rose-300 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">Current Medications</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Amlodipine 5mg morning, Metformin 500mg night"
                  value={formData.currentMedications}
                  onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">
                3. Emergency Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">Emergency Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ganesh (Son) or Kavitha (Spouse)"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98450 67890"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button type="button" variant="secondary" onClick={() => router.push('/patient')}>
                Cancel
              </Button>

              <Button type="submit" variant="primary" disabled={saving}>
                <Save className="w-4 h-4 mr-1.5" />
                <span>{saving ? 'Saving...' : 'Save Health Record'}</span>
              </Button>
            </div>

          </form>
        </Card>

      </div>
    </PortalLayout>
  );
}
