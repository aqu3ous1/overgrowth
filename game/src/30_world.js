// ---------------------------------------------------------------- world
// Tiles, rooms, wandering enemies. Encounters are visible on the overworld
// and avoidable, because in the liminal zones the quiet is the point.

const TS = 16;                       // tile size
const SOLID = new Set(['#', 'T', ' ', '=']);

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
  grass: paintGrass, wood: paintWood, water: paintWater,
  carpet: paintCarpet, dirt: paintDirt, ceiling: paintCeiling,
};
const WALLS = { brick: paintBrick, wood: paintWood, void: paintVoid, ceiling: paintCeiling };

// --- rooms -------------------------------------------------------------
// Maps: '.' floor, '#' wall, '~' water, 'T' tree, ' ' void, '=' furniture.
const ROOMS = {

  bedroom: {
    floor: 'carpet', wall: 'wood', light: 0.95, lightAt: [null], music: 'bedroom',
    grain: 0.03,
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
      { x: 2, y: 1, t: 'bed',    label: 'bed' },
      { x: 10, y: 1, t: 'dresser', label: 'dresser' },
      { x: 6, y: 0, t: 'window', label: 'window' },
      { x: 9, y: 0, t: 'poster', label: 'poster' },
      { x: 1, y: 4, t: 'switch', label: 'light switch' },
      { x: 6, y: 7, t: 'door',   label: 'door' },
    ],
    start: [6, 4],
  },

  void: {
    floor: 'dirt', wall: 'void', light: 1.25, music: 'void', grain: 0.05, dark: true,
    map: [
      '                        ',
      '                        ',
      '   ....................  ',
      '   ....................  ',
      '   ....................  ',
      '   ....................  ',
      '   ....................  ',
      '   ....................  ',
      '                        ',
    ],
    exits: [{ x: 22, y: 5, to: 'gallery_ext', at: [3, 7] }],
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
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '######...######',
      '     #...#     ',
      '     #...#     ',
    ],
    exits: [
      { x: 7, y: 1, to: 'gallery_room', at: [9, 6] },
      { x: 7, y: 9, to: 'gallery_ext', at: [6, 6] },
    ],
    start: [7, 8],
  },

  gallery_room: {
    floor: 'grass', wall: 'brick', light: 0.5, music: 'gallery', grain: 0.06,
    map: [
      '###################',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#########...#######',
    ],
    objects: [
      { x: 2, y: 0, t: 'painting', shape: 'obelisk' },
      { x: 5, y: 0, t: 'painting', shape: 'sphere' },
      { x: 9, y: 0, t: 'painting', shape: 'pyramid' },
      { x: 13, y: 0, t: 'painting', shape: 'cube' },
      { x: 16, y: 0, t: 'painting', shape: 'spire', small: true },
    ],
    exits: [
      { x: 9, y: 7, to: 'gallery_hall', at: [7, 2] },
      { x: 1, y: 3, to: 'gallery_corridor', at: [1, 2] },
    ],
    start: [9, 6],
  },

  gallery_corridor: {
    floor: 'grass', wall: 'brick', light: 0.75, music: 'gallery', grain: 0.07,
    map: [
      '########################################',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '########################################',
    ],
    exits: [{ x: 38, y: 2, to: 'fall', at: [1, 1], sfx: 'door' }],
    start: [2, 2],
  },

  arrival: {
    floor: 'grass', wall: 'brick', light: 0.15, music: 'okobo', grain: 0.03, bright: true,
    map: [
      '####################',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#................D.#',
      '####################',
    ],
    exits: [{ x: 17, y: 6, to: 'okobo', at: [2, 12] }],
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
      '#......................#',
      '#......................#',
      '#..............######..#',
      '#..............######..#',
      '#..............##D####.#',
      '#......................#',
      '#......................#',
      '#......................#',
      '########################',
    ],
    objects: [
      { x: 8, y: 6, t: 'well',     label: 'well' },
      { x: 18, y: 3, t: 'memorial', label: 'memorial' },
    ],
    npcs: [
      { x: 5, y: 8,  pal: 'villager',  key: 'okobo_woman' },
      { x: 12, y: 5, pal: 'villager2', key: 'okobo_man' },
      { x: 16, y: 10, pal: 'villager3', key: 'okobo_child' },
      { x: 20, y: 7, pal: 'villager',  key: 'okobo_elder' },
    ],
    exits: [
      { x: 5, y: 4,  to: 'shop', at: [4, 4], sfx: 'door' },
      { x: 16, y: 4, to: 'inn',  at: [4, 4], sfx: 'door' },
      { x: 17, y: 9, to: 'house', at: [4, 4], sfx: 'door' },
      { x: 1, y: 6, to: 'arrival', at: [16, 5] },
      { x: 22, y: 12, to: 'north_road', at: [2, 6] },
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
    npcs: [{ x: 4, y: 1, pal: 'villager2', key: 'shopkeeper', shop: true }],
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
    npcs: [{ x: 6, y: 2, pal: 'villager', key: 'innkeeper' }],
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
    npcs: [{ x: 3, y: 2, pal: 'villager3', key: 'hess' }],
    exits: [{ x: 4, y: 5, to: 'okobo', at: [17, 10] }],
    start: [4, 4],
  },

  north_road: {
    floor: 'dirt', wall: 'brick', light: 0.2, music: 'okobo', grain: 0.04, bright: true,
    map: [
      '####################',
      '#TTTT..........TTTT#',
      '#TT..............TT#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#TT..............TT#',
      '#TTTT..........TTTT#',
      '####################',
    ],
    spawn: [{ name: 'Little Cousin', n: 1 }, { name: 'Postbox', n: 1 }, { name: 'Fence Post', n: 1 }],
    objects: [{ x: 9, y: 7, t: 'foundation', label: 'foundation' }],
    exits: [
      { x: 2, y: 6, to: 'okobo', at: [21, 12] },
      { x: 17, y: 3, to: 'orchard1', at: [2, 5] },
    ],
    start: [3, 5],
  },

  orchard1: {
    floor: 'water', wall: 'brick', light: 0.55, music: 'orchard', grain: 0.05,
    map: [
      '####################',
      '#~~T~~~~T~~~~T~~~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~T~~~T~~~~T~~~T~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~T~~~T~~~~T~~~T~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '####################',
    ],
    spawn: [{ name: 'Windfall', n: 2 }, { name: 'Drowned Ladder', n: 1 }],
    exits: [
      { x: 2, y: 5, to: 'north_road', at: [16, 3] },
      { x: 18, y: 4, to: 'orchard2', at: [2, 4] },
    ],
    start: [3, 4],
  },

  orchard2: {
    floor: 'water', wall: 'brick', light: 0.65, music: 'orchard', grain: 0.05,
    map: [
      '####################',
      '#~~~~T~~~~T~~~~T~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~T~~~~T~~~~T~~~~T~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~~T~~~~T~~~~T~~~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '####################',
    ],
    spawn: [{ name: 'Same Tree', n: 2 }, { name: 'Wader', n: 1 }],
    objects: [{ x: 15, y: 6, t: 'collectible', which: 'marble' }],
    exits: [
      { x: 2, y: 4, to: 'orchard1', at: [17, 4] },
      { x: 18, y: 2, to: 'orchard3', at: [2, 4] },
    ],
    start: [3, 4],
  },

  orchard3: {
    floor: 'water', wall: 'brick', light: 0.75, music: 'orchard', grain: 0.06,
    map: [
      '####################',
      '#~~T~~~~~~~~~~~T~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~~~~~~#',
      '#~~T~~~~~~~~~~~T~~~#',
      '####################',
    ],
    spawn: [{ name: 'Wader', n: 1 }, { name: 'Orchard Keeper', n: 1 }],
    objects: [{ x: 9, y: 3, t: 'note', note: 'tied_branch' }],
    exits: [
      { x: 2, y: 4, to: 'orchard2', at: [17, 2] },
      { x: 18, y: 3, to: 'clearing', at: [2, 4] },
    ],
    start: [3, 4],
  },

  clearing: {
    floor: 'water', wall: 'brick', light: 0.9, music: 'orchard', grain: 0.07,
    map: [
      '###############',
      '#~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~#',
      '###############',
    ],
    exits: [{ x: 1, y: 4, to: 'orchard3', at: [17, 3] }],
    start: [2, 4],
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
      this.entities.push({
        kind: 'npc', x: n.x * TS + TS / 2, y: n.y * TS + TS / 2,
        pal: n.pal, key: n.key, shop: n.shop, face: 'down', bob: Math.random() * 6,
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

    const start = at || r.start;
    Player.x = start[0] * TS + TS / 2;
    Player.y = start[1] * TS + TS / 2;
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
      const ex = x.x * TS + TS / 2, ey = x.y * TS + TS / 2;
      if (Math.abs(px - ex) < 9 && Math.abs(py - ey) < 9) return x;
    }
    return null;
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
        if (t === '~') { paintWater(px, py, tx, ty, dim); continue; }
        floorFn(px, py, tx, ty, dim);
        if (t === 'T') {
          const nm = r.floor === 'water' ? 'bigtree' : 'tree';
          sprite(nm, px + (TS - spriteWidth(nm)) / 2, py - spriteHeight(nm) + TS + 2,
                 r.floor === 'water' ? 'tree' : 'bigtree');
        }
        if (t === '=') rect(px + 1, py + 3, TS - 2, TS - 6, shade('#4a3a2a', dim));
        if (t === 'D') { rect(px + 3, py + 1, TS - 6, TS - 2, '#8a8a92'); rect(px + TS - 6, py + 8, 1, 2, '#3a3a40'); }
      }
    }

    // Exits get a visible doorway so the player can read the room.
    for (const x of r.exits || []) {
      if (x.hidden) continue;
      const px = x.x * TS - this.camX, py = x.y * TS - this.camY;
      if (this.tile(x.x, x.y) === 'D') continue;
      rect(px + 4, py + 4, TS - 8, TS - 8, 'rgba(255,255,255,0.05)');
      const pulse = 0.12 + 0.06 * Math.sin(Time.t * 2.2);
      rect(px + 6, py + 6, TS - 12, TS - 12, `rgba(255,255,255,${pulse})`);
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
      const w = spriteWidth('villager'), h = spriteHeight('villager');
      const bob = Math.sin(e.bob * 1.6) > 0.94 ? 1 : 0;
      rect(px - 4, py + 1, 9, 2, 'rgba(0,0,0,0.28)');
      sprite('villager', px - w / 2, py - h + 3 - bob, e.pal);
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
      case 'door':
        rect(px - 7, py - 14, 15, 18, '#3a2a1e');
        rect(px - 6, py - 13, 13, 16, '#5a4230');
        rect(px + 3, py - 5, 2, 2, '#c8b46a');
        if (Player.flags.hallLight !== false) rect(px - 6, py + 2, 13, 2, 'rgba(240,225,180,0.5)');
        break;
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
  'Yard Dog':        { spr: 'dog',      pal: 'dog' },
  'Postbox':         { spr: 'postbox',  pal: 'postbox' },
  'Sunned Melon':    { spr: 'melon',    pal: 'melon' },
  'Little Cousin':   { spr: 'villager', pal: 'villager3' },
  'Fence Post':      { spr: 'post',     pal: 'post' },
  'Windfall':        { spr: 'melon',    pal: 'fruiting' },
  'Drowned Ladder':  { spr: 'ladder',   pal: 'ladder' },
  'Same Tree':       { spr: 'tree',     pal: 'tree' },
  'Wader':           { spr: 'wader',    pal: 'wader' },
  'Orchard Keeper':  { spr: 'tree',     pal: 'bigtree' },
  'The Fruiting Tree': { spr: 'bigtree', pal: 'fruiting' },
};
