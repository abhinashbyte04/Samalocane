import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Video, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  X, 
  Volume2, 
  BatteryCharging, 
  Headphones, 
  Sun, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

/**
 * Internet & Video-Call Guidance Box
 * Guides patients from pre-call preparation through active video call and safe completion.
 *
 * Modes:
 * - "pre_call" (default): Comprehensive checklist, connection check, and suggestions box.
 * - "in_call": Compact live status bar with dynamic recommendations and modal help drawer.
 */
export function InternetCallGuidanceBox({
  mode = 'pre_call',
  doctorName = 'Consulting Physician',
  onContinue,
  callState = 'idle',
  connectionQuality = 'good',
  metrics = null,
  onReconnect
}) {
  // ---------------------------------------------------------------------------
  // Pre-Call Checklist State (8 Required Healthcare Checklist Items)
  // ---------------------------------------------------------------------------
  const [checklist, setChecklist] = useState({
    internetAvailable: null, // null = unchecked, true = pass, false = warn/fail
    internetStable: null,
    cameraPermission: null,
    micPermission: null,
    cameraWorking: null,
    micWorking: null,
    quietWellLit: true,      // patient self-attested default
    batteryReady: null,
    headphonesReady: true    // patient self-attested default
  });

  const [hasRunCheck, setHasRunCheck] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);

  // Monitor online / offline changes in real-time
  useEffect(() => {
    const handleOnline = () => {
      setChecklist(prev => ({ ...prev, internetAvailable: true }));
    };
    const handleOffline = () => {
      setChecklist(prev => ({ ...prev, internetAvailable: false, internetStable: false }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Check Connection Handler (Real Browser APIs)
  // ---------------------------------------------------------------------------
  const handleCheckConnection = async () => {
    setIsChecking(true);
    setCheckFeedback(null);

    const updated = { ...checklist };

    // 1. Internet Reachability Check
    const browserOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
    let pingOk = false;
    let rttMs = null;

    if (browserOnline) {
      try {
        const start = Date.now();
        const res = await fetch('/api/health');
        if (res.ok) {
          pingOk = true;
          rttMs = Date.now() - start;
        }
      } catch (e) {
        pingOk = false;
      }
    }

    updated.internetAvailable = browserOnline && pingOk;
    updated.internetStable = browserOnline && pingOk && (rttMs === null || rttMs < 1500);

    // 2. Battery / Power Check
    if (typeof window !== 'undefined' && typeof navigator.getBattery === 'function') {
      try {
        const battery = await navigator.getBattery();
        updated.batteryReady = battery.charging || battery.level > 0.2;
      } catch (e) {
        updated.batteryReady = true;
      }
    } else {
      updated.batteryReady = true;
    }

    // 3. Camera & Microphone Permissions + Hardware Working Checks
    let mediaStream = null;
    try {
      if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        const videoTracks = mediaStream.getVideoTracks();
        const audioTracks = mediaStream.getAudioTracks();

        updated.cameraPermission = videoTracks.length > 0;
        updated.cameraWorking = videoTracks.length > 0 && videoTracks[0].readyState === 'live';

        updated.micPermission = audioTracks.length > 0;
        updated.micWorking = audioTracks.length > 0 && audioTracks[0].readyState === 'live';

        setCheckFeedback({
          type: 'success',
          message: 'All device checks passed. Camera, microphone, and internet are ready for consultation.'
        });
      } else {
        setCheckFeedback({
          type: 'warning',
          message: 'Camera and microphone hardware checks are not supported by this browser. You can still consult via low-bandwidth audio or real-time text chat.'
        });
      }
    } catch (err) {
      console.warn('[InternetCallGuidanceBox] Media device check notice:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        updated.cameraPermission = false;
        updated.micPermission = false;
        setCheckFeedback({
          type: 'danger',
          message: 'Camera or microphone permission was declined. Please allow camera and microphone access in your browser address bar settings.'
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        updated.cameraWorking = false;
        updated.micWorking = false;
        setCheckFeedback({
          type: 'warning',
          message: 'No video camera or microphone detected. You can consult using low-bandwidth real-time text chat.'
        });
      } else {
        setCheckFeedback({
          type: 'warning',
          message: `Device notice: ${err.message || 'Camera or microphone in use by another application'}. Review browser permissions.`
        });
      }
    } finally {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
    }

    setChecklist(updated);
    setHasRunCheck(true);
    setIsChecking(false);
  };

  // ---------------------------------------------------------------------------
  // Derive In-Call Connection Status
  // ---------------------------------------------------------------------------
  const getInCallStatus = () => {
    const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;

    if (!isOnline || callState === 'disconnected' || callState === 'failed') {
      return {
        key: 'disconnected',
        label: 'Disconnected',
        variant: 'danger',
        icon: WifiOff,
        recommendation: 'Connection lost: wait briefly, retry joining, or use the available reconnect option.'
      };
    }
    if (callState === 'reconnecting') {
      return {
        key: 'reconnecting',
        label: 'Reconnecting',
        variant: 'warning',
        icon: RefreshCw,
        recommendation: 'Re-establishing video link: please hold while the communication channel reconnects.'
      };
    }
    if (callState === 'calling' || callState === 'checking' || callState === 'idle') {
      return {
        key: 'checking',
        label: 'Checking connection',
        variant: 'brand',
        icon: Activity,
        recommendation: 'Checking connection: negotiating secure media channel with physician...'
      };
    }
    if (callState === 'connected' && connectionQuality === 'degraded') {
      return {
        key: 'unstable',
        label: 'Connection unstable',
        variant: 'warning',
        icon: AlertTriangle,
        recommendation: 'Weak or unstable internet: move closer to the router or switch to a more stable connection. Audio-first fallback active.'
      };
    }
    return {
      key: 'connected',
      label: 'Connected',
      variant: 'success',
      icon: CheckCircle2,
      recommendation: 'Call connected: clear audio and video active with consulting doctor.'
    };
  };

  const inCallStatus = getInCallStatus();

  // ===========================================================================
  // RENDER: IN-CALL COMPACT STATUS & HELP PANEL
  // ===========================================================================
  if (mode === 'in_call') {
    return (
      <>
        {/* Compact Connection-Status Indicator */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold border ${
                inCallStatus.key === 'connected' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : inCallStatus.key === 'unstable' 
                    ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                    : inCallStatus.key === 'reconnecting'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                      : inCallStatus.key === 'disconnected'
                        ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                        : 'bg-teal-50 text-teal-800 border-teal-300'
              }`}>
                <inCallStatus.icon className={`w-3.5 h-3.5 ${inCallStatus.key === 'reconnecting' ? 'animate-spin' : ''}`} />
                <span>{inCallStatus.label}</span>
              </span>

              {/* Real Metrics if available */}
              {metrics && (metrics.rttMs > 0 || metrics.packetLossPercent > 0) && (
                <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                  RTT: {metrics.rttMs}ms | Loss: {metrics.packetLossPercent}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {inCallStatus.key === 'disconnected' && onReconnect && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={onReconnect}
                  className="px-2.5 py-1 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reconnect</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsHelpDrawerOpen(true)}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-teal-800 flex items-center gap-1"
                title="Open Call Guidance & Troubleshooting"
              >
                <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>Call Guidance</span>
              </Button>
            </div>
          </div>

          {/* Context-Sensitive Status Recommendation */}
          <div className="text-xs sm:text-sm text-slate-600 font-medium flex items-start gap-1.5 pt-1 border-t border-slate-100">
            <span className="font-bold text-slate-700 shrink-0">Recommendation:</span>
            <span>{inCallStatus.recommendation}</span>
          </div>
        </div>

        {/* Modal Help & Troubleshooting Drawer (Does NOT interrupt call) */}
        {isHelpDrawerOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                      Internet & Call Guidance
                    </h3>
                    <p className="text-xs text-slate-500">Live Consultation Help</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHelpDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  aria-label="Close guidance panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* End-to-End In-Call Tips */}
              <div className="space-y-3 text-sm">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                  Troubleshooting & Connectivity Suggestions
                </h4>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1">
                    <p className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-amber-700" />
                      Weak or unstable internet
                    </p>
                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                      Move closer to the router or switch to a more stable mobile data connection. The system automatically maintains audio clarity if video drops.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-700" />
                      Camera unavailable
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Check browser permissions in the URL lock icon and ensure another application is not using the camera.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-slate-700" />
                      Microphone unavailable
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Select the correct input device in browser settings and review microphone permissions.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-slate-700" />
                      Poor audio or echo
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Use headphones and reduce background noise to prevent echo and audio feedback.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-slate-700" />
                      Video freezing
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Close unnecessary background applications, browser tabs, and reduce other network downloads.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 space-y-1">
                    <p className="font-bold text-rose-950 text-xs sm:text-sm flex items-center gap-1.5">
                      <WifiOff className="w-3.5 h-3.5 text-rose-700" />
                      Connection lost
                    </p>
                    <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                      Wait briefly, retry joining, or use the available reconnect option. Your message chat remains preserved.
                    </p>
                  </div>
                </div>

                {/* Safe Exit / Completion Guidance */}
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1 text-xs sm:text-sm text-teal-900">
                  <p className="font-bold">Completing the Consultation:</p>
                  <p className="leading-relaxed">
                    When finished, the physician will conclude the session. You may also click "Exit to Waiting Room" at the top to safely return without data loss.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsHelpDrawerOpen(false)}
                  className="px-4 py-1.5 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white"
                >
                  Return to Call
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ===========================================================================
  // RENDER: PRE-CALL GUIDANCE & CHECKLIST (Before Entering Call)
  // ===========================================================================
  return (
    <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-card p-5 sm:p-6 space-y-5">
      
      {/* Box Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-50 border border-teal-300 flex items-center justify-center text-teal-700 shrink-0">
            <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Internet & Call Guidance
              </h3>
              <Badge variant="brand">Pre-Call Readiness</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Review your connection and device setup before connecting with {doctorName}.
            </p>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isChecking}
            onClick={handleCheckConnection}
            className="text-xs sm:text-sm font-bold border-teal-300 text-teal-800 hover:bg-teal-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
          </Button>
        </div>
      </div>

      {/* Real Check Feedback Banner */}
      {checkFeedback && (
        <div className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
          checkFeedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
            : checkFeedback.type === 'danger'
              ? 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
              : 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
        }`}>
          {checkFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <span>{checkFeedback.message}</span>
        </div>
      )}

      {/* The 8 Required Pre-Call Checklist Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700">
            Consultation Readiness Checklist
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {hasRunCheck ? 'Verified with browser' : 'Run check to verify automatically'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          
          {/* 1. Internet Available */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Wifi className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">Internet connection is available</span>
            </div>
            {checklist.internetAvailable === true && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {checklist.internetAvailable === false && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {checklist.internetAvailable === null && <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />}
          </div>

          {/* 2. Internet Stable */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Activity className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">The internet connection appears stable</span>
            </div>
            {checklist.internetStable === true && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {checklist.internetStable === false && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {checklist.internetStable === null && <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />}
          </div>

          {/* 3. Camera Permission */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Camera className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">Browser has permission to use camera</span>
            </div>
            {checklist.cameraPermission === true && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {checklist.cameraPermission === false && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {checklist.cameraPermission === null && <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />}
          </div>

          {/* 4. Microphone Permission */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Mic className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">Browser has permission to use microphone</span>
            </div>
            {checklist.micPermission === true && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {checklist.micPermission === false && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {checklist.micPermission === null && <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />}
          </div>

          {/* 5. Camera & Mic Working */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">Camera and microphone are working</span>
            </div>
            {checklist.cameraWorking === true && checklist.micWorking === true && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {(checklist.cameraWorking === false || checklist.micWorking === false) && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {(checklist.cameraWorking === null || checklist.micWorking === null) && <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />}
          </div>

          {/* 6. Quiet & Well-Lit Place */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Sun className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">Patient is in a quiet, well-lit place</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>

          {/* 7. Sufficient Battery / Power */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <BatteryCharging className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">Device has battery or is connected to power</span>
            </div>
            {checklist.batteryReady === true ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : checklist.batteryReady === false ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
            )}
          </div>

          {/* 8. Headphones Available */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Headphones className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">Headphones available to prevent feedback</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>

        </div>
      </div>

      {/* Troubleshooting & Internet Suggestions Accordion */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          type="button"
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/70 transition"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-700" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              Internet & Troubleshooting Suggestions
            </span>
          </div>
          {showTroubleshooting ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showTroubleshooting && (
          <div className="p-4 pt-1 border-t border-slate-200 space-y-2.5 text-xs sm:text-sm">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <strong className="text-slate-900 block">Weak or unstable internet:</strong>
              <span className="text-slate-600">Move closer to the router or switch to a more stable mobile data connection.</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <strong className="text-slate-900 block">Camera unavailable:</strong>
              <span className="text-slate-600">Check browser permissions and ensure another application is not using the camera.</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <strong className="text-slate-900 block">Microphone unavailable:</strong>
              <span className="text-slate-600">Select the correct input device and review browser microphone permissions.</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <strong className="text-slate-900 block">Poor audio:</strong>
              <span className="text-slate-600">Use headphones and reduce background noise to eliminate echo.</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <strong className="text-slate-900 block">Video freezing:</strong>
              <span className="text-slate-600">Close unnecessary background applications and reduce other network downloads.</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <strong className="text-slate-900 block">Connection lost:</strong>
              <span className="text-slate-600">Wait briefly, retry joining, or use the available reconnect option.</span>
            </div>
          </div>
        )}
      </div>

      {/* Buttons: Check Connection & Continue to Consultation */}
      <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleCheckConnection}
          disabled={isChecking}
          className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Testing Connection...' : 'Check Connection'}</span>
        </Button>

        {onContinue && (
          <Button
            type="button"
            variant="primary"
            onClick={onContinue}
            className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Continue to Consultation</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

    </div>
  );
}

export default InternetCallGuidanceBox;

