/**
 * Samālōcane Dynamic Network Adaptation Manager
 * Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas
 *
 * Implements:
 * 1. RTCPeerConnection.getStats() polling with delta-based packet loss computation:
 *    packet_loss_% = delta_lost / (delta_received + delta_lost) * 100
 * 2. Multi-threshold connection evaluation (RTT > 350ms OR Packet Loss > 5%)
 * 3. Hysteresis-protected state transitions (consecutive measurements prevent flapping)
 * 4. Graceful Video Degradation -> Audio-First Preservation -> Text Fallback
 * 5. Strict independence of Audio vs Video tracks & respect for user camera preference
 */

const DEFAULT_CONFIG = {
  pollIntervalMs: 2000,              // Poll stats every 2 seconds
  rttThresholdMs: 350,               // RTT threshold for degradation (350 ms)
  packetLossThresholdPercent: 5.0,   // Packet loss threshold for degradation (5.0%)
  consecutiveDegradedLimit: 3,       // Required consecutive degraded readings to trigger fallback
  consecutiveRecoveredLimit: 3,      // Required consecutive healthy readings to trigger recovery
  degradedVideoBitrateBps: 80000,    // Target 80 kbps video bitrate under degradation
  normalVideoBitrateBps: 500000     // Target 500 kbps video bitrate under healthy network
};

class NetworkAdaptationManager {
  constructor(peerConnection, options = {}) {
    this.pc = peerConnection;
    this.config = { ...DEFAULT_CONFIG, ...options };

    // Connection Quality States: 'good' | 'fair' | 'degraded' | 'poor' | 'offline'
    this.currentQuality = 'good';
    // Active Consultation Modes: 'video' | 'audio_only' | 'text_chat'
    this.currentMode = options.initialMode || 'video';

    // User explicit camera intent (Separate from automated network adaptation!)
    this.userCameraEnabled = true;

    // Previous counter snapshots for delta calculations
    this.prevStats = {
      timestamp: 0,
      packetsReceived: 0,
      packetsLost: 0,
      bytesReceived: 0
    };

    // Hysteresis counters
    this.consecutiveDegradedCount = 0;
    this.consecutiveHealthyCount = 0;

    // Latest computed metrics
    this.latestMetrics = {
      rttMs: 0,
      packetLossPercent: 0,
      jitterMs: 0,
      bitrateKbps: 0,
      quality: 'good',
      mode: this.currentMode
    };

    // Polling interval timer
    this.timer = null;
    this.isPolling = false;

    // Event listeners
    this.listeners = {
      qualityChange: [],
      modeChange: [],
      degraded: [],
      recovered: []
    };
  }

  /**
   * Subscribe to adaptation events
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[NetworkAdaptationManager] Error in ${event} callback:`, err);
        }
      });
    }
  }

  /**
   * User manual camera toggle (Kept separate from automated adaptation)
   */
  setUserCameraPreference(enabled) {
    this.userCameraEnabled = Boolean(enabled);
    if (!this.userCameraEnabled && this.currentMode === 'video') {
      this.setMode('audio_only', 'User explicitly disabled camera');
    } else if (this.userCameraEnabled && this.currentQuality === 'good' && this.currentMode === 'audio_only') {
      this.setMode('video', 'User explicitly enabled camera on stable network');
    }
  }

  isUserCameraEnabled() {
    return this.userCameraEnabled;
  }

  /**
   * Set active mode and apply track/sender adaptations
   */
  setMode(newMode, reason = '') {
    if (this.currentMode === newMode) return;

    const oldMode = this.currentMode;
    this.currentMode = newMode;
    this.latestMetrics.mode = newMode;

    // Apply track actions on RTCPeerConnection if active
    this.applyTrackConstraintsForMode(newMode);

    this.emit('modeChange', {
      oldMode,
      newMode,
      reason,
      quality: this.currentQuality,
      metrics: { ...this.latestMetrics }
    });
  }

  /**
   * Adjusts RTCRtpSender tracks based on active mode
   */
  async applyTrackConstraintsForMode(mode) {
    if (!this.pc) return;

    try {
      const senders = this.pc.getSenders ? this.pc.getSenders() : [];
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');

      if (videoSender) {
        if (mode === 'audio_only' || mode === 'text_chat') {
          // Disable outgoing video transmission while keeping audio untouched
          if (videoSender.track) {
            videoSender.track.enabled = false;
          }
        } else if (mode === 'video' && this.userCameraEnabled) {
          // Restore video track only if user has not manually turned it off
          if (videoSender.track) {
            videoSender.track.enabled = true;
          }
        }
      }
    } catch (err) {
      console.warn('[NetworkAdaptationManager] Failed to apply track constraints:', err.message);
    }
  }

  /**
   * Delta-based packet loss computation:
   * delta_loss_% = delta_lost / (delta_received + delta_lost) * 100
   */
  computePacketLoss(currentReceived, prevReceived, currentLost, prevLost) {
    const deltaReceived = Math.max(0, currentReceived - prevReceived);
    const deltaLost = Math.max(0, currentLost - prevLost);
    const totalExpected = deltaReceived + deltaLost;

    if (totalExpected <= 0) return 0;
    const lossPercent = (deltaLost / totalExpected) * 100;
    return Math.min(100, Math.max(0, parseFloat(lossPercent.toFixed(2))));
  }

  /**
   * Extract RTT, packet loss, and jitter from getStats report safely across browsers
   */
  parseStatsReport(stats) {
    let rttMs = 0;
    let packetsReceived = 0;
    let packetsLost = 0;
    let jitterMs = 0;
    let bytesReceived = 0;

    stats.forEach(report => {
      // 1. Candidate pair report gives current RTT
      if (report.type === 'candidate-pair' && (report.state === 'succeeded' || report.nominated)) {
        if (report.currentRoundTripTime !== undefined) {
          rttMs = Math.round(report.currentRoundTripTime * 1000);
        } else if (report.roundTripTime !== undefined) {
          rttMs = Math.round(report.roundTripTime * 1000);
        }
      }

      // 2. Inbound RTP gives incoming packet counts, loss, and jitter
      if (report.type === 'inbound-rtp') {
        if (report.packetsReceived !== undefined) {
          packetsReceived += report.packetsReceived;
        }
        if (report.packetsLost !== undefined) {
          packetsLost += report.packetsLost;
        }
        if (report.jitter !== undefined && report.jitter > 0) {
          jitterMs = Math.max(jitterMs, Math.round(report.jitter * 1000));
        }
        if (report.bytesReceived !== undefined) {
          bytesReceived += report.bytesReceived;
        }
      }

      // 3. Remote inbound RTP fallback for RTT
      if (report.type === 'remote-inbound-rtp' && report.roundTripTime !== undefined) {
        rttMs = Math.max(rttMs, Math.round(report.roundTripTime * 1000));
      }
    });

    return { rttMs, packetsReceived, packetsLost, jitterMs, bytesReceived };
  }

  /**
   * Evaluates raw metrics against configurable thresholds and applies adaptation policy
   */
  evaluateMetrics(parsedData) {
    const { rttMs, packetsReceived, packetsLost, jitterMs, bytesReceived } = parsedData;

    // Compute delta-based packet loss
    let packetLossPercent = 0;
    if (this.prevStats.timestamp > 0) {
      packetLossPercent = this.computePacketLoss(
        packetsReceived,
        this.prevStats.packetsReceived,
        packetsLost,
        this.prevStats.packetsLost
      );
    }

    // Compute bitrate delta (kbps)
    let bitrateKbps = 0;
    if (this.prevStats.timestamp > 0) {
      const elapsedSec = (Date.now() - this.prevStats.timestamp) / 1000;
      if (elapsedSec > 0) {
        const deltaBytes = Math.max(0, bytesReceived - this.prevStats.bytesReceived);
        bitrateKbps = Math.round((deltaBytes * 8) / (elapsedSec * 1024));
      }
    }

    // Update snapshots
    this.prevStats = {
      timestamp: Date.now(),
      packetsReceived,
      packetsLost,
      bytesReceived
    };

    // Evaluate degradation condition
    const isDegradedReading = 
      packetLossPercent > this.config.packetLossThresholdPercent || 
      rttMs > this.config.rttThresholdMs;

    let targetQuality = 'good';

    if (isDegradedReading) {
      this.consecutiveDegradedCount++;
      this.consecutiveHealthyCount = 0;

      if (this.consecutiveDegradedCount >= this.config.consecutiveDegradedLimit) {
        targetQuality = packetLossPercent > 15 || rttMs > 600 ? 'poor' : 'degraded';

        // Adaptation step: Trigger audio-first fallback if currently in video
        if (this.currentMode === 'video') {
          this.setMode('audio_only', `Sustained degradation: RTT ${rttMs}ms, Loss ${packetLossPercent}%`);
        }

        this.emit('degraded', {
          rttMs,
          packetLossPercent,
          consecutiveCount: this.consecutiveDegradedCount
        });
      }
    } else {
      this.consecutiveHealthyCount++;
      this.consecutiveDegradedCount = 0;

      // Hysteresis recovery
      if (this.consecutiveHealthyCount >= this.config.consecutiveRecoveredLimit) {
        targetQuality = 'good';

        // Recover to video only if user had NOT turned off camera manually
        if (this.currentMode === 'audio_only' && this.userCameraEnabled) {
          this.setMode('video', `Network recovered: RTT ${rttMs}ms, Loss ${packetLossPercent}%`);
        }

        this.emit('recovered', {
          rttMs,
          packetLossPercent,
          consecutiveCount: this.consecutiveHealthyCount
        });
      } else if (this.currentQuality === 'degraded' || this.currentQuality === 'poor') {
        // In recovery window
        targetQuality = 'fair';
      }
    }

    // Update current quality
    const prevQuality = this.currentQuality;
    this.currentQuality = targetQuality;

    this.latestMetrics = {
      rttMs,
      packetLossPercent,
      jitterMs,
      bitrateKbps,
      quality: targetQuality,
      mode: this.currentMode
    };

    if (prevQuality !== targetQuality) {
      this.emit('qualityChange', {
        prevQuality,
        currentQuality: targetQuality,
        metrics: { ...this.latestMetrics }
      });
    }

    return this.latestMetrics;
  }

  /**
   * Starts periodic getStats polling on RTCPeerConnection
   */
  startMonitoring() {
    if (this.timer) return;

    this.timer = setInterval(async () => {
      if (this.isPolling) return; // Prevent overlapping getStats calls
      this.isPolling = true;

      try {
        if (!this.pc || !this.pc.getStats) return;

        const stats = await this.pc.getStats();
        const parsed = this.parseStatsReport(stats);
        this.evaluateMetrics(parsed);
      } catch (err) {
        // Safe handling of missing or closed peer connection
        console.warn('[NetworkAdaptationManager] getStats poll skipped:', err.message);
      } finally {
        this.isPolling = false;
      }
    }, this.config.pollIntervalMs);
  }

  /**
   * Stop polling and clean up timers
   */
  stopMonitoring() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isPolling = false;
  }

  /**
   * Returns current snapshot of metrics
   */
  getSnapshot() {
    return {
      ...this.latestMetrics,
      userCameraEnabled: this.userCameraEnabled,
      consecutiveDegradedCount: this.consecutiveDegradedCount,
      consecutiveHealthyCount: this.consecutiveHealthyCount
    };
  }
}

module.exports = {
  NetworkAdaptationManager,
  DEFAULT_CONFIG
};

