import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { 
  Stethoscope, 
  ShieldCheck, 
  Radio, 
  Clock, 
  User, 
  AlertTriangle, 
  PhoneCall, 
  Video, 
  MessageSquare, 
  ChevronRight, 
  CheckCircle2,
  Calendar,
  Building2,
  Activity,
  Users
} from 'lucide-react';
import { INITIAL_DEMO_DOCTORS } from '../../data/dummyDoctors';
import { DoctorDirectory } from '../../components/doctor/DoctorDirectory';
import { DoctorDetailModal } from '../../components/doctor/DoctorDetailModal';

export default function DoctorPortal() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sub-navigation tabs: 'directory' (default) vs 'queue'
  const [activeTab, setActiveTab] = useState('directory');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const loadData = async () => {
    try {
      const [docRes, consultData] = await Promise.all([
        fetch('/api/doctors/usr-doc-01').then(r => r.json()).catch(() => ({})),
        fetch('/api/consultations').then(r => r.json()).catch(() => ({}))
      ]);

      const docUser = {
        id: 'usr-doc-01',
        email: 'dr.ramesh.rao@samalocane.in',
        full_name: 'Dr. Ramesh Rao',
        role: 'doctor'
      };

      setSession(docUser);
      const doctorProfile = docRes?.doctor || {
        id: 'usr-doc-01',
        full_name: 'Dr. Ramesh Rao',
        registration_number: 'KMC-48291',
        qualification: 'MBBS, MD (General Medicine)',
        experience_years: 14,
        is_verified: true,
        is_available: true
      };
      setProfile(doctorProfile);
      if (doctorProfile.is_available !== undefined) {
        setIsAvailable(doctorProfile.is_available);
      }
      setConsultations(consultData?.consultations || []);
    } catch (err) {
      console.error('[Doctor Portal Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (router.query.tab && ['directory', 'queue'].includes(router.query.tab)) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  if (loading) {
    return (
      <PortalLayout portalName="Doctor Portal" requiredRole="doctor" icon={Stethoscope}>
        <div className="py-20 text-center text-slate-500 font-bold animate-pulse flex flex-col items-center justify-center space-y-2">
          <Stethoscope className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-600 font-semibold">Loading doctor directory & clinical workspace...</p>
        </div>
      </PortalLayout>
    );
  }

  // Active / pending consultations for queue tab
  const pendingRequests = consultations.filter(c => ['submitted', 'pending_doctor_review', 'accepted', 'waiting', 'in_progress'].includes(c.status));
  const pastConsultations = consultations.filter(c => ['completed', 'rejected', 'cancelled'].includes(c.status));
  const activeConsultation = consultations.find(c => c.status === 'in_progress');

  const handleConnectDoctor = (doc) => {
    const targetId = doc.doctor_user_id || doc.id;
    router.push(`/consultation/request/${targetId}`);
  };

  return (
    <PortalLayout portalName="Doctor Portal" requiredRole="doctor" icon={Stethoscope}>
      <div className="space-y-6">
        
        {/* Sub-Navigation Tabs */}
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
            <span>Doctor Directory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-extrabold">
              {INITIAL_DEMO_DOCTORS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`pb-3 px-1 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'queue'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Physician Queue & Workspace</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              {pendingRequests.length}
            </span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: DOCTOR DIRECTORY & DETAILED PROFILES (DEFAULT ACTIVE) */}
        {/* ===================================================================== */}
        {activeTab === 'directory' && (
          <>
            <DoctorDirectory
              doctors={INITIAL_DEMO_DOCTORS}
              onDoctorSelect={(doc) => setSelectedDoctor(doc)}
              onConnectDoctor={handleConnectDoctor}
            />

            <DoctorDetailModal
              doctor={selectedDoctor}
              isOpen={!!selectedDoctor}
              onClose={() => setSelectedDoctor(null)}
            />
          </>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: PHYSICIAN CLINICAL QUEUE & WORKSPACE */}
        {/* ===================================================================== */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            
            {/* Credentials and Status Card */}
            <Card className="flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs">
                  <Stethoscope className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {session?.full_name}
                    </h2>
                    <Badge variant={profile?.is_verified ? 'success' : 'warning'}>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1" />
                      <span>{profile?.is_verified ? 'KMC Verified (Demo)' : 'Pending Verification'}</span>
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-700">
                    {profile?.specialty_name || 'General Medicine'} • {profile?.qualification || 'MBBS, MD'} • Reg: <strong className="font-mono text-slate-900">{profile?.council_registration_number || 'KMC-48291'}</strong> ({profile?.council_name || 'Karnataka Medical Council'})
                  </p>

                  {profile?.hospital_affiliation && (
                    <p className="text-sm text-slate-600 flex items-center gap-1 pt-0.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{profile.hospital_affiliation}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 block">Consultation Status</span>
                  <span className={`text-sm font-bold ${isAvailable ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {isAvailable ? '● Online & Accepting Requests' : '○ Offline / In Clinic'}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant={isAvailable ? 'primary' : 'secondary'}
                  onClick={() => setIsAvailable(!isAvailable)}
                >
                  <Radio className="w-4 h-4 mr-1" />
                  <span>{isAvailable ? 'Go Offline' : 'Go Online'}</span>
                </Button>
              </div>
            </Card>

            {/* Clinical Queue Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="space-y-1 border-l-4 border-l-amber-500">
                <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Awaiting Action</span>
                <div className="text-2xl sm:text-3xl font-black text-amber-600">{pendingRequests.length}</div>
                <span className="text-xs sm:text-sm text-amber-700 font-medium">In Queue / Review</span>
              </Card>

              <Card className="space-y-1 border-l-4 border-l-teal-600">
                <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Active Live Call</span>
                <div className="text-2xl sm:text-3xl font-black text-teal-700">{activeConsultation ? '1 Active' : 'None'}</div>
                <span className="text-xs sm:text-sm text-teal-600 font-medium">Adaptive WebRTC</span>
              </Card>

              <Card className="space-y-1 border-l-4 border-l-emerald-600">
                <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Completed Consults</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600">{pastConsultations.filter(c => c.status === 'completed').length}</div>
                <span className="text-xs sm:text-sm text-emerald-700 font-medium">Discharge Summaries</span>
              </Card>

              <Card className="space-y-1 border-l-4 border-l-slate-400">
                <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Consultation Fee</span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{profile?.consultation_fee === 0 ? 'Free' : `₹${profile?.consultation_fee || 0}`}</div>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">Rural Mission Subsidized</span>
              </Card>
            </div>

            {/* Incoming Consultation Queue */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Active Consultation Requests ({pendingRequests.length})
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    Patient requests requiring review, acceptance, or waiting room entry
                  </p>
                </div>
                <Badge variant={pendingRequests.length > 0 ? 'warning' : 'neutral'}>
                  {pendingRequests.length} Pending Actions
                </Badge>
              </div>

              {pendingRequests.length === 0 ? (
                <Card className="text-center py-12 space-y-2 border-dashed">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <h4 className="font-bold text-slate-800 text-base">
                    Queue is Clear
                  </h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    No active consultation requests waiting for review. You will receive notifications when patients submit health concerns.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map(consult => (
                    <Card key={consult.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-teal-600 hover:border-teal-500 transition shadow-2xs">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-bold text-teal-800">
                            {consult.reference_number || consult.id}
                          </span>
                          <Badge variant={
                            consult.status === 'in_progress' ? 'brand' :
                            consult.status === 'waiting' ? 'warning' : 'neutral'
                          }>
                            {consult.status}
                          </Badge>
                          <span className="text-xs text-slate-600 font-mono uppercase bg-slate-100 px-2.5 py-0.5 rounded">
                            Mode: {consult.requested_mode}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-slate-900">
                          Chief Complaint: {consult.chief_complaint}
                        </h4>

                        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600">
                          <span>Patient: <strong>{consult.patient_name || 'Registered Patient'}</strong></span>
                          <span>•</span>
                          <span>Received: {new Date(consult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {consult.status === 'in_progress' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => router.push(`/consultation/room/${consult.id}`)}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                          >
                            <span>Resume Live Room</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => router.push(`/consultation/waiting/${consult.id}`)}
                          >
                            <span>Open Waiting Session</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Completed Consultations Summary */}
            {pastConsultations.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Past Consultations ({pastConsultations.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pastConsultations.slice(0, 4).map(c => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-slate-800">{c.reference_number || c.id}</span>
                        <Badge variant={c.status === 'completed' ? 'success' : 'neutral'}>{c.status}</Badge>
                      </div>
                      <p className="text-slate-700 font-medium truncate">{c.chief_complaint}</p>
                      <p className="text-slate-400 text-xs">
                        {new Date(c.created_at).toLocaleDateString()} • Mode: {c.actual_mode_used || c.requested_mode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </PortalLayout>
  );
}
