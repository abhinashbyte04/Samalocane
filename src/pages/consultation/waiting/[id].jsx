import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { 
  Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, 
  ArrowLeft, PhoneCall, Video, MessageSquare, RefreshCw, User, Stethoscope 
} from 'lucide-react';

const STATE_STEPS = [
  { key: 'submitted', label: 'Requested' },
  { key: 'pending_doctor_review', label: 'Under Review' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'waiting', label: 'Waiting Room' },
  { key: 'in_progress', label: 'In Consultation' },
  { key: 'completed', label: 'Completed' }
];

export default function WaitingRoomPage() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reasonInput, setReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch consultation details
  const fetchDetails = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/consultations/${id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to load consultation details');
      }
      const data = await res.json();
      setConsultation(data.consultation);
      setStatusHistory(data.statusHistory || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial Identity & Load
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(authData => {
        const user = authData?.user || {
          id: 'usr-pat-01',
          email: 'patient.demo@samalocane.in',
          full_name: 'Smt. Parvathi',
          role: 'patient'
        };
        setSession(user);
      })
      .catch(() => {
        setSession({
          id: 'usr-pat-01',
          email: 'patient.demo@samalocane.in',
          full_name: 'Smt. Parvathi',
          role: 'patient'
        });
      });
  }, []);

  useEffect(() => {
    if (session && id) {
      fetchDetails();
    }
  }, [session, id]);

  // Polling for live status updates (every 5 seconds, stopped if terminal state)
  useEffect(() => {
    if (!consultation) return;
    const isTerminal = ['completed', 'rejected', 'cancelled'].includes(consultation.status);
    if (isTerminal) return;

    const interval = setInterval(() => {
      fetchDetails();
    }, 5000);

    return () => clearInterval(interval);
  }, [consultation?.status, id]);

  // Handle State Transitions
  const handleTransition = async (toStatus, reason = '') => {
    setActionLoading(true);
    setErrorMsg('');
    setActionSuccessMsg('');

    try {
      const res = await fetch(`/api/consultations/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, reason })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to transition to ${toStatus}`);
      }

      setActionSuccessMsg(data.message || `Status updated to ${toStatus}`);
      setShowCancelModal(false);
      setShowRejectModal(false);
      setReasonInput('');
      fetchDetails();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Loading consultation waiting room...</p>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        <Alert type="danger" title="Consultation Not Found">
          {errorMsg || 'The requested consultation could not be found or you do not have permission to access it.'}
        </Alert>
        <Link href="/patient" className="inline-block text-xs font-bold text-teal-700 hover:underline">
          &larr; Return to Patient Portal
        </Link>
      </div>
    );
  }

  const isPatient = session?.id === consultation.patient_id;
  const isDoctor = session?.id === consultation.doctor_id || session?.role === 'doctor';
  const isAdmin = session?.role === 'admin';

  const status = consultation.status;
  const isTerminal = ['completed', 'rejected', 'cancelled'].includes(status);

  // Helper for current step index in normal pipeline
  const currentStepIdx = STATE_STEPS.findIndex(s => s.key === status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Back button and Low Bandwidth Banner */}
      <div className="flex items-center justify-between">
        <Link 
          href={isDoctor ? "/doctor" : "/patient"} 
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isDoctor ? "Back to Doctor Portal" : "Back to Dashboard"}</span>
        </Link>

        <span className="text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Low-Bandwidth Synchronized
        </span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Consultation Session</span>
            <Badge variant="brand" className="font-mono font-bold text-sm">
              {consultation.reference_number || consultation.id}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Virtual Consultation Waiting Room
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Requested Mode: <strong className="uppercase">{consultation.requested_mode}</strong> • Initiated {new Date(consultation.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status === 'completed' && <Badge variant="success">● Completed</Badge>}
          {status === 'in_progress' && <Badge variant="brand" className="animate-pulse">● Active Consultation</Badge>}
          {status === 'waiting' && <Badge variant="warning">● Patient In Waiting Room</Badge>}
          {status === 'accepted' && <Badge variant="brand">● Accepted by Physician</Badge>}
          {status === 'pending_doctor_review' && <Badge variant="neutral">● Under Physician Review</Badge>}
          {status === 'submitted' && <Badge variant="neutral">● Awaiting Response</Badge>}
          {status === 'rejected' && <Badge variant="danger">● Request Declined</Badge>}
          {status === 'cancelled' && <Badge variant="neutral">● Request Cancelled</Badge>}
        </div>
      </div>

      {/* Feedback Alerts */}
      {actionSuccessMsg && (
        <Alert type="success" onClose={() => setActionSuccessMsg('')}>
          {actionSuccessMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert type="danger" onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* Progress Pipeline / Stepper (Shown for active flow) */}
      {!['rejected', 'cancelled'].includes(status) ? (
        <Card className="bg-slate-50 border-slate-200 p-5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
            Consultation Lifecycle Progress
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {STATE_STEPS.map((step, idx) => {
              const isPast = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div 
                  key={step.key} 
                  className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition ${
                    isCurrent 
                      ? 'bg-teal-700 text-white border-teal-800 shadow-2xs font-extrabold ring-2 ring-teal-200' 
                      : isPast 
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold'
                        : 'bg-white text-slate-400 border-slate-200 font-medium'
                  }`}
                >
                  <span className="text-xs uppercase font-mono tracking-wider">Step {idx + 1}</span>
                  <span className="text-xs sm:text-sm">{step.label}</span>
                  {isPast && <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />}
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse mt-1"></span>}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* Terminal Alert */
        <Alert type={status === 'rejected' ? 'danger' : 'warning'} title={status === 'rejected' ? 'Consultation Declined' : 'Consultation Cancelled'}>
          {status === 'rejected' && (
            <p>
              The doctor was unable to accept this consultation request. 
              {consultation.rejection_reason && <span className="block mt-1 font-bold">Reason: {consultation.rejection_reason}</span>}
              Please select another available doctor from the directory.
            </p>
          )}
          {status === 'cancelled' && (
            <p>
              This consultation request was cancelled.
              {consultation.cancellation_reason && <span className="block mt-1 font-bold">Reason: {consultation.cancellation_reason}</span>}
            </p>
          )}
        </Alert>
      )}

      {/* Primary Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Doctor & Patient Info */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader 
              title="Participants & Health Concern" 
              subtitle="Verified medical records for this telemedicine session"
            />

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-xs flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Patient
                  </span>
                  <p className="font-extrabold text-slate-900 text-base">
                    {consultation.patient_name || 'Patient'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-xs flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Consulting Physician
                  </span>
                  <p className="font-extrabold text-teal-800 text-base">
                    {consultation.doctor_name || 'Doctor'}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    {consultation.specialty_name || 'General Medicine'} • {consultation.doctor_qualification || 'MBBS'}
                  </p>
                  {consultation.doctor_council_reg && (
                    <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SMC Reg: {consultation.doctor_council_reg}
                    </p>
                  )}
                </div>
              </div>

              {/* Stated Symptoms and Reason */}
              <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Chief Complaint
                </span>
                <p className="font-bold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 text-base">
                  {consultation.chief_complaint}
                </p>

                {consultation.symptoms && (
                  <>
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-xs block mt-2">
                      Reported Symptoms
                    </span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                      {consultation.symptoms}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Status Transition Audit History */}
          <Card>
            <CardHeader 
              title="Audit Trail & Status History" 
              subtitle="Verifiable record of state changes logged for this consultation"
            />
            {statusHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No transition history recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Transition</th>
                      <th className="py-2.5 px-3">Actor Role</th>
                      <th className="py-2.5 px-3">Notes / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statusHistory.map((h, i) => (
                      <tr key={h.id || i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                          {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <span className="text-slate-500 font-normal">{h.from_status}</span> &rarr; <span className="font-bold text-teal-800">{h.to_status}</span>
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-700 font-medium">
                          {h.actor_role}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 italic">
                          {h.reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Action Panel Sidebar */}
        <div className="space-y-4">
          
          <Card className="border-teal-200 bg-teal-50/40">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-900 mb-2">
              Telemedicine Actions
            </h3>

            {/* In Progress Call View */}
            {status === 'in_progress' && (
              <div className="space-y-3 p-3.5 bg-emerald-100/60 border border-emerald-300 rounded-xl text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto animate-bounce">
                  {consultation.requested_mode === 'video' ? <Video className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-base">Consultation In Session</h4>
                  <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                    Live channel active via {consultation.requested_mode.toUpperCase()}.
                  </p>
                </div>

                <Link href={`/consultation/room/${consultation.id}`} className="block">
                  <Button variant="primary" size="sm" className="w-full bg-emerald-700 hover:bg-emerald-800 font-bold text-sm">
                    Open Live Consultation & Chat &rarr;
                  </Button>
                </Link>

                {isDoctor && (
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="w-full mt-2" 
                    disabled={actionLoading}
                    onClick={() => handleTransition('completed', 'Consultation finished successfully')}
                  >
                    Conclude Consultation
                  </Button>
                )}
              </div>
            )}

            {/* Waiting State: Patient View */}
            {status === 'waiting' && isPatient && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                <Clock className="w-6 h-6 text-amber-500 mx-auto animate-spin" />
                <h4 className="font-bold text-slate-900 text-sm">You are in the waiting queue</h4>
                <p className="text-xs sm:text-sm text-slate-600">
                  The doctor has accepted. Please stay on this page. The consultation will automatically connect once the doctor begins.
                </p>
                <Link href={`/consultation/room/${consultation.id}`} className="block pt-1">
                  <Button variant="secondary" size="sm" className="w-full text-sm">
                    Open Real-Time Chat & Session &rarr;
                  </Button>
                </Link>
              </div>
            )}

            {/* Accepted State: Patient Action to Enter Waiting Room */}
            {status === 'accepted' && isPatient && (
              <div className="space-y-2">
                <Button 
                  variant="primary" 
                  className="w-full"
                  disabled={actionLoading}
                  onClick={() => handleTransition('waiting', 'Patient entered waiting room')}
                >
                  Enter Virtual Waiting Room
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Click to notify the physician that you are present and ready.
                </p>
              </div>
            )}

            {/* Doctor Actions */}
            {(isDoctor || isAdmin) && (
              <div className="space-y-2 mt-2">
                {status === 'submitted' && (
                  <>
                    <Button 
                      variant="primary" 
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => handleTransition('pending_doctor_review', 'Doctor initiated record review')}
                    >
                      Review Health Profile
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={actionLoading}
                      onClick={() => handleTransition('accepted', 'Doctor accepted request')}
                    >
                      Accept Consultation
                    </Button>
                    <Button 
                      variant="danger" 
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => setShowRejectModal(true)}
                    >
                      Decline Request
                    </Button>
                  </>
                )}

                {status === 'pending_doctor_review' && (
                  <>
                    <Button 
                      variant="primary" 
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={actionLoading}
                      onClick={() => handleTransition('accepted', 'Doctor reviewed and accepted request')}
                    >
                      Accept Consultation
                    </Button>
                    <Button 
                      variant="danger" 
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => setShowRejectModal(true)}
                    >
                      Decline Request
                    </Button>
                  </>
                )}

                {(status === 'accepted' || status === 'waiting') && (
                  <Button 
                    variant="primary" 
                    className="w-full bg-teal-800 text-white hover:bg-teal-900"
                    disabled={actionLoading}
                    onClick={() => handleTransition('in_progress', 'Doctor started consultation')}
                  >
                    Start Consultation Now
                  </Button>
                )}
              </div>
            )}

            {/* Patient Cancel Option (Allowed before in_progress) */}
            {isPatient && !isTerminal && status !== 'in_progress' && (
              <div className="pt-3 border-t border-slate-200 mt-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full text-rose-700 hover:bg-rose-50 border-rose-200"
                  disabled={actionLoading}
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Request
                </Button>
              </div>
            )}

            {/* Completed Back Link */}
            {isTerminal && (
              <div className="pt-2">
                <Link href={isDoctor ? "/doctor" : "/patient"}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Return to Portal
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Low Bandwidth Network Tip */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600 text-xs sm:text-sm">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              Low-Bandwidth Guarantee
            </span>
            <p className="leading-relaxed">
              In hill or coastal areas with intermittent 2G/3G connectivity, this waiting room consumes under 2 KB per status check. 
              Audio calls will be prioritized if video throughput is insufficient.
            </p>
          </div>
        </div>

      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full space-y-4">
            <h3 className="font-black text-slate-900 text-base">Decline Consultation</h3>
            <p className="text-xs text-slate-600">
              Please specify a clear clinical or operational reason for declining this request (required):
            </p>
            <textarea 
              rows={3} 
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
              placeholder="e.g., Doctor in emergency surgery; Please book Dr. Ramesh or consult Primary Health Centre."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => { setShowRejectModal(false); setReasonInput(''); }}
              >
                Back
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                disabled={!reasonInput.trim() || actionLoading}
                onClick={() => handleTransition('rejected', reasonInput.trim())}
              >
                Confirm Decline
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full space-y-4">
            <h3 className="font-black text-slate-900 text-base">Cancel Consultation Request</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel this consultation? Please provide a reason:
            </p>
            <textarea 
              rows={3} 
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500"
              placeholder="e.g., Symptoms resolved; Visiting local PHC directly."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => { setShowCancelModal(false); setReasonInput(''); }}
              >
                Keep Request
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                disabled={actionLoading}
                onClick={() => handleTransition('cancelled', reasonInput.trim() || 'Cancelled by patient')}
              >
                Confirm Cancellation
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}

