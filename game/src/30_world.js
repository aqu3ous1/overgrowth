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
  concrete: paintConcrete, pavement: paintPavement,
};
const WALLS = {
  brick: paintBrick, wood: paintWood, void: paintVoid, ceiling: paintCeiling,
  concrete: paintConcrete, stone: paintStone,
};

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
    objects: [
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
    floor: 'wood', wall: 'wood', light: 0.3, music: 'okobo', grain: 0.03,
    map: [
      '#########',
      '#.......#',
      '#.=====.#',
      '#.......#',
      '#.......#',
      '#...D...#',
      '#########',
    ],
    npcs: [{ art: 'vlg_shop', x: 4, y: 1, key: 'shopkeeper', shop: true }],
    exits: [{ x: 4, y: 5, to: 'okobo', at: [5, 5] }],
    start: [4, 4],
  },

  inn: {
    floor: 'wood', wall: 'wood', light: 0.3, music: 'okobo', grain: 0.03,
    map: [
      '#########',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#...D...#',
      '#########',
    ],
    objects: [{ x: 2, y: 1, t: 'bed', label: 'bed', save: true }],
    npcs: [{ art: 'vlg_inn', x: 6, y: 2, key: 'innkeeper' }],
    exits: [{ x: 4, y: 5, to: 'okobo', at: [16, 5] }],
    start: [4, 4],
  },

  house: {
    floor: 'wood', wall: 'wood', light: 0.35, music: 'okobo', grain: 0.03,
    map: [
      '#########',
      '#.......#',
      '#.=...=.#',
      '#.......#',
      '#.......#',
      '#...D...#',
      '#########',
    ],
    objects: [{ x: 6, y: 1, t: 'note', note: 'ration_card' }],
    npcs: [{ art: 'vlg_hess', x: 3, y: 2, key: 'hess' }],
    exits: [{ x: 4, y: 5, to: 'okobo', at: [17, 10] }],
    start: [4, 4],
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
      { x: 23, y: 4, w: 1, h: 2, to: 'ondo', at: [2, 8] },
    ],
    start: [2, 5],
  },

  ondo: {
    floor: 'pavement', wall: 'stone', light: 0.16, music: 'ondo', grain: 0.035, bright: true,
    map: [
      '##############################',
      '#............................#',
      '#..#######..######..#######..#',
      '#..#######..######..#######..#',
      '#..###D###..###D##..###D###..#',
      '#............................#',
      '#............................#',
      'P............................#',
      'P............................#',
      '#............................#',
      '#....######............###...#',
      '#....######............###...#',
      '#....###D#............###D...#',
      '#............................#',
      '#............................#',
      '#..........................PP#',
      '##############################',
    ],
    objects: [
      { x: 15, y: 7, t: 'fountain', label: 'fountain' },
      { x: 22, y: 6, t: 'billboard', label: 'billboard' },
    ],
    npcs: [
      { art: 'ond_clerk', x: 8, y: 6, key: 'ondo_clerk' },
      { art: 'ond_baker', x: 20, y: 9, key: 'ondo_baker' },
      { art: 'ond_bench', x: 12, y: 13, key: 'ondo_bench' },
      { art: 'ond_courier', x: 25, y: 6, key: 'ondo_courier' },
    ],
    exits: [
      { x: 6, y: 4, to: 'ondo_shop', at: [4, 4], sfx: 'door' },
      { x: 15, y: 4, to: 'ondo_inn', at: [4, 4], sfx: 'door' },
      { x: 23, y: 4, to: 'boarding_house', at: [4, 6], sfx: 'door' },
      { x: 8, y: 12, to: 'records_room', at: [4, 7], sfx: 'door' },
      { x: 25, y: 12, to: 'ondo_grocer', at: [4, 4], sfx: 'door' },
      { x: 0, y: 7, w: 1, h: 2, to: 'road_ondo', at: [21, 5] },
      { x: 27, y: 15, w: 2, h: 1, to: 'winter_road', at: [2, 5] },
    ],
    start: [4, 8],
  },

  ondo_shop: {
    floor: 'wood', wall: 'wood', light: 0.3, music: 'ondo', grain: 0.03,
    map: [
      '#########',
      '#.......#',
      '#.=====.#',
      '#.......#',
      '#.......#',
      '#...D...#',
      '#########',
    ],
    npcs: [{ art: 'ond_shop', x: 4, y: 1, key: 'ondo_shopkeeper', shop: 'ondo' }],
    exits: [{ x: 4, y: 5, to: 'ondo', at: [6, 5] }],
    start: [4, 4],
  },

  // The other end of the baker's grievance. Sells food; the feud is free.
  ondo_grocer: {
    floor: 'wood', wall: 'stone', light: 0.4, music: 'ondo', grain: 0.04,
    map: [
      '#########',
      '#.......#',
      '#.==.==.#',
      '#.......#',
      '#.......#',
      '#...D...#',
      '#########',
    ],
    npcs: [{ art: 'ond_grocer', x: 4, y: 2, key: 'ondo_grocer', shop: 'grocer' }],
    exits: [{ x: 4, y: 5, w: 1, h: 1, to: 'ondo', at: [25, 13], sfx: 'door' }],
    start: [4, 4],
  },

  ondo_inn: {
    floor: 'wood', wall: 'wood', light: 0.3, music: 'ondo', grain: 0.03,
    map: [
      '#########',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#...D...#',
      '#########',
    ],
    objects: [{ x: 2, y: 1, t: 'bed', label: 'bed', save: true }],
    npcs: [{ art: 'ond_inn', x: 6, y: 2, key: 'ondo_innkeeper' }],
    exits: [{ x: 4, y: 5, to: 'ondo', at: [15, 5] }],
    start: [4, 4],
  },

  boarding_house: {
    floor: 'wood', wall: 'wood', light: 0.42, music: 'ondo', grain: 0.04,
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
    exits: [{ x: 5, y: 6, to: 'ondo', at: [23, 5] }],
    start: [5, 5],
  },

  records_room: {
    floor: 'wood', wall: 'stone', light: 0.5, music: 'ondo', grain: 0.045,
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
    objects: [
      { x: 10, y: 5, t: 'collectible', which: 'poster_corner' },
      { x: 2, y: 3, t: 'note', note: 'work_order' },
    ],
    npcs: [{ art: 'records', x: 9, y: 1, key: 'records_clerk' }],
    exits: [{ x: 5, y: 7, to: 'ondo', at: [8, 13] }],
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
      { x: 0, y: 4, w: 1, h: 2, to: 'ondo', at: [26, 14] },
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
      'P.........PPP........#',
      'P.........PPP........#',
      '#....................#',
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
    floor: 'wood', wall: 'concrete', light: 0.6, music: 'kestrel', grain: 0.05,
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
        if (t === '#') { wallFn(px, py, tx, ty, dim); continue; }
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
};
