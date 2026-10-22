import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { 
  PhoneCall, Video, MessageSquare, Send, Clock, Check, 
  CheckCheck, AlertTriangle, ArrowLeft, ShieldCheck, RefreshCw, 
  Wifi, WifiOff, Mic, MicOff, Camera, CameraOff, User, Stethoscope, PhoneOff, Activity 
} from 'lucide-react';
import { useWebRTC } from '../../../hooks/useWebRTC';
import { InternetCallGuidanceBox } from '../../../components/consultation/InternetCallGuidanceBox';

export default function ConsultationRoomPage() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Local message outbox for offline queueing
  const [outbox, setOutbox] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);

  // Initial Identity & Consultation Fetch
  useEffect(() => {
    if (!id) return;

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(async (authData) => {
        const user = authData?.user || {
          id: 'usr-pat-01',
          email: 'patient.demo@samalocane.in',
          full_name: 'Smt. Parvathi',
          role: 'patient'
        };
        setSession(user);

        // Fetch consultation details
        const cRes = await fetch(`/api/consultations/${id}`);
        if (!cRes.ok) {
          const err = await cRes.json();
          throw new Error(err.message || 'Consultation not found');
        }
        const cData = await cRes.json();
        setConsultation(cData.consultation);

        // Join communication session
        const sRes = await fetch(`/api/consultations/${id}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: cData.consultation.requested_mode || 'audio' })
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          setActiveSession(sData.session);
        }

        // Load messages
        loadMessages();
      })
      .catch(err => {
        setErrorMsg(err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // WebRTC & Dynamic Network Adaptation Hook
  const rtc = useWebRTC(
    id,
    session?.role,
    consultation?.requested_mode || 'audio'
  );

  // Load Message History
  const loadMessages = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/consultations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.warn('[Messages Load Error]', e);
    }
  };

  // Periodic Message Sync & Heartbeat
  useEffect(() => {
    if (!id || !session) return;
    const interval = setInterval(() => {
      loadMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [id, session]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOutbox();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [outbox]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, outbox]);

  // Send Message with Client UUID & Instant Server ACK
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const clientMsgId = 'cmsg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    const content = inputContent.trim();
    setInputContent('');

    // Optimistic pending entry in outbox
    const optimisticMsg = {
      client_msg_id: clientMsgId,
      sender_id: session.id,
      sender_name: session.full_name,
      sender_role: session.role,
      content,
      server_received_at: null,
      isPending: true
    };

    setOutbox(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/consultations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientMsgId, content })
      });

      if (!res.ok) throw new Error('Failed to deliver message');
      const data = await res.json();

      if (data.ack) {
        setOutbox(prev => prev.filter(m => m.client_msg_id !== clientMsgId));
        setMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      console.warn('[Outbox] Message queued for retry:', err.message);
    }
  };

  const flushOutbox = async () => {
    if (outbox.length === 0) return;
    const queued = [...outbox];
    for (const msg of queued) {
      try {
        const res = await fetch(`/api/consultations/${id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientMsgId: msg.client_msg_id, content: msg.content })
        });
        if (res.ok) {
          const data = await res.json();
          setOutbox(prev => prev.filter(m => m.client_msg_id !== msg.client_msg_id));
          setMessages(prev => [...prev, data.message]);
        }
      } catch (e) {
        break;
      }
    }
  };

  // Doctor Conclude Consultation
  const handleConcludeConsultation = async () => {
    if (!confirm('Are you sure you want to conclude this clinical consultation?')) return;
    try {
      rtc.endCall();

      await fetch(`/api/consultations/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus: 'completed',
          reason: 'Clinical consultation concluded normally by physician.'
        })
      });

      await fetch(`/api/consultations/${id}/session`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' })
      });

      router.push(session.role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      alert('Failed to conclude session: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Connecting to consultation session...</p>
      </div>
    );
  }

  if (errorMsg || !consultation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        <Alert type="danger" title="Consultation Access Denied">
          {errorMsg || 'You do not have permission to join this consultation session.'}
        </Alert>
        <Link href="/patient" className="text-xs font-bold text-teal-700 hover:underline">
          &larr; Return to Dashboard
        </Link>
      </div>
    );
  }

  const isPatient = session?.id === consultation.patient_id;
  const isDoctor = session?.id === consultation.doctor_id || session?.role === 'doctor';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link 
            href={`/consultation/waiting/${consultation.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit to Waiting Room</span>
          </Link>
          <span className="text-slate-300">|</span>
          <Link 
            href="/patient"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900"
          >
            <span>Patient Portal</span>
          </Link>
        </div>

        {/* Dynamic Network Adaptation & Health Pill */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${
              rtc.connectionQuality === 'good' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : rtc.connectionQuality === 'degraded'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}>
              <Activity className="w-4 h-4" />
              <span className="capitalize">{rtc.connectionQuality} Network</span>
              <span className="font-mono text-xs text-slate-500">
                (RTT: {rtc.metrics.rttMs}ms | Loss: {rtc.metrics.packetLossPercent}%)
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-rose-50 text-rose-800 border border-rose-300 animate-pulse">
              <WifiOff className="w-4 h-4 text-rose-600" />
              <span>Offline (Outbox Active)</span>
            </span>
          )}

          {/* WebRTC Call State Badge */}
          <Badge variant={
            rtc.callState === 'connected' ? 'success' :
            rtc.callState === 'calling' ? 'warning' :
            rtc.callState === 'reconnecting' ? 'danger' : 'neutral'
          }>
            ● {rtc.callState === 'connected' ? 'Call Active' : 
               rtc.callState === 'calling' ? 'Calling...' : 
               rtc.callState === 'reconnecting' ? 'Reconnecting...' : 'Idle'}
          </Badge>

          <Badge variant="brand" className="font-mono text-sm">
            {consultation.reference_number || consultation.id}
          </Badge>
        </div>
      </div>

      {/* Live Internet & Call Guidance Indicator (Requirement A, D, E) */}
      <InternetCallGuidanceBox
        mode="in_call"
        doctorName={consultation?.doctor_name || 'Consulting Physician'}
        callState={rtc.callState}
        connectionQuality={rtc.connectionQuality}
        metrics={rtc.metrics}
        onReconnect={() => {
          if (rtc.startCall) {
            rtc.startCall(rtc.consultationMode || 'audio');
          }
        }}
      />

      {/* Degraded Network Notice Banner */}
      {rtc.connectionQuality === 'degraded' && (
        <Alert type="warning" title="Network Adaptation Active (Low Bandwidth)">
          High latency or packet loss (&gt;5%) detected on connection. Outgoing video transmission has been automatically paused to protect clinical audio intelligibility.
        </Alert>
      )}

      {/* Permission Denied Alert */}
      {rtc.error && (
        <Alert type="danger" title="Media Device Access Notice">
          {rtc.error}. Fallback to Low-Bandwidth Real-Time Chat is active.
        </Alert>
      )}

      {/* Main Grid: Left = Video/Audio Stage, Right = Real-Time Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column: Media Stage & Controls */}
        <div className="lg:col-span-1 space-y-4">
          
          <Card className="p-4 space-y-3 bg-slate-950 text-white border-slate-800 relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                Consultation Stage
              </span>
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                Mode: {rtc.consultationMode}
              </span>
            </div>

            {/* Media Window Container */}
            <div className="h-56 rounded-xl bg-slate-900 relative flex items-center justify-center border border-slate-800 overflow-hidden">
              
              {/* Remote Video Stream Element */}
              <video 
                ref={rtc.remoteVideoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover ${rtc.consultationMode === 'video' && rtc.hasRemoteStream ? 'block' : 'hidden'}`}
              />

              {/* Audio-Only / Fallback Avatar Stage */}
              {(rtc.consultationMode !== 'video' || !rtc.hasRemoteStream) && (
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-teal-900/60 border-2 border-teal-500/40 flex items-center justify-center text-teal-300 animate-pulse">
                    {isDoctor ? <User className="w-8 h-8" /> : <Stethoscope className="w-8 h-8" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">
                      {isDoctor ? (consultation.patient_name || 'Patient') : (consultation.doctor_name || 'Dr. Specialist')}
                    </h4>
                    <p className="text-xs sm:text-sm text-teal-300">
                      {rtc.callState === 'connected' ? 'Audio Stream Connected' : 'Waiting for connection...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Video Pip (Picture-in-Picture) Preview */}
              <div className="absolute bottom-2 right-2 w-24 h-20 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shadow-md">
                <video 
                  ref={rtc.localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${!rtc.isCameraOff ? 'block' : 'hidden'}`}
                />
                {rtc.isCameraOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-xs text-slate-400">
                    <CameraOff className="w-4 h-4 mb-0.5 text-slate-500" />
                    <span>Cam Off</span>
                  </div>
                )}
              </div>

            </div>

            {/* Media Control Bar */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={rtc.toggleMic}
                className={`py-2 px-1 rounded-xl border text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center gap-1 ${
                  rtc.isMicMuted 
                    ? 'bg-rose-600 text-white border-rose-700' 
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title={rtc.isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {rtc.isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span className="text-xs">{rtc.isMicMuted ? 'Muted' : 'Mic On'}</span>
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={rtc.toggleCamera}
                className={`py-2 px-1 rounded-xl border text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center gap-1 ${
                  rtc.isCameraOff 
                    ? 'bg-rose-600 text-white border-rose-700' 
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title={rtc.isCameraOff ? 'Enable Camera' : 'Disable Camera'}
              >
                {rtc.isCameraOff ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                <span className="text-xs">{rtc.isCameraOff ? 'Cam Off' : 'Cam On'}</span>
              </button>

              {/* Start Call / Connect */}
              <button
                type="button"
                onClick={() => rtc.startCall(rtc.consultationMode)}
                className={`py-2 px-1 rounded-xl border text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center gap-1 ${
                  rtc.callState === 'connected' 
                    ? 'bg-emerald-700 text-white border-emerald-800 cursor-default' 
                    : 'bg-teal-600 text-white border-teal-500 hover:bg-teal-700'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                <span className="text-xs">{rtc.callState === 'connected' ? 'Live' : 'Connect'}</span>
              </button>

              {/* Hangup / End */}
              <button
                type="button"
                onClick={rtc.endCall}
                className="py-2 px-1 rounded-xl border border-slate-700 bg-slate-800 text-rose-400 hover:bg-rose-900/50 hover:text-white transition flex flex-col items-center justify-center gap-1 text-xs sm:text-sm font-bold"
                title="Disconnect Call"
              >
                <PhoneOff className="w-4 h-4" />
                <span className="text-xs">Hang Up</span>
              </button>

            </div>

            {/* Mode Adaptation Selector */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Bandwidth Mode Adaptation:
              </span>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => rtc.switchMode('video')}
                  className={`py-1.5 px-2 rounded-lg font-bold border transition ${
                    rtc.consultationMode === 'video' ? 'bg-teal-600 text-white border-teal-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => rtc.switchMode('audio_only')}
                  className={`py-1.5 px-2 rounded-lg font-bold border transition ${
                    rtc.consultationMode === 'audio_only' ? 'bg-teal-600 text-white border-teal-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Audio Only
                </button>
                <button
                  type="button"
                  onClick={() => rtc.switchMode('text_chat')}
                  className={`py-1.5 px-2 rounded-lg font-bold border transition ${
                    rtc.consultationMode === 'text_chat' ? 'bg-teal-600 text-white border-teal-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Text Only
                </button>
              </div>
            </div>

            {/* Doctor Conclude Button */}
            {isDoctor && (
              <div className="pt-2">
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="w-full flex items-center justify-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-sm font-bold"
                  onClick={handleConcludeConsultation}
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Conclude Consultation</span>
                </Button>
              </div>
            )}

          </Card>

          {/* Clinical Context */}
          <Card className="text-sm space-y-2">
            <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs">
              Clinical Context
            </h4>
            <div className="space-y-1 text-slate-700">
              <p><strong>Chief Complaint:</strong> {consultation.chief_complaint}</p>
              {consultation.symptoms && (
                <p><strong>Reported Symptoms:</strong> {consultation.symptoms}</p>
              )}
            </div>
          </Card>

        </div>

        {/* Right Column: Verified Real-Time Chat with Server ACK */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[580px] p-0 overflow-hidden border-slate-200">
            
            {/* Chat Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-700" />
                  Verified Real-Time Consultation Chat
                </h3>
                <span className="text-xs sm:text-sm text-slate-500">
                  Every message is cryptographically logged with server delivery acknowledgement (ACK).
                </span>
              </div>
              <Badge variant="brand">Server ACK Active</Badge>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
              {messages.length === 0 && outbox.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">No messages in consultation session yet.</p>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Send a message below to start communicating with the {isDoctor ? 'patient' : 'physician'}.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map(msg => {
                    const isSelf = msg.sender_id === session.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-0.5 px-1 font-semibold">
                          <span>{msg.sender_name || (isSelf ? 'You' : 'Peer')}</span>
                          <span>•</span>
                          <span>{new Date(msg.server_received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className={`max-w-md p-3.5 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                          isSelf 
                            ? 'bg-teal-700 text-white rounded-br-xs' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          
                          <div className={`mt-1 flex items-center justify-end gap-1 text-xs ${
                            isSelf ? 'text-teal-200' : 'text-slate-400'
                          }`}>
                            <CheckCheck className="w-3.5 h-3.5 text-teal-300" />
                            <span>Server ACK</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pending Outbox Messages (Clock Icon 🕒) */}
                  {outbox.map(pendingMsg => (
                    <div 
                      key={pendingMsg.client_msg_id} 
                      className="flex flex-col items-end opacity-75"
                    >
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5 px-1">
                        <span>You (Queued in Device Outbox)</span>
                      </div>

                      <div className="max-w-md p-3.5 rounded-2xl text-sm bg-teal-800 text-white rounded-br-xs border border-dashed border-teal-400 leading-relaxed">
                        <p className="whitespace-pre-wrap">{pendingMsg.content}</p>
                        
                        <div className="mt-1 flex items-center justify-end gap-1 text-xs text-amber-200">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Pending Server ACK...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder={isOnline ? "Type clinical notes or response..." : "Offline: Message will queue in device outbox..."}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                className="flex-1 text-sm sm:text-base p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              />
              <Button 
                type="submit" 
                variant="primary" 
                size="sm"
                disabled={!inputContent.trim()}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 px-5 text-sm sm:text-base"
              >
                <Send className="w-4 h-4 mr-1.5" />
                <span>Send</span>
              </Button>
            </form>

          </Card>
        </div>

      </div>

    </div>
  );
}
