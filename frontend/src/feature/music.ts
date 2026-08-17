// Nhạc nền tổng hợp bằng Web Audio API — không cần file, không vướng bản quyền.
// Mỗi "bài" là một bộ tham số (tempo, thang âm, vòng hợp âm, mẫu trống) được
// dựng thành một vòng lặp cố định rồi phát bằng bộ lập lịch nhìn trước.
//
// Muốn dùng nhạc thật: bỏ file vào `public/music/ten-bai.mp3` rồi thêm một mục
// `{ id, name, tag, file: '/music/ten-bai.mp3' }` vào TRACKS — player tự phát
// bằng thẻ <audio> thay cho bộ tổng hợp.

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const PENTA = [0, 3, 5, 7, 10];

export interface Voice {
  wave: OscillatorType;
  gain: number;
  /** Xác suất một ô nhịp có nốt giai điệu. */
  density?: number;
  octave?: number;
}

export interface Track {
  id: string;
  name: string;
  tag: string;
  bpm: number;
  /** Nốt gốc theo số hiệu MIDI. */
  root: number;
  scale: number[];
  progression: number[];
  /** Mẫu trống 16 ô nhịp: '1' là đánh, '.' là nghỉ (hat dùng '2' cho tiếng mở). */
  kick: string;
  snare: string;
  hat: string;
  bass: string;
  lead: Required<Voice>;
  pad: Voice | null;
  /** Nếu có, player phát file này thay cho bộ tổng hợp. */
  file?: string;
}

/** Một ô nhịp đã dựng sẵn: mỗi bè hoặc im lặng, hoặc mang số hiệu MIDI. */
export interface PlanCell {
  kick: boolean;
  snare: boolean;
  /** 0 = nghỉ, 1 = tiếng đóng, 2 = tiếng mở. */
  hat: number;
  bass: number | null;
  lead: number | null;
  chord: number[] | null;
}

export const TRACKS: Track[] = [
  {
    id: 'neon-drop',
    name: 'Neon Drop',
    tag: 'Future bass · 128 BPM',
    bpm: 128,
    root: 45,
    scale: MINOR,
    progression: [5, 3, 0, 4],
    kick: '1...1...1...1...',
    snare: '....1.......1...',
    hat: '..1.2.1...1.2.1.',
    bass: '1.1...1.1...1.1.',
    lead: { wave: 'sawtooth', density: 0.5, octave: 2, gain: 0.11 },
    pad: { wave: 'triangle', gain: 0.06 },
  },
  {
    id: 'hyper-lab',
    name: 'Hyper Lab',
    tag: 'Hardstyle · 150 BPM',
    bpm: 150,
    root: 43,
    scale: PHRYGIAN,
    progression: [0, 0, 5, 4],
    kick: '1...1...1...1...',
    snare: '....1.......1...',
    hat: '.1.1.1.1.1.1.1.1',
    bass: '..1...1...1...1.',
    lead: { wave: 'sawtooth', density: 0.62, octave: 2, gain: 0.1 },
    pad: { wave: 'sawtooth', gain: 0.05 },
  },
  {
    id: 'arcade-rush',
    name: 'Arcade Rush',
    tag: 'Chiptune · 168 BPM',
    bpm: 168,
    root: 48,
    scale: PENTA,
    progression: [0, 4, 2, 3],
    kick: '1...1..1..1.1...',
    snare: '....1.......1...',
    hat: '1.1.1.1.1.1.1.1.',
    bass: '1.1.1.1.1.1.1.1.',
    lead: { wave: 'square', density: 0.7, octave: 2, gain: 0.09 },
    pad: null,
  },
  {
    id: 'ion-storm',
    name: 'Ion Storm',
    tag: 'Drum & bass · 174 BPM',
    bpm: 174,
    root: 41,
    scale: DORIAN,
    progression: [0, 6, 3, 4],
    kick: '1.....1...1.....',
    snare: '....1.......1...',
    hat: '..1...1.1...1.1.',
    bass: '1...1.1...1.1...',
    lead: { wave: 'sawtooth', density: 0.45, octave: 2, gain: 0.1 },
    pad: { wave: 'triangle', gain: 0.05 },
  },
  {
    id: 'lofi-reaction',
    name: 'Lo-fi Reaction',
    tag: 'Lo-fi chill · 84 BPM',
    bpm: 84,
    root: 45,
    scale: DORIAN,
    progression: [0, 3, 5, 4],
    kick: '1.......1.......',
    snare: '....1.......1...',
    hat: '..1...1...1...1.',
    bass: '1.....1...1.....',
    lead: { wave: 'triangle', density: 0.28, octave: 2, gain: 0.1 },
    pad: { wave: 'triangle', gain: 0.07 },
  },
];

export const OFF = 'off';
export const trackById = (id: string): Track | null => TRACKS.find((t) => t.id === id) ?? null;

const midiToFreq = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

// PRNG có hạt giống: giai điệu ngẫu nhiên nhưng cố định cho từng bài.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (str: string): number => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
};

// Bậc trong thang âm -> số nửa cung (bậc âm hoặc vượt quãng tám đều được).
function degree(scale: number[], d: number): number {
  const len = scale.length;
  const oct = Math.floor(d / len);
  return scale[((d % len) + len) % len] + 12 * oct;
}

// Dựng sẵn cả vòng lặp (2 lượt vòng hợp âm) để lúc chơi chỉ việc đọc ra.
export function buildPlan(track: Track): PlanCell[] {
  const rng = mulberry32(hash(track.id));
  const bars = track.progression.length * 2;
  const steps = bars * 16;
  const plan: PlanCell[] = [];

  for (let i = 0; i < steps; i++) {
    const inBar = i % 16;
    const bar = Math.floor(i / 16);
    const chordDegree = track.progression[bar % track.progression.length];
    const chordRoot = track.root + degree(track.scale, chordDegree);

    const cell: PlanCell = {
      kick: track.kick[inBar] === '1',
      snare: track.snare[inBar] === '1',
      hat: track.hat[inBar] === '.' ? 0 : Number(track.hat[inBar]),
      bass: null,
      lead: null,
      chord: null,
    };

    if (track.bass[inBar] === '1') {
      cell.bass = chordRoot - 12 + (rng() < 0.15 ? 12 : 0);
    }
    if (track.pad && inBar === 0) {
      // hợp âm ba: bậc 1 - 3 - 5 tính trong thang âm
      cell.chord = [0, 2, 4].map((s) => track.root + degree(track.scale, chordDegree + s));
    }
    // nghỉ giai điệu ở ô nhịp đầu mỗi 4 nhịp cho đỡ ngộp, chỉ còn trống + bass
    const leadOn = bar % 4 !== 0;
    if (leadOn && rng() < track.lead.density) {
      const jump = [0, 1, 2, 4, 5][Math.floor(rng() * 5)];
      cell.lead = track.root + 12 * track.lead.octave + degree(track.scale, chordDegree + jump);
    }
    plan.push(cell);
  }
  return plan;
}

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

const LOOKAHEAD = 0.15; // giây được lên lịch trước
const TICK_MS = 25;

interface ToneOptions {
  wave?: OscillatorType;
  gain?: number;
  attack?: number;
  /** Lượng tín hiệu gửi sang bộ delay. */
  send?: number;
}

export class MusicPlayer {
  ctx: AudioContext | null = null;
  trackId: string | null = null;
  timer: ReturnType<typeof setInterval> | null = null;
  volume = 0.55;
  muted = false;
  audioEl: HTMLAudioElement | null = null;

  // Được dựng cùng lúc với `ctx` trong ensureContext().
  master!: GainNode;
  delay!: DelayNode;
  feedback!: GainNode;
  noise!: AudioBuffer;

  // Được đặt khi bắt đầu phát một bài tổng hợp.
  track!: Track;
  plan: PlanCell[] | null = null;
  stepDur = 0;
  step = 0;
  nextTime = 0;

  get playing(): boolean {
    return this.trackId !== null;
  }

  // AudioContext chỉ được tạo từ thao tác của người dùng (click), nếu không
  // trình duyệt sẽ chặn.
  ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctx = typeof window !== 'undefined' ? window.AudioContext ?? window.webkitAudioContext : undefined;
    if (!Ctx) return null;

    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(ctx.destination);

    this.delay = ctx.createDelay(1);
    this.feedback = ctx.createGain();
    this.feedback.gain.value = 0.26;
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.master);

    this.noise = makeNoise(ctx);
    return ctx;
  }

  play(trackId: string | null): void {
    if (!trackId || trackId === OFF) {
      this.stop();
      return;
    }
    if (this.trackId === trackId) return;
    const track = trackById(trackId);
    if (!track) {
      this.stop();
      return;
    }
    this.stop();
    this.trackId = trackId;

    if (track.file) {
      this.audioEl = new Audio(track.file);
      this.audioEl.loop = true;
      this.audioEl.volume = this.muted ? 0 : this.volume;
      this.audioEl.play().catch(() => {});
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) {
      this.trackId = null;
      return;
    }
    ctx.resume?.();

    this.track = track;
    this.plan = buildPlan(track);
    this.stepDur = 60 / track.bpm / 4;
    this.delay.delayTime.value = this.stepDur * 3;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  tick(): void {
    if (!this.ctx || !this.plan) return;
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      this.scheduleStep(this.plan[this.step % this.plan.length], this.nextTime);
      this.nextTime += this.stepDur;
      this.step++;
    }
  }

  scheduleStep(cell: PlanCell, time: number): void {
    const { lead, pad } = this.track;
    if (cell.kick) this.kick(time);
    if (cell.snare) this.snare(time);
    if (cell.hat) this.hat(time, cell.hat === 2);
    if (cell.bass !== null) {
      this.tone(time, midiToFreq(cell.bass), this.stepDur * 1.6, { wave: 'square', gain: 0.16 });
    }
    if (cell.chord && pad) {
      for (const note of cell.chord) {
        this.tone(time, midiToFreq(note), this.stepDur * 14, { wave: pad.wave, gain: pad.gain, attack: 0.12 });
      }
    }
    if (cell.lead !== null) {
      this.tone(time, midiToFreq(cell.lead), this.stepDur * 1.2, {
        wave: lead.wave,
        gain: lead.gain,
        send: 0.5,
      });
    }
  }

  tone(time: number, freq: number, dur: number, { wave = 'sine', gain = 0.1, attack = 0.005, send = 0 }: ToneOptions): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(gain, time + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env);
    env.connect(this.master);
    if (send > 0) {
      const sendGain = ctx.createGain();
      sendGain.gain.value = send;
      env.connect(sendGain);
      sendGain.connect(this.delay);
    }
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  kick(time: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.09);
    env.gain.setValueAtTime(0.5, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(env);
    env.connect(this.master);
    osc.start(time);
    osc.stop(time + 0.24);
  }

  snare(time: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1900;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.28, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(time);
    src.stop(time + 0.16);
  }

  hat(time: number, open: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7200;
    const env = ctx.createGain();
    const dur = open ? 0.18 : 0.045;
    env.gain.setValueAtTime(open ? 0.14 : 0.1, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(time);
    src.stop(time + dur + 0.02);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.plan = null;
    this.trackId = null;
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl = null;
    }
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    this.applyGain();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGain();
  }

  applyGain(): void {
    const level = this.muted ? 0 : this.volume;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(level, this.ctx.currentTime, 0.02);
    }
    if (this.audioEl) this.audioEl.volume = level;
  }

  dispose(): void {
    this.stop();
    this.ctx?.close?.();
    this.ctx = null;
  }
}
