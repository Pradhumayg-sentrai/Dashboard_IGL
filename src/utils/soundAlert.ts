// Web Audio API Synthesizer for Industrial Critical Alarms
class SoundAlertManager {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private mutedUntil: number | null = null;

  constructor() {
    // Restore mute setting from localStorage if available
    const savedMute = localStorage.getItem('igl_alarm_muted_until');
    if (savedMute) {
      const val = parseInt(savedMute, 10);
      if (val > Date.now()) {
        this.mutedUntil = val;
      } else {
        localStorage.removeItem('igl_alarm_muted_until');
      }
    }
  }

  public async initAudio(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.isUnlocked = true;
      return true;
    } catch (err) {
      console.warn('Failed to initialize Web Audio context:', err);
      return false;
    }
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked && this.ctx !== null && this.ctx.state === 'running';
  }

  public isMuted(): boolean {
    if (!this.mutedUntil) return false;
    if (Date.now() > this.mutedUntil) {
      this.mutedUntil = null;
      localStorage.removeItem('igl_alarm_muted_until');
      return false;
    }
    return true;
  }

  public getMutedUntil(): number | null {
    return this.isMuted() ? this.mutedUntil : null;
  }

  public setMuteTimeout(minutes: number | null): void {
    if (!minutes || minutes <= 0) {
      this.mutedUntil = null;
      localStorage.removeItem('igl_alarm_muted_until');
    } else {
      const until = Date.now() + minutes * 60 * 1000;
      this.mutedUntil = until;
      localStorage.setItem('igl_alarm_muted_until', until.toString());
    }
  }

  /**
   * Plays a distinct industrial critical alarm alert tone (dual high-pitch pulse: 880Hz -> 660Hz).
   */
  public playCriticalAlarmTone(): void {
    if (!this.isAudioUnlocked() || this.isMuted()) return;
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // First pulse (880Hz - A5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.18);

      // Second pulse (660Hz - E5)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(660, now + 0.22);

      gain2.gain.setValueAtTime(0.25, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(now + 0.22);
      osc2.stop(now + 0.42);
    } catch (err) {
      console.warn('Error synthesizing alarm tone:', err);
    }
  }
}

export const soundManager = new SoundAlertManager();
