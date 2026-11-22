// Every sound is synthesised with WebAudio — no audio files, no network.
// The context is created on the first user gesture, so the game stays
// silent (and error-free) in a headless screenshot run.

export function createAudio() {
  let context = null;
  let muted = false;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(frequency, seconds, type, volume, when = 0, slideTo = null) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  function noise(seconds, volume, lowpass = 1200) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }

  return {
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    setMuted(value) {
      muted = value;
      if (muted) this.stopAlarm();
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.16);
      tone(1318, 0.16, 'sine', 0.14, 0.07);
    },
    ledger() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.09));
    },
    coin() {
      tone(1567, 0.09, 'sine', 0.14);
      tone(2093, 0.14, 'sine', 0.1, 0.06);
    },
    smoke() {
      noise(0.5, 0.25, 900);
    },
    terminal() {
      tone(440, 0.08, 'square', 0.08);
      tone(660, 0.08, 'square', 0.08, 0.09);
      tone(880, 0.14, 'square', 0.08, 0.18);
    },
    crack() {
      tone(1200 + Math.random() * 600, 0.03, 'square', 0.05);
    },
    spotted() {
      tone(220, 0.25, 'sawtooth', 0.16, 0, 440);
      tone(220, 0.25, 'sawtooth', 0.16, 0.28, 440);
    },
    caught() {
      tone(392, 0.3, 'sawtooth', 0.18, 0, 98);
      noise(0.3, 0.2, 600);
    },
    escaped() {
      [392, 523, 659, 784].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, i * 0.11));
    },
    gameover() {
      [330, 262, 196].forEach((f, i) => tone(f, 0.4, 'triangle', 0.14, i * 0.22));
    },
    startAlarm() {
      const ctx = ensure();
      if (!ctx || muted || alarmOsc) return;
      alarmOsc = ctx.createOscillator();
      alarmGain = ctx.createGain();
      alarmOsc.type = 'sine';
      alarmOsc.frequency.value = 660;
      alarmGain.gain.value = 0.045;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 2.2;
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain).connect(alarmOsc.frequency);
      alarmOsc.connect(alarmGain).connect(ctx.destination);
      alarmOsc.start();
      lfo.start();
      alarmOsc._lfo = lfo;
    },
    stopAlarm() {
      if (!alarmOsc) return;
      try {
        alarmOsc.stop();
        alarmOsc._lfo?.stop();
      } catch {
        // Already stopped.
      }
      alarmOsc = null;
      alarmGain = null;
    },
  };
}
