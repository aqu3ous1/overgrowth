// ---------------------------------------------------------------- world
// Tiles, rooms, wandering enemies. Encounters are visible on the overworld
// and avoidable, because in the liminal zones the quiet is the point.

const TS = 16;                       // tile size
const SOLID = new Set(['#', 'T', ' ', '=']);
const WALKWAY = new Set(['P', 'D']);

// --- tile painting -----------------------------------------------------
function paintGrass(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#3f7a30', dim));
  for (let i = 0; i < 14; i++) {
    const h = hash2(tx * 71 + i, ty * 37 + i * 13);
    const px = x + ((h * TS) | 0), py = y + ((hash2(i, tx * ty + i) * TS) | 0);
    rect(px, py, 1, h > 0.5 ? 2 : 1, shade(h > 0.62 ? '#4f9440' : '#33632a', dim));
  }
}
function paintBrick(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#3a2622', dim));
  const bh = 4;
  for (let r = 0; r < TS / bh; r++) {
    const off = ((ty * (TS / bh) + r) % 2) ? 8 : 0;
    for (let c = -1; c < 3; c++) {
      const bx = x + off + c * 8, by = y + r * bh;
      const v = hash2(tx * 13 + c + off, ty * 29 + r);
      rect(Math.max(x, bx), by, Math.min(7, x + TS - bx), bh - 1,
           shade(v > 0.72 ? '#8a4739' : v > 0.35 ? '#7d3f34' : '#6d362c', dim));
    }
  }
}
function paintWood(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#4a3324', dim));
  for (let c = 0; c < TS; c += 4) {
    rect(x + c, y, 3, TS, shade(hash2(tx * 7 + c, ty) > 0.5 ? '#553a29' : '#4a3324', dim));
    rect(x + c + 3, y, 1, TS, shade('#33231a', dim));
  }
}
function paintWater(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#2b4a5c', dim));
  const t = Time.t * 0.7;
  for (let i = 0; i < 5; i++) {
    const h = hash2(tx * 17 + i, ty * 23 + i);
    const py = y + ((h * TS) | 0);
    const px = x + (((h * 2 + Math.sin(t + h * 6) * 0.12 + 1) % 1 * TS) | 0);
    rect(px, py, 3, 1, shade('#5d8fa4', dim));
  }
}
function paintCeiling(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#5a5a52', dim));
  rect(x, y, TS, 1, shade('#3e3e38', dim));
  rect(x, y, 1, TS, shade('#3e3e38', dim));
  for (let i = 0; i < 6; i++) {
    const h = hash2(tx * 31 + i, ty * 11 + i);
    rect(x + ((h * TS) | 0), y + ((hash2(i, tx + ty) * TS) | 0), 1, 1, shade('#6a6a60', dim));
  }
}
function paintCarpet(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#2a2530', dim));
  for (let i = 0; i < 8; i++) {
    const h = hash2(tx * 41 + i, ty * 19 + i);
    rect(x + ((h * TS) | 0), y + ((hash2(i * 3, tx - ty) * TS) | 0), 1, 1, shade('#332d3a', dim));
  }
}
function paintPath(x, y, tx, ty, dim, overWater) {
  if (overWater) {
    // stepping stones, so a way through the orchard reads as a way through
    paintWater(x, y, tx, ty, dim);
    for (let i = 0; i < 3; i++) {
      const h = hash2(tx * 61 + i, ty * 47 + i);
      const sx = x + 2 + ((h * 9) | 0), sy = y + 2 + ((hash2(i, tx + ty * 3) * 9) | 0);
      rect(sx, sy, 5, 4, shade('#6e6a5e', dim));
      rect(sx, sy, 5, 1, shade('#8a8578', dim));
    }
    return;
  }
  rect(x, y, TS, TS, shade('#6a5a42', dim));
  for (let i = 0; i < 12; i++) {
    const h = hash2(tx * 83 + i, ty * 59 + i);
    rect(x + ((h * TS) | 0), y + ((hash2(i * 7, tx - ty * 2) * TS) | 0), 1, 1,
         shade(h > 0.5 ? '#7d6c4f' : '#57492f', dim));
  }
}
function paintSnow(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#b9c2cc', dim));
  for (let i = 0; i < 10; i++) {
    const h = hash2(tx * 91 + i, ty * 67 + i);
    rect(x + ((h * TS) | 0), y + ((hash2(i * 9, tx + ty * 5) * TS) | 0), 1, 1,
         shade(h > 0.6 ? '#d8e0e8' : '#9aa4b0', dim));
  }
}
function paintConcrete(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#54565c', dim));
  rect(x, y, TS, 1, shade('#43454a', dim));
  rect(x, y, 1, TS, shade('#43454a', dim));
  for (let i = 0; i < 8; i++) {
    const h = hash2(tx * 37 + i, ty * 73 + i);
    rect(x + ((h * TS) | 0), y + ((hash2(i * 11, tx - ty) * TS) | 0), 1, 1,
         shade(h > 0.5 ? '#61636a' : '#484a4f', dim));
  }
}
function paintPavement(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#6e6a64', dim));
  const bh = 8;
  for (let r = 0; r < TS / bh; r++) {
    const off = ((ty * 2 + r) % 2) ? 8 : 0;
    for (let c = -1; c < 3; c++) {
      const bx = x + off + c * 16, v = hash2(tx * 17 + c, ty * 41 + r);
      rect(Math.max(x, bx), y + r * bh, Math.min(15, x + TS - bx), bh - 1,
           shade(v > 0.6 ? '#7b776f' : '#66625c', dim));
    }
  }
}
// Ondo's masonry: pale block, deep mortar. Must not read like its pavement.
function paintStone(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#2f2c28', dim));
  const bh = 5;
  for (let r = 0; r < 4; r++) {
    const off = ((ty * 3 + r) % 2) ? 6 : 0;
    for (let c = -1; c < 3; c++) {
      const bx = x + off + c * 12, by = y + r * bh;
      if (by >= y + TS) continue;
      const v = hash2(tx * 23 + c + off, ty * 59 + r);
      rect(Math.max(x, bx), by, Math.min(11, x + TS - bx), bh - 1,
           shade(v > 0.7 ? '#9c948a' : v > 0.35 ? '#8b8379' : '#7a736a', dim));
    }
  }
}

// Interior floorboards. Warmer and lighter than the wall behind them: with the
// same wood on both, a room read as one continuous brown field with furniture
// floating in it.
function paintPlank(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#7a5a3c', dim));
  for (let r = 0; r < 4; r++) {
    const v = hash2(tx * 13, ty * 4 + r);
    rect(x, y + r * 4, TS, 3, shade(v > 0.66 ? '#87643f' : v > 0.33 ? '#7a5a3c' : '#6d5036', dim));
    rect(x, y + r * 4 + 3, TS, 1, shade('#4f3826', dim));
  }
  // The odd board end, so the run does not look printed.
  if (hash2(tx * 3, ty * 7) > 0.72) rect(x + 6, y, 1, TS, shade('#4f3826', dim));
}

// Plaster over lath, with a skirting board along the bottom of the room so the
// wall meets the floor somewhere instead of just changing colour.
function paintPlaster(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#8d8272', dim));
  for (let i = 0; i < 10; i++) {
    const h = hash2(tx * 61 + i, ty * 29 + i);
    rect(x + ((h * TS) | 0), y + ((hash2(i * 5, tx - ty) * TS) | 0), 1, 1,
         shade(h > 0.5 ? '#9a8f7e' : '#7e7466', dim));
  }
  rect(x, y, TS, 1, shade('#6d6455', dim));
}

// --- interior dressing -------------------------------------------------
// Flat props with no collision and no interaction. Interiors were nine-by-seven
// boxes with one row of crates in them; this is what makes a shop look like a
// shop rather than like the inn with a different NPC standing in it.
function drawDecor(t, px, py, dim, o) {
  switch (t) {
    case 'rug':
      rect(px - 15, py - 9, 31, 19, shade('#5a2f3a', dim));
      rect(px - 13, py - 7, 27, 15, shade('#6d3a46', dim));
      rect(px - 9, py - 4, 19, 9, shade('#8a4a52', dim));
      rect(px - 5, py - 2, 11, 5, shade('#5a2f3a', dim));
      break;
    case 'counter':                       // long, waist-high, with a worn top
      rect(px - 16, py - 10, 33, 16, shade('#4a3524', dim));
      rect(px - 16, py - 12, 33, 3, shade('#7a5a3a', dim));
      rect(px - 16, py - 13, 33, 1, shade('#9a7a52', dim));
      for (let i = 0; i < 5; i++) rect(px - 13 + i * 7, py - 8, 5, 11, shade('#3d2b1d', dim));
      break;
    case 'shelf':
      rect(px - 12, py - 22, 25, 24, shade('#3f2d1e', dim));
      rect(px - 11, py - 21, 23, 22, shade('#563d29', dim));
      for (let r = 0; r < 3; r++) {
        rect(px - 11, py - 15 + r * 7, 23, 2, shade('#3f2d1e', dim));
        for (let i = 0; i < 4; i++) {
          const h = hash2(o.x * 7 + i, o.y * 5 + r);
          if (h < 0.3) continue;
          rect(px - 10 + i * 6, py - 20 + r * 7, 4, 5,
               shade(['#8a6a3a', '#5a7a6a', '#7a4a4a', '#6a6a7a'][(h * 4) | 0], dim));
        }
      }
      break;
    case 'cabinet':                       // records, ledgers, municipal misery
      rect(px - 9, py - 24, 19, 26, shade('#3a3e44', dim));
      rect(px - 8, py - 23, 17, 24, shade('#4e545c', dim));
      for (let r = 0; r < 4; r++) {
        rect(px - 7, py - 22 + r * 6, 15, 5, shade('#41464e', dim));
        rect(px - 2, py - 20 + r * 6, 5, 1, shade('#8d939c', dim));
      }
      break;
    case 'stove':
      rect(px - 10, py - 18, 21, 20, shade('#2e3238', dim));
      rect(px - 9, py - 17, 19, 18, shade('#43484f', dim));
      rect(px - 7, py - 14, 15, 8, shade('#1c1f24', dim));
      rect(px - 6, py - 12, 13, 4, shade('#a8552a', dim));   // firebox, still lit
      rect(px - 5, py - 11, 11, 2, shade('#e0913a', dim));
      rect(px - 3, py - 24, 6, 7, shade('#33373d', dim));    // flue
      break;
    case 'sink':
      rect(px - 10, py - 12, 21, 14, shade('#4a4f56', dim));
      rect(px - 9, py - 13, 19, 3, shade('#6d747d', dim));
      rect(px - 6, py - 10, 13, 7, shade('#2b2f34', dim));
      rect(px - 5, py - 9, 11, 5, shade('#5f7480', dim));
      rect(px - 1, py - 17, 2, 5, shade('#8d939c', dim));
      break;
    case 'table':
      rect(px - 14, py - 12, 29, 12, shade('#4a3524', dim));
      rect(px - 14, py - 14, 29, 3, shade('#7d5c3c', dim));
      rect(px - 12, py, 3, 5, shade('#3d2b1d', dim));
      rect(px + 9, py, 3, 5, shade('#3d2b1d', dim));
      rect(px - 6, py - 18, 5, 5, shade('#c8bda0', dim));    // something left on it
      break;
    case 'cot':                           // a bed nobody made
      rect(px - 11, py - 16, 23, 20, shade('#3f2d1e', dim));
      rect(px - 10, py - 15, 21, 18, shade('#6a5a48', dim));
      rect(px - 10, py - 15, 21, 7, shade('#a8a294', dim));
      rect(px - 9, py - 14, 8, 5, shade('#d6d2c4', dim));    // pillow
      break;
    case 'plant':
      rect(px - 5, py - 6, 11, 8, shade('#7a4a34', dim));
      rect(px - 5, py - 7, 11, 2, shade('#96603f', dim));
      for (let i = 0; i < 5; i++) {
        const a = i / 4 * 2 - 1;
        rect(px + a * 6 - 1, py - 15 - Math.abs(a) * -3, 3, 9, shade('#3f7a44', dim));
      }
      break;
    case 'barrel':
      rect(px - 7, py - 15, 15, 17, shade('#6b4d31', dim));
      rect(px - 7, py - 16, 15, 3, shade('#9a7549', dim));
      rect(px - 6, py - 15, 13, 1, shade('#b08a58', dim));
      rect(px - 8, py - 11, 17, 2, shade('#3a2a1c', dim));
      rect(px - 8, py - 4, 17, 2, shade('#3a2a1c', dim));
      break;
    case 'sacks':
      rect(px - 11, py - 9, 11, 11, shade('#8a7a56', dim));
      rect(px - 1, py - 12, 12, 14, shade('#9c8a62', dim));
      rect(px - 10, py - 8, 4, 4, shade('#a89a72', dim));
      break;
    case 'picture':                       // hung on the wall behind
      rect(px - 8, py - 12, 17, 14, shade('#3a2c18', dim));
      rect(px - 7, py - 11, 15, 12, shade('#8a6a34', dim));
      rect(px - 6, py - 10, 13, 10, shade('#2a3550', dim));
      rect(px - 6, py - 10, 13, 5, shade('#54608c', dim));
      break;
    case 'clock':
      rect(px - 5, py - 14, 11, 13, shade('#4a3524', dim));
      rect(px - 4, py - 13, 9, 9, shade('#d8d2c2', dim));
      rect(px - 1, py - 11, 1, 4, shade('#2a2418', dim));
      rect(px, py - 9, 3, 1, shade('#2a2418', dim));
      break;
    case 'lamp':
      rect(px - 1, py - 12, 3, 13, shade('#4a4438', dim));
      rect(px - 6, py - 18, 13, 6, shade('#8a7a4a', dim));
      rect(px - 5, py - 12, 11, 2, shade('#f0d890', dim));
      break;
    case 'pipe':                          // industrial, runs along the wall
      rect(px - 16, py - 8, 33, 5, shade('#5a5f66', dim));
      rect(px - 16, py - 8, 33, 2, shade('#767d86', dim));
      rect(px - 4, py - 10, 8, 9, shade('#484d54', dim));
      break;
    case 'crates':
      rect(px - 12, py - 10, 12, 12, shade('#4a3524', dim));
      rect(px - 12, py - 10, 12, 2, shade('#7a5a3a', dim));
      rect(px + 1, py - 16, 11, 18, shade('#54402c', dim));
      rect(px + 1, py - 16, 11, 2, shade('#8a6a44', dim));
      break;
    case 'mural_wall': {
      // Painted on the corridor wall. It is not trying to match anything.
      const seed = o.x * 31 + o.y * 17;
      rect(px - 22, py - 14, 45, 28, shade('#2a1f38', dim));
      for (let i = 0; i < 7; i++) {
        const h = hash2(seed + i, seed - i);
        const bx = px - 20 + i * 6, by = py - 11 + ((hash2(seed, i) * 16) | 0);
        const c = ['#c04a7a', '#4ac0b0', '#e0a83a', '#6a4ac0', '#3f8ad0'][(h * 5) | 0];
        if (h > 0.55) rect(bx, by, 5, 12, shade(c, dim));
        else { rect(bx - 1, by, 8, 5, shade(c, dim)); rect(bx + 1, by + 5, 4, 6, shade(c, dim)); }
      }
      rect(px - 22, py - 14, 45, 1, shade('#6a4ac0', dim));
      rect(px - 22, py + 13, 45, 1, shade('#6a4ac0', dim));
      break;
    }
    case 'neon_sign': {
      // Hung off the front of a shop. The glow is the point; the word is not.
      const pulse = 0.72 + 0.28 * Math.sin(Time.t * 2.4 + o.x);
      const hue = ['#ff4a9a', '#4ad8e0', '#ffc84a', '#8a6aff'][(o.x + o.y) % 4];
      cx.globalAlpha = 0.16 * pulse;
      circle(px, py - 8, 22, hue);
      cx.globalAlpha = 0.28 * pulse;
      circle(px, py - 8, 13, hue);
      cx.globalAlpha = 1;
      rect(px - 13, py - 16, 27, 16, '#12141c');
      rect(px - 12, py - 15, 25, 14, '#1b1f2a');
      cx.globalAlpha = pulse;
      rect(px - 9, py - 12, 3, 9, hue);
      rect(px - 9, py - 12, 8, 2, hue);
      rect(px - 9, py - 8, 6, 2, hue);
      rect(px + 3, py - 12, 3, 9, hue);
      rect(px + 3, py - 5, 6, 2, hue);
      cx.globalAlpha = 1;
      rect(px - 1, py, 3, 4, '#3a3f4a');
      break;
    }
    case 'bunting':                       // strung across a market row
      for (let i = 0; i < 6; i++) {
        const bx = px - 15 + i * 6, by = py - 14 + Math.abs(i - 2.5) | 0;
        rect(bx, by, 5, 1, shade('#6a6250', dim));
        rect(bx + 1, by + 1, 3, 4, shade(['#8a4a52', '#5a7a6a', '#8a7a4a'][i % 3], dim));
      }
      break;
  }
}

// --- roofs and facades -------------------------------------------------
// Seen from above, a building is mostly roof: only its bottom row is the face
// you walk up to. Painting the whole block in wall texture is what made every
// structure in the game read as a slab with a hole in it.
function paintShingle(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#5e2f28', dim));
  for (let r = 0; r < 4; r++) {
    const off = ((ty * 4 + r) % 2) ? 4 : 0;
    for (let c = -1; c < 3; c++) {
      const bx = x + off + c * 8, by = y + r * 4;
      const v = hash2(tx * 19 + c + off, ty * 7 + r);
      rect(Math.max(x, bx), by, Math.min(7, x + TS - bx), 3,
           shade(v > 0.7 ? '#8c463a' : v > 0.35 ? '#7d3f34' : '#6b352c', dim));
      rect(Math.max(x, bx), by, Math.min(7, x + TS - bx), 1,
           shade(v > 0.5 ? '#a1554529'.slice(0, 7) : '#96503f', dim));
    }
  }
}
function paintSlate(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#3d444e', dim));
  for (let r = 0; r < 4; r++) {
    const off = ((ty * 4 + r) % 2) ? 5 : 0;
    for (let c = -1; c < 3; c++) {
      const bx = x + off + c * 10, by = y + r * 4;
      const v = hash2(tx * 29 + c + off, ty * 13 + r);
      rect(Math.max(x, bx), by, Math.min(9, x + TS - bx), 3,
           shade(v > 0.66 ? '#5d6673' : v > 0.33 ? '#525a66' : '#474e59', dim));
    }
  }
}
// Corrugated steel, streaked with rust. The works has not been maintained.
function paintPanel(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#4a4d54', dim));
  for (let c = 0; c < TS; c += 4) {
    rect(x + c, y, 3, TS, shade(hash2(tx * 11 + c, ty) > 0.5 ? '#565a62' : '#4a4d54', dim));
    rect(x + c + 3, y, 1, TS, shade('#33363c', dim));
  }
  for (let i = 0; i < 3; i++) {
    const h = hash2(tx * 47 + i, ty * 31 + i);
    if (h > 0.72) rect(x + ((h * TS) | 0), y + ((hash2(i, tx + ty) * TS) | 0), 2, 3,
                       shade('#6d4a33', dim));
  }
}
const ROOFS = { brick: paintShingle, stone: paintSlate, concrete: paintPanel };

// The floor slab and the roofline coping, per wall material - the same stone or
// concrete the building is made of, seen edge-on.
const STOREY_BAND = { concrete: '#727680', stone: '#9a9285', brick: '#8e6b5c' };
const CORNICE = { concrete: '#8d919a', stone: '#a89f90', brick: '#b3aa9c' };

// --- storeys ---------------------------------------------------------------
// A building here is a block of wall tiles: the bottom row is the shopfront you
// walk up to and everything above it is roof, which means every structure in the
// game was one storey tall by construction. That is right for Okobo and wrong
// for a capital.
//
// Rooms marked `tall: true` read their blocks differently: bottom row is still
// the shopfront, the topmost row becomes the roofline, and every row between is
// a floor of windows. Height then comes from the map - a four-row block is two
// storeys, a seven-row block is five - so the city can be laid out rather than
// drawn.
function paintStorey(x, y, tx, ty, dim, floor) {
  // Two windows per tile, not one. At sixteen pixels a single window per tile
  // reads as a house; a city has to read as many small rooms stacked.
  for (let i = 0; i < 2; i++) {
    if (hash2(tx * 7 + i * 3, ty * 11 + 5) < 0.10) continue;   // a bay bricked up
    const wx = x + 2 + i * 7;
    const lit = hash2(tx * 13 + i * 5, ty * 3 + 1) > 0.54;
    rect(wx, y + 3, 5, 9, shade('#191b21', dim));
    rect(wx + 1, y + 4, 3, 7, lit ? '#d6c184' : shade('#39424c', dim));
    rect(wx + 1, y + 4, 3, 2, lit ? '#f2e3ae' : shade('#4b5661', dim));
    // A lit window occasionally has someone in it, which is one pixel and does
    // more for the feeling of a populated city than any amount of wall texture.
    if (lit && hash2(tx * 3 + i, ty * 17) > 0.78) rect(wx + 2, y + 7, 1, 3, '#3a2f28');
  }
  // The floor slab between storeys, which is what stops a stack of windows
  // reading as one very tall window.
  rect(x, y + TS - 2, TS, 1, shade('#23252b', dim));
  rect(x, y + TS - 1, TS, 1, shade(floor, dim - 8));
}

// The roofline: a coping band along the bottom of the top row, so the building
// visibly stops rather than fading into the sky.
function paintCornice(x, y, tx, ty, dim, coping) {
  rect(x, y + TS - 5, TS, 1, shade('#1c1e24', dim));
  rect(x, y + TS - 4, TS, 3, shade(coping, dim + 10));
  rect(x, y + TS - 1, TS, 1, shade('#212329', dim - 6));
  // Roof furniture, sparsely: a vent housing or an aerial. Cities are cluttered
  // on top and nobody ever draws it.
  const h = hash2(tx * 23, ty * 41);
  if (h > 0.80) {
    rect(x + 4, y + 2, 7, 6, shade('#4a4e56', dim));
    rect(x + 4, y + 2, 7, 2, shade('#5e636c', dim + 6));
  } else if (h > 0.68) {
    rect(x + 8, y + 1, 1, 8, shade('#6a6f78', dim));
    rect(x + 5, y + 3, 7, 1, shade('#6a6f78', dim));
  }
}

function paintVoid(x, y) { rect(x, y, TS, TS, '#000000'); }
function paintDirt(x, y, tx, ty, dim) {
  rect(x, y, TS, TS, shade('#5a4a36', dim));
  for (let i = 0; i < 10; i++) {
    const h = hash2(tx * 53 + i, ty * 43 + i);
    rect(x + ((h * TS) | 0), y + ((hash2(i * 5, tx * 3 + ty) * TS) | 0), 1, 1,
         shade(h > 0.5 ? '#6a5842' : '#4c3d2c', dim));
  }
}

const FLOORS = {
  grass: paintGrass, wood: paintWood, water: paintWater, carpet: paintCarpet,
  dirt: paintDirt, ceiling: paintCeiling, snow: paintSnow,
  concrete: paintConcrete, pavement: paintPavement, plank: paintPlank,
};
const WALLS = {
  brick: paintBrick, wood: paintWood, void: paintVoid, ceiling: paintCeiling,
  concrete: paintConcrete, stone: paintStone, plaster: paintPlaster,
};
// Walls that are the inside of a room rather than the outside of a building:
// no roof, no facade windows, no eaves.
const INTERIOR_WALLS = new Set(['wood', 'ceiling', 'plaster']);

// --- rooms -------------------------------------------------------------
// Maps: '.' floor, '#' wall, '~' water, 'T' tree, ' ' void, '=' furniture,
// 'D' doorway, 'P' path.
//
// Exits are rectangles in tile space, and they always sit on a 'P' path or a
// 'D' doorway — the tile itself is the signpost, the way an older Pokemon
// route reads. Nothing floats or pulses.
const ROOMS = {

  bedroom: {
    floor: 'carpet', wall: 'wood', light: 0.95, music: 'bedroom', grain: 0.03,
    map: [
      '#############',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#############',
    ],
    objects: [
      { x: 6, y: 0, t: 'door', label: 'door' },
      { x: 2, y: 0, t: 'window', label: 'window' },
      { x: 10, y: 0, t: 'poster', label: 'poster' },
      { x: 9, y: 0, t: 'switch', label: 'light switch' },
      { x: 2, y: 6, t: 'bed', label: 'bed' },
      { x: 10, y: 6, t: 'dresser', label: 'dresser' },
    ],
    lightAt: [6, 1],
    start: [6, 4],
  },

  void: {
    floor: 'dirt', wall: 'void', light: 1.25, music: 'void', grain: 0.05, dark: true,
    map: [
      '                         ',
      '                         ',
      '   ...................P  ',
      '   ...................P  ',
      '   ...................P  ',
      '   ...................P  ',
      '   ...................P  ',
      '   ...................P  ',
      '                         ',
    ],
    exits: [{ x: 22, y: 2, w: 1, h: 6, to: 'gallery_ext', at: [3, 7] }],
    start: [5, 5],
  },

  gallery_ext: {
    floor: 'grass', wall: 'brick', light: 1.05, music: 'gallery', grain: 0.05, dark: true,
    map: [
      '              ',
      '  ##########  ',
      '  ##########  ',
      '  ##########  ',
      '  ####..####  ',
      '  ....D.....  ',
      '  ..........  ',
      '  ..........  ',
    ],
    exits: [{ x: 6, y: 5, to: 'gallery_hall', at: [7, 8], sfx: 'door' }],
    start: [3, 7],
  },

  gallery_hall: {
    floor: 'grass', wall: 'brick', light: 0.6, music: 'gallery', grain: 0.06,
    map: [
      '######D########',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '######...######',
      '     #...#     ',
      '     #PPP#     ',
    ],
    exits: [
      { x: 6, y: 0, to: 'gallery_room', at: [10, 5], sfx: 'door' },
      { x: 6, y: 9, w: 3, h: 1, to: 'gallery_ext', at: [6, 6] },
    ],
    start: [7, 8],
  },

  gallery_room: {
    floor: 'grass', wall: 'brick', light: 0.5, music: 'gallery', grain: 0.06,
    map: [
      '###################',
      'D.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#########PPP#######',
    ],
    objects: [
      { x: 2, y: 1, t: 'collectible', which: 'gallery_chip' },
      { x: 2, y: 0, t: 'painting', shape: 'obelisk' },
      { x: 5, y: 0, t: 'painting', shape: 'sphere' },
      { x: 9, y: 0, t: 'painting', shape: 'pyramid' },
      { x: 13, y: 0, t: 'painting', shape: 'cube' },
      { x: 16, y: 0, t: 'painting', shape: 'spire', small: true },
    ],
    exits: [
      { x: 9, y: 7, w: 3, h: 1, to: 'gallery_hall', at: [7, 2] },
      { x: 0, y: 1, to: 'gallery_corridor', at: [2, 2], sfx: 'door' },
    ],
    start: [10, 5],
  },

  gallery_corridor: {
    floor: 'grass', wall: 'brick', light: 0.75, music: 'gallery', grain: 0.07,
    map: [
      '########################################',
      '#......................................P',
      '#......................................P',
      '#......................................P',
      '########################################',
    ],
    exits: [{ x: 39, y: 1, w: 1, h: 3, to: 'fall', at: [1, 1], sfx: 'door' }],
    start: [2, 2],
  },

  arrival: {
    floor: 'grass', wall: 'brick', light: 0.15, music: 'okobo', grain: 0.03, bright: true,
    map: [
      '####################',
      '#..................#',
      '#..................#',
      '#..............PPPPP',
      '#..............PPPPP',
      '#..................#',
      '#..................#',
      '####################',
    ],
    exits: [{ x: 19, y: 3, w: 1, h: 2, to: 'okobo', at: [2, 5] }],
    spawn: [{ name: 'Yard Dog', n: 2 }, { name: 'Sunned Melon', n: 1 }],
    start: [3, 3],
  },

  okobo: {
    floor: 'grass', wall: 'brick', light: 0.12, music: 'okobo', grain: 0.03, bright: true,
    map: [
      '########################',
      '#......................#',
      '#..######..######......#',
      '#..######..######......#',
      '#..##D###..#####D......#',
      'P......................#',
      'P......................#',
      '#..............######..#',
      '#..............######..#',
      '#..............##D####.#',
      '#......................#',
      '#.....................PP',
      '#.....................PP',
      '########################',
    ],
    decor: [
      { x: 3, y: 12, t: 'crates' }, { x: 23, y: 3, t: 'barrel' },
      { x: 9, y: 8, t: 'plant' },
    ],
    objects: [
      { x: 9, y: 9, t: 'collectible', which: 'well_coin' },
      { x: 8, y: 6, t: 'well', label: 'well' },
      { x: 18, y: 3, t: 'memorial', label: 'memorial' },
    ],
    npcs: [
      { art: 'vlg_woman', x: 5, y: 8, key: 'okobo_woman' },
      { art: 'vlg_man', x: 12, y: 5, key: 'okobo_man' },
      { art: 'vlg_child', x: 16, y: 10, key: 'okobo_child' },
      { art: 'vlg_elder', x: 20, y: 7, key: 'okobo_elder' },
    ],
    exits: [
      { x: 5, y: 4, to: 'shop', at: [4, 4], sfx: 'door' },
      { x: 16, y: 4, to: 'inn', at: [4, 4], sfx: 'door' },
      { x: 17, y: 9, to: 'house', at: [4, 4], sfx: 'door' },
      { x: 0, y: 5, w: 1, h: 2, to: 'arrival', at: [17, 4] },
      { x: 23, y: 11, w: 1, h: 2, to: 'north_road', at: [2, 5] },
    ],
    start: [4, 11],
  },

  shop: {
    floor: 'plank', wall: 'plaster', light: 0.24, music: 'okobo', grain: 0.03,
    map: [
      '#############',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#.....D.....#',
      '#############',
    ],
    decor: [
      { x: 6, y: 1, t: 'counter' }, { x: 2, y: 1, t: 'shelf' },
      { x: 10, y: 1, t: 'shelf' }, { x: 2, y: 4, t: 'barrel' },
      { x: 10, y: 4, t: 'sacks' }, { x: 6, y: 4, t: 'rug' },
      { x: 4, y: 1, t: 'clock' },
    ],
    npcs: [{ art: 'vlg_shop', x: 6, y: 2, key: 'shopkeeper', shop: true }],
    exits: [{ x: 6, y: 6, to: 'okobo', at: [5, 5] }],
    start: [6, 5],
  },

  inn: {
    floor: 'plank', wall: 'plaster', light: 0.24, music: 'okobo', grain: 0.03,
    map: [
      '#############',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#.....D.....#',
      '#############',
    ],
    decor: [
      { x: 2, y: 1, t: 'stove' }, { x: 10, y: 1, t: 'shelf' },
      { x: 4, y: 4, t: 'table' }, { x: 9, y: 4, t: 'plant' },
      { x: 6, y: 1, t: 'picture' }, { x: 10, y: 4, t: 'lamp' },
    ],
    objects: [{ x: 2, y: 4, t: 'bed', label: 'bed', save: true }],
    npcs: [{ art: 'vlg_inn', x: 8, y: 2, key: 'innkeeper' }],
    exits: [{ x: 6, y: 6, to: 'okobo', at: [16, 5] }],
    start: [6, 5],
  },

  house: {
    floor: 'plank', wall: 'plaster', light: 0.29, music: 'okobo', grain: 0.03,
    map: [
      '#############',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#.....D.....#',
      '#############',
    ],
    decor: [
      { x: 2, y: 1, t: 'stove' }, { x: 5, y: 1, t: 'picture' },
      { x: 9, y: 1, t: 'shelf' }, { x: 3, y: 4, t: 'table' },
      { x: 9, y: 4, t: 'cot' }, { x: 6, y: 4, t: 'rug' },
      { x: 11, y: 1, t: 'clock' },
    ],
    objects: [{ x: 7, y: 1, t: 'note', note: 'ration_card' }],
    npcs: [{ art: 'vlg_hess', x: 4, y: 2, key: 'hess' }],
    exits: [{ x: 6, y: 6, to: 'okobo', at: [17, 10] }],
    start: [6, 5],
  },

  north_road: {
    floor: 'dirt', wall: 'brick', light: 0.2, music: 'okobo', grain: 0.04, bright: true,
    map: [
      '####################',
      '#TTTT..........TTTT#',
      '#TT..............TT#',
      '#.................PP',
      '#.................PP',
      'PP.................#',
      'PP.................#',
      '#TT..............TT#',
      '#TTTT..........TTTT#',
      '####################',
    ],
    objects: [{ x: 9, y: 7, t: 'foundation', label: 'foundation' }],
    spawn: [{ name: 'Little Cousin', n: 1 }, { name: 'Postbox', n: 1 }, { name: 'Fence Post', n: 1 }],
    exits: [
      { x: 0, y: 5, w: 1, h: 2, to: 'okobo', at: [21, 11] },
      { x: 19, y: 3, w: 1, h: 2, to: 'orchard1', at: [2, 4] },
    ],
    start: [3, 5],
  },

  orchard1: {
    floor: 'water', wall: 'brick', light: 0.55, music: 'orchard', grain: 0.05,
    map: [
      '####################',
      '#~~T~~~~T~~~~T~~~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~T~~~T~~~~T~~~T~~~P',
      '#~~~~~~~~~~~~~~~~~~P',
      'P~~~~~~~~~~~~~~~~~~#',
      'P~T~~~T~~~~T~~~T~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '####################',
    ],
    spawn: [{ name: 'Windfall', n: 2 }, { name: 'Drowned Ladder', n: 1 }],
    exits: [
      { x: 0, y: 5, w: 1, h: 2, to: 'north_road', at: [17, 3] },
      { x: 19, y: 3, w: 1, h: 2, to: 'orchard2', at: [2, 5] },
    ],
    start: [3, 5],
  },

  orchard2: {
    floor: 'water', wall: 'brick', light: 0.65, music: 'orchard', grain: 0.05,
    map: [
      '####################',
      '#~~~~T~~~~T~~~~T~~~P',
      '#~~~~~~~~~~~~~~~~~~P',
      '#~T~~~~T~~~~T~~~~T~#',
      '#~~~~~~~~~~~~~~~~~~#',
      'P~~T~~~~T~~~~T~~~~~#',
      'P~~~~~~~~~~~~~~~~~~#',
      '####################',
    ],
    spawn: [{ name: 'Same Tree', n: 2 }, { name: 'Wader', n: 1 }],
    objects: [{ x: 15, y: 6, t: 'collectible', which: 'marble' }],
    exits: [
      { x: 0, y: 5, w: 1, h: 2, to: 'orchard1', at: [17, 3] },
      { x: 19, y: 1, w: 1, h: 2, to: 'orchard3', at: [2, 5] },
    ],
    start: [3, 5],
  },

  orchard3: {
    floor: 'water', wall: 'brick', light: 0.75, music: 'orchard', grain: 0.06,
    map: [
      '####################',
      '#~~T~~~~~~~~~~~T~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~~~~~~P',
      '#~~~~~~~~~~~~~~~~~~P',
      'P~~T~~~~~~~~~~~T~~~#',
      'P~~~~~~~~~~~~~~~~~~#',
      '####################',
    ],
    spawn: [{ name: 'Wader', n: 1 }, { name: 'Orchard Keeper', n: 1 }],
    objects: [{ x: 9, y: 3, t: 'note', note: 'tied_branch' }],
    exits: [
      { x: 0, y: 5, w: 1, h: 2, to: 'orchard2', at: [17, 1] },
      { x: 19, y: 3, w: 1, h: 2, to: 'clearing', at: [2, 3] },
    ],
    start: [3, 5],
  },

  clearing: {
    floor: 'water', wall: 'brick', light: 0.9, music: 'orchard', grain: 0.07,
    map: [
      '###############',
      '#~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~P',
      'P~~~~~~~~~~~~~P',
      'P~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~#',
      '###############',
    ],
    exits: [
      { x: 0, y: 3, w: 1, h: 2, to: 'orchard3', at: [17, 3] },
      // The far side of the orchard, open only once the tree is down.
      { x: 14, y: 2, w: 1, h: 2, to: 'road_ondo', at: [2, 5], requires: 'beatBoss' },
    ],
    start: [3, 4],
  },

  // --- Act 2 -------------------------------------------------------------
  road_ondo: {
    floor: 'dirt', wall: 'brick', light: 0.22, music: 'okobo', grain: 0.04, bright: true,
    map: [
      '########################',
      '#TT..................TT#',
      '#T....................T#',
      '#......................#',
      'P......................P',
      'P......................P',
      '#......................#',
      '#T....................T#',
      '#TT..................TT#',
      '########################',
    ],
    objects: [
      { x: 6, y: 3, t: 'milepost', label: 'milepost' },
      { x: 17, y: 6, t: 'shrine', label: 'shrine' },
      { x: 12, y: 2, t: 'note', note: 'water_board' },
    ],
    spawn: [{ name: 'Milepost', n: 1 }, { name: 'Ration Tin', n: 1 },
            { name: "Someone's Bicycle", n: 1 }, { name: 'Roadside Shrine', n: 1 }],
    exits: [
      { x: 0, y: 4, w: 1, h: 2, to: 'clearing', at: [13, 3] },
      { x: 23, y: 4, w: 1, h: 2, to: 'ondo', at: [2, 11] },
    ],
    start: [2, 5],
  },

  ondo: {
    tall: true,   // blocks are storeys, not roofs — see paintStorey
    floor: 'pavement', wall: 'stone', light: 0.16, music: 'ondo', grain: 0.035, bright: true,
    map: [
      '##############################',
      '#..#######..........#######..#',
      '#..#######..........#######..#',
      '#..#######..######..#######..#',
      '#..#######..######..#######..#',
      '#..#######..######..#######..#',
      '#..#######..######..#######..#',
      '#..###D###..###D##..###D###..#',
      '#............................#',
      '#............................#',
      'P............................#',
      'P............................#',
      '#....######............###...#',
      '#....######............###...#',
      '#....######............###...#',
      '#....###D#............###D...#',
      '#............................#',
      '#............................#',
      '#..........................PP#',
      '##############################',
    ],
    decor: [
      { x: 10, y: 9, t: 'bunting' }, { x: 18, y: 9, t: 'bunting' },
      { x: 4, y: 14, t: 'plant' }, { x: 27, y: 11, t: 'plant' },
      { x: 17, y: 17, t: 'crates' },
    ],
    objects: [
      { x: 15, y: 10, t: 'fountain', label: 'fountain' },
      { x: 22, y: 9, t: 'billboard', label: 'billboard' },
    ],
    npcs: [
      { art: 'ond_clerk', x: 8, y: 9, key: 'ondo_clerk' },
      { art: 'ond_baker', x: 20, y: 12, key: 'ondo_baker' },
      { art: 'ond_bench', x: 12, y: 16, key: 'ondo_bench' },
      { art: 'ond_courier', x: 25, y: 9, key: 'ondo_courier' },
    ],
    exits: [
      { x: 6, y: 7, to: 'ondo_shop', at: [4, 4], sfx: 'door' },
      { x: 15, y: 7, to: 'ondo_inn', at: [4, 4], sfx: 'door' },
      { x: 23, y: 7, to: 'boarding_house', at: [4, 6], sfx: 'door' },
      { x: 8, y: 15, to: 'records_room', at: [4, 7], sfx: 'door' },
      { x: 25, y: 15, to: 'ondo_grocer', at: [4, 4], sfx: 'door' },
      { x: 0, y: 10, w: 1, h: 2, to: 'road_ondo', at: [21, 5] },
      { x: 27, y: 18, w: 2, h: 1, to: 'winter_road', at: [2, 5] },
    ],
    start: [4, 11],
  },

  ondo_shop: {
    floor: 'plank', wall: 'plaster', light: 0.24, music: 'ondo', grain: 0.03,
    map: [
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#......D......#',
      '###############',
    ],
    decor: [
      { x: 7, y: 1, t: 'counter' }, { x: 2, y: 1, t: 'shelf' },
      { x: 5, y: 1, t: 'shelf' }, { x: 12, y: 1, t: 'cabinet' },
      { x: 2, y: 4, t: 'crates' }, { x: 12, y: 4, t: 'barrel' },
      { x: 7, y: 4, t: 'rug' }, { x: 10, y: 1, t: 'clock' },
    ],
    npcs: [{ art: 'ond_shop', x: 7, y: 2, key: 'ondo_shopkeeper', shop: 'ondo' }],
    exits: [{ x: 7, y: 6, to: 'ondo', at: [6, 8] }],
    start: [7, 5],
  },

  // The other end of the baker's grievance. Sells food; the feud is free.
  ondo_grocer: {
    floor: 'plank', wall: 'plaster', light: 0.34, music: 'ondo', grain: 0.04,
    map: [
      '#############',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#.....D.....#',
      '#############',
    ],
    decor: [
      { x: 6, y: 1, t: 'counter' }, { x: 2, y: 1, t: 'sacks' },
      { x: 10, y: 1, t: 'shelf' }, { x: 2, y: 4, t: 'crates' },
      { x: 10, y: 4, t: 'barrel' }, { x: 8, y: 4, t: 'sacks' },
      { x: 4, y: 1, t: 'bunting' },
    ],
    npcs: [{ art: 'ond_grocer', x: 6, y: 2, key: 'ondo_grocer', shop: 'grocer' }],
    exits: [{ x: 6, y: 6, to: 'ondo', at: [25, 16] }],
    start: [6, 5],
  },

  ondo_inn: {
    floor: 'plank', wall: 'plaster', light: 0.26, music: 'ondo', grain: 0.03,
    map: [
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#......D......#',
      '###############',
    ],
    decor: [
      { x: 2, y: 1, t: 'counter' }, { x: 6, y: 1, t: 'picture' },
      { x: 9, y: 1, t: 'clock' }, { x: 12, y: 1, t: 'plant' },
      { x: 4, y: 4, t: 'table' }, { x: 9, y: 4, t: 'table' },
      { x: 12, y: 4, t: 'lamp' }, { x: 7, y: 3, t: 'rug' },
    ],
    objects: [{ x: 2, y: 4, t: 'bed', label: 'bed', save: true }],
    npcs: [{ art: 'ond_inn', x: 7, y: 2, key: 'ondo_innkeeper' }],
    exits: [{ x: 7, y: 6, to: 'ondo', at: [15, 8] }],
    start: [7, 5],
  },

  boarding_house: {
    floor: 'plank', wall: 'plaster', light: 0.36, music: 'ondo', grain: 0.04,
    map: [
      '###########',
      '#.........#',
      '#.=.....=.#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#....D....#',
      '###########',
    ],
    decor: [
      { x: 2, y: 2, t: 'counter' }, { x: 5, y: 1, t: 'clock' },
      { x: 8, y: 1, t: 'picture' }, { x: 2, y: 5, t: 'plant' },
      { x: 9, y: 5, t: 'lamp' },
    ],
    objects: [
      { x: 8, y: 1, t: 'note', note: 'ledger' },
      { x: 5, y: 1, t: 'door7', label: 'door' },
    ],
    npcs: [
      { art: 'boarder', x: 3, y: 3, key: 'boarder', once: 'boarderSeen' },
      { art: 'landlady', x: 7, y: 4, key: 'landlady' },
      { art: 'tenant_three', x: 2, y: 5, key: 'tenant_three' },
      { art: 'tenant_five', x: 9, y: 3, key: 'tenant_five' },
    ],
    exits: [{ x: 5, y: 6, to: 'ondo', at: [23, 8] }],
    start: [5, 5],
  },

  records_room: {
    floor: 'plank', wall: 'plaster', light: 0.44, music: 'ondo', grain: 0.045,
    map: [
      '#############',
      '#...........#',
      '#.=..=..=..=#',
      '#...........#',
      '#.=..=..=..=#',
      '#...........#',
      '#.=..=..=..=#',
      '#....D......#',
      '#############',
    ],
    decor: [
      { x: 2, y: 2, t: 'cabinet' }, { x: 5, y: 2, t: 'cabinet' },
      { x: 8, y: 2, t: 'cabinet' }, { x: 11, y: 2, t: 'cabinet' },
      { x: 2, y: 5, t: 'cabinet' }, { x: 5, y: 5, t: 'cabinet' },
      { x: 11, y: 5, t: 'cabinet' }, { x: 8, y: 6, t: 'lamp' },
    ],
    objects: [
      { x: 10, y: 5, t: 'collectible', which: 'poster_corner' },
      { x: 2, y: 3, t: 'note', note: 'work_order' },
    ],
    npcs: [{ art: 'records', x: 9, y: 1, key: 'records_clerk' }],
    exits: [{ x: 5, y: 7, to: 'ondo', at: [8, 16] }],
    start: [5, 6],
  },

  winter_road: {
    floor: 'snow', wall: 'stone', light: 0.34, music: 'kestrel', grain: 0.05,
    map: [
      '######################',
      '#TT................TT#',
      '#T..................T#',
      '#....................#',
      'P....................P',
      'P....................P',
      '#....................#',
      '#T..................T#',
      '#TT................TT#',
      '######################',
    ],
    // Northside: three addresses, and the road they are on has no houses left.
    objects: [
      { x: 5, y: 2, t: 'parcel', label: 'postbox', n: 1 },
      { x: 11, y: 7, t: 'parcel', label: 'postbox', n: 2 },
      { x: 17, y: 2, t: 'parcel', label: 'postbox', n: 3 },
    ],
    spawn: [{ name: 'Frostbitten Glove', n: 2 }, { name: 'Coil', n: 1 }],
    exits: [
      { x: 0, y: 4, w: 1, h: 2, to: 'ondo', at: [26, 17] },
      { x: 21, y: 4, w: 1, h: 2, to: 'kestrel_yard', at: [2, 8] },
    ],
    start: [2, 5],
  },

  kestrel_yard: {
    floor: 'snow', wall: 'concrete', light: 0.46, music: 'kestrel', grain: 0.06,
    map: [
      '######################',
      '#....................#',
      '#....................#',
      '#..################..#',
      '#..################..#',
      '#..#######DDD#####...#',
      '#.........PPP........#',
      'P.........PPP.......P#',
      'P.........PPP.......P#',
      '#...................P#',
      '######################',
    ],
    objects: [
      // Far corner, away from both exits: the boss is something you walk up to.
      { x: 18, y: 8, t: 'memorial_stone', label: 'memorial' },
      { x: 8, y: 6, t: 'panel', label: 'panel' },
    ],
    spawn: [{ name: 'Yard Light', n: 1 }, { name: 'Frostbitten Glove', n: 1 }],
    exits: [
      { x: 0, y: 7, w: 1, h: 2, to: 'winter_road', at: [20, 5] },
      { x: 10, y: 5, w: 3, h: 1, to: 'kestrel_f1', at: [10, 7], sfx: 'door' },
      // Open once the Memorial is down: the border, and Yettallia past it.
      { x: 20, y: 8, w: 1, h: 2, to: 'border', at: [2, 6], requires: 'beatMemorial' },
    ],
    start: [2, 8],
  },

  kestrel_f1: {
    floor: 'concrete', wall: 'concrete', light: 0.62, music: 'kestrel', grain: 0.06,
    map: [
      '#####################',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#...................#',
      '#.D......PPP........P',
      '#.P......PPP........P',
      '#########PPP#########',
    ],
    decor: [
      { x: 3, y: 7, t: 'pipe' }, { x: 17, y: 7, t: 'pipe' },
      { x: 12, y: 1, t: 'crates' },
    ],
    objects: [
      { x: 4, y: 4, t: 'note', note: 'notice_year_one' },
      { x: 16, y: 7, t: 'machine', label: 'machine' },
      { x: 6, y: 1, t: 'machine', label: 'machine' },
    ],
    spawn: [{ name: 'Conveyor', n: 2 }, { name: 'Coil', n: 1 }],
    exits: [
      { x: 9, y: 8, w: 3, h: 3, to: 'kestrel_yard', at: [11, 6] },
      { x: 2, y: 8, w: 1, h: 2, to: 'kestrel_boiler', at: [3, 3], sfx: 'door' },
      { x: 20, y: 8, w: 1, h: 2, to: 'kestrel_f2', at: [2, 8] },
    ],
    start: [10, 7],
  },

  // The boiler room. Below everything, and the only part of the works that is
  // still warm — which is the wrong way round, and the game does not say so.
  kestrel_boiler: {
    floor: 'concrete', wall: 'concrete', light: 1.1, music: 'kestrel', grain: 0.08, dark: true,
    map: [
      '################',
      '#..............#',
      'P..............#',
      'P..............#',
      '#....======....#',
      '#....======....#',
      '#..............#',
      '#..............#',
      '################',
    ],
    decor: [
      { x: 3, y: 2, t: 'pipe' }, { x: 12, y: 2, t: 'pipe' },
      { x: 3, y: 6, t: 'barrel' }, { x: 12, y: 6, t: 'crates' },
    ],
    objects: [
      { x: 11, y: 3, t: 'note', note: 'safety_inspection' },
      { x: 6, y: 6, t: 'machine', label: 'boiler' },
      { x: 10, y: 6, t: 'machine', label: 'boiler' },
    ],
    spawn: [{ name: 'Coil', n: 2 }],
    exits: [{ x: 0, y: 2, w: 1, h: 2, to: 'kestrel_f1', at: [3, 9], sfx: 'door' }],
    start: [3, 3],
  },

  kestrel_f2: {
    floor: 'concrete', wall: 'concrete', light: 0.72, music: 'kestrel', grain: 0.065,
    map: [
      '#####################',
      '#...................#',
      '#..====....====.....#',
      '#...................#',
      '#........DD.........#',
      '#..====..PP.===.....#',
      '#........PP.........#',
      'P...................#',
      'P..................D#',
      '#####################',
    ],
    decor: [
      { x: 3, y: 1, t: 'pipe' }, { x: 17, y: 3, t: 'crates' },
    ],
    objects: [
      { x: 6, y: 3, t: 'note', note: 'notice_year_four' },
    ],
    spawn: [{ name: 'Conveyor', n: 1 }, { name: 'Second Shift', n: 1 },
            { name: 'Yard Light', n: 1 }],
    exits: [
      { x: 0, y: 7, w: 1, h: 2, to: 'kestrel_f1', at: [19, 8] },
      { x: 9, y: 4, w: 2, h: 1, to: 'kestrel_office', at: [6, 4], sfx: 'door' },
      { x: 19, y: 8, to: 'kestrel_f3', at: [3, 7], sfx: 'door' },
    ],
    start: [2, 8],
  },

  // The foreman's office. Somebody had to sign the notices.
  kestrel_office: {
    floor: 'plank', wall: 'plaster', light: 0.54, music: 'kestrel', grain: 0.05,
    map: [
      '#############',
      '#...........#',
      '#.==.....==.#',
      '#...........#',
      '#...........#',
      '#.....P.....#',
      '#.....D.....#',
      '#############',
    ],
    decor: [
      { x: 2, y: 2, t: 'cabinet' }, { x: 10, y: 2, t: 'cabinet' },
      { x: 6, y: 1, t: 'clock' }, { x: 2, y: 4, t: 'stove' },
      { x: 10, y: 4, t: 'lamp' },
    ],
    objects: [
      { x: 3, y: 4, t: 'note', note: 'shift_schedule' },
      { x: 9, y: 1, t: 'desk', label: 'desk' },
    ],
    exits: [{ x: 6, y: 5, w: 1, h: 2, to: 'kestrel_f2', at: [10, 6], sfx: 'door' }],
    start: [6, 4],
  },

  kestrel_f3: {
    floor: 'concrete', wall: 'concrete', light: 0.85, music: 'kestrel', grain: 0.07,
    map: [
      '###################',
      '#.................#',
      '#.===.===.===.===.#',
      '#.................#',
      '#.................#',
      '#.===.===.===.===.#',
      '#........PP.......#',
      'P........DD.......#',
      '###################',
    ],
    objects: [
      { x: 5, y: 4, t: 'note', note: 'in_a_locker' },
      { x: 16, y: 1, t: 'collectible', which: 'loose_key' },
      { x: 15, y: 6, t: 'locker', label: 'locker' },
    ],
    spawn: [{ name: 'Second Shift', n: 2 }, { name: 'Frostbitten Glove', n: 1 }],
    exits: [
      { x: 0, y: 7, w: 1, h: 1, to: 'kestrel_f2', at: [18, 8] },
      { x: 9, y: 7, w: 2, h: 1, to: 'kestrel_locker', at: [7, 2], sfx: 'door' },
    ],
    start: [3, 7],
  },

  // The changing room. Two hundred lockers, all of them open, and the note the
  // last person out left on their way through it.
  kestrel_locker: {
    floor: 'concrete', wall: 'concrete', light: 0.9, music: 'kestrel', grain: 0.07,
    map: [
      '###############',
      '#######PP######',
      '#......PP.....#',
      '#.====.PP.====#',
      '#.............#',
      '#.====...====.#',
      '#.............#',
      '###############',
    ],
    decor: [
      { x: 2, y: 5, t: 'pipe' }, { x: 11, y: 5, t: 'pipe' },
      { x: 3, y: 2, t: 'crates' },
    ],
    objects: [
      { x: 3, y: 4, t: 'locker', label: 'locker' },
      { x: 11, y: 4, t: 'locker', label: 'locker' },
      { x: 7, y: 6, t: 'locker', label: 'locker' },
      // The last note in the sequence, in the last room anyone used.
      { x: 12, y: 6, t: 'note', note: 'last_one_out' },
    ],
    spawn: [{ name: 'Frostbitten Glove', n: 1 }],
    exits: [{ x: 7, y: 1, w: 2, h: 1, to: 'kestrel_f3', at: [9, 6], sfx: 'door' }],
    start: [7, 3],
  },

  // --- Act 3: the crossing ---------------------------------------------
  // Border country. The boom is still down and there is nobody to lift it.
  border: {
    floor: 'snow', wall: 'stone', light: 0.3, music: 'kestrel', grain: 0.05,
    map: [
      '#########################',
      '#.......................#',
      '#..####........####.....#',
      '#..####........####.....#',
      '#..###D........###D.....#',
      'P.......................P',
      'P.......................P',
      '#.......................#',
      '#....TT..........TT.....#',
      '#########################',
    ],
    decor: [{ x: 12, y: 2, t: 'crates' }, { x: 20, y: 7, t: 'barrel' }],
    objects: [
      { x: 12, y: 6, t: 'note', note: 'border_order' },
      { x: 6, y: 4, t: 'machine', label: 'hut' },
    ],
    spawn: [{ name: 'Checkpoint', n: 1 }, { name: 'Frozen Hare', n: 1 },
            { name: 'Long Coat', n: 1 }],
    exits: [
      { x: 0, y: 5, w: 1, h: 2, to: 'kestrel_yard', at: [19, 8] },
      { x: 24, y: 5, w: 1, h: 2, to: 'sable_road', at: [2, 5] },
    ],
    start: [2, 6],
  },

  // The first thing in the game that is louder than he is.
  sable_road: {
    tall: true,   // blocks are storeys, not roofs — see paintStorey
    floor: 'pavement', wall: 'concrete', light: 0.12, music: 'sable', grain: 0.05,
    bright: true, tint: ['#7aa8ff', 0.06],
    map: [
      '#########################',
      '#..#######......######..#',
      '#..#######......######..#',
      '#..#######......######..#',
      '#..######D......#####D..#',
      'P.......................P',
      'P.......................P',
      '#.......................#',
      '#..####......########...#',
      '#..####......########...#',
      '#########################',
    ],
    decor: [{ x: 8, y: 8, t: 'crates' }, { x: 18, y: 8, t: 'barrel' },
            { x: 6, y: 4, t: 'neon_sign' }, { x: 20, y: 4, t: 'neon_sign' }],
    objects: [
      { x: 14, y: 6, t: 'billboard', label: 'billboard' },
      { x: 5, y: 7, t: 'note', note: 'transit_complaint' },
    ],
    spawn: [{ name: 'Surplus Crate', n: 1 }, { name: 'Long Coat', n: 2 }],
    exits: [
      { x: 0, y: 5, w: 1, h: 2, to: 'border', at: [22, 6] },
      { x: 24, y: 5, w: 1, h: 2, to: 'sable', at: [2, 13] },
    ],
    start: [2, 6],
  },

  sable: {
    tall: true,   // blocks are storeys, not roofs — see paintStorey
    floor: 'pavement', wall: 'concrete', light: 0.02, music: 'sable', grain: 0.045,
    bright: true, tint: ['#ff6ad0', 0.08],
    map: [
      '##################################',
      '#..######..........######........#',
      '#..######..........######........#',
      '#..######..######..######........#',
      '#..######..######..######........#',
      '#..######..######..######..####..#',
      '#..######..######..######..####..#',
      '#..######..######..######..####..#',
      '#..######..######..######..####..#',
      '#..#####D..#####D..#####D..###D..#',
      '#................................#',
      'P................................#',
      'P................................#',
      '#................................#',
      '#....######........######........#',
      '#....######........######........#',
      '#....######........######........#',
      '#....#####D........#####D........#',
      'P................................#',
      'P..............................PP#',
      '##################################',
    ],
    decor: [
      { x: 5, y: 9, t: 'neon_sign' }, { x: 13, y: 9, t: 'neon_sign' },
      { x: 21, y: 9, t: 'neon_sign' }, { x: 28, y: 9, t: 'neon_sign' },
      { x: 7, y: 18, t: 'neon_sign' }, { x: 21, y: 18, t: 'neon_sign' },
      { x: 12, y: 13, t: 'bunting' }, { x: 24, y: 13, t: 'bunting' },
      { x: 4, y: 13, t: 'crates' }, { x: 29, y: 14, t: 'barrel' },
      { x: 17, y: 14, t: 'plant' },
    ],
    objects: [
      { x: 17, y: 10, t: 'billboard', label: 'billboard' },
      { x: 26, y: 10, t: 'pod', label: 'demo pod' },
      { x: 9, y: 13, t: 'note', note: 'vixtry_flyer' },
    ],
    npcs: [
      { art: 'sab_local', x: 7, y: 10, key: 'sable_local' },
      { art: 'sab_kid', x: 20, y: 13, key: 'sable_kid' },
      { art: 'sab_rail', x: 30, y: 10, key: 'sable_rail' },
      { art: 'vix_rep', x: 14, y: 16, key: 'vixtry_desk' },
    ],
    exits: [
      { x: 0, y: 11, w: 1, h: 2, to: 'sable_road', at: [22, 6] },
      { x: 0, y: 18, w: 1, h: 2, to: 'sable_market', at: [2, 5] },
      { x: 8, y: 9, to: 'sable_shop', at: [7, 5], sfx: 'door' },
      { x: 16, y: 9, to: 'sable_inn', at: [7, 5], sfx: 'door' },
      { x: 24, y: 9, to: 'sable_transit', at: [8, 7], sfx: 'door' },
      { x: 30, y: 9, to: 'sable_flat', at: [6, 5], sfx: 'door' },
      { x: 10, y: 17, w: 1, h: 1, to: 'sable_works', at: [2, 7], sfx: 'door' },
      { x: 24, y: 17, w: 1, h: 1, to: 'sable_arcade', at: [7, 6], sfx: 'door' },
      { x: 30, y: 19, w: 2, h: 1, to: 'bellhouse_ext', at: [11, 8] },
    ],
    start: [2, 13],
  },

  sable_shop: {
    floor: 'plank', wall: 'plaster', light: 0.28, music: 'sable', grain: 0.03,
    map: [
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#......D......#',
      '###############',
    ],
    decor: [
      { x: 7, y: 1, t: 'counter' }, { x: 2, y: 1, t: 'shelf' },
      { x: 4, y: 1, t: 'shelf' }, { x: 12, y: 1, t: 'cabinet' },
      { x: 2, y: 4, t: 'crates' }, { x: 12, y: 4, t: 'barrel' },
      { x: 7, y: 4, t: 'rug' }, { x: 10, y: 1, t: 'clock' },
    ],
    npcs: [{ art: 'sab_shop', x: 7, y: 2, key: 'sable_shopkeeper', shop: 'sable' }],
    exits: [{ x: 7, y: 6, to: 'sable', at: [8, 10], sfx: 'door' }],
    start: [7, 5],
  },

  sable_inn: {
    floor: 'plank', wall: 'plaster', light: 0.3, music: 'sable', grain: 0.03,
    map: [
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#......D......#',
      '###############',
    ],
    decor: [
      { x: 2, y: 1, t: 'counter' }, { x: 6, y: 1, t: 'picture' },
      { x: 9, y: 1, t: 'clock' }, { x: 12, y: 1, t: 'plant' },
      { x: 5, y: 4, t: 'table' }, { x: 10, y: 4, t: 'lamp' },
      { x: 8, y: 3, t: 'rug' },
    ],
    objects: [{ x: 2, y: 4, t: 'bed', label: 'bed', save: true }],
    npcs: [{ art: 'sab_inn', x: 7, y: 2, key: 'sable_innkeeper' }],
    exits: [{ x: 7, y: 6, to: 'sable', at: [16, 10], sfx: 'door' }],
    start: [7, 5],
  },

  // The transit hub, and the recruitment desk in the corner of it.
  sable_transit: {
    floor: 'plank', wall: 'plaster', light: 0.26, music: 'sable', grain: 0.035,
    map: [
      '####D############',
      '#...............#',
      '#...............#',
      '#..===...===....#',
      '#...............#',
      '#...............#',
      '#..===...===....#',
      '#...............#',
      '#.......D.......#',
      '#################',
    ],
    decor: [
      { x: 14, y: 1, t: 'cabinet' }, { x: 2, y: 1, t: 'clock' },
      { x: 8, y: 1, t: 'picture' }, { x: 2, y: 7, t: 'plant' },
      { x: 14, y: 7, t: 'lamp' },
    ],
    objects: [
      { x: 11, y: 4, t: 'note', note: 'demo_terms' },
      { x: 14, y: 4, t: 'pod', label: 'demo pod' },
    ],
    npcs: [
      { art: 'vix_rep', x: 4, y: 4, key: 'vixtry_recruiter' },
      { art: 'sab_wait', x: 8, y: 5, key: 'sable_waiting' },
    ],
    exits: [
      { x: 8, y: 8, to: 'sable', at: [24, 10], sfx: 'door' },
      { x: 4, y: 0, to: 'sable_overpass', at: [2, 3], sfx: 'door' },
    ],
    start: [8, 7],
  },

  sable_flat: {
    floor: 'plank', wall: 'plaster', light: 0.34, music: 'sable', grain: 0.03,
    map: [
      '#############',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#.....D.....#',
      '#############',
    ],
    decor: [
      { x: 2, y: 1, t: 'stove' }, { x: 5, y: 1, t: 'picture' },
      { x: 9, y: 1, t: 'shelf' }, { x: 3, y: 4, t: 'table' },
      { x: 9, y: 4, t: 'cot' }, { x: 6, y: 4, t: 'rug' },
      { x: 11, y: 1, t: 'clock' },
    ],
    npcs: [{ art: 'sab_flat', x: 6, y: 2, key: 'sable_tenant' }],
    exits: [{ x: 6, y: 6, to: 'sable', at: [30, 10], sfx: 'door' }],
    start: [6, 5],
  },

  // The industrial district. Mini-Boss 2 is at the end of it.
  // The arcade. Six pods, and somebody's mother is in one of them.
  sable_arcade: {
    floor: 'plank', wall: 'plaster', light: 0.3, music: 'sable', grain: 0.04,
    tint: ['#7aa8ff', 0.06],
    map: [
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#......D......#',
      '###############',
    ],
    decor: [
      { x: 2, y: 1, t: 'counter' }, { x: 12, y: 1, t: 'cabinet' },
      { x: 2, y: 5, t: 'plant' }, { x: 12, y: 5, t: 'lamp' },
      { x: 7, y: 6, t: 'rug' },
    ],
    objects: [
      { x: 4, y: 2, t: 'pod', label: 'demo pod' },
      { x: 7, y: 2, t: 'pod', label: 'demo pod' },
      { x: 10, y: 2, t: 'pod', label: 'demo pod' },
      { x: 4, y: 5, t: 'pod', label: 'demo pod' },
      { x: 10, y: 5, t: 'pod', label: 'demo pod' },
      { x: 7, y: 5, t: 'pod_mother', label: 'demo pod' },
    ],
    npcs: [{ art: 'vix_rep', x: 12, y: 3, key: 'arcade_attendant' }],
    exits: [{ x: 7, y: 7, to: 'sable', at: [24, 18], sfx: 'door' }],
    start: [7, 6],
  },

  // --- the market row, the overpass, and what is under it ---------------
  // Act 3 used to be one street with six doors off it and a corridor at the
  // end. These three make a loop: market to overpass to service level and back
  // out onto the street, walkable in either direction and none of it required.
  sable_market: {
    floor: 'pavement', wall: 'concrete', light: 0.22, music: 'sable', grain: 0.05,
    tint: ['#ffb060', 0.07],
    map: [
      '#########################',
      '#.......................#',
      '#.===..===..===..===..==#',
      '#.......................#',
      '#.......................#',
      'P.......................D',
      'P.......................#',
      '#.......................#',
      '#.===..===..===..===..==#',
      '#.......................#',
      '#########################',
    ],
    decor: [
      { x: 3, y: 3, t: 'bunting' }, { x: 11, y: 3, t: 'bunting' },
      { x: 19, y: 3, t: 'bunting' }, { x: 7, y: 7, t: 'bunting' },
      { x: 15, y: 7, t: 'bunting' },
      { x: 2, y: 6, t: 'crates' }, { x: 22, y: 3, t: 'barrel' },
      { x: 12, y: 5, t: 'plant' },
    ],
    objects: [
      { x: 5, y: 4, t: 'counter', label: 'stall' },
      { x: 13, y: 4, t: 'counter', label: 'stall' },
      { x: 20, y: 7, t: 'counter', label: 'stall' },
      { x: 9, y: 9, t: 'note', note: 'market_pricing' },
    ],
    npcs: [
      { art: 'sab_shop', x: 5, y: 5, key: 'market_fruit' },
      { art: 'sab_local', x: 13, y: 5, key: 'market_repairs' },
      { art: 'sab_wait', x: 20, y: 6, key: 'market_leaving' },
    ],
    exits: [
      { x: 0, y: 5, w: 1, h: 2, to: 'sable', at: [2, 19] },
      { x: 24, y: 5, to: 'sable_under', at: [1, 4], sfx: 'door' },
    ],
    start: [2, 5],
  },

  sable_overpass: {
    floor: 'concrete', wall: 'concrete', light: 0.06, music: 'sable', grain: 0.05,
    bright: true, tint: ['#7aa8ff', 0.10],
    map: [
      '#########################',
      '#.......................#',
      'D.......................#',
      '#.......................#',
      '#.......................P',
      '#.......................P',
      '#.......................#',
      '#########.......#########',
      '########.........########',
      '#######...........#######',
    ],
    decor: [
      { x: 4, y: 1, t: 'neon_sign' }, { x: 12, y: 1, t: 'neon_sign' },
      { x: 20, y: 1, t: 'neon_sign' },
      { x: 8, y: 6, t: 'pipe' }, { x: 16, y: 6, t: 'pipe' },
    ],
    objects: [
      { x: 12, y: 3, t: 'billboard', label: 'billboard' },
      { x: 3, y: 5, t: 'note', note: 'overpass_sign' },
      { x: 21, y: 2, t: 'pod', label: 'demo pod' },
    ],
    npcs: [{ art: 'sab_rail', x: 17, y: 4, key: 'overpass_watcher' }],
    exits: [
      { x: 0, y: 2, to: 'sable_transit', at: [8, 3], sfx: 'door' },
      { x: 24, y: 4, w: 1, h: 2, to: 'sable_under', at: [21, 2] },
    ],
    start: [2, 3],
  },

  sable_under: {
    floor: 'concrete', wall: 'concrete', light: 0.55, music: 'kestrel', grain: 0.07,
    map: [
      '#######################',
      'D.....................#',
      '#.....................P',
      '#..##....##....##.....P',
      '#..##....##....##.....#',
      '#.....................#',
      '#.....................#',
      '#..##....##....##.....#',
      '#..##....##....##.....#',
      '#.....................#',
      '#######################',
    ],
    decor: [
      { x: 6, y: 2, t: 'pipe' }, { x: 14, y: 2, t: 'pipe' },
      { x: 6, y: 6, t: 'pipe' }, { x: 14, y: 6, t: 'pipe' },
      { x: 19, y: 5, t: 'crates' }, { x: 2, y: 8, t: 'barrel' },
    ],
    objects: [
      { x: 10, y: 5, t: 'note', note: 'under_the_rail' },
      { x: 19, y: 8, t: 'machine', label: 'junction box' },
    ],
    spawn: [{ name: 'Ration Tin', n: 1 }, { name: 'Coil', n: 2 }],
    exits: [
      { x: 0, y: 1, to: 'sable_market', at: [22, 5], sfx: 'door' },
      { x: 22, y: 2, w: 1, h: 2, to: 'sable_overpass', at: [22, 4] },
    ],
    start: [2, 1],
  },

  sable_works: {
    floor: 'concrete', wall: 'concrete', light: 0.34, music: 'sable', grain: 0.06,
    map: [
      '#####################',
      '#...................#',
      '#..===...===...===..#',
      '#...................#',
      '#...................#',
      '#..===...===...===..#',
      '#...................#',
      'D...................#',
      '#........PPP........#',
      '#........PPP........#',
      '#########PPP#########',
    ],
    decor: [
      { x: 3, y: 6, t: 'pipe' }, { x: 16, y: 6, t: 'pipe' },
      { x: 10, y: 1, t: 'crates' },
    ],
    objects: [
      { x: 17, y: 4, t: 'machine', label: 'press' },
      { x: 4, y: 1, t: 'machine', label: 'press' },
    ],
    spawn: [{ name: 'Surplus Crate', n: 1 }, { name: 'Commuter', n: 1 },
            { name: 'Long Coat', n: 1 }],
    exits: [
      { x: 0, y: 7, to: 'sable', at: [10, 18], sfx: 'door' },
      { x: 9, y: 10, w: 3, h: 1, to: 'sable_floor', at: [10, 2] },
    ],
    start: [2, 7],
  },

  sable_floor: {
    floor: 'concrete', wall: 'concrete', light: 0.55, music: 'sable', grain: 0.065,
    map: [
      '#########PPP#########',
      '#........PPP........#',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#####################',
    ],
    decor: [{ x: 3, y: 6, t: 'pipe' }, { x: 17, y: 6, t: 'pipe' }],
    objects: [
      { x: 10, y: 6, t: 'foreman', label: 'supervisor' },
      { x: 17, y: 2, t: 'collectible', which: 'shift_badge' },
    ],
    spawn: [{ name: 'Kiosk', n: 1 }, { name: 'Neon Sign', n: 1 }],
    exits: [{ x: 9, y: 0, w: 3, h: 1, to: 'sable_works', at: [10, 7] }],
    start: [10, 2],
  },

  // --- Bellhouse Commons ------------------------------------------------
  bellhouse_ext: {
    floor: 'pavement', wall: 'concrete', light: 0.32, music: 'bellhouse', grain: 0.05, dark: true,
    map: [
      '#######################',
      '#.....................#',
      '#..#################..#',
      '#..#################..#',
      '#..#################..#',
      '#..########DD######...#',
      '#..........PP.........#',
      '#..........PP.........#',
      '#....................D#',
      'PP....................#',
      '#######################',
    ],
    decor: [{ x: 4, y: 8, t: 'plant' }, { x: 18, y: 8, t: 'crates' }],
    objects: [{ x: 16, y: 7, t: 'note', note: 'rent_notice' }],
    exits: [
      { x: 0, y: 9, w: 2, h: 1, to: 'sable', at: [29, 18] },
      { x: 11, y: 5, w: 2, h: 1, to: 'bellhouse_1', at: [10, 8], sfx: 'door' },
      { x: 21, y: 8, to: 'campus_approach', at: [2, 8],
        requires: 'beatTenant', sfx: 'door' },
    ],
    start: [11, 8],
  },

  // The halls are longer than the building. Management has asked us to note
  // that the halls are not long.
  bellhouse_1: {
    // Both ends of this hall arrive in the same place, on purpose.
    impossible: true,
    floor: 'carpet', wall: 'plaster', light: 0.6, music: 'bellhouse', grain: 0.06,
    map: [
      '####D##################',
      '#.....................#',
      'D.....................D',
      '#.....................#',
      '#######.#######.#######',
      '#.....................#',
      '#.....................#',
      '#.....................#',
      '#.........PP..........#',
      '#########DPP###########',
    ],
    decor: [
      { x: 3, y: 3, t: 'mural_wall' }, { x: 11, y: 3, t: 'mural_wall' },
      { x: 19, y: 3, t: 'mural_wall' }, { x: 5, y: 7, t: 'lamp' },
      { x: 17, y: 7, t: 'lamp' },
    ],
    objects: [
      { x: 7, y: 6, t: 'note', note: 'artists_statement' },
      { x: 14, y: 2, t: 'apartment', label: 'door', unit: '7B' },
    ],
    spawn: [{ name: 'Hall Mirror', n: 1 }, { name: "Tenant's Cat", n: 1 }],
    exits: [
      { x: 9, y: 9, w: 3, h: 1, to: 'bellhouse_ext', at: [11, 6], sfx: 'door' },
      { x: 4, y: 0, to: 'bellhouse_mural', at: [2, 2], sfx: 'door' },
      { x: 0, y: 2, to: 'bellhouse_2', at: [21, 5], sfx: 'door' },
      { x: 22, y: 2, to: 'bellhouse_2', at: [2, 5], sfx: 'door' },
    ],
    start: [10, 8],
  },

  // Both ends of the hall above arrive here. Neither is the way back.
  bellhouse_2: {
    // Both ends of this hall arrive in the same place, on purpose.
    impossible: true,
    floor: 'carpet', wall: 'plaster', light: 0.66, music: 'bellhouse', grain: 0.065,
    map: [
      '########################',
      '#......................#',
      '#......................#',
      '#..####.....####.......#',
      '#..####.....####.......#',
      'D..#D##.....####.......D',
      '#......................#',
      '#......................#',
      '#.........PP...........#',
      '#########DPP############',
    ],
    decor: [
      { x: 7, y: 2, t: 'mural_wall' }, { x: 16, y: 2, t: 'mural_wall' },
      { x: 20, y: 7, t: 'lamp' }, { x: 3, y: 7, t: 'plant' },
    ],
    objects: [
      { x: 12, y: 6, t: 'note', note: 'maintenance_log' },

      { x: 18, y: 3, t: 'collectible', which: 'spare_key' },
    ],
    spawn: [{ name: 'Unit 4C', n: 1 }, { name: 'Mural', n: 1 },
            { name: "Tenant's Cat", n: 1 }],
    exits: [
      { x: 9, y: 9, w: 3, h: 1, to: 'bellhouse_1', at: [10, 2], sfx: 'door' },
      { x: 0, y: 5, to: 'bellhouse_3', at: [10, 7], sfx: 'door' },
      { x: 23, y: 5, to: 'bellhouse_3', at: [10, 7], sfx: 'door' },
      { x: 4, y: 5, to: 'bellhouse_4c', at: [7, 5], sfx: 'door' },
    ],
    start: [10, 8],
  },

  bellhouse_3: {
    floor: 'carpet', wall: 'plaster', light: 0.72, music: 'bellhouse', grain: 0.07,
    map: [
      '#####################',
      '#...................#',
      '#...................#',
      '#..#####...#####....#',
      '#..#####...#####....#',
      '#..####D...####D....#',
      '#...................#',
      '#...................#',
      '#........PP.........#',
      '#########PP##########',
    ],
    decor: [
      { x: 10, y: 1, t: 'mural_wall' }, { x: 3, y: 7, t: 'lamp' },
      { x: 17, y: 7, t: 'lamp' },
    ],
    objects: [
      { x: 15, y: 7, t: 'note', note: 'left_with_super' },
      { x: 6, y: 1, t: 'apartment', label: 'door', unit: '2A' },
    ],
    npcs: [{ art: 'bell_super', x: 12, y: 7, key: 'bellhouse_super' }],
    spawn: [{ name: 'Mural', n: 1 }, { name: 'Hall Mirror', n: 1 }],
    exits: [
      { x: 9, y: 8, w: 2, h: 2, to: 'bellhouse_2', at: [10, 2], sfx: 'door' },
      { x: 7, y: 5, to: 'bellhouse_7b', at: [5, 4], sfx: 'door' },
      { x: 15, y: 5, to: 'bellhouse_top', at: [9, 12], sfx: 'door' },
    ],
    start: [10, 8],
  },

  // 7B. Nothing wrong. Tenant wanted company.
  bellhouse_7b: {
    floor: 'plank', wall: 'plaster', light: 0.36, music: 'bellhouse', grain: 0.04,
    map: [
      '###########',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#....D....#',
      '###########',
    ],
    decor: [
      { x: 2, y: 1, t: 'cot' }, { x: 8, y: 1, t: 'shelf' },
      { x: 5, y: 3, t: 'rug' }, { x: 8, y: 3, t: 'lamp' },
      { x: 5, y: 1, t: 'clock' },
    ],
    objects: [
      { x: 3, y: 3, t: 'television', label: 'television' },
      { x: 8, y: 4, t: 'note', note: 'under_a_door' },
    ],
    npcs: [{ art: 'bell_7b', x: 6, y: 2, key: 'bellhouse_7b' }],
    exits: [{ x: 5, y: 5, to: 'bellhouse_3', at: [7, 6], sfx: 'door' }],
    start: [5, 4],
  },

  // The room at the top. It is a perfect cube and it is bigger than the floor
  // it is on.
  // The docs say roughly four apartments are occupied and the murals match
  // nothing about the exterior. Only 7B existed; the maintenance log has been
  // naming 4C since Act 3 shipped, and nothing was behind it.
  bellhouse_4c: {
    floor: 'carpet', wall: 'plaster', light: 0.42, music: 'bellhouse', grain: 0.04,
    map: [
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#......D......#',
      '###############',
    ],
    decor: [
      { x: 2, y: 1, t: 'cabinet' }, { x: 12, y: 1, t: 'shelf' },
      { x: 2, y: 4, t: 'lamp' }, { x: 7, y: 5, t: 'rug' },
    ],
    objects: [
      { x: 4, y: 2, t: 'television', label: 'television' },
      { x: 10, y: 2, t: 'table', label: 'table' },
      { x: 12, y: 4, t: 'note', note: 'four_c_door' },
    ],
    npcs: [{ art: 'tenant_three', x: 7, y: 3, key: 'tenant_4c' }],
    exits: [{ x: 7, y: 6, to: 'bellhouse_2', at: [4, 6], sfx: 'door' }],
    start: [7, 5],
  },

  bellhouse_mural: {
    floor: 'carpet', wall: 'plaster', light: 0.5, music: 'bellhouse', grain: 0.05,
    tint: ['#c05ad0', 0.09],
    map: [
      '#########################',
      'D.......................D',
      '#.......................#',
      '#.......................#',
      '#########################',
    ],
    decor: [
      { x: 3, y: 0, t: 'mural_wall' }, { x: 8, y: 0, t: 'mural_wall' },
      { x: 13, y: 0, t: 'mural_wall' }, { x: 18, y: 0, t: 'mural_wall' },
      { x: 6, y: 4, t: 'mural_wall' }, { x: 16, y: 4, t: 'mural_wall' },
    ],
    objects: [
      { x: 11, y: 2, t: 'note', note: 'mural_key' },
      { x: 20, y: 2, t: 'painting', label: 'frame' },
    ],
    exits: [
      { x: 0, y: 1, to: 'bellhouse_1', at: [4, 1], sfx: 'door' },
      { x: 24, y: 1, to: 'bellhouse_laundry', at: [2, 4], sfx: 'door' },
    ],
    start: [2, 2],
  },

  bellhouse_laundry: {
    floor: 'plank', wall: 'plaster', light: 0.36, music: 'bellhouse', grain: 0.05,
    map: [
      '#################',
      '#...............#',
      '#..===...===....#',
      '#...............#',
      'D...............#',
      '#...............#',
      '#..===...===....#',
      '#...............#',
      '#################',
    ],
    decor: [
      { x: 13, y: 1, t: 'sink' }, { x: 13, y: 6, t: 'barrel' },
      { x: 2, y: 7, t: 'crates' },
    ],
    objects: [
      { x: 4, y: 3, t: 'machine', label: 'washer' },
      { x: 9, y: 3, t: 'machine', label: 'washer' },
      { x: 6, y: 5, t: 'note', note: 'still_in_the_drum' },
      { x: 13, y: 3, t: 'warp', label: 'something on the lid' },
    ],
    npcs: [{ art: 'tenant_five', x: 9, y: 5, key: 'tenant_laundry' }],
    exits: [{ x: 0, y: 4, to: 'bellhouse_mural', at: [22, 1], sfx: 'door' }],
    start: [2, 4],
  },

  // ===================================================================
  // ACT 5 - THE ROOT.
  //
  // What the dream world looks like when it stops maintaining itself: Okobo's
  // geometry with Kestrel's lighting, Bellhouse's corridors opening onto the
  // Sunken Orchard, the bedroom's furniture in the middle of a field. Colour
  // drained nearly to the real-world palette, and grass on everything.
  //
  // Every room in here is a room the player has already walked, wrong.
  // ===================================================================
  root_arrival: {
    floor: 'grass', wall: 'brick', light: 0.55, music: 'root', grain: 0.08, dark: true,
    map: [
      '#####################',
      '#...................#',
      '#..#####...#####....#',
      '#..#####...#####....#',
      '#..####D...####D....#',
      '#...................#',
      '#...................#',
      '#...................#',
      'D...................D',
      '#####################',
    ],
    decor: [
      { x: 4, y: 6, t: 'plant' }, { x: 16, y: 6, t: 'plant' },
      { x: 10, y: 1, t: 'mural_wall' },
    ],
    objects: [
      { x: 10, y: 6, t: 'well', label: 'the well' },
      { x: 6, y: 7, t: 'note', note: 'root_first' },
    ],
    spawn: [{ name: 'Dresser', n: 1 }],
    exits: [
      { x: 0, y: 8, to: 'long_hall_end', at: [8, 7], sfx: 'door' },
      { x: 20, y: 8, to: 'root_field', at: [2, 6] },
      { x: 7, y: 4, to: 'root_corridor', at: [2, 3], sfx: 'door' },
      { x: 15, y: 4, to: 'root_okobo', at: [2, 8], sfx: 'door' },
    ],
    start: [2, 8],
  },

  // The bedroom's furniture, in a field, in the order it stands in the bedroom.
  root_field: {
    floor: 'grass', wall: 'void', light: 0.6, music: 'root', grain: 0.08, dark: true,
    map: [
      '#############################',
      '#...........................#',
      '#...........................#',
      '#...........................#',
      '#...........................#',
      'D...........................#',
      '#...........................#',
      '#...........................#',
      '#.........................DD#',
      '#############################',
    ],
    objects: [
      { x: 6, y: 3, t: 'bed', label: 'a bed' },
      { x: 12, y: 3, t: 'dresser', label: 'a dresser' },
      { x: 18, y: 3, t: 'desk', label: 'a desk' },
      { x: 23, y: 6, t: 'window', label: 'a window' },
      { x: 9, y: 6, t: 'note', note: 'root_furniture' },
    ],
    spawn: [{ name: 'Dresser', n: 2 }, { name: 'Bedroom Door', n: 1 }],
    exits: [
      { x: 0, y: 5, to: 'root_arrival', at: [18, 8] },
      { x: 26, y: 8, w: 2, h: 1, to: 'root_deep', at: [2, 6] },
    ],
    start: [2, 6],
  },

  // Bellhouse's corridor, opening onto the Sunken Orchard at the far end.
  root_corridor: {
    floor: 'carpet', wall: 'plaster', light: 0.7, music: 'root', grain: 0.07, dark: true,
    map: [
      '#############################',
      '#...........................#',
      '#...........................#',
      'D...........................#',
      '#...........................#',
      '#.........................DD#',
      '#############################',
    ],
    decor: [
      { x: 6, y: 1, t: 'mural_wall' }, { x: 16, y: 1, t: 'mural_wall' },
      { x: 11, y: 4, t: 'lamp' },
    ],
    objects: [
      { x: 21, y: 2, t: 'apartment', label: 'door', unit: '4C' },
      { x: 14, y: 4, t: 'note', note: 'root_corridor_note' },
    ],
    spawn: [{ name: 'Bedroom Door', n: 2 }],
    exits: [
      { x: 0, y: 3, to: 'root_arrival', at: [7, 5], sfx: 'door' },
      { x: 26, y: 5, w: 2, h: 1, to: 'root_orchard', at: [2, 5] },
    ],
    start: [2, 3],
  },

  root_orchard: {
    floor: 'grass', wall: 'brick', light: 0.62, music: 'root', grain: 0.08, dark: true,
    map: [
      '#########################',
      '#.......................#',
      '#..T....T....T....T.....#',
      '#.......................#',
      '#.......................#',
      'D.......................#',
      '#.......................#',
      '#..T....T....T....T.....#',
      '#.......................#',
      '#.....................DD#',
      '#########################',
    ],
    objects: [
      { x: 12, y: 4, t: 'shrine', label: 'the good tree' },
      { x: 5, y: 8, t: 'note', note: 'root_orchard_note' },
    ],
    spawn: [{ name: 'The Argument', n: 1 }, { name: 'Dresser', n: 1 }],
    exits: [
      { x: 0, y: 5, to: 'root_corridor', at: [25, 5] },
      { x: 22, y: 9, w: 2, h: 1, to: 'root_okobo', at: [2, 12] },
    ],
    start: [2, 5],
  },

  // Okobo, with the grass over everything. The collectible is here, and it is
  // in the one place the player has walked past every single time.
  root_okobo: {
    floor: 'grass', wall: 'brick', light: 0.5, music: 'root', grain: 0.07, dark: true,
    map: [
      '##########################',
      '#........................#',
      '#..#######....######.....#',
      '#..#######....######.....#',
      '#..######D....#####D.....#',
      '#........................#',
      '#........................#',
      'D........................#',
      '#........................#',
      '#........................#',
      '#........................#',
      '#........................#',
      'D.......................DD',
      '##########################',
    ],
    decor: [
      { x: 5, y: 6, t: 'plant' }, { x: 19, y: 6, t: 'plant' },
      { x: 12, y: 10, t: 'plant' }, { x: 3, y: 10, t: 'plant' },
      { x: 22, y: 9, t: 'plant' },
    ],
    objects: [
      { x: 12, y: 7, t: 'well', label: 'the well' },
      { x: 17, y: 10, t: 'note', note: 'root_okobo_note' },
      { x: 12, y: 8, t: 'collectible', which: 'photo_half' },
    ],
    spawn: [{ name: 'The Argument', n: 1 }, { name: 'Bedroom Door', n: 1 }],
    exits: [
      { x: 0, y: 7, to: 'root_arrival', at: [15, 5], sfx: 'door' },
      { x: 0, y: 12, to: 'root_orchard', at: [21, 9] },
      { x: 24, y: 12, w: 2, h: 1, to: 'root_deep', at: [2, 6] },
    ],
    start: [2, 12],
  },

  root_deep: {
    floor: 'grass', wall: 'concrete', light: 0.85, music: 'root', grain: 0.09, dark: true,
    map: [
      '#####################',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      'D...................#',
      '#...................#',
      '#.........DD........#',
      '#####################',
    ],
    decor: [{ x: 10, y: 2, t: 'mural_wall' }],
    objects: [{ x: 16, y: 4, t: 'note', note: 'root_deep_note' }],
    exits: [
      { x: 0, y: 6, to: 'root_field', at: [25, 8] },
      { x: 10, y: 8, w: 2, h: 1, to: 'root_last', at: [10, 10],
        requires: 'beatLeftover' },
    ],
    start: [2, 6],
  },

  // The last room. Lit like the bedroom in Act 0, because it is.
  root_last: {
    floor: 'grass', wall: 'void', light: 1.2, music: 'none', grain: 0.10, dark: true,
    map: [
      '#####################',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#.........DD........#',
      '#####################',
    ],
    exits: [{ x: 10, y: 12, w: 2, h: 1, to: 'root_deep', at: [10, 7] }],
    start: [10, 11],
  },

  // --- the secret path -------------------------------------------------
  // One additional door, in a room the player has already cleared, marked only
  // by the grass being thicker in front of it (docs/09).
  gallery_restored: {
    floor: 'grass', wall: 'brick', light: 0.28, music: 'gallery', grain: 0.04,
    map: [
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '######D########',
    ],
    decor: [{ x: 7, y: 5, t: 'plant' }],
    objects: [
      { x: 2, y: 1, t: 'painting', label: 'the obelisk' },
      { x: 5, y: 1, t: 'painting', label: 'the cube' },
      { x: 8, y: 1, t: 'painting', label: 'the sphere' },
      { x: 11, y: 1, t: 'painting', label: 'the pyramid' },
      { x: 12, y: 4, t: 'painting', label: 'a small empty frame' },
      { x: 4, y: 5, t: 'note', note: 'root_gallery_note' },
    ],
    exits: [{ x: 6, y: 7, to: 'root_okobo', at: [20, 10], sfx: 'door' }],
    start: [6, 6],
  },

  // ===================================================================
  // EVERGREEN - a Vixtry Co-Living space, entered through the open demo pod on
  // the campus. Optional, and the longest thread in the game.
  //
  // The rule for every room in here: it is the prettiest place the player has
  // been since Okobo, and nothing in it is threatening. The horror is entirely
  // in what the residents say and what the ledger counts. Nobody is ever cruel
  // to him and nobody ever stops him leaving - they only ask him to reconsider.
  // ===================================================================
  ever_arrival: {
    floor: 'grass', wall: 'brick', light: 0.02, music: 'evergreen', grain: 0.015,
    bright: true, tint: ['#7ae86a', 0.10],
    map: [
      '#####################',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#..................DD',
      '#...................#',
      '#####################',
    ],
    decor: [
      { x: 3, y: 1, t: 'bunting' }, { x: 11, y: 1, t: 'bunting' },
      { x: 17, y: 1, t: 'bunting' },
      { x: 2, y: 6, t: 'plant' }, { x: 6, y: 6, t: 'plant' },
      { x: 14, y: 6, t: 'plant' },
    ],
    objects: [
      { x: 10, y: 3, t: 'billboard', label: 'sign' },
      { x: 5, y: 4, t: 'note', note: 'ever_welcome' },
      { x: 16, y: 2, t: 'helpdesk', label: 'help point' },
    ],
    npcs: [{ art: 'ever_host', x: 10, y: 5, key: 'ever_host' }],
    exits: [{ x: 19, y: 6, w: 2, h: 1, to: 'ever_green', at: [2, 8] }],
    start: [10, 6],
  },

  ever_green: {
    floor: 'grass', wall: 'brick', light: 0.02, music: 'evergreen', grain: 0.015,
    bright: true, tint: ['#7ae86a', 0.09],
    map: [
      '#################################',
      '#...............................#',
      '#..#####...#####...#####...######',
      '#..#####...#####...#####...######',
      '#..###D#...###D#...###D#...###D##',
      '#...............................#',
      '#...............................#',
      '#...............................#',
      'D...............................#',
      '#...............................#',
      '#....#####...........#####......#',
      '#....#####...........#####......#',
      '#....###D#...........###D#......#',
      '#...............................#',
      '#..............................DD',
      '#################################',
    ],
    decor: [
      { x: 5, y: 5, t: 'plant' }, { x: 13, y: 5, t: 'plant' },
      { x: 21, y: 5, t: 'plant' }, { x: 29, y: 5, t: 'plant' },
      { x: 7, y: 13, t: 'bunting' }, { x: 22, y: 13, t: 'bunting' },
      { x: 16, y: 7, t: 'fountain' },
    ],
    objects: [
      { x: 16, y: 6, t: 'fountain', label: 'fountain' },
      { x: 10, y: 9, t: 'note', note: 'ever_noticeboard' },
      { x: 26, y: 13, t: 'note', note: 'ever_ticket' },
    ],
    npcs: [
      { art: 'ever_woman', x: 8, y: 6, key: 'ever_neighbour' },
      { art: 'ever_man', x: 24, y: 8, key: 'ever_gardener' },
      { art: 'ever_child', x: 18, y: 12, key: 'ever_kid' },
    ],
    exits: [
      { x: 0, y: 8, to: 'ever_arrival', at: [17, 6] },
      { x: 6, y: 4, to: 'ever_house', at: [8, 7], sfx: 'door' },
      { x: 14, y: 4, to: 'ever_school', at: [10, 8], sfx: 'door' },
      { x: 8, y: 12, to: 'ever_desk', at: [8, 7], sfx: 'door' },
      { x: 31, y: 14, w: 2, h: 1, to: 'ever_orchard', at: [2, 6] },
    ],
    start: [2, 8],
  },

  // Household 4114. Four chairs. Three of them pushed in.
  ever_house: {
    floor: 'plank', wall: 'plaster', light: 0.04, music: 'evergreen', grain: 0.02,
    bright: true,
    map: [
      '#################',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#.......D.......#',
      '#################',
    ],
    decor: [
      { x: 2, y: 1, t: 'stove' }, { x: 5, y: 1, t: 'picture' },
      { x: 13, y: 1, t: 'cabinet' }, { x: 2, y: 6, t: 'plant' },
      { x: 8, y: 5, t: 'rug' },
    ],
    objects: [
      { x: 8, y: 3, t: 'table', label: 'table' },
      { x: 12, y: 6, t: 'note', note: 'ever_four_chairs' },
      { x: 3, y: 3, t: 'clock', label: 'clock' },
    ],
    npcs: [{ art: 'ever_woman', x: 8, y: 5, key: 'ever_resident' }],
    exits: [{ x: 8, y: 8, to: 'ever_green', at: [6, 5], sfx: 'door' }],
    start: [8, 7],
  },

  ever_school: {
    floor: 'plank', wall: 'plaster', light: 0.05, music: 'evergreen', grain: 0.02,
    bright: true,
    map: [
      '#####################',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#...................#',
      '#.........D.........#',
      '#####################',
    ],
    decor: [
      { x: 2, y: 1, t: 'shelf' }, { x: 18, y: 1, t: 'cabinet' },
      { x: 10, y: 8, t: 'rug' },
    ],
    objects: [
      { x: 10, y: 1, t: 'mural_wall', label: 'the board' },
      { x: 17, y: 7, t: 'note', note: 'ever_lesson' },
    ],
    npcs: [
      { art: 'ever_child', x: 4, y: 3, key: 'ever_pupil' },
      { art: 'ever_child', x: 12, y: 5, key: 'ever_pupil_two' },
      { art: 'ever_teacher', x: 10, y: 2, key: 'ever_teacher' },
    ],
    exits: [{ x: 10, y: 9, to: 'ever_green', at: [14, 5], sfx: 'door' }],
    start: [10, 8],
  },

  // The orchard, dry, with the good tree standing in it. Act 1's note said this
  // is where it was if the water ever went down.
  ever_orchard: {
    floor: 'grass', wall: 'brick', light: 0.02, music: 'evergreen', grain: 0.02,
    bright: true, tint: ['#8ae87a', 0.11],
    map: [
      '#############################',
      '#...........................#',
      '#..T....T....T....T....T....#',
      '#...........................#',
      '#...........................#',
      'D...........................#',
      '#...........................#',
      '#..T....T....T....T....T....#',
      '#...........................#',
      '#.........................DD#',
      '#############################',
    ],
    objects: [
      { x: 14, y: 4, t: 'shrine', label: 'the good tree' },
      { x: 6, y: 8, t: 'note', note: 'ever_orchard_note' },
    ],
    npcs: [{ art: 'ever_man', x: 20, y: 4, key: 'ever_orchardman' }],
    exits: [
      { x: 0, y: 5, to: 'ever_green', at: [30, 13] },
      { x: 26, y: 9, w: 2, h: 1, to: 'ever_edge', at: [2, 5] },
    ],
    start: [2, 6],
  },

  // The edge. The residents stand at it, facing out, perfectly content.
  ever_edge: {
    floor: 'grass', wall: 'void', light: 0.35, music: 'evergreen', grain: 0.05,
    tint: ['#8ae87a', 0.05],
    map: [
      '#########################',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      'D.......................#',
      '#.......................#',
      '#.......................#',
      '#.....................DD#',
      '     ....................',
      '        ...       ..     ',
    ],
    objects: [{ x: 12, y: 6, t: 'note', note: 'ever_boundary' }],
    npcs: [
      { art: 'ever_edge', x: 6, y: 8, key: 'ever_stander' },
      { art: 'ever_edge', x: 14, y: 8, key: 'ever_stander_two' },
      { art: 'ever_edge', x: 19, y: 8, key: 'ever_stander_three' },
    ],
    exits: [
      { x: 0, y: 4, to: 'ever_orchard', at: [25, 9] },
      { x: 22, y: 7, w: 2, h: 1, to: 'ever_ledger', at: [2, 5], sfx: 'door' },
    ],
    start: [2, 4],
  },

  // Behind the edge. Nobody stops him coming in here either.
  ever_ledger: {
    floor: 'concrete', wall: 'concrete', light: 0.5, music: 'longhall', grain: 0.06,
    map: [
      '#####################',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#...................#',
      'D...................#',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#####################',
    ],
    decor: [
      { x: 2, y: 5, t: 'pipe' }, { x: 17, y: 1, t: 'pipe' },
      { x: 10, y: 5, t: 'panel' },
    ],
    objects: [
      { x: 5, y: 4, t: 'machine', label: 'rack' },
      { x: 12, y: 4, t: 'machine', label: 'rack' },
      { x: 9, y: 6, t: 'note', note: 'ever_ledger_note' },
      { x: 16, y: 6, t: 'note', note: 'ever_do_not_close' },
    ],
    spawn: [{ name: 'Server Rack', n: 2 }],
    exits: [{ x: 0, y: 5, to: 'ever_edge', at: [21, 7], sfx: 'door' }],
    start: [2, 5],
  },

  // The way out, and the whole point: it is a help desk, and leaving is a
  // ticket. Nobody refuses. They ask him to reconsider, three times, kindly.
  ever_desk: {
    floor: 'plank', wall: 'plaster', light: 0.03, music: 'evergreen', grain: 0.02,
    bright: true,
    map: [
      '#################',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#.......D.......#',
      '#################',
    ],
    decor: [
      { x: 2, y: 1, t: 'plant' }, { x: 13, y: 1, t: 'plant' },
      { x: 8, y: 5, t: 'rug' }, { x: 2, y: 6, t: 'lamp' },
    ],
    objects: [
      { x: 8, y: 2, t: 'counter', label: 'the desk' },
      { x: 12, y: 6, t: 'note', note: 'ever_leaving' },
      { x: 4, y: 3, t: 'helpdesk', label: 'the way out' },
    ],
    npcs: [{ art: 'ever_clerk', x: 8, y: 3, key: 'ever_deskclerk' }],
    exits: [{ x: 8, y: 8, to: 'ever_green', at: [8, 13], sfx: 'door' }],
    start: [8, 7],
  },

  // ===================================================================
  // ACT 4 - Vixtry Regional Campus, and the Long Hall.
  //
  // The campus is the one liminal space in the game that is not abandoned. It
  // is fully staffed, brightly lit, and nobody stops him. Every room here is
  // brighter than anywhere he has been, which is what makes it worse.
  // ===================================================================
  campus_approach: {
    floor: 'concrete', wall: 'concrete', light: 0.08, music: 'campus', grain: 0.04,
    bright: true, tall: true,
    map: [
      '#########################',
      '#.......................#',
      '#..######.......######..#',
      '#..######.......######..#',
      '#..######.......######..#',
      '#..######.......######..#',
      '#..######.......######..#',
      'P.......................#',
      'P.......................#',
      '#..........DD...........#',
      '#########################',
    ],
    decor: [
      { x: 5, y: 7, t: 'lamp' }, { x: 19, y: 7, t: 'lamp' },
      { x: 12, y: 1, t: 'plant' }, { x: 3, y: 8, t: 'plant' },
      { x: 21, y: 8, t: 'plant' },
    ],
    objects: [
      { x: 12, y: 7, t: 'billboard', label: 'sign' },
      { x: 7, y: 8, t: 'note', note: 'campus_welcome' },
    ],
    npcs: [{ art: 'vix_greeter', x: 16, y: 8, key: 'campus_greeter' }],
    exits: [
      { x: 0, y: 7, w: 1, h: 2, to: 'bellhouse_ext', at: [19, 8] },
      { x: 11, y: 9, w: 2, h: 1, to: 'campus_atrium', at: [12, 10], sfx: 'door' },
    ],
    start: [2, 8],
  },

  campus_atrium: {
    floor: 'plank', wall: 'plaster', light: 0.03, music: 'campus', grain: 0.02,
    bright: true,
    map: [
      '#########################',
      '#.......................#',
      '#....===.......===......#',
      '#.......................#',
      '#.......................#',
      '#..===...........===....#',
      '#.......................#',
      '#.......................#',
      '#....===.......===......#',
      '#.......................#',
      '#.......................#',
      '#.......D.......D.......#',
      '#...........DD..........#',
      '#########################',
    ],
    decor: [
      { x: 2, y: 1, t: 'plant' }, { x: 22, y: 1, t: 'plant' },
      { x: 2, y: 10, t: 'plant' }, { x: 22, y: 10, t: 'plant' },
      { x: 12, y: 3, t: 'rug' }, { x: 12, y: 7, t: 'lamp' },
    ],
    objects: [
      { x: 12, y: 1, t: 'counter', label: 'reception' },
      { x: 5, y: 6, t: 'bench', label: 'bench' },
      { x: 19, y: 6, t: 'machine', label: 'vending machine', shop: 'campus' },
      { x: 8, y: 9, t: 'note', note: 'campus_directory' },
    ],
    npcs: [
      { art: 'vix_desk', x: 12, y: 2, key: 'campus_desk' },
      { art: 'vix_intern', x: 6, y: 4, key: 'campus_intern' },
      { art: 'vix_janitor', x: 20, y: 9, key: 'campus_janitor' },
    ],
    exits: [
      { x: 12, y: 12, w: 2, h: 1, to: 'campus_approach', at: [12, 7], sfx: 'door' },
      { x: 8, y: 11, to: 'campus_floor', at: [2, 6], sfx: 'door' },
      { x: 16, y: 11, to: 'campus_pods', at: [12, 8], sfx: 'door' },
    ],
    start: [12, 11],
  },

  campus_floor: {
    floor: 'pavement', wall: 'plaster', light: 0.05, music: 'campus', grain: 0.025,
    bright: true,
    map: [
      '#############################',
      'D...........................#',
      '#..===..===..===..===..===..#',
      '#...........................#',
      '#...........................#',
      '#...........................#',
      '#...........................D',
      '#...........................#',
      '#..===..===..===..===..===..#',
      '#...........................#',
      '#.............D.............#',
      '#############################',
    ],
    decor: [
      { x: 3, y: 4, t: 'lamp' }, { x: 14, y: 4, t: 'lamp' },
      { x: 25, y: 4, t: 'lamp' }, { x: 8, y: 9, t: 'plant' },
      { x: 20, y: 9, t: 'plant' },
    ],
    objects: [
      { x: 5, y: 3, t: 'desk', label: 'desk' },
      { x: 12, y: 3, t: 'desk', label: 'desk' },
      { x: 19, y: 3, t: 'desk', label: 'desk' },
      { x: 26, y: 3, t: 'desk', label: 'desk' },
      { x: 10, y: 7, t: 'bench', label: 'bench' },
      { x: 17, y: 6, t: 'note', note: 'campus_memo_retention' },
      { x: 24, y: 9, t: 'note', note: 'campus_memo_subject' },
    ],
    npcs: [
      { art: 'vix_eng', x: 12, y: 4, key: 'campus_engineer' },
      { art: 'vix_greeter', x: 22, y: 7, key: 'campus_byname' },
    ],
    spawn: [{ name: 'Intern', n: 2 }, { name: 'Receptionist', n: 1 },
            { name: 'Server Rack', n: 1 }],
    exits: [
      { x: 14, y: 10, to: 'campus_atrium', at: [8, 10], sfx: 'door' },
      { x: 0, y: 1, to: 'campus_racks', at: [2, 5], sfx: 'door' },
      { x: 28, y: 6, to: 'campus_office', at: [10, 10], sfx: 'door' },
    ],
    start: [2, 6],
  },

  campus_pods: {
    floor: 'plank', wall: 'plaster', light: 0.14, music: 'campus', grain: 0.03,
    tint: ['#7aa8ff', 0.05],
    map: [
      '#########################',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#...........DD..........#',
      '#########################',
    ],
    decor: [
      { x: 2, y: 1, t: 'cabinet' }, { x: 22, y: 1, t: 'shelf' },
      { x: 2, y: 8, t: 'plant' }, { x: 22, y: 8, t: 'lamp' },
      { x: 12, y: 5, t: 'rug' },
    ],
    objects: [
      { x: 4, y: 2, t: 'pod', label: 'demo pod' },
      { x: 8, y: 2, t: 'pod', label: 'demo pod' },
      { x: 16, y: 2, t: 'pod', label: 'demo pod' },
      { x: 20, y: 2, t: 'pod', label: 'demo pod' },
      { x: 4, y: 7, t: 'pod', label: 'demo pod' },
      { x: 20, y: 7, t: 'pod', label: 'demo pod' },
      { x: 12, y: 2, t: 'pod_open', label: 'an open pod' },
      { x: 12, y: 7, t: 'note', note: 'campus_pod_terms' },
    ],
    npcs: [{ art: 'vix_greeter', x: 8, y: 6, key: 'campus_pod_host' }],
    spawn: [{ name: 'Demo Pod', n: 2 }],
    exits: [{ x: 12, y: 9, w: 2, h: 1, to: 'campus_atrium', at: [16, 10], sfx: 'door' }],
    start: [12, 8],
  },

  campus_racks: {
    floor: 'concrete', wall: 'plaster', light: 0.34, music: 'campus', grain: 0.05,
    map: [
      '#####################',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#...................#',
      '#...................D',
      '#...................#',
      '#..===..===..===....#',
      '#...................#',
      '#####################',
    ],
    decor: [
      { x: 2, y: 5, t: 'pipe' }, { x: 18, y: 1, t: 'pipe' },
      { x: 10, y: 5, t: 'panel' },
    ],
    objects: [
      { x: 5, y: 4, t: 'machine', label: 'rack' },
      { x: 12, y: 4, t: 'machine', label: 'rack' },
      { x: 9, y: 8, t: 'note', note: 'campus_retention_log' },
      { x: 17, y: 8, t: 'collectible', which: 'session_tape' },
    ],
    spawn: [{ name: 'Server Rack', n: 2 }, { name: 'Ceiling Tile', n: 1 }],
    exits: [{ x: 20, y: 5, to: 'campus_floor', at: [2, 1], sfx: 'door' }],
    start: [2, 5],
  },

  campus_office: {
    floor: 'plank', wall: 'plaster', light: 0.07, music: 'campus', grain: 0.03,
    bright: true,
    map: [
      '##########D##########',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#...................#',
      '#........DD.........#',
      '#####################',
    ],
    decor: [
      { x: 2, y: 1, t: 'cabinet' }, { x: 18, y: 1, t: 'shelf' },
      { x: 2, y: 9, t: 'plant' }, { x: 18, y: 9, t: 'plant' },
      { x: 10, y: 6, t: 'rug' },
    ],
    objects: [
      { x: 10, y: 3, t: 'desk', label: 'desk' },
      { x: 15, y: 8, t: 'note', note: 'campus_apology_draft' },
    ],
    exits: [
      { x: 9, y: 11, w: 2, h: 1, to: 'campus_floor', at: [26, 6], sfx: 'door' },
      { x: 10, y: 0, to: 'long_hall_1', at: [2, 3],
        requires: 'beatManager', sfx: 'door' },
    ],
    start: [10, 9],
  },

  // The Gallery's hallway, reskinned and much longer. Same brick, same ceiling,
  // same grass. The paintings are gone; the frames are not.
  long_hall_1: {
    floor: 'grass', wall: 'brick', light: 0.5, music: 'longhall', grain: 0.06, dark: true,
    map: [
      '###################################',
      '#.................................#',
      '#.................................#',
      'D.................................D',
      '#.................................#',
      '#.................................#',
      '###################################',
    ],
    objects: [
      { x: 6, y: 1, t: 'painting', label: 'frame' },
      { x: 14, y: 1, t: 'painting', label: 'frame' },
      { x: 22, y: 1, t: 'painting', label: 'frame' },
      { x: 30, y: 1, t: 'painting', label: 'frame' },
      { x: 18, y: 4, t: 'note', note: 'long_hall_inventory' },
    ],
    spawn: [{ name: 'Empty Frame', n: 2 }, { name: 'Fluorescent', n: 1 }],
    exits: [
      { x: 0, y: 3, to: 'campus_office', at: [10, 2], sfx: 'door' },
      { x: 34, y: 3, to: 'long_hall_2', at: [1, 3], sfx: 'door' },
    ],
    start: [2, 3],
  },

  long_hall_2: {
    floor: 'grass', wall: 'brick', light: 0.72, music: 'longhall', grain: 0.07, dark: true,
    map: [
      '###################################',
      '#.................................#',
      '#.................................#',
      'D.................................D',
      '#.................................#',
      '#.................................#',
      '###################################',
    ],
    objects: [
      { x: 9, y: 1, t: 'painting', label: 'frame' },
      { x: 25, y: 1, t: 'painting', label: 'frame' },
      { x: 17, y: 4, t: 'collectible', which: 'hall_nail' },
    ],
    spawn: [{ name: 'Empty Frame', n: 2 }, { name: 'Ceiling Tile', n: 2 },
            { name: 'Custodial Cart', n: 1 }],
    exits: [
      { x: 0, y: 3, to: 'long_hall_1', at: [33, 3], sfx: 'door' },
      { x: 34, y: 3, to: 'long_hall_3', at: [1, 3], sfx: 'door' },
    ],
    start: [2, 3],
  },

  long_hall_3: {
    floor: 'grass', wall: 'brick', light: 0.95, music: 'longhall', grain: 0.08, dark: true,
    map: [
      '###################################',
      '#.................................#',
      '#.................................#',
      'D.................................D',
      '#.................................#',
      '#.................................#',
      '###################################',
    ],
    objects: [{ x: 20, y: 4, t: 'note', note: 'long_hall_last' }],
    spawn: [{ name: 'Custodial Cart', n: 2 }, { name: 'Fluorescent', n: 2 }],
    exits: [
      { x: 0, y: 3, to: 'long_hall_2', at: [33, 3], sfx: 'door' },
      { x: 34, y: 3, to: 'long_hall_end', at: [2, 7], sfx: 'door' },
    ],
    start: [2, 3],
  },

  long_hall_end: {
    floor: 'grass', wall: 'brick', light: 1.15, music: 'longhall', grain: 0.09, dark: true,
    map: [
      '########D########',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      '#...............#',
      'D...............#',
      '#...............#',
      '#################',
    ],
    decor: [{ x: 8, y: 1, t: 'mural_wall' }],
    exits: [
      { x: 0, y: 7, to: 'long_hall_3', at: [33, 3], sfx: 'door' },
      { x: 8, y: 0, to: 'root_arrival', at: [2, 8],
        requires: 'beatCustodian' },
    ],
    start: [2, 7],
  },

  bellhouse_top: {
    floor: 'carpet', wall: 'plaster', light: 0.85, music: 'bellhouse', grain: 0.08, dark: true,
    map: [
      '###################',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#........PP.......#',
      '#########DD########',
    ],
    decor: [{ x: 9, y: 3, t: 'mural_wall' }],
    exits: [{ x: 9, y: 14, w: 2, h: 1, to: 'bellhouse_3', at: [15, 6], sfx: 'door' }],
    start: [9, 13],
  },
};

// --- room runtime ------------------------------------------------------
const World = {
  id: null, room: null, w: 0, h: 0,
  entities: [], camX: 0, camY: 0,

  load(id, at) {
    const r = ROOMS[id];
    if (!r) { console.warn('no room', id); return; }
    this.id = id; this.room = r;
    this.w = r.map[0].length; this.h = r.map.length;
    this.entities = [];

    for (const n of r.npcs || []) {
      // Some people are only there once. The game does not remark on it.
      if (n.once && Player.flags[n.once]) continue;
      this.entities.push({
        kind: 'npc', x: n.x * TS + TS / 2, y: n.y * TS + TS / 2,
        art: n.art, key: n.key, shop: n.shop, face: 'down', bob: Math.random() * 6,
      });
    }
    // Wandering enemies, only those not already beaten out of this room.
    for (const s of r.spawn || []) {
      for (let i = 0; i < s.n; i++) {
        const spot = this.findFloor();
        if (!spot) continue;
        this.entities.push({
          kind: 'enemy', species: s.name, x: spot[0], y: spot[1],
          vx: 0, vy: 0, think: Math.random() * 1.5, face: 'down',
          hp: 1, cool: 0.9,
        });
      }
    }
    if (r.objects) for (const o of r.objects) {
      if (o.t === 'collectible' && Player.flags['got_' + o.which]) continue;
      this.entities.push({ kind: 'object', ...o, x: o.x * TS + TS / 2, y: o.y * TS + TS / 2 });
    }

    // Remember the leg of the walk this room belongs to, for the map.
    const leg = routeIndexOf(id);
    if (leg >= 0 && !Player.seen.includes(leg)) Player.seen.push(leg);

    const start = at || r.start;
    Player.x = start[0] * TS + TS / 2;
    Player.y = start[1] * TS + TS / 2;
    this.exitArmed = false;
    Audio_.play(r.music || 'none');
    this.centerCamera();
  },

  findFloor() {
    for (let tries = 0; tries < 80; tries++) {
      const tx = 1 + ((Math.random() * (this.w - 2)) | 0);
      const ty = 1 + ((Math.random() * (this.h - 2)) | 0);
      if (this.solidTile(tx, ty)) continue;
      const px = tx * TS + TS / 2, py = ty * TS + TS / 2;
      if (Math.hypot(px - Player.x, py - Player.y) < 56) continue;
      return [px, py];
    }
    return null;
  },

  tile(tx, ty) {
    if (ty < 0 || ty >= this.h) return '#';
    const row = this.room.map[ty];
    if (tx < 0 || tx >= row.length) return '#';
    return row[tx];
  },
  solidTile(tx, ty) { return SOLID.has(this.tile(tx, ty)); },
  solidAt(px, py) { return this.solidTile(Math.floor(px / TS), Math.floor(py / TS)); },

  // Axis-separated box collision so walls slide rather than stick.
  move(e, dx, dy, hw = 4, hh = 3) {
    if (dx) {
      const nx = e.x + dx;
      if (!this.solidAt(nx + Math.sign(dx) * hw, e.y) &&
          !this.solidAt(nx + Math.sign(dx) * hw, e.y - hh)) e.x = nx;
    }
    if (dy) {
      const ny = e.y + dy;
      if (!this.solidAt(e.x - hw + 1, ny + Math.sign(dy) * hh) &&
          !this.solidAt(e.x + hw - 1, ny + Math.sign(dy) * hh)) e.y = ny;
    }
    e.x = Math.max(2, Math.min(this.w * TS - 2, e.x));
    e.y = Math.max(2, Math.min(this.h * TS - 2, e.y));
  },

  // Roofline, eaves and skirting, worked out from the shape of the block rather
  // than authored per building. Every structure in the game was a flat
  // rectangle of texture with a hole in it; this is what makes one read as a
  // building seen from above instead of as a wall the tiles happen to share.
  isWall(x, y) { const t = this.tile(x, y); return t === '#' || t === 'D'; },

  // Which part of a structure a wall tile is. The map's own outermost ring is
  // scenery, not a building, so it stays flat: without that test the border
  // columns have wall above and below and classify as roof.
  wallPart(tx, ty) {
    const r = this.room;
    if (INTERIOR_WALLS.has(r.wall)) return 'inside';
    if (tx === 0 || ty === 0 || tx === this.w - 1 || ty === this.h - 1) return 'border';
    const below = this.isWall(tx, ty + 1), above = this.isWall(tx, ty - 1);
    // In a tall room the rows between the shopfront and the roofline are floors.
    if (r.tall && below && above) return 'storey';
    if (r.tall && below) return 'cap';
    if (below) return 'roof';
    if (above) return 'face';
    return 'border';
  },

  // How many wall rows sit under this one, so a storey knows which floor it is.
  // Used only to lift the light a little per floor: the top of a building
  // catches more sky than the street does, and that gradient is most of what
  // sells height in a flat projection.
  floorsUnder(tx, ty) {
    let n = 0;
    for (let y = ty + 1; y < this.h && this.isWall(tx, y); y++) n++;
    return n;
  },

  // The front of a building: a window on alternate bays, and never beside the
  // door, so the doorway stays the thing your eye lands on.
  facade(tx, ty, px, py, dim) {
    if (this.isWall(tx - 1, ty) && this.tile(tx - 1, ty) === 'D') return;
    if (this.isWall(tx + 1, ty) && this.tile(tx + 1, ty) === 'D') return;
    if (hash2(tx * 5, ty * 3) < 0.18) return;
    const lit = hash2(tx * 3 + 1, ty * 9 + 2) > 0.55;
    rect(px + 3, py + 3, 10, 9, shade('#22242c', dim));
    rect(px + 4, py + 4, 8, 7, lit ? '#c8b878' : shade('#4a5560', dim));
    rect(px + 4, py + 4, 8, 3, lit ? '#e0d09a' : shade('#5c6874', dim));
    rect(px + 7, py + 4, 1, 7, shade('#22242c', dim));   // the glazing bar
    rect(px + 2, py + 12, 12, 1, shade('#8a8378', dim)); // sill
  },

  trim(tx, ty, px, py, dim, part) {
    const wall = (x, y) => this.isWall(x, y);
    const up = wall(tx, ty - 1), down = wall(tx, ty + 1);
    const left = wall(tx - 1, ty), right = wall(tx + 1, ty);
    const r = this.room;
    if (part === 'inside') return;

    const ridge = r.wall === 'concrete' ? '#7b7f88'
                : r.wall === 'stone' ? '#b3aa9c' : '#a2564a';
    const shade_ = r.wall === 'concrete' ? '#31333a'
                 : r.wall === 'stone' ? '#413c36' : '#41221d';

    // The top edge catches the light: a ridge cap along it, and a return down
    // the first pixel of each side so corners do not look bitten off.
    if (!up) {
      rect(px, py, TS, 2, shade(ridge, dim + 6));
      rect(px, py + 2, TS, 1, shade(shade_, dim));
    }
    // The bottom edge is the front of the building, in shadow, with a sill.
    if (!down) {
      rect(px, py + TS - 3, TS, 1, shade(shade_, dim));
      rect(px, py + TS - 2, TS, 2, shade(ridge, dim - 14));
    }
    if (!left) rect(px, py, 1, TS, shade(shade_, dim));
    if (!right) rect(px + TS - 1, py, 1, TS, shade(shade_, dim));
    // Corner pieces, so the ridge turns properly instead of stopping dead.
    if (!up && !left) rect(px, py, 2, 3, shade(ridge, dim + 10));
    if (!up && !right) rect(px + TS - 2, py, 2, 3, shade(ridge, dim + 10));
  },

  centerCamera() {
    this.camX = Math.round(Math.max(0, Math.min(this.w * TS - W, Player.x - W / 2)));
    this.camY = Math.round(Math.max(0, Math.min(this.h * TS - H, Player.y - H / 2)));
    if (this.w * TS < W) this.camX = Math.round((this.w * TS - W) / 2);
    if (this.h * TS < H) this.camY = Math.round((this.h * TS - H) / 2);
  },

  exitAt(px, py) {
    for (const x of this.room.exits || []) {
      if (x.requires && !Player.flags[x.requires]) continue;
      const w = x.w || 1, h = x.h || 1;
      if (px >= x.x * TS && px < (x.x + w) * TS &&
          py >= x.y * TS && py < (x.y + h) * TS) return x;
    }
    return null;
  },

  // An exit cannot fire until the player has stood clear of every exit since
  // arriving. Without this, landing on or beside a return path bounces you
  // straight back, and every doorway in the game is one tile from being that
  // bug.
  updateExitArming() {
    if (this.exitArmed) return;
    if (!this.exitAt(Player.x, Player.y)) this.exitArmed = true;
  },

  update(dt) {
    for (const e of this.entities) {
      if (e.kind === 'npc') { e.bob += dt; continue; }
      if (e.kind !== 'enemy') continue;
      e.cool -= dt;
      e.think -= dt;
      if (e.think <= 0) {
        e.think = 0.7 + Math.random() * 1.6;
        const dir = (Math.random() * 5) | 0;
        const sp = 15;
        e.vx = [0, sp, -sp, 0, 0][dir]; e.vy = [0, 0, 0, sp, -sp][dir];
        if (e.vx) e.face = e.vx > 0 ? 'right' : 'left';
        else if (e.vy) e.face = e.vy > 0 ? 'down' : 'up';
      }
      this.move(e, e.vx * dt, e.vy * dt, 5, 4);
    }
    this.updateExitArming();
    this.centerCamera();
  },

  touchedEnemy() {
    for (const e of this.entities) {
      if (e.kind !== 'enemy' || e.cool > 0) continue;
      if (Math.abs(e.x - Player.x) < 10 && Math.abs(e.y - Player.y) < 11) return e;
    }
    return null;
  },

  // Whatever the player is facing, within reach.
  facing() {
    const d = { up: [0, -12], down: [0, 12], left: [-12, 0], right: [12, 0] }[Player.face];
    const fx = Player.x + d[0], fy = Player.y + d[1];
    let best = null, bestD = 15;
    for (const e of this.entities) {
      if (e.kind === 'enemy') continue;
      const dist = Math.hypot(e.x - fx, e.y - fy);
      if (dist < bestD) { bestD = dist; best = e; }
    }
    return best;
  },

  draw() {
    const r = this.room;
    const dim = r.bright ? 8 : (r.dark ? -46 : -22);
    const x0 = Math.floor(this.camX / TS), x1 = Math.ceil((this.camX + W) / TS);
    const y0 = Math.floor(this.camY / TS), y1 = Math.ceil((this.camY + H) / TS);
    const floorFn = FLOORS[r.floor] || paintGrass;
    const wallFn = WALLS[r.wall] || paintBrick;

    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const px = tx * TS - this.camX, py = ty * TS - this.camY;
        const t = this.tile(tx, ty);
        if (t === ' ') { paintVoid(px, py); continue; }
        if (t === '#') {
          // Interior rooms are all wall; outdoor blocks are roof except along
          // the front, and the map's own border is neither.
          const part = this.wallPart(tx, ty);
          // Each floor up is lit a little more: the street is in shadow and the
          // top of the building is not. Capped so a tower does not go white.
          const lift = part === 'storey' || part === 'cap'
            ? Math.min(16, this.floorsUnder(tx, ty) * 3) : 0;
          if (part === 'roof') (ROOFS[r.wall] || paintShingle)(px, py, tx, ty, dim);
          else wallFn(px, py, tx, ty, dim + lift);
          if (part === 'face') this.facade(tx, ty, px, py, dim);
          if (part === 'storey') {
            paintStorey(px, py, tx, ty, dim + lift, STOREY_BAND[r.wall] || '#8e6b5c');
          }
          if (part === 'cap') {
            paintCornice(px, py, tx, ty, dim + lift, CORNICE[r.wall] || '#b3aa9c');
          }
          this.trim(tx, ty, px, py, dim, part);
          continue;
        }
        if (t === 'P') { paintPath(px, py, tx, ty, dim, r.floor === 'water'); continue; }
        if (t === 'D') {
          // a doorway punched through the wall it sits in
          wallFn(px, py, tx, ty, dim - 14);
          rect(px + 3, py + 2, TS - 6, TS - 2, shade('#3b3b42', dim));
          rect(px + 4, py + 3, TS - 8, TS - 3, shade('#8a8a92', dim));
          rect(px + TS - 6, py + 9, 1, 2, '#2a2a30');
          continue;
        }
        if (t === '~') { paintWater(px, py, tx, ty, dim); continue; }
        floorFn(px, py, tx, ty, dim);
        if (t === 'T') {
          const nm = r.floor === 'water' ? 'bigtree' : 'tree';
          const pal = r.floor === 'snow' ? 'winter' : (r.floor === 'water' ? 'tree' : 'bigtree');
          sprite(nm, px + (TS - spriteWidth(nm)) / 2, py - spriteHeight(nm) + TS + 2, pal);
        }
        if (t === '=') {
          const metal = r.floor === 'concrete';
          rect(px + 1, py + 2, TS - 2, TS - 5, shade(metal ? '#54585f' : '#4a3a2a', dim));
          rect(px + 1, py + 2, TS - 2, 2, shade(metal ? '#6d7178' : '#5d4a35', dim));
          rect(px + 2, py + TS - 5, TS - 4, 1, shade(metal ? '#31343a' : '#2e241a', dim));
        }
      }
    }

    if (r.decor) {
      for (const d of r.decor) {
        const dx = d.x * TS + TS / 2 - this.camX, dy = d.y * TS + TS / 2 - this.camY;
        if (dx < -40 || dx > W + 40 || dy < -48 || dy > H + 48) continue;
        drawDecor(d.t, dx, dy, dim, d);
      }
    }

    // Everything that stands up, sorted by depth.
    const drawables = [...this.entities, { kind: 'player', x: Player.x, y: Player.y }];
    drawables.sort((a, b) => a.y - b.y);
    for (const e of drawables) this.drawEntity(e);
  },

  drawEntity(e) {
    const px = Math.round(e.x - this.camX), py = Math.round(e.y - this.camY);
    if (e.kind === 'player') { Player.draw(px, py); return; }

    if (e.kind === 'npc') {
      // Sprite and palette share a name: every person is one entry in
      // gen_sprites' PEOPLE table, so they cannot be mismatched here.
      const nm = e.art;
      const w = spriteWidth(nm), h = spriteHeight(nm);
      const bob = Math.sin(e.bob * 1.6) > 0.94 ? 1 : 0;
      rect(px - 4, py + 1, 9, 2, 'rgba(0,0,0,0.28)');
      sprite(nm, px - w / 2, py - h + 3 - bob, nm);
      return;
    }

    if (e.kind === 'enemy') {
      const art = ENEMY_ART[e.species] || { spr: 'dog', pal: 'dog' };
      const w = spriteWidth(art.spr), h = spriteHeight(art.spr);
      rect(px - 4, py + 1, 9, 2, 'rgba(0,0,0,0.28)');
      const bob = Math.sin(Time.t * 3 + e.x) > 0.6 ? 1 : 0;
      sprite(art.spr, px - w / 2, py - h + 3 - bob, art.pal, e.face === 'left');
      return;
    }

    if (e.kind === 'object') this.drawObject(e, px, py);
  },

  drawObject(o, px, py) {
    switch (o.t) {
      case 'bed':
        rect(px - 7, py - 12, 15, 20, '#5a4038');
        rect(px - 6, py - 10, 13, 9, '#c8c0b4');
        rect(px - 6, py + 1, 13, 6, '#8a5a52');
        break;
      case 'dresser':
        rect(px - 7, py - 10, 15, 16, '#4a3628');
        rect(px - 5, py - 7, 11, 4, '#3a2a1e'); rect(px - 5, py - 1, 11, 4, '#3a2a1e');
        break;
      case 'window': {
        rect(px - 9, py - 12, 19, 16, '#2a2a34');
        rect(px - 7, py - 10, 15, 12, '#0d1018');
        rect(px - 1, py - 10, 1, 12, '#2a2a34'); rect(px - 7, py - 5, 15, 1, '#2a2a34');
        break;
      }
      case 'poster':
        rect(px - 6, py - 12, 13, 15, '#3a3550');
        rect(px - 4, py - 10, 9, 11, '#4d4770');
        rect(px - 2, py - 7, 5, 5, '#6b62a0');
        break;
      case 'switch':
        rect(px - 2, py - 8, 5, 7, '#c8c8c0'); rect(px - 1, py - 6, 3, 3, '#8a8a84');
        break;
      case 'door': {
        rect(px - 7, py - 5, 15, 18, '#2a1e16');
        rect(px - 6, py - 4, 13, 16, '#523d2c');
        rect(px - 6, py - 4, 3, 16, '#634b36');
        rect(px - 4, py - 1, 9, 6, '#412f22');
        rect(px + 3, py + 6, 2, 2, '#c8b46a');
        if (Player.flags.hallLight !== false) {
          // The only light in the room, and it is not for him.
          rect(px - 6, py + 12, 13, 1, '#ffeec2');
          rect(px - 6, py + 13, 13, 1, 'rgba(255,232,176,0.75)');
          const g = cx.createLinearGradient(0, py + 13, 0, py + 34);
          g.addColorStop(0, 'rgba(255,226,160,0.30)');
          g.addColorStop(1, 'rgba(255,226,160,0)');
          cx.fillStyle = g;
          cx.beginPath();
          cx.moveTo(px - 7, py + 13); cx.lineTo(px + 8, py + 13);
          cx.lineTo(px + 15, py + 34); cx.lineTo(px - 14, py + 34);
          cx.closePath(); cx.fill();
        }
        break;
      }
      case 'well':
        rect(px - 8, py - 6, 17, 11, '#6a6a66');
        rect(px - 6, py - 4, 13, 7, '#14141a');
        rect(px - 8, py - 16, 2, 11, '#5a4230'); rect(px + 7, py - 16, 2, 11, '#5a4230');
        rect(px - 9, py - 17, 19, 2, '#5a4230');
        break;
      case 'memorial':
        rect(px - 5, py - 20, 11, 22, '#7a7a76');
        rect(px - 7, py, 15, 4, '#5f5f5c');
        for (let i = 0; i < 7; i++) rect(px - 3, py - 17 + i * 2, 7, 1, '#585854');
        break;
      case 'painting': {
        const big = !o.small;
        const w = big ? 22 : 15, h = big ? 20 : 14;
        rect(px - w / 2 - 2, py - h - 2, w + 4, h + 4, '#3a2c18');
        rect(px - w / 2 - 1, py - h - 1, w + 2, h + 2, '#8a6a34');
        rect(px - w / 2, py - h, w, h, '#2a3550');
        rect(px - w / 2, py - h, w, h * 0.55, '#54608c');
        rect(px - w / 2, py - h * 0.45, w, h * 0.45, '#1e2740');
        const cxp = px, base = py - h * 0.45;
        cx.fillStyle = '#9a9a9e';
        if (o.shape === 'obelisk') cx.fillRect(cxp - 1, base - h * 0.44, 3, h * 0.44);
        if (o.shape === 'spire') cx.fillRect(cxp - 1, base - h * 0.5, 2, h * 0.5);
        if (o.shape === 'cube') cx.fillRect(cxp - 4, base - 8, 8, 8);
        if (o.shape === 'sphere') { cx.beginPath(); cx.arc(cxp, base - 5, 4.5, 0, 7); cx.fill(); }
        if (o.shape === 'pyramid') {
          cx.beginPath(); cx.moveTo(cxp, base - 9); cx.lineTo(cxp + 6, base); cx.lineTo(cxp - 6, base);
          cx.closePath(); cx.fill();
        }
        cx.globalAlpha = 0.3;
        if (o.shape === 'cube') cx.fillRect(cxp - 4, base, 8, 5);
        else cx.fillRect(cxp - 3, base, 6, 5);
        cx.globalAlpha = 1;
        break;
      }
      case 'note':
        rect(px - 4, py - 6, 9, 7, '#d8d2c0'); rect(px - 3, py - 5, 7, 1, '#8a8478');
        rect(px - 3, py - 3, 5, 1, '#8a8478');
        break;
      case 'fountain': {
        // Nobody is in charge of opening the valve.
        rect(px - 14, py - 6, 29, 12, '#6d6a62');
        rect(px - 12, py - 4, 25, 8, '#4a4740');
        rect(px - 3, py - 14, 6, 10, '#7d7a70');
        rect(px - 6, py - 16, 12, 3, '#8b887c');
        for (let i = 0; i < 14; i++)
          rect(px - 11 + i * 2, py - 3 + ((i * 3) % 5), 1, 1, '#3d3a34');
        break;
      }
      case 'billboard': {
        rect(px - 4, py - 2, 2, 11, '#41434a');
        rect(px + 3, py - 2, 2, 11, '#41434a');
        rect(px - 20, py - 26, 41, 25, '#0e1119');
        rect(px - 19, py - 25, 39, 23, '#1b2432');
        // Cleaner than anything else in the world, and pasted on top of it.
        rect(px - 15, py - 21, 3, 9, '#dce8f0');   // the V, as two strokes
        rect(px - 12, py - 14, 3, 4, '#dce8f0');
        rect(px - 9, py - 21, 3, 9, '#dce8f0');
        rect(px - 4, py - 21, 22, 2, '#8fa8bc');   // strapline, unreadably small
        rect(px - 4, py - 17, 16, 1, '#5b7a90');
        rect(px - 15, py - 8, 33, 1, '#3f5567');
        rect(px - 15, py - 5, 20, 1, '#33465666'.slice(0, 7));
        break;
      }
      case 'milepost':
        rect(px - 2, py - 12, 5, 14, '#8d8d84');
        rect(px - 2, py - 12, 2, 14, '#adada2');
        rect(px - 1, py - 10, 3, 1, '#4c4c46');
        rect(px - 1, py - 8, 3, 1, '#4c4c46');
        break;
      case 'shrine':
        rect(px - 6, py - 10, 13, 12, '#8a8276');
        rect(px - 6, py - 10, 4, 12, '#a8a094');
        rect(px - 3, py - 7, 7, 7, '#2c2822');
        rect(px - 1, py - 4, 3, 3, '#c8a24a');
        rect(px - 8, py - 14, 17, 5, '#7a7266');
        break;
      case 'memorial_stone': {
        rect(px - 5, py - 26, 11, 26, '#8d8d84');
        rect(px - 5, py - 26, 4, 26, '#a9a99f');
        rect(px - 8, py - 2, 17, 4, '#6d6d66');
        for (let i = 0; i < 9; i++) rect(px - 3, py - 23 + i * 2, 7, 1, '#5a5a54');
        break;
      }
      case 'machine':
        rect(px - 10, py - 14, 21, 16, '#5f6168');
        rect(px - 10, py - 14, 5, 16, '#82858e');
        rect(px - 7, py - 11, 14, 6, '#2c2f34');
        rect(px - 6, py - 3, 4, 3, '#3a3d43');
        rect(px + 2, py - 3, 4, 3, '#3a3d43');
        break;
      case 'door7':
        rect(px - 7, py - 22, 15, 23, '#4a3a26');
        rect(px - 6, py - 21, 13, 21, '#5d4930');
        rect(px - 6, py - 21, 4, 21, '#6d5738');
        rect(px + 3, py - 11, 2, 2, '#c0a860');
        rect(px - 2, py - 19, 4, 4, '#8a7448');   // the number, too small to read
        break;
      case 'parcel': {
        // Standard municipal postbox, standing in snow, on its own.
        const done = Player.flags['parcel' + o.n];
        rect(px - 5, py - 4, 11, 5, '#3f4a52');
        rect(px - 6, py - 17, 13, 14, done ? '#4a5560' : '#6a4e4e');
        rect(px - 6, py - 17, 4, 14, done ? '#5c6874' : '#856262');
        rect(px - 4, py - 13, 9, 2, '#2b3238');
        rect(px - 6, py - 19, 13, 3, '#7d8791');
        break;
      }
      // A demo pod. Somebody is in it, and their face is very calm.
      case 'pod': {
        rect(px - 10, py - 24, 21, 26, '#dfe4ea');
        rect(px - 9, py - 23, 19, 24, '#f2f5f9');
        rect(px - 7, py - 20, 15, 15, '#1a2430');
        rect(px - 6, py - 19, 13, 13, '#22415e');
        const g = 0.5 + 0.5 * Math.sin(Time.t * 1.7 + px);
        rect(px - 5, py - 17, 11, 4, `rgba(120,190,240,${0.25 + g * 0.35})`);
        rect(px - 3, py - 12, 7, 5, '#c8b090');
        rect(px + 5, py - 4, 4, 2, '#4a8ad0');
        break;
      }
      // The pod somebody finished with. Same shell, dark glass, lid up.
      case 'pod_open': {
        rect(px - 10, py - 24, 21, 26, '#dfe4ea');
        rect(px - 9, py - 23, 19, 24, '#f2f5f9');
        rect(px - 7, py - 20, 15, 15, '#1a2430');
        rect(px - 6, py - 19, 13, 13, '#2b3440');
        rect(px - 5, py - 12, 11, 4, '#3d4854');   // the shape of a head, kept
        rect(px - 12, py - 27, 25, 3, '#c9ccd4');  // the lid, standing open
        rect(px + 5, py - 4, 4, 2, '#8d99a8');
        break;
      }
      // A bench in a corridor, facing a wall. It is a save point.
      case 'bench':
        rect(px - 10, py - 9, 21, 4, '#8a7a58');
        rect(px - 10, py - 9, 21, 1, '#a89572');
        rect(px - 10, py - 14, 21, 4, '#8a7a58');
        rect(px - 10, py - 14, 21, 1, '#a89572');
        rect(px - 9, py - 5, 3, 6, '#4a4550');
        rect(px + 7, py - 5, 3, 6, '#4a4550');
        break;
      // An apartment door. The unit number is on it, and it stays shut.
      case 'apartment':
        rect(px - 8, py - 24, 17, 26, '#3f2d1e');
        rect(px - 7, py - 23, 15, 24, '#5d4630');
        rect(px - 6, py - 21, 13, 9, '#4a3524');
        rect(px - 6, py - 10, 13, 8, '#4a3524');
        rect(px + 4, py - 12, 3, 3, '#c8a860');
        rect(px - 4, py - 22, 9, 4, '#c9c4bc');
        break;
      case 'television':
        rect(px - 9, py - 16, 19, 17, '#3a3730');
        rect(px - 8, py - 15, 17, 15, '#4e4a42');
        // Facing the wall. The back of it is what you see.
        rect(px - 6, py - 13, 13, 11, '#2e2b26');
        rect(px - 4, py - 11, 9, 3, '#413d36');
        rect(px - 1, py - 20, 2, 5, '#8d939c');
        break;
      case 'foreman':
        rect(px - 9, py - 20, 19, 21, '#3f4a5a');
        rect(px - 9, py - 20, 6, 21, '#4e5b6d');
        rect(px - 6, py - 17, 13, 8, '#232a35');
        rect(px - 5, py - 16, 11, 6, '#d8a83a');
        rect(px - 3, py - 7, 7, 4, '#232a35');
        break;
      case 'desk':
        rect(px - 11, py - 12, 23, 12, '#4a3a26');
        rect(px - 11, py - 12, 23, 2, '#6b5436');
        rect(px - 9, py - 9, 8, 6, '#33261a');
        rect(px + 2, py - 9, 8, 6, '#33261a');
        rect(px - 7, py - 15, 9, 4, '#d8d2c2');   // paper, squared off
        rect(px - 7, py - 15, 9, 1, '#f0ece0');
        break;
      case 'panel': {
        // A grey box on a post. The one working light in the yard is on it.
        rect(px - 1, py - 8, 3, 10, '#5a5d64');
        rect(px - 8, py - 22, 17, 15, '#6b6e76');
        rect(px - 8, py - 22, 5, 15, '#83868e');
        rect(px - 6, py - 20, 12, 11, '#3c3f45');
        rect(px + 2, py - 18, 3, 5, '#9aa0a8');
        const on = !Player.flags.kestrelDark;
        rect(px - 4, py - 17, 2, 2, on ? '#c8e07a' : '#2a2d33');
        break;
      }
      case 'locker':
        rect(px - 9, py - 20, 19, 22, '#4e6272');
        rect(px - 9, py - 20, 6, 22, '#5f7686');
        rect(px - 1, py - 20, 1, 22, '#2f3d47');
        rect(px - 6, py - 10, 2, 2, '#c0cad2');
        rect(px + 3, py - 10, 2, 2, '#c0cad2');
        for (let i = 0; i < 3; i++) {
          rect(px - 7, py - 17 + i, 5, 1, '#33424c');
          rect(px + 2, py - 17 + i, 5, 1, '#33424c');
        }
        break;
      case 'collectible': {
        // The grass is thicker here. Nothing says so.
        const g = 0.5 + 0.5 * Math.sin(Time.t * 2);
        cx.globalAlpha = 0.5 + g * 0.3;
        rect(px - 2, py - 4, 4, 4, '#e8e2d0');
        cx.globalAlpha = 1;
        break;
      }
    }
  },
};

const ENEMY_ART = {
  'Milepost':          { spr: 'milepost',   pal: 'milepost' },
  'Ration Tin':        { spr: 'ration_tin', pal: 'ration_tin' },
  "Someone's Bicycle": { spr: 'bicycle',    pal: 'bicycle' },
  'Bad Weather':       { spr: 'weather',    pal: 'weather' },
  'Roadside Shrine':   { spr: 'shrine',     pal: 'shrine' },
  'Frostbitten Glove': { spr: 'glove',      pal: 'glove' },
  'Coil':              { spr: 'coil',       pal: 'coil' },
  'Conveyor':          { spr: 'conveyor',   pal: 'conveyor' },
  'Yard Light':        { spr: 'yard_light', pal: 'yard_light' },
  'Second Shift':      { spr: 'worker',     pal: 'worker' },
  'The Memorial':      { spr: 'memorial',   pal: 'memorial' },
  'Yard Dog':        { spr: 'dog',      pal: 'dog' },
  'Postbox':         { spr: 'postbox',  pal: 'postbox' },
  'Sunned Melon':    { spr: 'melon',    pal: 'melon' },
  'Little Cousin':   { spr: 'vlg_child',  pal: 'vlg_child' },
  'Fence Post':      { spr: 'post',     pal: 'post' },
  'Windfall':        { spr: 'melon',    pal: 'fruiting' },
  'Drowned Ladder':  { spr: 'ladder',   pal: 'ladder' },
  'Same Tree':       { spr: 'tree',     pal: 'tree' },
  'Wader':           { spr: 'wader',    pal: 'wader' },
  'Orchard Keeper':  { spr: 'tree',     pal: 'bigtree' },
  'The Fruiting Tree': { spr: 'bigtree', pal: 'fruiting' },
  'Checkpoint':        { spr: 'checkpoint', pal: 'checkpoint' },
  'Frozen Hare':       { spr: 'hare',       pal: 'hare' },
  'Surplus Crate':     { spr: 'crate',      pal: 'crate' },
  'Long Coat':         { spr: 'coat',       pal: 'coat' },
  'Commuter':          { spr: 'commuter',   pal: 'commuter' },
  'Kiosk':             { spr: 'kiosk',      pal: 'kiosk' },
  'Neon Sign':         { spr: 'neon',       pal: 'neon' },
  'Vixtry Canvasser':  { spr: 'canvasser',  pal: 'canvasser' },
  'Hall Mirror':       { spr: 'mirror',     pal: 'mirror' },
  "Tenant's Cat":      { spr: 'cat',        pal: 'cat' },
  'Unit 4C':           { spr: 'door4c',     pal: 'door4c' },
  'Mural':             { spr: 'mural',      pal: 'mural' },
  'Building Super':    { spr: 'super',      pal: 'super' },
  'Line Supervisor':   { spr: 'supervisor', pal: 'supervisor' },
  'Tenant':            { spr: 'tenant',     pal: 'tenant' },
  // Act 4. Three of the campus species are staff, so they reuse the people
  // sprites the campus is populated with - the joke is that the receptionist
  // fighting you is the receptionist.
  'Intern':               { spr: 'vix_intern',  pal: 'vix_intern' },
  'Receptionist':         { spr: 'vix_desk',    pal: 'vix_desk' },
  'Demo Pod':             { spr: 'pod_enemy',   pal: 'pod_enemy' },
  'Server Rack':          { spr: 'rack',        pal: 'rack' },
  'Retention Specialist': { spr: 'vix_manager', pal: 'vix_manager' },
  'Ceiling Tile':         { spr: 'ceiling',     pal: 'ceiling' },
  'Empty Frame':          { spr: 'frame',       pal: 'frame' },
  'Fluorescent':          { spr: 'yard_light',  pal: 'yard_light' },
  'Custodial Cart':       { spr: 'cart',        pal: 'cart' },
  'Account Manager':      { spr: 'manager',     pal: 'manager' },
  'The Custodian':        { spr: 'sphere',      pal: 'sphere' },
  // Act 5. The Root's own species are his bedroom, and the two shapes at the
  // end of it are the same shape twice - one finished, one not.
  'Dresser':                  { spr: 'dresser_e',    pal: 'dresser_e' },
  'Bedroom Door':             { spr: 'bedroom_door', pal: 'bedroom_door' },
  'The Argument':             { spr: 'argument',     pal: 'argument' },
  'Something Left Over':      { spr: 'leftover',     pal: 'leftover' },
  'The Custodian, Unfinished': { spr: 'pyramid',     pal: 'pyramid' },
  'The Custodian, Unfinished (Spire)': { spr: 'spire', pal: 'spire' },
};
