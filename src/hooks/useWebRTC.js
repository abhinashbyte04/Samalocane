import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCController } from '../lib/webrtcClient';

export function useWebRTC(consultationId, userRole, initialMode = 'audio') {
  const [callState, setCallState] = useState('idle');
  const [consultationMode, setConsultationMode] = useState(initialMode);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [metrics, setMetrics] = useState({
    rttMs: 0,
    packetLossPercent: 0,
    jitterMs: 0,
    bitrateKbps: 0
  });

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(initialMode !== 'video');
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const controllerRef = useRef(null);

  // Initialize controller
  useEffect(() => {
    if (!consultationId || !userRole) return;

    const controller = new WebRTCController(consultationId, userRole, {
      onLocalStream: (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      },
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          setHasRemoteStream(true);
        }
      },
      onConnectionStateChange: (state, iceState) => {
        setCallState(state);
      },
      onQualityChange: (data) => {
        setConnectionQuality(data.currentQuality);
        if (data.metrics) {
          setMetrics({
            rttMs: data.metrics.rttMs || 0,
            packetLossPercent: data.metrics.packetLossPercent || 0,
            jitterMs: data.metrics.jitterMs || 0,
            bitrateKbps: data.metrics.bitrateKbps || 0
          });
        }
      },
      onModeChange: (data) => {
        setConsultationMode(data.newMode);
      },
      onError: (err) => {
        setError(err.message);
      }
    });

    controllerRef.current = controller;

    // Start signaling listener
    controller.startSignalingListener();

    return () => {
      controller.cleanup();
      controllerRef.current = null;
    };
  }, [consultationId, userRole]);

  // Start call
  const startCall = useCallback(async (mode = initialMode) => {
    if (!controllerRef.current) return;
    setError(null);

    try {
      await controllerRef.current.initializeMedia(mode);
      if (userRole === 'doctor') {
        // Doctor initiates offer
        await controllerRef.current.createAndSendOffer();
      }
      setConsultationMode(mode);
    } catch (err) {
      console.warn('[useWebRTC] Media initialization error:', err.message);
      setError(err.message);
      // Auto-fallback to text mode if camera/mic fails
      setConsultationMode('text_chat');
    }
  }, [initialMode, userRole]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (!controllerRef.current) return;
    const muted = controllerRef.current.toggleMicrophone();
    setIsMicMuted(muted);
  }, []);

  // Toggle Camera
  const toggleCamera = useCallback(() => {
    if (!controllerRef.current) return;
    const disabled = controllerRef.current.toggleCamera();
    setIsCameraOff(disabled);
  }, []);

  // Manual Mode Switch
  const switchMode = useCallback((mode) => {
    if (!controllerRef.current) return;
    if (controllerRef.current.adaptationManager) {
      controllerRef.current.adaptationManager.setMode(mode, 'Manual user selection');
    }
    setConsultationMode(mode);
  }, []);

  // End Call
  const endCall = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.sendSignalMessage('call_ended', { reason: 'User terminated call' });
    controllerRef.current.cleanup();
    setCallState('ended');
    setHasRemoteStream(false);
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    callState,
    consultationMode,
    connectionQuality,
    metrics,
    isMicMuted,
    isCameraOff,
    hasRemoteStream,
    error,
    startCall,
    toggleMic,
    toggleCamera,
    switchMode,
    endCall
  };
}

