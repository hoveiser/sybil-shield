type Voice = OscillatorType;

const STORAGE_KEY = "sybilshield.sound";

class SoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabledState = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.enabledState = window.localStorage.getItem(STORAGE_KEY) === "on";
    }
  }

  get enabled(): boolean {
    return this.enabledState;
  }

  unlock(): void {
    if (this.context) {
      if (this.context.state === "suspended") void this.context.resume();
      return;
    }
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.context.destination);
  }

  setEnabled(next: boolean): void {
    this.enabledState = next;
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    if (next) {
      this.unlock();
      this.chime();
    }
  }

  private tone(frequency: number, duration: number, type: Voice, gain = 0.5, delay = 0, glideTo?: number): void {
    if (!this.enabledState || !this.context || !this.master) return;
    const ctx = this.context;
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (glideTo !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), start + duration);
    }
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  click(): void {
    this.tone(640, 0.05, "square", 0.18);
  }

  hover(): void {
    this.tone(1180, 0.03, "sine", 0.06);
  }

  chime(): void {
    this.tone(880, 0.22, "sine", 0.32, 0);
    this.tone(1174.66, 0.22, "sine", 0.24, 0.06);
    this.tone(1567.98, 0.32, "sine", 0.18, 0.12);
  }

  verified(): void {
    this.tone(523.25, 0.16, "triangle", 0.28, 0);
    this.tone(659.25, 0.16, "triangle", 0.26, 0.08);
    this.tone(783.99, 0.28, "triangle", 0.24, 0.16);
    this.tone(1046.5, 0.42, "sine", 0.2, 0.26);
  }

  error(): void {
    this.tone(220, 0.18, "sawtooth", 0.26, 0, 90);
    this.tone(164, 0.24, "sawtooth", 0.2, 0.08, 70);
  }

  whoosh(): void {
    this.tone(320, 0.3, "sine", 0.12, 0, 1200);
  }

  sweep(): void {
    this.tone(180, 0.6, "sine", 0.1, 0, 540);
    this.tone(240, 0.6, "triangle", 0.06, 0.05, 720);
  }
}

export const sound = new SoundEngine();
