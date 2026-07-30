// ---------------------------------------------------------------- art
// A 5x7 bitmap font, pixel sprites as row strings, and procedural tile
// texture. Nothing is loaded; everything here is drawn.

// --- font --------------------------------------------------------------
const FONT_H = 7, FONT_W = 5;
const GLYPHS = {
  'A': '01110,10001,10001,11111,10001,10001,10001',
  'B': '11110,10001,10001,11110,10001,10001,11110',
  'C': '01110,10001,10000,10000,10000,10001,01110',
  'D': '11110,10001,10001,10001,10001,10001,11110',
  'E': '11111,10000,10000,11110,10000,10000,11111',
  'F': '11111,10000,10000,11110,10000,10000,10000',
  'G': '01110,10001,10000,10111,10001,10001,01111',
  'H': '10001,10001,10001,11111,10001,10001,10001',
  'I': '01110,00100,00100,00100,00100,00100,01110',
  'J': '00111,00010,00010,00010,00010,10010,01100',
  'K': '10001,10010,10100,11000,10100,10010,10001',
  'L': '10000,10000,10000,10000,10000,10000,11111',
  'M': '10001,11011,10101,10101,10001,10001,10001',
  'N': '10001,11001,10101,10011,10001,10001,10001',
  'O': '01110,10001,10001,10001,10001,10001,01110',
  'P': '11110,10001,10001,11110,10000,10000,10000',
  'Q': '01110,10001,10001,10001,10101,10010,01101',
  'R': '11110,10001,10001,11110,10100,10010,10001',
  'S': '01111,10000,10000,01110,00001,00001,11110',
  'T': '11111,00100,00100,00100,00100,00100,00100',
  'U': '10001,10001,10001,10001,10001,10001,01110',
  'V': '10001,10001,10001,10001,10001,01010,00100',
  'W': '10001,10001,10001,10101,10101,11011,10001',
  'X': '10001,10001,01010,00100,01010,10001,10001',
  'Y': '10001,10001,01010,00100,00100,00100,00100',
  'Z': '11111,00001,00010,00100,01000,10000,11111',
  'a': '00000,00000,01110,00001,01111,10001,01111',
  'b': '10000,10000,11110,10001,10001,10001,11110',
  'c': '00000,00000,01111,10000,10000,10000,01111',
  'd': '00001,00001,01111,10001,10001,10001,01111',
  'e': '00000,00000,01110,10001,11111,10000,01110',
  'f': '00110,01001,01000,11100,01000,01000,01000',
  'g': '00000,01111,10001,10001,01111,00001,01110',
  'h': '10000,10000,11110,10001,10001,10001,10001',
  'i': '00100,00000,01100,00100,00100,00100,01110',
  'j': '00010,00000,00110,00010,00010,10010,01100',
  'k': '10000,10000,10010,10100,11000,10100,10010',
  'l': '01100,00100,00100,00100,00100,00100,01110',
  'm': '00000,00000,11010,10101,10101,10101,10101',
  'n': '00000,00000,11110,10001,10001,10001,10001',
  'o': '00000,00000,01110,10001,10001,10001,01110',
  'p': '00000,11110,10001,10001,11110,10000,10000',
  'q': '00000,01111,10001,10001,01111,00001,00001',
  'r': '00000,00000,10110,11000,10000,10000,10000',
  's': '00000,00000,01111,10000,01110,00001,11110',
  't': '01000,01000,11100,01000,01000,01001,00110',
  'u': '00000,00000,10001,10001,10001,10011,01101',
  'v': '00000,00000,10001,10001,10001,01010,00100',
  'w': '00000,00000,10001,10001,10101,10101,01010',
  'x': '00000,00000,10001,01010,00100,01010,10001',
  'y': '00000,10001,10001,10001,01111,00001,01110',
  'z': '00000,00000,11111,00010,00100,01000,11111',
  '0': '01110,10001,10011,10101,11001,10001,01110',
  '1': '00100,01100,00100,00100,00100,00100,01110',
  '2': '01110,10001,00001,00110,01000,10000,11111',
  '3': '11110,00001,00001,01110,00001,00001,11110',
  '4': '00010,00110,01010,10010,11111,00010,00010',
  '5': '11111,10000,11110,00001,00001,10001,01110',
  '6': '00110,01000,10000,11110,10001,10001,01110',
  '7': '11111,00001,00010,00100,01000,01000,01000',
  '8': '01110,10001,10001,01110,10001,10001,01110',
  '9': '01110,10001,10001,01111,00001,00010,01100',
  '.': '00000,00000,00000,00000,00000,01100,01100',
  ',': '00000,00000,00000,00000,01100,01100,01000',
  '!': '00100,00100,00100,00100,00100,00000,00100',
  '?': '01110,10001,00001,00110,00100,00000,00100',
  "'": '00100,00100,00000,00000,00000,00000,00000',
  '"': '01010,01010,00000,00000,00000,00000,00000',
  '-': '00000,00000,00000,11111,00000,00000,00000',
  ':': '00000,01100,01100,00000,01100,01100,00000',
  ';': '00000,01100,01100,00000,01100,01100,01000',
  '/': '00001,00010,00010,00100,01000,01000,10000',
  '(': '00010,00100,01000,01000,01000,00100,00010',
  ')': '01000,00100,00010,00010,00010,00100,01000',
  '+': '00000,00100,00100,11111,00100,00100,00000',
  '<': '00010,00100,01000,10000,01000,00100,00010',
  '>': '01000,00100,00010,00001,00010,00100,01000',
  '%': '10001,00010,00100,00100,01000,10001,00000',
  '*': '00000,10101,01110,11111,01110,10101,00000',
  '#': '01010,11111,01010,01010,11111,01010,00000',
  '=': '00000,00000,11111,00000,11111,00000,00000',
  '_': '00000,00000,00000,00000,00000,00000,11111',
  // the block glyph: what the game will not show you
  '@': '11111,11111,11111,11111,11111,11111,11111',
  ' ': '00000,00000,00000,00000,00000,00000,00000',
};
const GLYPH_CACHE = {};
for (const ch in GLYPHS) GLYPH_CACHE[ch] = GLYPHS[ch].split(',');

function drawChar(ch, x, y, color) {
  const g = GLYPH_CACHE[ch] || GLYPH_CACHE['?'];
  cx.fillStyle = color;
  for (let r = 0; r < FONT_H; r++) {
    const row = g[r];
    for (let c = 0; c < FONT_W; c++) if (row[c] === '1') cx.fillRect(x + c, y + r, 1, 1);
  }
}

function text(str, x, y, color = '#e8e8ee', spacing = 1) {
  let cxp = x;
  for (const ch of String(str)) {
    if (ch !== ' ') drawChar(ch, cxp, y, color);
    cxp += FONT_W + spacing;
  }
  return cxp;
}

function textWidth(str, spacing = 1) { return String(str).length * (FONT_W + spacing) - spacing; }
function textCentered(str, cxPos, y, color, spacing = 1) {
  text(str, Math.round(cxPos - textWidth(str, spacing) / 2), y, color, spacing);
}

// Word-wraps to a pixel width, returning lines.
function wrap(str, maxPx, spacing = 1) {
  const words = String(str).split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (textWidth(test, spacing) > maxPx && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// --- drawing helpers ---------------------------------------------------
function rect(x, y, w, h, c) { cx.fillStyle = c; cx.fillRect(x | 0, y | 0, w | 0, h | 0); }

// Only the touch overlay uses these; everything in the world is rectangles.
function circle(x, y, r, c) {
  cx.fillStyle = c; cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
}
function ring(x, y, r, c, w = 1) {
  cx.strokeStyle = c; cx.lineWidth = w;
  cx.beginPath(); cx.arc(x, y, r - w / 2, 0, Math.PI * 2); cx.stroke();
}

// Deterministic per-pixel noise, so texture never shimmers between frames.
//
// Multiplied through Math.imul, and shifted with >>> rather than >>. The plain
// `*` version this started as overflowed into a double, so the following shift
// truncated it and the result was uniform on [0, 0.5) - it could not return a
// value of 0.5 or above for any input at all. Every `hash2(...) > 0.5x` test in
// the game was therefore dead, and a lot of authored texture detail - rust
// streaks on the works, lit windows, shingle highlights - had never once been
// drawn. Mean is 0.4996 across a 400x400 grid now, deciles within 0.2%.
function hash2(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h ^= 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// --- sprites -----------------------------------------------------------
// SPR and PAL are generated by tools/gen_sprites.py into 15_sprites.js.
// Palette keys are base36 so a sprite can carry more than ten tones.

function sprite(name, x, y, pal, flip = false, alpha = 1) {
  const s = SPR[name]; if (!s) return;
  const p = PAL[pal] || PAL.player;
  if (alpha < 1) cx.globalAlpha = alpha;
  const w = s[0].length;
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < w; c++) {
      const ch = s[r][c];
      if (ch === '.' || ch === ' ') continue;
      const col = p[ch]; if (!col) continue;
      cx.fillStyle = col;
      cx.fillRect((x + (flip ? w - 1 - c : c)) | 0, (y + r) | 0, 1, 1);
    }
  }
  if (alpha < 1) cx.globalAlpha = 1;
}

function spriteWidth(name) { return SPR[name] ? SPR[name][0].length : 0; }
function spriteHeight(name) { return SPR[name] ? SPR[name].length : 0; }

// --- lighting ----------------------------------------------------------
// One dominant source per room, hard falloff, corners going to actual black.
function vignette(strength, cxp = W / 2, cyp = H / 2, radius = 130) {
  if (strength <= 0) return;
  const g = cx.createRadialGradient(cxp, cyp, 8, cxp, cyp, radius);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.55, `rgba(0,0,0,${strength * 0.35})`);
  g.addColorStop(1, `rgba(0,0,0,${Math.min(1, strength)})`);
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
}

function tintScreen(color, alpha) {
  if (alpha <= 0) return;
  cx.globalAlpha = alpha; rect(0, 0, W, H, color); cx.globalAlpha = 1;
}

// Fine grain over everything — the VHS-soft layer the sprites sit against.
function grain(amount = 0.05) {
  if (typeof Options !== 'undefined' && Options.values && !Options.values.grain) return;
  if (amount <= 0) return;
  const step = 2, seed = (Time.frame / 3) | 0;
  cx.globalAlpha = amount;
  cx.fillStyle = '#ffffff';
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (hash2(x + seed * 31, y - seed * 17) > 0.86) cx.fillRect(x, y, 1, 1);
    }
  }
  cx.globalAlpha = 1;
}
