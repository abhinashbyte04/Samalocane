/**
 * Samālōcane Client WebRTC PeerConnection & Media Controller
 * Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas
 *
 * Implements:
 * 1. RTCPeerConnection initialization with STUN configuration
 * 2. Independent Audio and Video Track Capture & Controls
 * 3. Offer / Answer creation and remote description sequencing
 * 4. Safe ICE Candidate queueing when remote description is pending
 * 5. Dynamic NetworkAdaptationManager integration for automated degradation
 * 6. Clean track disposal and resource teardown
 */

const { NetworkAdaptationManager } = require('./networkAdaptationManager');

const DEFAULT_RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

class WebRTCController {
  constructor(consultationId, userRole, options = {}) {
    this.consultationId = consultationId;
    this.userRole = userRole; // 'patient' | 'doctor'
    this.rtcConfig = options.rtcConfig || DEFAULT_RTC_CONFIG;

    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;

    this.adaptationManager = null;
    this.signalingTimer = null;

    // Queued remote ICE candidates arriving before setRemoteDescription
    this.iceCandidateQueue = [];
    this.hasRemoteDescription = false;

    // Independent control states
    this.isMicMuted = false;
    this.isCameraDisabled = false;

    // Call state: 'idle' | 'calling' | 'connected' | 'reconnecting' | 'ended'
    this.callState = 'idle';

    this.callbacks = {
      onLocalStream: options.onLocalStream || (() => {}),
      onRemoteStream: options.onRemoteStream || (() => {}),
      onConnectionStateChange: options.onConnectionStateChange || (() => {}),
      onQualityChange: options.onQualityChange || (() => {}),
      onModeChange: options.onModeChange || (() => {}),
      onError: options.onError || (() => {})
    };
  }

  /**
   * Initializes local microphone and camera capture
   */
  async initializeMedia(requestedMode = 'audio') {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('WebRTC MediaDevices API is not supported in this environment.');
    }

    const wantVideo = requestedMode === 'video';

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: wantVideo ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { max: 20 } // Low-bandwidth optimization for coastal/hill 3G
        } : false
      });

      this.callbacks.onLocalStream(this.localStream);
      return this.localStream;
    } catch (err) {
      // If video failed, attempt fallback to audio-only capture
      if (wantVideo) {
        console.warn('[WebRTC] Camera access failed. Falling back to audio-only capture:', err.message);
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.callbacks.onLocalStream(this.localStream);
        return this.localStream;
      }
      throw err;
    }
  }

  /**
   * Creates and configures the RTCPeerConnection
   */
  createPeerConnection() {
    if (this.pc) return this.pc;

    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('RTCPeerConnection is not supported by this browser.');
    }

    this.pc = new RTCPeerConnection(this.rtcConfig);
    this.hasRemoteDescription = false;
    this.iceCandidateQueue = [];

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.pc.addTrack(track, this.localStream);
      });
    }

    // Handle incoming remote media tracks
    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) this.remoteStream = new MediaStream();
        this.remoteStream.addTrack(event.track);
      }
      this.callbacks.onRemoteStream(this.remoteStream);
    };

    // Handle local ICE candidates and transmit via signaling endpoint
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalMessage('ice_candidate', {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        });
      }
    };

    // Monitor ICE connection state changes
    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        this.callState = 'connected';
        if (this.adaptationManager) {
          this.adaptationManager.startMonitoring();
        }
      } else if (state === 'disconnected') {
        this.callState = 'reconnecting';
      } else if (state === 'failed') {
        this.callState = 'reconnecting';
        this.handleIceFailure();
      }
      this.callbacks.onConnectionStateChange(this.callState, state);
    };

    // Initialize NetworkAdaptationManager
    this.adaptationManager = new NetworkAdaptationManager(this.pc, {
      initialMode: this.localStream?.getVideoTracks().length > 0 ? 'video' : 'audio_only'
    });

    this.adaptationManager.on('qualityChange', (data) => {
      this.callbacks.onQualityChange(data);
    });

    this.adaptationManager.on('modeChange', (data) => {
      this.callbacks.onModeChange(data);
    });

    return this.pc;
  }

  /**
   * Initiates call as Caller (Creates and sends SDP Offer)
   */
  async createAndSendOffer() {
    this.createPeerConnection();
    this.callState = 'calling';

    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    await this.pc.setLocalDescription(offer);

    await this.sendSignalMessage('offer', {
      type: 'offer',
      sdp: offer.sdp
    });

    return offer;
  }

  /**
   * Handles incoming SDP Offer and sends SDP Answer
   */
  async handleOfferAndSendAnswer(offerPayload) {
    this.createPeerConnection();

    const remoteDesc = new RTCSessionDescription({
      type: 'offer',
      sdp: offerPayload.sdp
    });

    await this.pc.setRemoteDescription(remoteDesc);
    this.hasRemoteDescription = true;

    // Process any queued ICE candidates that arrived before the offer
    await this.processQueuedCandidates();

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    await this.sendSignalMessage('answer', {
      type: 'answer',
      sdp: answer.sdp
    });

    return answer;
  }

  /**
   * Handles incoming SDP Answer from recipient
   */
  async handleAnswer(answerPayload) {
    if (!this.pc) return;

    const remoteDesc = new RTCSessionDescription({
      type: 'answer',
      sdp: answerPayload.sdp
    });

    await this.pc.setRemoteDescription(remoteDesc);
    this.hasRemoteDescription = true;

    await this.processQueuedCandidates();
  }

  /**
   * Handles incoming ICE candidate safely with queueing if remote description is pending
   */
  async handleRemoteIceCandidate(candidatePayload) {
    if (!candidatePayload.candidate) return;

    const candidate = new RTCIceCandidate({
      candidate: candidatePayload.candidate,
      sdpMid: candidatePayload.sdpMid,
      sdpMLineIndex: candidatePayload.sdpMLineIndex
    });

    if (this.hasRemoteDescription && this.pc && this.pc.remoteDescription) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('[WebRTC] Failed to add ICE candidate directly:', err.message);
      }
    } else {
      // Safe queuing before remote description is applied
      this.iceCandidateQueue.push(candidate);
    }
  }

  /**
   * Flushes and applies queued ICE candidates
   */
  async processQueuedCandidates() {
    if (!this.pc || !this.pc.remoteDescription) return;

    const queue = [...this.iceCandidateQueue];
    this.iceCandidateQueue = [];

    for (const candidate of queue) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('[WebRTC] Failed to apply queued ICE candidate:', err.message);
      }
    }
  }

  /**
   * Independent Microphone Control: Toggle Mute
   */
  toggleMicrophone(muted) {
    this.isMicMuted = muted !== undefined ? muted : !this.isMicMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMicMuted;
      });
    }
    return this.isMicMuted;
  }

  /**
   * Independent Camera Control: Toggle Camera
   */
  toggleCamera(disabled) {
    this.isCameraDisabled = disabled !== undefined ? disabled : !this.isCameraDisabled;
    if (this.adaptationManager) {
      this.adaptationManager.setUserCameraPreference(!this.isCameraDisabled);
    }
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !this.isCameraDisabled;
      });
    }
    return this.isCameraDisabled;
  }

  /**
   * Transmits signaling message to API route
   */
  async sendSignalMessage(signalType, payload) {
    try {
      const res = await fetch(`/api/consultations/${this.consultationId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalType, payload })
      });
      return await res.json();
    } catch (err) {
      console.warn(`[WebRTC Signaling] Failed to transmit ${signalType}:`, err.message);
    }
  }

  /**
   * Starts polling signaling endpoint for incoming messages
   */
  startSignalingListener(pollIntervalMs = 1500) {
    if (this.signalingTimer) return;

    this.signalingTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/consultations/${this.consultationId}/signal`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.signals && data.signals.length > 0) {
          for (const signal of data.signals) {
            await this.processIncomingSignal(signal);
          }
        }
      } catch (err) {
        // Suppress transient network poll errors
      }
    }, pollIntervalMs);
  }

  /**
   * Processes incoming signaling event
   */
  async processIncomingSignal(signal) {
    const { signal_type, payload } = signal;

    if (signal_type === 'offer') {
      await this.handleOfferAndSendAnswer(payload);
    } else if (signal_type === 'answer') {
      await this.handleAnswer(payload);
    } else if (signal_type === 'ice_candidate') {
      await this.handleRemoteIceCandidate(payload);
    } else if (signal_type === 'call_ended') {
      this.cleanup();
      this.callState = 'ended';
      this.callbacks.onConnectionStateChange('ended', 'closed');
    }
  }

  /**
   * ICE failure recovery handler
   */
  handleIceFailure() {
    if (!this.pc) return;
    try {
      if (this.pc.restartIce) {
        this.pc.restartIce();
      }
    } catch (e) {
      console.warn('[WebRTC] ICE restart failed:', e.message);
    }
  }

  /**
   * Stops listening to signaling endpoint
   */
  stopSignalingListener() {
    if (this.signalingTimer) {
      clearInterval(this.signalingTimer);
      this.signalingTimer = null;
    }
  }

  /**
   * Complete teardown of peer connection, streams, timers and adaptation manager
   */
  cleanup() {
    this.stopSignalingListener();

    if (this.adaptationManager) {
      this.adaptationManager.stopMonitoring();
      this.adaptationManager = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      this.remoteStream = null;
    }

    if (this.pc) {
      try {
        this.pc.ontrack = null;
        this.pc.onicecandidate = null;
        this.pc.oniceconnectionstatechange = null;
        this.pc.close();
      } catch (e) {}
      this.pc = null;
    }

    this.hasRemoteDescription = false;
    this.iceCandidateQueue = [];
    this.callState = 'ended';
  }
}

module.exports = {
  WebRTCController,
  DEFAULT_RTC_CONFIG
};

