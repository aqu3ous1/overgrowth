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

// --- touch controls ----------------------------------------------------
// An on-screen pad and buttons, drawn into the game's own 320x180 frame so
// they scale with it and land where they look like they are. The previous
// scheme — drag the left half, tap the right half — had no cancel and no menu,
// so half the game was unreachable on a phone.
//
// Named TouchPad, not Touch: a top-level `const Touch` shadows the DOM's own
// Touch constructor for everything else in the global scope.
const TouchPad = {
  on: false,                 // overlay live; set from Options
  supported: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
  ids: {},                   // touch identifier -> which control it grabbed
  lit: {},                   // control -> seconds of highlight left
  // The last tap or click, in game coordinates, for screens that want to be
  // pressed directly rather than through the pad — the controls picker has to
  // work before the player has told us which controls they have.
  lastTap: null,
  takeTap() { const t = this.lastTap; this.lastTap = null; return t; },
  // Up the sides, not along the bottom. Every text box in this game is anchored
  // to the bottom edge, so a thumb pad down there sits on top of the words -
  // the move list was unreadable behind it. These positions clear the tallest
  // bottom box (the battle move list, y 118 down) and the HUD in the corner.
  padX: 32, padY: 90, padR: 27, dead: 7,
  buttons: [
    { k: 'ok',   x: 291, y: 100, r: 17, label: 'Z' },
    { k: 'no',   x: 291, y: 60,  r: 14, label: 'X' },
    { k: 'menu', x: 299, y: 24,  r: 12, label: 'C' },
  ],

  // Client space -> the game's 320x180 space, so a tap lands on what it hit.
  local(t) {
    const r = cv.getBoundingClientRect();
    return [(t.clientX - r.left) / r.width * W, (t.clientY - r.top) / r.height * H];
  },

  buttonAt(x, y) {
    for (const b of this.buttons) if (Math.hypot(x - b.x, y - b.y) <= b.r) return b;
    return null;
  },
  onPad(x, y) {
    return Math.abs(x - this.padX) <= this.padR && Math.abs(y - this.padY) <= this.padR;
  },

  // The pad is a stick, not four keys: direction comes from the offset, so
  // diagonals work and a thumb sliding around the pad keeps steering.
  steer(x, y) {
    const dx = x - this.padX, dy = y - this.padY;
    held.left = dx < -this.dead;  held.right = dx > this.dead;
    held.up = dy < -this.dead;    held.down = dy > this.dead;
    for (const k of ['left', 'right', 'up', 'down']) if (held[k]) this.lit[k] = 0.12;
  },
  release() { held.left = held.right = held.up = held.down = false; },

  // While a text box is up there is nothing to steer and one thing to do, so
  // the whole screen becomes the advance button. Every mobile RPG does this and
  // it is the difference between readable and infuriating.
  reading() {
    return (typeof Dialogue !== 'undefined' && Dialogue.active)
        || (typeof Game !== 'undefined' && Game.mode === 'cutscene')
        || (typeof Battle !== 'undefined' && Battle.active && Battle.state === 'message');
  },

  start(t) {
    const [x, y] = this.local(t);
    const b = this.buttonAt(x, y);
    if (b) {
      this.ids[t.identifier] = b.k;
      if (!held[b.k]) pressed[b.k] = true;
      held[b.k] = true;
      this.lit[b.k] = 0.16;
      return;
    }
    if (!this.reading() && this.onPad(x, y)) {
      this.ids[t.identifier] = 'pad'; this.steer(x, y); return;
    }
    if (this.reading()) {
      this.ids[t.identifier] = 'ok';
      if (!held.ok) pressed.ok = true;
      held.ok = true;
    }
  },
  move(t) {
    if (this.ids[t.identifier] !== 'pad') return;
    const [x, y] = this.local(t);
    this.steer(x, y);
  },
  end(t) {
    const which = this.ids[t.identifier];
    delete this.ids[t.identifier];
    if (!which) return;
    if (which === 'pad') this.release();
    else held[which] = false;
  },
  tick(dt) { for (const k in this.lit) this.lit[k] = Math.max(0, this.lit[k] - dt); },

  draw() {
    if (!this.on) return;
    // The picker asks which controls you want; showing them over the question
    // answers it for you.
    if (typeof Game !== 'undefined' && Game.mode === 'controls') return;
    const a = (k, base) => (this.lit[k] > 0 ? Math.min(1, base * 2.1) : base);
    // The pad is hidden while reading: it would sit on top of the text box, and
    // there is nothing to walk to anyway.
    // Every element is a light shape on its own dark plate. A single light
    // shape disappears against snow; a single dark one disappears in the
    // Gallery. Both together survive either.
    if (!this.reading()) {
      cx.globalAlpha = 0.42;
      circle(this.padX, this.padY, this.padR, '#0a0c12');
      cx.globalAlpha = 0.7;
      ring(this.padX, this.padY, this.padR, '#9aa1b2');
      const arms = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
      for (const [k, dx, dy] of arms) {
        const bx = this.padX + dx * 15, by = this.padY + dy * 15;
        const w = dy ? 14 : 8, h = dy ? 8 : 14;
        cx.globalAlpha = a(k, 0.55);
        rect(bx - w / 2 - 1, by - h / 2 - 1, w + 2, h + 2, '#0a0c12');
        cx.globalAlpha = a(k, 0.8);
        rect(bx - w / 2, by - h / 2, w, h, '#e6e8ee');
      }
    }
    for (const b of this.buttons) {
      if (this.reading() && b.k !== 'ok') continue;
      cx.globalAlpha = a(b.k, 0.42);
      circle(b.x, b.y, b.r, '#0a0c12');
      cx.globalAlpha = a(b.k, 0.72);
      ring(b.x, b.y, b.r, '#c8ccd8');
      cx.globalAlpha = a(b.k, 0.85);
      text(b.label, b.x - 2, b.y - 3, '#f0f2f6');
    }
    cx.globalAlpha = 1;
  },
};

cv.addEventListener('touchstart', e => {
  Audio_.unlock();
  // Recorded whether or not the overlay is live: a screen may want the raw tap.
  if (e.changedTouches[0]) TouchPad.lastTap = TouchPad.local(e.changedTouches[0]);
  if (!TouchPad.on) return;
  e.preventDefault();
  for (const t of e.changedTouches) TouchPad.start(t);
}, { passive: false });
// A mouse counts too, so the picker can be clicked on a desktop.
cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') return;         // already handled above
  TouchPad.lastTap = TouchPad.local(e);
});
cv.addEventListener('touchmove', e => {
  if (!TouchPad.on) return;
  e.preventDefault();
  for (const t of e.changedTouches) TouchPad.move(t);
}, { passive: false });
for (const ev of ['touchend', 'touchcancel']) {
  cv.addEventListener(ev, e => {
    if (!TouchPad.on) return;
    e.preventDefault();
    for (const t of e.changedTouches) TouchPad.end(t);
  }, { passive: false });
}

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

  tone(freq, dur, { type = 'square', gain = 0.2, dest = null, detune = 0,
                    attack = 0.005, when = 0, vibrato = 0, decay = 0 } = {}) {
    if (!this.ac) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    const now = this.ac.currentTime + when;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + attack);
    // A held note that only ramps down at the very end reads as an organ. A
    // short drop to a sustain level first is what makes it read as plucked,
    // which is most of the difference between this and the flat tone it was.
    if (decay > 0) {
      g.gain.exponentialRampToValueAtTime(gain * decay, now + attack + dur * 0.28);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    // A slow, shallow wobble on the melody voice only. SNES leads almost never
    // sit perfectly still, and a perfectly still square is the sound of a
    // placeholder.
    if (vibrato) {
      const lfo = this.ac.createOscillator(), amt = this.ac.createGain();
      lfo.frequency.value = 5.2; amt.gain.value = vibrato;
      lfo.connect(amt); amt.connect(o.detune);
      lfo.start(now); lfo.stop(now + dur + 0.02);
    }
    o.start(now); o.stop(now + dur + 0.02);
  },

  // --- kit ---------------------------------------------------------------
  // Three voices, synthesised rather than sampled, all routed to the music bus
  // so the volume setting moves them with the rest of the track.
  burst(dur, { gain = 0.15, freq = 1200, q = 1, when = 0, type = 'bandpass', dest = null } = {}) {
    if (!this.ac) return;
    const n = Math.max(1, Math.floor(this.ac.sampleRate * dur));
    const buf = this.ac.createBuffer(1, n, this.ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const src = this.ac.createBufferSource(); src.buffer = buf;
    const f = this.ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ac.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(dest || this.musicGain);
    src.start(this.ac.currentTime + when);
  },

  kick(when, gain = 0.20) {
    if (!this.ac) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    const t0 = this.ac.currentTime + when;
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t0);
    o.frequency.exponentialRampToValueAtTime(46, t0 + 0.11);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
    o.connect(g); g.connect(this.musicGain);
    o.start(t0); o.stop(t0 + 0.18);
  },

  snare(when, gain = 0.11) {
    this.burst(0.13, { gain, freq: 1750, q: 0.7, when });
    this.tone(196, 0.07, { type: 'triangle', gain: gain * 0.5, dest: this.musicGain, when });
  },

  hat(when, gain = 0.035, open = false) {
    this.burst(open ? 0.13 : 0.035, { gain, freq: 8200, q: 0.6, when, type: 'highpass' });
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
      // Layered on top of the ordinary hit, never instead of it: a crit should
      // sound like the same punch landing harder.
      case 'crit':   this.noise(0.09, { gain: 0.26, freq: 2600, q: 1.2 });
                     [1046, 1568].forEach((f, i) =>
                       setTimeout(() => this.tone(f, 0.10, { gain: 0.14, type: 'square' }), i * 45));
                     break;
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

  hz(semitones) { return 220 * Math.pow(2, semitones / 12); },

  update(dt) {
    if (!this.ac || !this.seq) return;
    const t = this.seq;
    if (!t.lead && !t.drums && !t.chords) return;   // drone-only rooms
    this.seqTime += dt;
    const step = 60 / t.bpm / 2;                    // one step is an eighth note
    while (this.seqTime >= step) {
      this.seqTime -= step;
      this.step(t, this.seqStep, step);
      this.seqStep++;
    }
  },

  // One eighth note, across every voice the track has. The four are deliberately
  // driven off the same counter rather than four sequencers: a melody that can
  // drift out of phase with its own bass line is worse than having no bass.
  step(t, i, step) {
    // Swing: hold the offbeats back. Straight eighths are the single biggest
    // reason the old tracks sounded like a test tone rather than music.
    const late = (i % 2 === 1) ? (t.swing || 0) * step : 0;
    const bar = t.chordEvery || 8;

    if (t.lead) {
      const L = t.lead;
      const s = L.steps[i % L.steps.length];
      if (s !== null && s !== undefined) {
        this.tone(this.hz(s + (t.key || 0)), step * (L.legato || 1.7), {
          type: L.type || 'square', gain: L.gain || 0.055, dest: this.musicGain,
          detune: L.detune || 0, attack: 0.015, when: late,
          vibrato: L.vibrato || 0, decay: L.decay || 0,
        });
      }
    }

    if (t.chords) {
      const [root, quality] = t.chords[Math.floor(i / bar) % t.chords.length];
      const notes = CHORDS[quality] || CHORDS.maj;
      const at = i % bar;
      // Comping. Spread by a few milliseconds per note so the chord is strummed
      // rather than stamped.
      if (t.comp && t.comp[at % t.comp.length] === 'x') {
        notes.forEach((n, k) => this.tone(
          this.hz(root + n + (t.key || 0) - 12), step * (t.compLen || 0.9), {
            type: t.padType || 'square', gain: t.padGain || 0.018,
            dest: this.musicGain, attack: 0.012, when: late + k * 0.006, decay: 0.5,
          }));
      }
      if (t.bassLine) {
        const c = t.bassLine[at % t.bassLine.length];
        if (c !== '-') {
          // r root, 3 third, 5 fifth, 7 seventh, 8 the octave above.
          const deg = c === 'r' ? 0 : c === '3' ? notes[1] : c === '5' ? notes[2]
                    : c === '7' ? (notes[3] === undefined ? 10 : notes[3]) : 12;
          this.tone(this.hz(root + deg + (t.key || 0) - 24), step * (t.bassLen || 1.5), {
            type: t.bassType || 'triangle', gain: t.bassGain || 0.062,
            dest: this.musicGain, attack: 0.008, when: late, decay: 0.45,
          });
        }
      }
    }

    if (t.drums) {
      const d = t.drums[i % t.drums.length];
      if (d === 'k') this.kick(late, t.kickGain || 0.2);
      else if (d === 's') this.snare(late, t.snareGain || 0.11);
      else if (d === 'h') this.hat(late, t.hatGain || 0.03);
      else if (d === 'H') this.hat(late, (t.hatGain || 0.03) * 1.4, true);
      else if (d === 'K') { this.kick(late, t.kickGain || 0.2); this.hat(late, t.hatGain || 0.03); }
    }
  },
};

// Chord shapes, as semitone offsets from the chord's root. The sevenths and
// ninths are the point: triads alone sound like a hymn, and this game's
// reference is a SNES RPG that never met a major seventh it did not like.
const CHORDS = {
  maj:  [0, 4, 7],       min:  [0, 3, 7],
  maj7: [0, 4, 7, 11],   min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],   min9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14], add9: [0, 4, 7, 14],
  sus4: [0, 5, 7],       sus2: [0, 2, 7],
  dim:  [0, 3, 6],       dim7: [0, 3, 6, 9],
  aug:  [0, 4, 8],       m7b5: [0, 3, 6, 10],
  six:  [0, 4, 7, 9],    m6:   [0, 3, 7, 9],
};
addEventListener('pointerdown', () => Audio_.unlock(), { once: false });
addEventListener('keydown', () => Audio_.unlock(), { once: false });

// Offsets are semitones from A3 (220 Hz). A track is up to four voices sharing
// one clock: `lead` carries the tune, `chords` gives the harmony that `comp` and
// `bassLine` are read against, and `drums` is a step string — k kick, s snare,
// h hat, H open hat, K kick and hat together, - rest.
const TRACKS = {
  // Okobo: the prettiest thing in the game. Amaj7 - F#m7 - Dmaj7 - E7, which is
  // about as EarthBound as four chords get: a plain major key with the sevenths
  // left in so it never quite resolves into something cheerful.
  okobo: {
    bpm: 104, swing: 0.16, chordEvery: 16,
    chords: [[0, 'maj7'], [-3, 'min7'], [-7, 'maj9'], [-5, 'dom7']],
    comp: '--x--x-x--x--x-x', padType: 'triangle', padGain: 0.020, compLen: 1.1,
    bassLine: 'r--5--3-r--5--7-', bassGain: 0.058,
    drums: 'k--h-s-hk-Kh-s-h', kickGain: 0.15, snareGain: 0.075, hatGain: 0.022,
    lead: {
      type: 'triangle', gain: 0.072, detune: 7, legato: 1.9, vibrato: 9, decay: 0.62,
      steps: [
        0, null, 4, 7, 9, null, 7, 4, 5, null, 9, 12, 11, null, 9, 7,
        0, null, 4, 7, 9, null, 12, 14, 16, null, 14, 12, 9, null, 7, null,
        -3, null, 2, 5, 7, null, 5, 2, 4, null, 7, 11, 9, null, 7, 4,
        0, null, 4, 7, 9, null, 7, 4, 2, null, 0, null, null, null, null, null,
      ],
    },
  },

  // Ondo: the capital. Same language, slower, and voiced lower — a town that
  // used to be grander and knows it. Emaj7 - C#m7 - Amaj7 - Bm7.
  ondo: {
    bpm: 88, swing: 0.18, chordEvery: 16,
    chords: [[-5, 'maj7'], [-8, 'min7'], [-12, 'maj9'], [-10, 'min7']],
    comp: '--x-----x-x-----', padType: 'triangle', padGain: 0.022, compLen: 1.8,
    bassLine: 'r-------5---3---', bassGain: 0.060, bassLen: 2.4,
    drums: 'k-------s-----h-', kickGain: 0.13, snareGain: 0.055, hatGain: 0.018,
    lead: {
      type: 'triangle', gain: 0.068, detune: 9, legato: 2.1, vibrato: 11, decay: 0.7,
      steps: [
        -5, null, 0, 2, 3, null, 2, 0, -2, null, 3, 7, 5, null, 3, 2,
        -5, null, 0, 3, 7, null, 10, 12, 10, null, 7, 3, 2, null, 0, null,
        -7, null, -2, 2, 5, null, 3, -2, 0, null, 5, 9, 7, null, 5, 2,
        -5, null, 0, 2, 3, null, 0, -2, -5, null, null, null, null, null, null, null,
      ],
    },
  },

  // Kestrel Works: cold and mechanically dead. No harmony and no kit, but the
  // hum is on a slow pulse now, because a factory that is merely silent reads
  // as an empty channel rather than as a building.
  kestrel: {
    bpm: 52, chordEvery: 8,
    drones: [{ freq: 43.7, gain: 0.055, type: 'sine' },
             { freq: 87.9, gain: 0.02, type: 'triangle' },
             { freq: 131.2, gain: 0.008, type: 'sine' }],
    drums: '-------h--------k-------h-------',
    kickGain: 0.07, hatGain: 0.012,
  },

  // Battle: upbeat and cheerful against whatever is being revealed. A funk vamp
  // on Am7 - D9 - Am7 - E7, swung, because the joke of this game's battle theme
  // is that it is having a much better time than the player is.
  battle: {
    bpm: 168, swing: 0.14, chordEvery: 8,
    chords: [[0, 'min7'], [5, 'dom7'], [0, 'min7'], [7, 'dom7']],
    comp: '--x--x-x', padType: 'square', padGain: 0.016, compLen: 0.6,
    bassLine: 'r-r-5-7-', bassGain: 0.070, bassLen: 0.9, bassType: 'sawtooth',
    drums: 'k-hks-hhk-hks-hs', kickGain: 0.19, snareGain: 0.10, hatGain: 0.026,
    lead: {
      type: 'square', gain: 0.048, detune: 4, legato: 1.2, vibrato: 5, decay: 0.5,
      steps: [
        0, 0, 7, 0, 10, 0, 7, 0, 3, 3, 10, 3, 12, 3, 10, 3,
        5, 5, 12, 5, 15, 5, 12, 5, 3, 3, 10, 3, 7, 7, 3, 0,
      ],
    },
  },

  // Boss: the same kit, driven harder, over chords that will not sit still.
  // Diminished into a flat second — nothing here resolves.
  boss: {
    bpm: 176, chordEvery: 8,
    chords: [[0, 'dim7'], [1, 'dim7'], [0, 'm7b5'], [-1, 'dom7']],
    comp: 'x---x-x-', padType: 'square', padGain: 0.014, compLen: 0.5,
    bassLine: 'r-r-r-3-', bassGain: 0.075, bassLen: 0.8, bassType: 'sawtooth',
    drums: 'kkhsk-hsk-hskshs', kickGain: 0.21, snareGain: 0.12, hatGain: 0.028,
    lead: {
      type: 'sawtooth', gain: 0.040, detune: 11, legato: 1.1, vibrato: 14, decay: 0.45,
      steps: [
        0, 1, 0, -1, 0, 3, 5, 3, 0, 1, 0, -1, 0, 6, 5, 3,
        -2, -1, -2, -3, -2, 1, 3, 1, 0, 5, 7, 5, 3, 1, 0, -1,
      ],
    },
  },

  // Sable City: fast, bright, and too many voices at once. Four-on-the-floor
  // under add9s, which is the sound of somewhere that would like you to keep
  // moving.
  sable: {
    bpm: 152, swing: 0.08, chordEvery: 16,
    chords: [[7, 'add9'], [5, 'maj9'], [3, 'min7'], [2, 'dom7']],
    comp: '-x-x-x-x-x-x-x-x', padType: 'square', padGain: 0.014, compLen: 0.55,
    bassLine: 'r-5-r-5-r-5-3-7-', bassGain: 0.066, bassLen: 0.9,
    drums: 'k-hks-hkk-hks-hs', kickGain: 0.18, snareGain: 0.095, hatGain: 0.030,
    lead: {
      type: 'square', gain: 0.044, detune: 9, legato: 1.1, vibrato: 6, decay: 0.5,
      steps: [
        7, 12, 14, 12, 7, 12, 14, 16, 14, 12, 7, 5, 7, null, 5, 3,
        5, 10, 12, 10, 5, 10, 12, 14, 12, 10, 5, 3, 5, null, 3, 2,
        0, 7, 12, 7, 0, 7, 12, 14, 12, 7, 0, -2, 0, null, -2, -4,
        3, 10, 15, 10, 3, 10, 15, 17, 15, 10, 3, 2, 0, null, null, null,
      ],
    },
  },

  // Bellhouse: a corridor. Two tones a semitone apart, and a door somewhere
  // else in the building.
  bellhouse: {
    bpm: 46, chordEvery: 8,
    drones: [{ freq: 58, gain: 0.05, type: 'sine' },
             { freq: 61.4, gain: 0.03, type: 'sine' },
             { freq: 174, gain: 0.012, type: 'triangle' }],
    drums: '---------------s', snareGain: 0.03,
  },
  // Vixtry Regional Campus. The only track in the game in a clean major key
  // with nothing wrong in it, which is the point: it is corporate hold music
  // and it is genuinely pleasant. Cmaj9 - Am9 - Fmaj7 - G13, brushed.
  campus: {
    bpm: 96, swing: 0.20, chordEvery: 16,
    chords: [[3, 'maj9'], [0, 'min9'], [-4, 'maj7'], [-2, 'dom7']],
    comp: '--x--x-x--x--x-x', padType: 'triangle', padGain: 0.019, compLen: 1.2,
    bassLine: 'r--5--3-r--7--5-', bassGain: 0.052,
    drums: 'k--h-s-h--Kh-s-h', kickGain: 0.11, snareGain: 0.045, hatGain: 0.016,
    lead: {
      type: 'sine', gain: 0.062, detune: 3, legato: 2.0, vibrato: 6, decay: 0.72,
      steps: [
        7, null, 10, 12, 14, null, 12, 10, 12, null, 14, 17, 15, null, 14, 12,
        3, null, 7, 10, 12, null, 10, 7, 10, null, 12, 15, 14, null, 12, 10,
        -1, null, 3, 7, 8, null, 7, 3, 5, null, 8, 12, 10, null, 8, 7,
        2, null, 5, 9, 11, null, 9, 5, 3, null, null, null, null, null, null, null,
      ],
    },
  },

  // Evergreen. The sweetest thing in the game, and the only track with no
  // seventh anywhere in it - plain major triads and a plain major bass, which is
  // exactly why it is unsettling next to Okobo. It is a jingle, not a theme.
  evergreen: {
    bpm: 118, swing: 0.10, chordEvery: 8,
    chords: [[3, 'maj'], [-2, 'maj'], [-4, 'maj'], [3, 'six']],
    comp: '-x-x-x-x', padType: 'triangle', padGain: 0.022, compLen: 0.7,
    bassLine: 'r-5-r-3-', bassGain: 0.050,
    drums: 'k-h-s-h-k-h-s-hh', kickGain: 0.12, snareGain: 0.05, hatGain: 0.020,
    lead: {
      type: 'triangle', gain: 0.070, detune: 4, legato: 1.5, vibrato: 4, decay: 0.6,
      steps: [
        7, 7, 10, 12, 14, null, 12, 10, 10, 10, 12, 14, 12, null, 10, 7,
        5, 5, 8, 10, 12, null, 10, 8, 3, 3, 7, 10, 12, null, 10, 7,
        7, 7, 10, 12, 14, null, 15, 14, 12, null, 10, null, 7, null, null, null,
      ],
    },
  },

  // The Long Hall. The Gallery's drone, a fifth lower and slowing down, with a
  // fluorescent tick in it that is not quite on the beat.
  longhall: {
    bpm: 38, chordEvery: 8,
    drones: [{ freq: 36.7, gain: 0.052, type: 'sine' },
             { freq: 55.0, gain: 0.024, type: 'sine' },
             { freq: 110.0, gain: 0.009, type: 'triangle' }],
    drums: '-------h-------------h----------', hatGain: 0.010,
  },

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
  TouchPad.tick(Time.dt);
  Game.update(Time.dt);
  Game.draw();
  TouchPad.draw();
  Input.endFrame();
  requestAnimationFrame(frame);
}
