/**
 * Procedural sound effects.
 *
 * Retro blips synthesised with the Web Audio API at play time: no audio files to source,
 * license or load. Complements the recorded sounds in public/audio (laser, explosion,
 * power-up, boost, soundtrack) for events that had no sound.
 */

export type SfxName =
  | 'enemyLaser'
  | 'hit'
  | 'hullHit'
  | 'shieldHit'
  | 'coreHit'
  | 'lightning'
  | 'praetorian'
  | 'waveStart'
  | 'waveClear'
  | 'upgrade'
  | 'gameOver';

/** Minimum seconds between two plays of the same effect, so swarms don't stack into noise. */
export const SFX_MIN_INTERVAL: Record<SfxName, number> = {
  enemyLaser: 0.07,
  hit: 0.05,
  hullHit: 0.15,
  shieldHit: 0.2,
  coreHit: 0.8,
  lightning: 0.4,
  praetorian: 0.2,
  waveStart: 1,
  waveClear: 1,
  upgrade: 0.2,
  gameOver: 2,
};

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

const getNoise = (ctx: BaseAudioContext): AudioBuffer => {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
};

/** Gain node with a fast attack and exponential decay to silence over `dur` seconds. */
const envelope = (ctx: BaseAudioContext, out: AudioNode, t: number, dur: number, peak: number): GainNode => {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out);
  return g;
};

const tone = (
  ctx: BaseAudioContext, out: AudioNode, t: number,
  type: OscillatorType, f0: number, f1: number, dur: number, peak: number,
): void => {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  osc.connect(envelope(ctx, out, t, dur, peak));
  osc.start(t);
  osc.stop(t + dur + 0.02);
};

const noise = (
  ctx: BaseAudioContext, out: AudioNode, t: number,
  filter: BiquadFilterType, f0: number, f1: number, dur: number, peak: number,
): void => {
  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx);
  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) biquad.frequency.exponentialRampToValueAtTime(f1, t + dur);
  src.connect(biquad);
  biquad.connect(envelope(ctx, out, t, dur, peak));
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
};

const arpeggio = (
  ctx: BaseAudioContext, out: AudioNode, t: number,
  type: OscillatorType, notes: number[], step: number, dur: number, peak: number,
): void => {
  notes.forEach((f, i) => tone(ctx, out, t + i * step, type, f, f, dur, peak));
};

/** Schedule effect `name` on `ctx`, routed into `out`. */
export const playSfx = (ctx: BaseAudioContext, out: AudioNode, name: SfxName): void => {
  const t = ctx.currentTime + 0.005;
  switch (name) {
    case 'enemyLaser':
      tone(ctx, out, t, 'square', 1400, 280, 0.13, 0.1);
      break;
    case 'hit':
      tone(ctx, out, t, 'triangle', 1100, 1700, 0.05, 0.25);
      break;
    case 'hullHit':
      noise(ctx, out, t, 'lowpass', 1800, 200, 0.3, 0.5);
      tone(ctx, out, t, 'sawtooth', 160, 45, 0.3, 0.2);
      break;
    case 'shieldHit':
      tone(ctx, out, t, 'sine', 620, 300, 0.2, 0.22);
      tone(ctx, out, t, 'sine', 930, 450, 0.2, 0.1);
      break;
    case 'coreHit':
      tone(ctx, out, t, 'square', 330, 330, 0.12, 0.16);
      tone(ctx, out, t + 0.16, 'square', 247, 247, 0.16, 0.16);
      break;
    case 'lightning':
      noise(ctx, out, t, 'bandpass', 3200, 900, 0.4, 0.35);
      tone(ctx, out, t, 'sawtooth', 70, 40, 0.4, 0.12);
      break;
    case 'praetorian':
      tone(ctx, out, t, 'sawtooth', 120, 50, 1.0, 0.28);
      tone(ctx, out, t, 'sine', 1200, 200, 0.6, 0.15);
      noise(ctx, out, t, 'lowpass', 4000, 250, 0.8, 0.4);
      break;
    case 'waveStart':
      arpeggio(ctx, out, t, 'square', [440, 554, 659], 0.1, 0.09, 0.14);
      break;
    case 'waveClear':
      arpeggio(ctx, out, t, 'triangle', [523, 659, 784, 1047], 0.09, 0.16, 0.2);
      break;
    case 'upgrade':
      arpeggio(ctx, out, t, 'sine', [784, 1175, 1568], 0.07, 0.18, 0.18);
      break;
    case 'gameOver':
      arpeggio(ctx, out, t, 'sawtooth', [392, 330, 262, 196], 0.24, 0.3, 0.18);
      break;
  }
};
