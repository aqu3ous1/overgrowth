// ---------------------------------------------------------------- engine
// Canvas, input, frame loop, and a small WebAudio synth. No assets: every
// pixel is drawn and every sound is generated at runtime, so the whole game
// is one self-contained file.

const W = 320, H = 180;
const cv = document.getElementById('screen');
const cx = cv.getContext('2d');
cx.imageSmoothingEnabled = false;

// --- input -------------------------------------------------------------
const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  W: 'up', S: 'down', A: 'left', D: 'right',
  z: 'ok', Z: 'ok', Enter: 'ok', ' ': 'ok',
  x: 'no', X: 'no', Escape: 'no', Backspace: 'no',
  c: 'menu', C: 'menu',
};
const held = {}, pressed = {}, consumed = {};

addEventListener('keydown', e => {
  const k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  if (!held[k]) pressed[k] = true;
  held[k] = true;
});
addEventListener('keyup', e => {
  const k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  held[k] = false;
});
addEventListener('blur', () => { for (const k in held) held[k] = false; });

const Input = {
  down: k => !!held[k],
  hit(k) { if (pressed[k] && !consumed[k]) { consumed[k] = true; return true; } return false; },
  // Held-with-repeat, for menus.
  repeat(k, state, delay = 0.28, rate = 0.08) {
    if (this.hit(k)) { state[k] = -delay; return true; }
    if (!held[k]) { state[k] = 0; return false; }
    state[k] = (state[k] || 0) + Time.dt;
    if (state[k] >= rate) { state[k] = 0; return true; }
    return false;
  },
  endFrame() { for (const k in pressed) { pressed[k] = false; consumed[k] = false; } },
};

// Touch: drag the left half to move, tap the right half to confirm.
let touchOrigin = null;
cv.addEventListener('touchstart', e => {
  e.preventDefault(); Audio_.unlock();
  const t = e.changedTouches[0], r = cv.getBoundingClientRect();
  if (t.clientX - r.left < r.width / 2) touchOrigin = { x: t.clientX, y: t.clientY };
  else { pressed.ok = true; held.ok = true; setTimeout(() => held.ok = false, 60); }
}, { passive: false });
cv.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!touchOrigin) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchOrigin.x, dy = t.clientY - touchOrigin.y, dead = 14;
  held.left = dx < -dead; held.right = dx > dead;
  held.up = dy < -dead; held.down = dy > dead;
}, { passive: false });
cv.addEventListener('touchend', e => {
  e.preventDefault(); touchOrigin = null;
  held.left = held.right = held.up = held.down = false;
}, { passive: false });

// --- time --------------------------------------------------------------
const Time = { dt: 0, t: 0, frame: 0 };

// --- audio -------------------------------------------------------------
// Everything is oscillators and filtered noise. Town music is warm and
// slightly detuned; liminal rooms get a single sustained tone and a hum.
const Audio_ = {
  ac: null, master: null, musicGain: null, sfxGain: null,
  current: null, seq: null, seqStep: 0, seqTime: 0, drones: [],

  unlock() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain(); this.master.gain.value = 0.34;
    this.master.connect(this.ac.destination);
    this.musicGain = this.ac.createGain(); this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ac.createGain(); this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.master);
    const note = document.getElementById('audio-note');
    if (note) { note.textContent = 'Sound on'; note.dataset.on = '1'; }
    if (this.pendingTrack) this.play(this.pendingTrack);
  },

  tone(freq, dur, { type = 'square', gain = 0.2, dest = null, detune = 0, attack = 0.005 } = {}) {
    if (!this.ac) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    const now = this.ac.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(now); o.stop(now + dur + 0.02);
  },

  noise(dur, { gain = 0.15, freq = 1200, q = 1 } = {}) {
    if (!this.ac) return;
    const n = Math.floor(this.ac.sampleRate * dur);
    const buf = this.ac.createBuffer(1, n, this.ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ac.createBufferSource(); src.buffer = buf;
    const f = this.ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = this.ac.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start();
  },

  sfx(name) {
    if (!this.ac) return;
    switch (name) {
      case 'blip':   this.tone(660, 0.05, { gain: 0.10, type: 'square' }); break;
      case 'ok':     this.tone(880, 0.07, { gain: 0.12 }); break;
      case 'cancel': this.tone(300, 0.08, { gain: 0.10 }); break;
      case 'step':   this.noise(0.05, { gain: 0.035, freq: 500, q: 1.4 }); break;
      case 'water':  this.noise(0.13, { gain: 0.06, freq: 1900, q: 0.7 }); break;
      case 'hit':    this.noise(0.16, { gain: 0.22, freq: 340, q: 0.8 });
                     this.tone(150, 0.14, { gain: 0.16, type: 'sawtooth' }); break;
      case 'hurt':   this.tone(190, 0.20, { gain: 0.18, type: 'sawtooth' });
                     this.tone(95, 0.26, { gain: 0.13, type: 'square' }); break;
      case 'psy':    for (let i = 0; i < 5; i++)
                       setTimeout(() => this.tone(720 + i * 190, 0.11, { gain: 0.09, type: 'sine' }), i * 34);
                     break;
      case 'heal':   [523, 659, 784, 1047].forEach((f, i) =>
                       setTimeout(() => this.tone(f, 0.16, { gain: 0.10, type: 'triangle' }), i * 55));
                     break;
      case 'levelup':[523, 659, 784, 1047, 1319].forEach((f, i) =>
                       setTimeout(() => this.tone(f, 0.24, { gain: 0.12, type: 'square' }), i * 85));
                     break;
      case 'door':   this.noise(0.30, { gain: 0.13, freq: 220, q: 0.5 }); break;
      case 'slam':   this.noise(0.45, { gain: 0.30, freq: 120, q: 0.4 });
                     this.tone(60, 0.4, { gain: 0.2, type: 'square' }); break;
      case 'win':    [659, 784, 988, 1319].forEach((f, i) =>
                       setTimeout(() => this.tone(f, 0.3, { gain: 0.13 }), i * 110));
                     break;
      case 'found':  [880, 1175].forEach((f, i) =>
                       setTimeout(() => this.tone(f, 0.22, { gain: 0.12, type: 'triangle' }), i * 90));
                     break;
      case 'wrong':  this.tone(120, 0.35, { gain: 0.16, type: 'sawtooth' }); break;
    }
  },

  // --- music -----------------------------------------------------------
  // Tracks are step sequences of semitone offsets; null is a rest.
  play(name) {
    if (!this.ac) { this.pendingTrack = name; return; }
    if (this.current === name) return;
    this.current = name;
    this.stopDrones();
    const t = TRACKS[name];
    this.seq = t || null; this.seqStep = 0; this.seqTime = 0;
    if (t && t.drones) t.drones.forEach(d => this.drone(d.freq, d.gain, d.type));
  },

  drone(freq, gain, type = 'sine') {
    if (!this.ac) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, this.ac.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, this.ac.currentTime + 1.4);
    o.connect(g); g.connect(this.musicGain); o.start();
    this.drones.push({ o, g });
  },

  stopDrones() {
    if (!this.ac) return;
    for (const d of this.drones) {
      d.g.gain.cancelScheduledValues(this.ac.currentTime);
      d.g.gain.setValueAtTime(d.g.gain.value, this.ac.currentTime);
      d.g.gain.exponentialRampToValueAtTime(0.0001, this.ac.currentTime + 0.5);
      d.o.stop(this.ac.currentTime + 0.6);
    }
    this.drones = [];
  },

  update(dt) {
    if (!this.ac || !this.seq || !this.seq.steps) return;
    this.seqTime += dt;
    const step = 60 / this.seq.bpm / 2;
    while (this.seqTime >= step) {
      this.seqTime -= step;
      const s = this.seq.steps[this.seqStep % this.seq.steps.length];
      if (s !== null && s !== undefined) {
        const f = 220 * Math.pow(2, s / 12);
        this.tone(f, step * (this.seq.legato || 1.7), {
          type: this.seq.type || 'square', gain: this.seq.gain || 0.055,
          dest: this.musicGain, detune: this.seq.detune || 0, attack: 0.02,
        });
        if (this.seq.bass && this.seqStep % 4 === 0) {
          this.tone(f / 4, step * 2.2, { type: 'triangle', gain: 0.05, dest: this.musicGain, attack: 0.02 });
        }
      }
      this.seqStep++;
    }
  },
};
addEventListener('pointerdown', () => Audio_.unlock(), { once: false });
addEventListener('keydown', () => Audio_.unlock(), { once: false });

// n.b. offsets are semitones from A3.
const TRACKS = {
  // Okobo: the prettiest thing in the game. Warm, detuned, a little wistful.
  okobo: {
    bpm: 104, type: 'triangle', gain: 0.075, detune: 7, legato: 1.9, bass: true,
    steps: [
      0, null, 4, 7, 9, null, 7, 4, 5, null, 9, 12, 11, null, 9, 7,
      0, null, 4, 7, 9, null, 12, 14, 16, null, 14, 12, 9, null, 7, null,
      -3, null, 2, 5, 7, null, 5, 2, 4, null, 7, 11, 9, null, 7, 4,
      0, null, 4, 7, 9, null, 7, 4, 2, null, 0, null, null, null, null, null,
    ],
  },
  // Battle: upbeat and cheerful against whatever is being revealed.
  battle: {
    bpm: 168, type: 'square', gain: 0.05, detune: 4, legato: 1.2, bass: true,
    steps: [
      0, 0, 7, 0, 10, 0, 7, 0, 3, 3, 10, 3, 12, 3, 10, 3,
      5, 5, 12, 5, 15, 5, 12, 5, 3, 3, 10, 3, 7, 7, 3, 0,
    ],
  },
  boss: {
    bpm: 176, type: 'sawtooth', gain: 0.042, detune: 11, legato: 1.1, bass: true,
    steps: [
      0, 1, 0, -1, 0, 3, 5, 3, 0, 1, 0, -1, 0, 6, 5, 3,
      -2, -1, -2, -3, -2, 1, 3, 1, 0, 5, 7, 5, 3, 1, 0, -1,
    ],
  },
  // Liminal rooms: no melody, just a held tone and a hum.
  gallery:  { drones: [{ freq: 55, gain: 0.05, type: 'sine' }, { freq: 110.3, gain: 0.022, type: 'sine' }] },
  orchard:  { drones: [{ freq: 73.4, gain: 0.045, type: 'sine' }, { freq: 147.6, gain: 0.014, type: 'triangle' }] },
  bedroom:  { drones: [{ freq: 48, gain: 0.055, type: 'sine' }] },
  void:     { drones: [{ freq: 41, gain: 0.05, type: 'sine' }] },
  none:     {},
};

// --- frame loop --------------------------------------------------------
let lastT = performance.now();
function frame(now) {
  Time.dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now; Time.t += Time.dt; Time.frame++;
  Audio_.update(Time.dt);
  Game.update(Time.dt);
  Game.draw();
  Input.endFrame();
  requestAnimationFrame(frame);
}
