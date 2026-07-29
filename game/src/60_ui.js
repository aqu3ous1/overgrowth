// ---------------------------------------------------------------- UI
// Title, name entry, pause menu, shop, save. Menu text is monospace-cold and
// never uses contractions; NPC text does, constantly.

const SAVE_KEY = 'overgrowth.save.v1';

const Save = {
  write() {
    const d = {
      name: Player.name, level: Player.level, exp: Player.exp,
      hp: Player.hp, pp: Player.pp, sp: Player.sp, money: Player.money,
      bag: Player.bag, flags: Player.flags, notes: Player.notes, seen: Player.seen,
      collectibles: Player.collectibles, room: World.id,
      equip: Player.equip, owned: Player.owned,
      passives: Player.passives, owed: Player.owed,
      x: Math.round(Player.x), y: Math.round(Player.y), stamp: Date.now(),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); return true; }
    catch (e) { return false; }
  },
  read() {
    try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; }
    catch (e) { return null; }
  },
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} },
  apply(d) {
    Object.assign(Player, {
      name: d.name, level: d.level, exp: d.exp, hp: d.hp, pp: d.pp, sp: d.sp,
      money: d.money, bag: d.bag || {}, flags: d.flags || {}, notes: d.notes || [],
      collectibles: d.collectibles || 0, seen: d.seen || [],
      // Saves written before gear existed have none of this; fall back to what
      // a new game starts in rather than leaving the slots undefined.
      equip: Object.assign({}, DATA.equipStart, d.equip || {}),
      owned: d.owned || {}, passives: d.passives || {}, owed: d.owed || [],
    });
    // A save from before milestones existed can be past level 10 with nothing
    // chosen. Re-queue anything it is owed rather than silently skipping it.
    for (const lv of Player.milestonesUpTo(Player.level)) {
      if (!Player.passives[lv] && !Player.owed.includes(lv)) Player.owed.push(lv);
    }
    World.load(d.room || 'okobo');
    Player.x = d.x; Player.y = d.y;
    World.centerCamera();
  },
};

// --- title -------------------------------------------------------------
const Title = {
  cursor: 0, rep: {}, t: 0, hasSave: false, opts: [],
  enter() {
    this.hasSave = !!Save.read();
    this.opts = this.hasSave ? ['CONTINUE', 'NEW GAME', 'OPTIONS'] : ['NEW GAME', 'OPTIONS'];
    this.cursor = 0; this.t = 0;
    Audio_.play('void');
  },
  update(dt) {
    this.t += dt;
    const n = this.opts.length;
    if (Input.repeat('up', this.rep)) { this.cursor = (this.cursor - 1 + n) % n; Audio_.sfx('blip'); }
    if (Input.repeat('down', this.rep)) { this.cursor = (this.cursor + 1) % n; Audio_.sfx('blip'); }
    if (Input.hit('ok')) {
      Audio_.sfx('ok');
      const pick = this.opts[this.cursor];
      if (pick === 'CONTINUE') { Save.apply(Save.read()); Game.mode = 'field'; }
      else if (pick === 'NEW GAME') { Game.mode = 'name'; NameEntry.enter(); }
      else { Options.enter('title'); Game.mode = 'options'; }
    }
  },
  draw() {
    rect(0, 0, W, H, '#05050a');
    // The building, barely resolving out of the black.
    const bx = W / 2 - 56, by = 46;
    for (let y = 0; y < 3; y++) for (let x = 0; x < 7; x++) paintBrick(bx + x * TS, by + y * TS, x, y, -64);
    rect(bx + 50, by + 22, 12, 26, '#2e2e34');
    rect(bx + 51, by + 23, 10, 24, '#53535a');
    // Grass runs off the bottom of frame and dies into black, rather than
    // sitting on screen as a slab with edges.
    const gy = by + 48;
    for (let y = 0; y * TS + gy < H; y++)
      for (let x = -4; x < W / TS + 4; x++) paintGrass(x * TS, gy + y * TS, x, y, -78);
    const fade = cx.createLinearGradient(0, gy - 4, 0, H);
    fade.addColorStop(0, 'rgba(0,0,0,0.15)');
    fade.addColorStop(0.45, 'rgba(0,0,0,0.72)');
    fade.addColorStop(1, 'rgba(0,0,0,0.97)');
    cx.fillStyle = fade; cx.fillRect(0, gy - 4, W, H - gy + 4);
    vignette(1.25, W / 2, by + 26, 100);

    const flick = Math.sin(this.t * 1.3) * 0.5 + 0.5;
    textCentered('OVERGROWTH', W / 2, 26, `rgba(240,240,236,${0.72 + flick * 0.28})`, 3);

    const top = H - 14 - this.opts.length * 12;
    for (let i = 0; i < this.opts.length; i++) {
      const y = top + i * 12;
      textCentered(this.opts[i], W / 2, y, this.cursor === i ? '#f0ece2' : '#70707c');
      if (this.cursor === i && Math.sin(this.t * 5) > 0)
        text('>', W / 2 - textWidth(this.opts[i]) / 2 - 10, y, '#e8d24a');
    }
    grain(0.05);
  },
};

// --- options -----------------------------------------------------------
const OPT_KEY = 'overgrowth.options.v1';
const Options = {
  cursor: 0, rep: {}, from: 'title',
  values: { controls: 0, controlsAsked: 0, textSpeed: 1, volume: 2, flashing: 1, grain: 1 },
  rows: [
    { key: 'controls',  label: 'CONTROLS',   opts: ['AUTO', 'KEYBOARD', 'TOUCH'] },
    { key: 'textSpeed', label: 'TEXT SPEED', opts: ['SLOW', 'NORMAL', 'FAST'] },
    { key: 'volume',    label: 'VOLUME',     opts: ['OFF', 'LOW', 'NORMAL', 'LOUD'] },
    { key: 'flashing',  label: 'FLASHING',   opts: ['REDUCED', 'NORMAL'] },
    { key: 'grain',     label: 'FILM GRAIN', opts: ['OFF', 'ON'] },
  ],

  load() {
    try {
      const v = JSON.parse(localStorage.getItem(OPT_KEY) || 'null');
      if (v) Object.assign(this.values, v);
    } catch (e) {}
    this.apply();
  },
  save() { try { localStorage.setItem(OPT_KEY, JSON.stringify(this.values)); } catch (e) {} },
  apply() {
    if (Audio_.master) Audio_.master.gain.value = [0, 0.16, 0.34, 0.55][this.values.volume];
    // AUTO means "show the pad on anything with a touchscreen". The explicit
    // settings exist because AUTO gets it wrong on hybrids either way: a laptop
    // with a touch display does not want a thumb pad over the art, and a tablet
    // with a keyboard case might.
    const c = this.values.controls;
    TouchPad.on = c === 2 || (c === 0 && TouchPad.supported);
    if (!TouchPad.on) { TouchPad.release(); TouchPad.ids = {}; }
  },

  enter(from) { this.from = from || 'title'; this.cursor = 0; },
  update(dt) {
    const n = this.rows.length + 1;                    // rows plus BACK
    if (Input.repeat('up', this.rep)) { this.cursor = (this.cursor - 1 + n) % n; Audio_.sfx('blip'); }
    if (Input.repeat('down', this.rep)) { this.cursor = (this.cursor + 1) % n; Audio_.sfx('blip'); }
    const leave = () => {
      this.save();
      Audio_.sfx('cancel');
      if (this.from === 'title') { Game.mode = 'title'; Title.enter(); }
      // Back to where they were, not to the field - they opened this from the
      // pause menu and expect to land there again.
      else if (this.from === 'menu') { Menu.open = true; Game.mode = 'menu'; }
      else { Game.mode = 'field'; }
    };
    if (Input.hit('no')) { leave(); return; }
    if (this.cursor === this.rows.length) {
      if (Input.hit('ok')) leave();
      return;
    }
    const row = this.rows[this.cursor];
    const step = (d) => {
      const len = row.opts.length;
      this.values[row.key] = (this.values[row.key] + d + len) % len;
      this.apply(); this.save(); Audio_.sfx('blip');
    };
    if (Input.repeat('left', this.rep)) step(-1);
    if (Input.repeat('right', this.rep) || Input.hit('ok')) step(1);
  },
  draw() {
    rect(0, 0, W, H, '#08080c');
    textCentered('OPTIONS', W / 2, 18, '#f0ece2', 2);
    rect(60, 30, W - 120, 1, '#2c2c36');
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i], y = 40 + i * 15, sel = this.cursor === i;
      text(r.label, 58, y, sel ? '#f0ece2' : '#8a8a94');
      const v = r.opts[this.values[r.key]];
      text('< ' + v + ' >', W - 58 - textWidth('< ' + v + ' >'), y, sel ? '#e8d24a' : '#70707c');
      if (sel) text('>', 46, y, '#e8d24a');
    }
    const by = 40 + this.rows.length * 15 + 8;
    const selBack = this.cursor === this.rows.length;
    textCentered('BACK', W / 2, by, selBack ? '#f0ece2' : '#70707c');
    if (selBack) text('>', W / 2 - textWidth('BACK') / 2 - 10, by, '#e8d24a');
    textCentered('LEFT / RIGHT CHANGE    X BACK', W / 2, H - 14, '#4a4a56');
    grain(0.04);
  },
};

// --- controls picker ---------------------------------------------------
// The first thing the game shows, once. It has to be answerable by whatever
// the player actually has, which is the whole reason it exists: a phone player
// who is never offered the pad has no way to press anything, and a desktop
// player who gets it anyway has a thumb pad sitting on their art.
const ControlPick = {
  cursor: 0, rep: {}, t: 0,
  cards: [
    { key: 'touch', value: 2, title: 'ON-SCREEN', sub: 'PAD AND BUTTONS' },
    { key: 'keys',  value: 1, title: 'KEYBOARD',  sub: 'ARROWS  Z  X  C' },
  ],
  boxes() {
    const w = 116, h = 76, y = 62, gap = 12;
    const x0 = (W - (w * 2 + gap)) / 2;
    return this.cards.map((c, i) => ({ c, x: x0 + i * (w + gap), y, w, h }));
  },

  enter() { this.cursor = TouchPad.supported ? 0 : 1; this.t = 0; TouchPad.takeTap(); },

  choose(card) {
    Options.values.controls = card.value;
    Options.values.controlsAsked = 1;
    Options.apply(); Options.save();
    Audio_.sfx('ok');
    Game.mode = 'title'; Title.enter();
  },

  update(dt) {
    this.t += dt;
    const n = this.cards.length;
    if (Input.repeat('left', this.rep)) { this.cursor = (this.cursor + n - 1) % n; Audio_.sfx('blip'); }
    if (Input.repeat('right', this.rep)) { this.cursor = (this.cursor + 1) % n; Audio_.sfx('blip'); }
    const tap = TouchPad.takeTap();
    if (tap) {
      for (const b of this.boxes()) {
        if (tap[0] >= b.x && tap[0] <= b.x + b.w && tap[1] >= b.y && tap[1] <= b.y + b.h) {
          this.choose(b.c); return;
        }
      }
    }
    if (Input.hit('ok')) this.choose(this.cards[this.cursor]);
  },

  draw() {
    rect(0, 0, W, H, '#08080c');
    textCentered('OVERGROWTH', W / 2, 18, '#e8e4da', 2);
    textCentered('HOW ARE YOU PLAYING?', W / 2, 42, '#9a9aa4');

    for (let i = 0; i < 2; i++) {
      const b = this.boxes()[i], sel = i === this.cursor;
      rect(b.x, b.y, b.w, b.h, sel ? '#141922' : '#0d0f15');
      const edge = sel ? '#e8d24a' : '#3a3a44';
      rect(b.x, b.y, b.w, 1, edge); rect(b.x, b.y + b.h - 1, b.w, 1, edge);
      rect(b.x, b.y, 1, b.h, edge); rect(b.x + b.w - 1, b.y, 1, b.h, edge);
      const cxp = b.x + b.w / 2, art = b.y + 26;
      if (b.c.key === 'touch') {
        // The pad and buttons, drawn small, so the choice shows itself.
        cx.globalAlpha = sel ? 1 : 0.45;
        ring(cxp - 26, art, 14, '#9aa1b2');
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const w = dy ? 8 : 4, h = dy ? 4 : 8;
          rect(cxp - 26 + dx * 8 - w / 2, art + dy * 8 - h / 2, w, h, '#e6e8ee');
        }
        ring(cxp + 22, art + 7, 9, '#c8ccd8'); text('Z', cxp + 20, art + 4, '#f0f2f6');
        ring(cxp + 22, art - 12, 7, '#c8ccd8'); text('X', cxp + 20, art - 15, '#f0f2f6');
        cx.globalAlpha = 1;
      } else {
        cx.globalAlpha = sel ? 1 : 0.45;
        // Keycaps. The arrows are drawn, not typed: the 5x7 font has letters,
        // digits and punctuation, and no arrow glyphs at all.
        const cap = (kx, ky) => {
          rect(kx, ky, 11, 11, '#1c1c24');
          rect(kx, ky + 10, 11, 1, '#3a3a44');
        };
        const arrow = (kx, ky, dx, dy) => {
          for (let i = 0; i < 3; i++) {
            const w = 5 - i * 2;
            if (dy) rect(kx + 5 - w / 2 - 0.5, ky + (dy > 0 ? 3 + i : 7 - i), w, 1, '#d8d4c8');
            else rect(kx + (dx > 0 ? 3 + i : 7 - i), ky + 5 - w / 2 - 0.5, 1, w, '#d8d4c8');
          }
        };
        const ax = cxp - 46, ay = art - 12;
        cap(ax + 13, ay);      arrow(ax + 13, ay, 0, -1);        // up
        cap(ax, ay + 13);      arrow(ax, ay + 13, -1, 0);        // left
        cap(ax + 13, ay + 13); arrow(ax + 13, ay + 13, 0, 1);    // down
        cap(ax + 26, ay + 13); arrow(ax + 26, ay + 13, 1, 0);    // right
        const letters = ['Z', 'X', 'C'];
        for (let li = 0; li < 3; li++) {
          const kx = cxp + 6 + li * 14, ky = art + 1;
          cap(kx, ky);
          text(letters[li], kx + 3, ky + 3, '#d8d4c8');
        }
        cx.globalAlpha = 1;
      }
      textCentered(b.c.title, cxp, b.y + b.h - 26, sel ? '#f0ece2' : '#70707c');
      textCentered(b.c.sub, cxp, b.y + b.h - 14, sel ? '#8a8a94' : '#4e4e58');
      // Corner brackets, each arm running inward from its own corner.
      if (sel && Math.sin(this.t * 5) > -0.3) {
        const L = b.x - 3, R = b.x + b.w + 1, T = b.y - 3, B = b.y + b.h + 1;
        for (const [hx, vy, vx, hy] of [[L, T, L, T], [R - 8, T, R - 2, T],
                                        [L, B - 8, L, B - 2], [R - 8, B - 8, R - 2, B - 2]]) {
          rect(hx, hy, 8, 2, '#e8d24a');
          rect(vx, vy, 2, 8, '#e8d24a');
        }
      }
    }

    textCentered(TouchPad.supported ? 'TAP ONE, OR USE THE ARROW KEYS.'
                                    : 'CLICK ONE, OR USE THE ARROW KEYS.',
                 W / 2, H - 26, '#5a5a66');
    textCentered('YOU CAN CHANGE THIS LATER IN OPTIONS.', W / 2, H - 14, '#3f3f4a');
    grain(0.04);
  },
};

// --- name entry --------------------------------------------------------
const NameEntry = {
  rows: ['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ.-  '],
  cx: 0, cy: 0, value: '', rep: {}, shake: 0,
  enter() { this.value = ''; this.cx = 0; this.cy = 0; this.shake = 0; },
  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 3);
    if (Input.repeat('left', this.rep)) { this.cx = (this.cx + 9) % 10; Audio_.sfx('blip'); }
    if (Input.repeat('right', this.rep)) { this.cx = (this.cx + 1) % 10; Audio_.sfx('blip'); }
    if (Input.repeat('up', this.rep)) { this.cy = (this.cy + 2) % 3; Audio_.sfx('blip'); }
    if (Input.repeat('down', this.rep)) { this.cy = (this.cy + 1) % 3; Audio_.sfx('blip'); }
    if (Input.hit('no')) {
      this.value = this.value.slice(0, -1); Audio_.sfx('cancel');
    }
    if (Input.hit('ok')) {
      const ch = this.rows[this.cy][this.cx];
      if (ch !== ' ' && this.value.length < 8) { this.value += ch; Audio_.sfx('ok'); }
      else Audio_.sfx('cancel');
    }
    if (Input.hit('menu')) {
      // Confirm. An empty field is refused, and the refusal does not explain itself.
      if (!this.value.trim()) { this.shake = 1; Audio_.sfx('wrong'); return; }
      Player.name = this.value.trim();
      Audio_.sfx('ok');
      Game.startNewGame();
    }
  },
  draw() {
    rect(0, 0, W, H, '#08080c');
    textCentered('WHAT IS YOUR NAME?', W / 2, 22, '#cfe0e8');
    const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 5) : 0;
    const shown = this.value || '';
    rect(W / 2 - 46 + sx, 38, 92, 15, '#101018');
    rect(W / 2 - 46 + sx, 38, 92, 1, '#8fa8b4'); rect(W / 2 - 46 + sx, 52, 92, 1, '#8fa8b4');
    textCentered(shown + (Math.sin(Time.t * 5) > 0 ? '_' : ' '), W / 2 + sx, 42, '#f0ece2');
    if (this.shake > 0) textCentered('IT NEEDS A NAME.', W / 2, 58, '#c05a5a');

    const gx = W / 2 - 68, gy = 76;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 10; c++) {
        const ch = this.rows[r][c];
        const x = gx + c * 14, y = gy + r * 14;
        const sel = (r === this.cy && c === this.cx);
        if (sel) rect(x - 3, y - 3, 13, 13, '#2a3a48');
        text(ch, x, y, sel ? '#f0ece2' : '#9a9aa4');
      }
    }
    textCentered('Z ADD    X DELETE    C CONFIRM', W / 2, H - 20, '#5a5a66');
    grain(0.04);
  },
};

// The route, in the order it is walked, and where each leg sits on the map of
// Limpo. `at` is in map space (288x112); `kind` picks the marker. The first two
// legs have no `at` on purpose — the bedroom and the Gallery are not places in
// this world, and the map does not pretend otherwise.
const ROUTE = [
  { label: 'HOME',            rooms: ['bedroom'] },
  { label: 'THE GALLERY',     rooms: ['void', 'gallery_ext', 'gallery_hall', 'gallery_room',
                                      'gallery_corridor'] },
  { warpTo: 'okobo', label: 'OKOBO',           rooms: ['arrival', 'okobo', 'shop', 'inn', 'house'],
    at: [56, 82], kind: 'town', short: 'OKOBO' },
  { label: 'THE NORTH ROAD',  rooms: ['north_road'], at: [74, 70], kind: 'road' },
  { warpTo: 'orchard1', label: 'SUNKEN ORCHARD',  rooms: ['orchard1', 'orchard2', 'orchard3', 'clearing'],
    at: [100, 60], kind: 'orchard', short: 'ORCHARD' },
  { label: 'THE ROAD TO ONDO', rooms: ['road_ondo'], at: [124, 50], kind: 'road' },
  { warpTo: 'ondo', label: 'ONDO',            rooms: ['ondo', 'ondo_shop', 'ondo_inn', 'ondo_grocer',
                                      'boarding_house', 'records_room'],
    at: [148, 40], kind: 'city', short: 'ONDO' },
  { label: 'THE WINTER ROAD', rooms: ['winter_road'], at: [162, 24], kind: 'road' },
  { warpTo: 'kestrel_yard', label: 'KESTREL WORKS',   rooms: ['kestrel_yard', 'kestrel_f1', 'kestrel_f2', 'kestrel_f3',
                                      'kestrel_boiler', 'kestrel_office', 'kestrel_locker'],
    at: [190, 13], kind: 'works', short: 'KESTREL' },
  // Yettallia: across the water, on the landmass he could only see before.
  { label: 'THE BORDER',      rooms: ['border'], at: [222, 26], kind: 'road' },
  { warpTo: 'sable', label: 'SABLE CITY',      rooms: ['sable', 'sable_road', 'sable_shop', 'sable_inn',
                                      'sable_transit', 'sable_flat', 'sable_arcade', 'sable_works',
                                      'sable_market', 'sable_overpass', 'sable_under',
                                      'sable_floor'],
    at: [252, 44], kind: 'city', short: 'SABLE' },
  { warpTo: 'bellhouse_ext', label: 'BELLHOUSE COMMONS', rooms: ['bellhouse_ext', 'bellhouse_1', 'bellhouse_2',
                                        'bellhouse_3', 'bellhouse_7b', 'bellhouse_top',
                                        'bellhouse_4c', 'bellhouse_mural', 'bellhouse_laundry'],
    at: [268, 74], kind: 'works', short: 'BELLHOUSE' },
];
function routeIndexOf(roomId) {
  return ROUTE.findIndex(a => a.rooms.includes(roomId));
}

// --- the map of Limpo --------------------------------------------------
// Painted once into an offscreen canvas and blitted, because the terrain is
// thousands of little rects and redrawing it every frame to show a static
// picture would be silly.
const MAP_W = 288, MAP_H = 112;
const MAP_SNOW = 30;                 // everything north of this line is winter

const WorldMap = {
  cv: null, cx: null, built: 0,

  // Limpo is a lumpy peninsula. Ellipses rather than a traced outline: this has
  // to read as a coastline at 288 pixels, not survive being zoomed in on.
  land(x, y) {
    const blob = (cx_, cy_, rx, ry) => {
      const dx = (x - cx_) / rx, dy = (y - cy_) / ry;
      return dx * dx + dy * dy <= 1;
    };
    return blob(96, 74, 86, 40) || blob(150, 46, 78, 34) ||
           blob(196, 20, 62, 22) || blob(64, 52, 44, 26) || blob(120, 30, 46, 22) ||
           // Yettallia, joined to Limpo by the border road and nothing else.
           blob(262, 58, 46, 44) || blob(232, 32, 26, 16);
  },

  build() {
    if (!this.cv) {
      this.cv = document.createElement('canvas');
      this.cv.width = MAP_W; this.cv.height = MAP_H;
      this.cx = this.cv.getContext('2d');
    }
    const c = this.cx;
    c.clearRect(0, 0, MAP_W, MAP_H);
    c.fillStyle = '#13202b'; c.fillRect(0, 0, MAP_W, MAP_H);      // the sea

    // Terrain, two pixels at a time. Snow in the north, marsh where the orchard
    // drowned, and a coastal band so the edge is not a hard cut.
    for (let y = 0; y < MAP_H; y += 2) {
      for (let x = 0; x < MAP_W; x += 2) {
        if (!this.land(x, y)) continue;
        const n = hash2(x * 3 + 1, y * 7 + 2);
        const edge = !this.land(x + 4, y) || !this.land(x - 4, y)
                  || !this.land(x, y + 4) || !this.land(x, y - 4);
        const marsh = Math.hypot(x - 100, (y - 62) * 1.7) < 22;
        // The snowline wanders. A straight one reads as a stripe of paint
        // rather than as the point where the country stops thawing.
        const snowAt = MAP_SNOW + Math.sin(x * 0.055) * 7 + Math.sin(x * 0.017) * 6
                     + (n > 0.7 ? 2 : 0);
        let col;
        if (edge) col = n > 0.5 ? '#5f5a44' : '#6d6650';           // sand
        else if (y < snowAt) col = n > 0.55 ? '#c2ccd6' : '#a8b3bf';
        else if (y < snowAt + 11) col = n > 0.5 ? '#6f7a68' : '#5e6a5a';  // thaw
        else if (marsh) col = n > 0.5 ? '#3c6274' : '#33566a';
        else col = n > 0.62 ? '#4c7d3e' : (n > 0.28 ? '#3f6a34' : '#375c2d');
        c.fillStyle = col; c.fillRect(x, y, 2, 2);
      }
    }

    // The road, drawn as the walk itself: leg to leg, in order.
    const pts = ROUTE.filter(a => a.at).map(a => a.at);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= steps; s++) {
        if (s % 4 === 3) continue;                                 // dashed
        const px = Math.round(x0 + (x1 - x0) * s / steps);
        const py = Math.round(y0 + (y1 - y0) * s / steps);
        // A dark pixel under each dash, so the road stays legible crossing
        // both the green and the snow.
        c.fillStyle = 'rgba(24,20,12,0.55)'; c.fillRect(px, py + 1, 1, 1);
        c.fillStyle = '#b09a62'; c.fillRect(px, py, 1, 1);
      }
    }

    c.fillStyle = '#2c343e'; c.fillRect(MAP_W - 2, 0, 2, MAP_H);
    this.built = 1;
  },

  // Markers are drawn live, not baked, because which ones are visible changes.
  marker(px, py, kind) {
    switch (kind) {
      case 'town':
        rect(px - 5, py - 3, 4, 5, '#c8bda0'); rect(px - 5, py - 4, 4, 1, '#8a6a4a');
        rect(px, py - 5, 5, 7, '#d8cdb0');     rect(px, py - 6, 5, 1, '#8a6a4a');
        break;
      case 'city':
        for (let i = 0; i < 4; i++) {
          const h = 5 + (i % 2) * 4;
          rect(px - 7 + i * 4, py + 2 - h, 3, h, '#ded4c0');
          rect(px - 7 + i * 4, py + 1 - h, 3, 1, '#9a8a6a');
        }
        break;
      case 'orchard':
        for (const [ox, oy] of [[-5, 0], [0, -3], [5, 1]]) {
          rect(px + ox - 2, py + oy - 4, 5, 4, '#2f6a52');
          rect(px + ox - 1, py + oy, 2, 3, '#4a3a24');
        }
        break;
      case 'works':
        rect(px - 7, py - 4, 14, 6, '#5b5f66');
        rect(px - 7, py - 4, 14, 1, '#767b83');
        rect(px + 2, py - 11, 3, 8, '#4a4e55');
        rect(px + 2, py - 12, 3, 1, '#767b83');
        break;
      default:                                   // a road, and nothing on it
        rect(px - 1, py - 1, 3, 3, '#9a8a5a');
        rect(px, py, 1, 1, '#2a2418');
    }
  },
};

// "JUST NOW" / "14 MINUTES AGO" / "3 DAYS AGO". Coarse on purpose: the exact
// minute is never the thing the player wants to know off a save slot.
function agoText(stamp) {
  if (!stamp) return '';
  const s = Math.max(0, (Date.now() - stamp) / 1000);
  if (s < 90) return 'JUST NOW';
  const units = [[60, 'MINUTE'], [3600, 'HOUR'], [86400, 'DAY']];
  let [div, word] = units[0];
  for (const u of units) if (s >= u[0]) [div, word] = u;
  const n = Math.floor(s / div);
  return `${n} ${word}${n === 1 ? '' : 'S'} AGO`;
}

// --- pause menu --------------------------------------------------------
// --- the milestone pick ---------------------------------------------------
// Every tenth level offers two passives and takes one. It is shown out in the
// field rather than on the victory screen: the choice is worth a moment, and a
// fight is not the place to spend one. Player.owed queues them.
const Milestone = {
  cursor: 0, rep: {}, t: 0, level: 0,
  boxes() {
    const w = 128, h = 66, y = 72, gap = 10;
    const x0 = (W - (w * 2 + gap)) / 2;
    return this.choices().map((c, i) => ({ c, x: x0 + i * (w + gap), y, w, h }));
  },
  choices() { return DATA.milestones.choices[this.level] || []; },

  pending() { return Player.owed.length ? Player.owed[0] : 0; },

  enter() {
    this.level = this.pending();
    this.cursor = 0; this.t = 0;
    TouchPad.takeTap();
    Audio_.play('found');
  },

  choose(pick) {
    Player.passives[this.level] = pick.id;
    Player.owed = Player.owed.filter(lv => lv !== this.level);
    Audio_.sfx('levelup');
    // More than one can be owed at once if the player was handed several levels
    // by a boss, so this re-enters rather than assuming it is finished.
    if (this.pending()) { this.enter(); return; }
    Game.mode = 'field';
  },

  update(dt) {
    this.t += dt;
    const list = this.choices();
    if (!list.length) { Game.mode = 'field'; return; }
    const n = list.length;
    if (Input.repeat('left', this.rep)) { this.cursor = (this.cursor + n - 1) % n; Audio_.sfx('blip'); }
    if (Input.repeat('right', this.rep)) { this.cursor = (this.cursor + 1) % n; Audio_.sfx('blip'); }
    const tap = TouchPad.takeTap();
    if (tap) {
      for (const b of this.boxes()) {
        if (tap[0] >= b.x && tap[0] <= b.x + b.w && tap[1] >= b.y && tap[1] <= b.y + b.h) {
          this.choose(b.c); return;
        }
      }
    }
    if (Input.hit('ok')) this.choose(list[this.cursor]);
  },

  draw() {
    rect(0, 0, W, H, 'rgba(4,4,8,0.94)');
    textCentered(`LEVEL ${this.level}`, W / 2, 22, '#e8d24a', 2);
    textCentered('SOMETHING SETTLES. PICK ONE.', W / 2, 44, '#9a9aa4');
    textCentered(`PP AND SP NOW RETURN ${DATA.regen.PP + Player.regenBonus} A TURN.`,
                 W / 2, 56, '#6e7a8a');
    const boxes = this.boxes();
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i], sel = i === this.cursor;
      rect(b.x, b.y, b.w, b.h, sel ? '#141922' : '#0d0f15');
      const edge = sel ? '#e8d24a' : '#3a3a44';
      rect(b.x, b.y, b.w, 1, edge); rect(b.x, b.y + b.h - 1, b.w, 1, edge);
      rect(b.x, b.y, 1, b.h, edge); rect(b.x + b.w - 1, b.y, 1, b.h, edge);
      textCentered(b.c.name.toUpperCase(), b.x + b.w / 2, b.y + 10, sel ? '#f0ece2' : '#8a8a94');
      const lines = wrap(b.c.effect, b.w - 16);
      for (let j = 0; j < Math.min(4, lines.length); j++) {
        textCentered(lines[j], b.x + b.w / 2, b.y + 28 + j * 10, sel ? '#b8b8c2' : '#6e6e7a');
      }
    }
    const hint = 'LEFT / RIGHT      Z  TAKE IT';
    textCentered(hint, W / 2, H - 16, '#5a5a66');
  },
};

const TAB_STATUS = 0, TAB_BAG = 1, TAB_GEAR = 2, TAB_MOVES = 3, TAB_MAP = 4,
      TAB_NOTES = 5, TAB_SAVE = 6, TAB_OPTIONS = 7;

const Menu = {
  open: false, tab: 0, cursor: 0, rep: {},
  tabs: ['STATUS', 'BAG', 'GEAR', 'MOVES', 'MAP', 'NOTES', 'SAVE', 'OPTIONS'],
  message: '', messageT: 0, savedT: 0,
  toggle() { this.open = !this.open; this.cursor = 0; this.messageT = 0; Audio_.sfx(this.open ? 'ok' : 'cancel'); },
  update(dt) {
    this.messageT = Math.max(0, this.messageT - dt);
    if (Input.hit('menu') || Input.hit('no')) { this.toggle(); return; }
    const n = this.tabs.length;
    if (Input.repeat('left', this.rep)) { this.tab = (this.tab + n - 1) % n; this.cursor = 0; this.messageT = 0; Audio_.sfx('blip'); }
    if (Input.repeat('right', this.rep)) { this.tab = (this.tab + 1) % n; this.cursor = 0; this.messageT = 0; Audio_.sfx('blip'); }
    // Read the confirm key ONCE. Input.hit consumes, so a second call in a
    // later branch always sees false - that is how the BAG tab ended up doing
    // nothing while the NOTES branch above it silently ate the press.
    const ok = Input.hit('ok');
    if (this.tab === TAB_OPTIONS && ok) {
      this.open = false; Options.enter('menu'); Game.mode = 'options'; Audio_.sfx('ok'); return;
    }
    if (this.tab === TAB_SAVE && ok) { this.saveHere(); return; }
    if (this.tab === TAB_MAP) { this.mapInput(ok); return; }
    const list = this.list();
    if (list.length) {
      if (Input.repeat('up', this.rep)) { this.cursor = (this.cursor - 1 + list.length) % list.length; Audio_.sfx('blip'); }
      if (Input.repeat('down', this.rep)) { this.cursor = (this.cursor + 1) % list.length; Audio_.sfx('blip'); }
      if (ok && this.tab === TAB_NOTES) {
        const note = list[this.cursor];
        Audio_.sfx('ok');
        this.open = false;
        Dialogue.say(NOTES[note].pages.map(t => ({ text: t, speaker: 'system' })));
      }
      if (ok && this.tab === TAB_BAG) this.useFromBag(list[this.cursor]);
      if (ok && this.tab === TAB_GEAR) this.wearFromList(list[this.cursor]);
    }
  },

  // --- fast travel -----------------------------------------------------
  // The map is a picture until the first warp device turns up in Bellhouse
  // Commons, at which point the whole explored world opens at once (docs/06).
  // That is deliberately a single beat rather than a drip: it should read as a
  // reward, and it is the moment the game stops being a corridor.
  warpTargets() {
    if (!Player.flags.warp) return [];
    return ROUTE.map((a, i) => i)
      .filter(i => ROUTE[i].at && Player.seen.includes(i) && ROUTE[i].warpTo);
  },

  mapInput(ok) {
    const list = this.warpTargets();
    if (!list.length) return;
    if (Input.repeat('up', this.rep)) { this.cursor = (this.cursor - 1 + list.length) % list.length; Audio_.sfx('blip'); }
    if (Input.repeat('down', this.rep)) { this.cursor = (this.cursor + 1) % list.length; Audio_.sfx('blip'); }
    if (!ok) return;
    const to = ROUTE[list[this.cursor % list.length]];
    if (to.rooms.includes(World.id)) {
      this.message = 'HE IS ALREADY HERE.';
      this.messageT = 1.5;
      Audio_.sfx('wrong');
      return;
    }
    Audio_.sfx('found');
    this.open = false;
    Game.mode = 'field';
    Fade.out(() => {
      World.load(to.warpTo);
      Audio_.play(World.room.music || 'none');
    }, 1.8);
  },

  wearFromList(name) {
    const piece = DATA.equipment[name];
    if (!piece) return;
    if (Player.equip[piece.slot] === name) {
      this.message = 'Already on.';
      this.messageT = 1.4;
      Audio_.sfx('wrong');
      return;
    }
    Player.wear(name);
    Audio_.sfx('ok');
    this.message = `${name.toUpperCase()} ON.`;
    this.messageT = 1.6;
  },

  // Writing it down and resting are different things. An inn bed restores HP,
  // PP and SP as well; this only records where he got to. Making the menu save
  // heal too would mean the player never needs an inn again, and attrition is
  // the whole shape of this game's difficulty (see docs/11).
  saveHere() {
    if (Save.write()) {
      Audio_.sfx('found');
      this.message = 'SAVED.';
      this.savedT = 1.0;
    } else {
      Audio_.sfx('wrong');
      this.message = 'IT WOULD NOT WRITE.';
    }
    this.messageT = 1.8;
  },

  // Restoratives work out here too. Everything else in the bag is either a
  // stat stage, which does not survive leaving a fight, or a debuff with
  // nothing to aim at.
  useFromBag(name) {
    const it = DATA.items[name];
    if (!it) return;
    if (!it.field) {
      this.message = it.battle ? 'Only in a fight.' : 'Nothing to use it on.';
      this.messageT = 1.6;
      Audio_.sfx('wrong');
      return;
    }
    const full = (it.heal && Player.hp >= Player.maxHp)
              || (it.pp && Player.pp >= Player.maxPp)
              || (it.sp && Player.sp >= Player.maxSp);
    if (full) {
      this.message = 'He does not need it yet.';
      this.messageT = 1.6;
      Audio_.sfx('wrong');
      return;
    }
    Player.useItem(name);
    let got = 0, pool = 'HP';
    if (it.heal) {
      const before = Player.hp;
      Player.hp = Math.min(Player.maxHp, Player.hp + (it.heal === 'full' ? Player.maxHp : it.heal));
      got = Player.hp - before;
    } else if (it.pp) {
      const before = Player.pp;
      Player.pp = Math.min(Player.maxPp, Player.pp + it.pp);
      got = Player.pp - before; pool = 'PP';
    } else if (it.sp) {
      const before = Player.sp;
      Player.sp = Math.min(Player.maxSp, Player.sp + it.sp);
      got = Player.sp - before; pool = 'SP';
    }
    Audio_.sfx('heal');
    this.message = `Recovered ${got} ${pool}.`;
    this.messageT = 1.6;
    // The list just got shorter; do not leave the cursor past the end.
    const n = this.list().length;
    if (this.cursor >= n) this.cursor = Math.max(0, n - 1);
  },
  list() {
    if (this.tab === TAB_BAG) return Object.keys(Player.bag);
    if (this.tab === TAB_MOVES) return Player.moves('physical').concat(Player.moves('special'));
    if (this.tab === TAB_NOTES) return Player.notes;
    if (this.tab === TAB_GEAR) return this.gearList();
    return [];
  },

  // Weapons then body, each in the order the world hands them out, so a new
  // piece appears at the bottom of its own group instead of somewhere in the
  // middle of an alphabet.
  gearList() {
    const owned = Object.keys(Player.owned).filter(n => DATA.equipment[n]);
    for (const slot in Player.equip) {
      if (!owned.includes(Player.equip[slot])) owned.push(Player.equip[slot]);
    }
    const order = { weapon: 0, body: 1 };
    return owned.sort((a, b) => {
      const A = DATA.equipment[a], B = DATA.equipment[b];
      return (order[A.slot] - order[B.slot]) || (A.act - B.act) || (A.price - B.price);
    });
  },
  draw() {
    rect(0, 0, W, H, 'rgba(4,4,8,0.88)');
    // Laid out by measured width rather than a fixed pitch: seven labels of
    // very different lengths do not sit on a grid without gaps you can drive a
    // bus through.
    let tx = 6;
    for (let i = 0; i < this.tabs.length; i++) {
      const w = textWidth(this.tabs[i]) + 6;
      if (i === this.tab) rect(tx - 2, 8, w, 12, '#1e2630');
      text(this.tabs[i], tx + 1, 11, i === this.tab ? '#f0ece2' : '#70707c');
      tx += w + 1;
    }
    rect(8, 22, W - 16, 1, '#3a3a44');

    if (this.tab === TAB_MAP) { this.drawMap(); }
    else if (this.tab === TAB_MOVES) { this.drawMoves(); }
    else if (this.tab === TAB_SAVE) { this.drawSave(); }
    else if (this.tab === TAB_GEAR) { this.drawGear(); }
    else if (this.tab === 0) {
      const rows = [
        ['NAME', Player.name], ['LEVEL', Player.level],
        ['HP', `${Player.hp} / ${Player.maxHp}`],
        ['PP', `${Player.pp} / ${Player.maxPp}`],
        ['SP', `${Player.sp} / ${Player.maxSp}`],
        ['ATK', Player.atk], ['SPATK', Player.spatk],
        ['DEF', Player.def], ['SPDEF', Player.spdef], ['SPD', Player.spd],
        ['RELL', Player.money],
        ['EXP', `${Player.exp} / ${Player.expToReach(Player.level + 1)}`],
        ['FOUND', `${Player.collectibles} / 10`],
      ];
      // The left column runs down the same strip the thumb pad occupies.
      const shift = TouchPad.on ? 46 : 0;
      for (let i = 0; i < rows.length; i++) {
        const x = i < 7 ? 14 + shift : W / 2 + 6, y = 30 + (i % 7) * 11;
        text(rows[i][0], x, y, '#8a8a94');
        text(String(rows[i][1]), x + 52, y, '#e8e8ee');
      }
    } else if (this.tab === TAB_OPTIONS) {
      text('PRESS Z TO OPEN OPTIONS.', 14, 32, '#9a9aa4');
    } else {
      const list = this.list();
      if (!list.length) {
        text(this.tab === TAB_BAG ? 'NOTHING IN THE BAG.' : 'NOTHING READ YET.', 14, 32, '#70707c');
      }
      const inset = TouchPad.on ? 46 : 0;      // clear of the thumb pad
      for (let i = 0; i < Math.min(11, list.length); i++) {
        const y = 30 + i * 11;
        const name = this.tab === TAB_BAG ? list[i] : NOTES[list[i]].title;
        // In the bag, what you cannot use out here is dimmed - the same tell
        // the battle menu uses for a move you cannot pay for.
        const usable = this.tab !== TAB_BAG || (DATA.items[list[i]] || {}).field;
        const lit = i === this.cursor;
        text(name, 20 + inset, y, usable ? (lit ? '#f0ece2' : '#9a9aa4') : (lit ? '#9a9aa4' : '#63636e'));
        if (this.tab === TAB_BAG) text('x' + Player.bag[list[i]], W - 34 - inset, y, '#8a8a94');
        if (i === this.cursor) text('>', 12 + inset, y, '#e8d24a');
      }
      if (this.tab === TAB_BAG && list.length) {
        const it = DATA.items[list[this.cursor]];
        if (it) text(wrap(it.effect || '', W - 30)[0], 14, H - 16, '#8a8a94');
        text(`HP ${Player.hp}/${Player.maxHp}   PP ${Player.pp}/${Player.maxPp}`
             + `   SP ${Player.sp}/${Player.maxSp}`, 14, H - 27, '#6e6e7a');
      }
    }
    if (this.messageT > 0) {
      const w = textWidth(this.message) + 12;
      rect((W - w) / 2, H - 46, w, 13, '#12121a');
      text(this.message, (W - w) / 2 + 6, H - 43, '#e8d24a');
    }
    const hint = this.tab === TAB_BAG ? 'Z  USE     C / X  CLOSE'
               : this.tab === TAB_GEAR ? 'Z  WEAR    C / X  CLOSE'
               : (this.tab === TAB_MAP || this.tab === TAB_SAVE) ? '' : 'C / X  CLOSE';
    if (hint) text(hint, W - textWidth(hint) - 10, H - 12, '#5a5a66');
  },

  // Two slots, and the thing that matters is the difference between what is on
  // and what is under the cursor — so that is what the bottom of the panel says,
  // rather than making the player hold two stat blocks in their head.
  drawGear() {
    const list = this.gearList();
    const inset = TouchPad.on ? 46 : 0;
    const STATS = [['atk', 'ATK'], ['spatk', 'SPATK'], ['def', 'DEF'],
                   ['spdef', 'SPDEF'], ['spd', 'SPD'], ['hp', 'HP']];
    if (!list.length) { text('NOTHING BUT WHAT HE CAME IN.', 14, 32, '#70707c'); return; }

    // Flattened to rows first, headers included, so the scroll window is over
    // what is actually drawn. Windowing the item list instead lets a slot
    // heading push the selected row off the bottom once the wardrobe fills up.
    const rows = [];
    let lastSlot = null;
    for (let i = 0; i < list.length; i++) {
      const piece = DATA.equipment[list[i]];
      if (piece.slot !== lastSlot) { rows.push({ head: piece.slot }); lastSlot = piece.slot; }
      rows.push({ i, piece });
    }
    const MAX = 10;
    const at = rows.findIndex(r => r.i === this.cursor);
    const start = Math.max(0, Math.min(rows.length - MAX, at - MAX + 2));
    for (let r = 0; r < Math.min(MAX, rows.length - start); r++) {
      const e = rows[start + r], y = 30 + r * 11;
      if (e.head) { text(e.head.toUpperCase(), 12 + inset, y, '#5a6a7a'); continue; }
      const on = Player.equip[e.piece.slot] === list[e.i];
      const lit = e.i === this.cursor;
      text(list[e.i].toUpperCase(), 20 + inset, y, lit ? '#f0ece2' : (on ? '#b8c8a8' : '#9a9aa4'));
      if (on) text('WORN', W - 40 - inset, y, '#8ac06a');
      if (lit) text('>', 12 + inset, y, '#e8d24a');
    }

    const sel = DATA.equipment[list[this.cursor]];
    const worn = DATA.equipment[Player.equip[sel.slot]] || { stats: {} };
    let dx = 14;
    for (const [key, label] of STATS) {
      const delta = (sel.stats[key] || 0) - (worn.stats[key] || 0);
      if (!delta) continue;
      const s = `${label} ${delta > 0 ? '+' : ''}${delta}`;
      text(s, dx, H - 27, delta > 0 ? '#8ac06a' : '#c07a7a');
      dx += textWidth(s) + 8;
    }
    if (dx === 14) text(Player.equip[sel.slot] === list[this.cursor] ? 'WORN.' : 'NO CHANGE.',
                        14, H - 27, '#6e6e7a');
    text(wrap(sel.flavour, W - 30)[0], 14, H - 16, '#8a8a94');
  },

  // Every move he knows, with what it costs and what it does. This is the only
  // place that prose lives now - a fight is not the moment to read.
  drawMoves() {
    const list = this.list();
    const phys = Player.moves('physical').length;
    const inset = TouchPad.on ? 46 : 0;
    for (let i = 0; i < Math.min(11, list.length); i++) {
      const m = list[i], y = 29 + i * 11;
      const lit = i === this.cursor;
      const pool = i < phys ? 'PP' : 'SP';
      const afford = (i < phys ? Player.pp : Player.sp) >= m.cost;
      text(m.name.toUpperCase(), 18 + inset, y, lit ? '#f0ece2' : (afford ? '#9a9aa4' : '#63636e'));
      const cost = `${m.cost} ${pool}`;
      // Columns are tight: COUNTER STANCE is the longest name and Multi-Jab has
      // the longest stat line, and all three have to fit across 320 pixels. The
      // cost is right-aligned to its column so the names never collide with it.
      text(cost, 128 + inset - textWidth(cost), y, afford ? '#b8b8c2' : '#63636e');
      // The stat column is dropped on touch: 46 pixels of it are gone and a
      // truncated line is worse than none. It is on the STATUS-side row anyway.
      if (!inset) text(moveStatLine(m), 136, y, lit ? '#b0b0ba' : '#7a7a86');
      if (lit) text('>', 10 + inset, y, '#e8d24a');
    }
    const sel = list[this.cursor];
    if (inset && sel) text(moveStatLine(sel), 14, H - 34, '#b0b0ba');
    if (sel && sel.notes) {
      const lines = wrap(sel.notes, W - 28);
      for (let i = 0; i < Math.min(2, lines.length); i++)
        text(lines[i], 14, H - 24 + i * 10, '#8a8a94');
    }
  },

  // One slot, shown as what it currently holds. The player should be able to
  // see what they are about to write over before they write over it.
  drawSave() {
    const d = Save.read();
    const boxY = 34, boxH = 74;
    rect(28, boxY, W - 56, boxH, 'rgba(10,12,18,0.7)');
    rect(28, boxY, W - 56, 1, '#3a3a44'); rect(28, boxY + boxH - 1, W - 56, 1, '#3a3a44');
    rect(28, boxY, 1, boxH, '#3a3a44'); rect(W - 29, boxY, 1, boxH, '#3a3a44');

    if (!d) {
      text('THE NOTEBOOK IS EMPTY.', 40, boxY + 14, '#70707c');
      text('NOTHING HAS BEEN WRITTEN DOWN YET.', 40, boxY + 26, '#4e4e58');
    } else {
      const leg = routeIndexOf(d.room);
      const rows = [
        ['NAME', d.name || '-'],
        ['LEVEL', String(d.level)],
        ['WHERE', leg >= 0 ? ROUTE[leg].label : 'SOMEWHERE'],
        ['FOUND', `${d.collectibles || 0} / 10`],
        ['WRITTEN', agoText(d.stamp)],
      ];
      for (let i = 0; i < rows.length; i++) {
        const y = boxY + 8 + i * 12;
        text(rows[i][0], 40, y, '#7a7a86');
        text(rows[i][1], 108, y, '#e8e8ee');
      }
    }

    // The saved beat: the line flashes once and then sits there.
    const fresh = this.savedT > 0;
    if (fresh) this.savedT = Math.max(0, this.savedT - Time.dt);
    const prompt = d ? 'Z  WRITE OVER IT' : 'Z  WRITE IT DOWN';
    textCentered(prompt, W / 2, boxY + boxH + 10,
                 fresh && Math.sin(Time.t * 22) > 0 ? '#f0ece2' : '#e8d24a');
    textCentered('SAVING RECORDS WHERE HE GOT TO. IT DOES NOT REST HIM.',
                 W / 2, H - 14, '#5a5a66');
  },

  // A map of Limpo, in the town-map idiom: terrain, a road, and a marker for
  // every place he has actually been. Everywhere he has not is under cloud.
  drawMap() {
    if (!WorldMap.built) WorldMap.build();
    const ox = 16, oy = 26;
    cx.drawImage(WorldMap.cv, ox, oy);

    const here = routeIndexOf(World.id);
    // Cloud over the legs not yet walked, cut back leg by leg as he goes. It is
    // a ragged edge rather than a straight one, so it reads as weather.
    const reached = Player.seen.filter(i => ROUTE[i] && ROUTE[i].at);
    const frontier = reached.length
      ? Math.max(...reached.map(i => ROUTE[i].at[0])) + 26 : 0;
    cx.save();
    cx.beginPath(); cx.rect(ox, oy, MAP_W, MAP_H); cx.clip();
    for (let y = 0; y < MAP_H; y += 2) {
      const jag = Math.round(Math.sin(y * 0.21) * 5 + Math.sin(y * 0.07) * 4);
      const x0 = frontier + jag;
      if (x0 >= MAP_W) continue;
      rect(ox + x0, oy + y, MAP_W - x0, 2, 'rgba(10,12,18,0.95)');
      rect(ox + x0, oy + y, 2, 2, 'rgba(70,76,90,0.6)');
    }
    cx.restore();
    rect(ox - 1, oy - 1, MAP_W + 2, 1, '#3a3a44');
    rect(ox - 1, oy + MAP_H, MAP_W + 2, 1, '#3a3a44');
    rect(ox - 1, oy - 1, 1, MAP_H + 2, '#3a3a44');
    rect(ox + MAP_W, oy - 1, 1, MAP_H + 2, '#3a3a44');

    for (let i = 0; i < ROUTE.length; i++) {
      const a = ROUTE[i];
      if (!a.at || !Player.seen.includes(i)) continue;
      const px = ox + a.at[0], py = oy + a.at[1];
      WorldMap.marker(px, py, a.kind);
      if (a.short) {
        const w = textWidth(a.short), ly = py + (a.kind === 'orchard' ? 6 : 4);
        rect(px - w / 2 - 2, ly, w + 4, 9, 'rgba(8,10,14,0.76)');
        text(a.short, px - w / 2, ly + 1, i === here ? '#f0ece2' : '#b6b2a6');
      }
      if (i === here && Math.sin(Time.t * 5) > -0.2) {
        rect(px - 6, py - 12, 3, 1, '#e8d24a'); rect(px - 6, py - 12, 1, 3, '#e8d24a');
        rect(px + 4, py - 12, 3, 1, '#e8d24a'); rect(px + 6, py - 12, 1, 3, '#e8d24a');
        rect(px - 6, py + 3, 3, 1, '#e8d24a');  rect(px - 6, py + 1, 1, 3, '#e8d24a');
        rect(px + 4, py + 3, 3, 1, '#e8d24a');  rect(px + 6, py + 1, 1, 3, '#e8d24a');
      }
    }

    // With a warp device, the picked destination gets its own ring, so the
    // cursor is on the map rather than in a list beside it.
    const targets = this.warpTargets();
    if (targets.length) {
      const t = ROUTE[targets[this.cursor % targets.length]];
      const px = ox + t.at[0], py = oy + t.at[1];
      const r = 7 + Math.round(Math.sin(Time.t * 4) * 1.5);
      cx.strokeStyle = '#8ad0e8'; cx.lineWidth = 1;
      cx.strokeRect(px - r + 0.5, py - r + 0.5, r * 2, r * 2);
    }

    // The one place on his walk that this map has no square for.
    const label = here >= 0 && ROUTE[here].at ? ROUTE[here].label
                : here >= 0 ? 'NOT ON ANY MAP' : '';
    if (label) text(label, 16, H - 12, here >= 0 && ROUTE[here].at ? '#e8d24a' : '#8a7a4a');
    const count = `${reached.length} / ${ROUTE.filter(a => a.at).length}`;
    text(count, W - textWidth(count) - 16, H - 12, '#5a5a66');
    if (targets.length) {
      const to = ROUTE[targets[this.cursor % targets.length]].label;
      const hint = `Z  GO TO ${to}`;
      text(hint, W - textWidth(hint) - 16, H - 22, '#8ad0e8');
    }
  },
};

// --- shop --------------------------------------------------------------
const Shop = {
  open: false, cursor: 0, scroll: 0, rep: {}, stock: [],
  ROWS: 10,
  start(stock, title) {
    this.open = true; this.stock = stock; this.cursor = 0; this.scroll = 0;
    this.title = title || 'SHOP';
  },

  // A shop sells consumables and gear from one list, so everything below asks
  // "what is this name?" rather than assuming which table it came from.
  entry(name) {
    const gear = DATA.equipment[name];
    if (gear) return { price: gear.price, gear: true, blurb: gear.flavour, slot: gear.slot };
    const it = DATA.items[name] || { price: 0, effect: '' };
    return { price: it.price, gear: false, blurb: it.effect };
  },

  buy(name) {
    const e = this.entry(name);
    if (e.gear && Player.owned[name]) { Audio_.sfx('wrong'); return; }
    if (Player.money < e.price) { Audio_.sfx('wrong'); return; }
    Player.money -= e.price;
    if (e.gear) Player.ownGear(name); else Player.addItem(name);
    Audio_.sfx('found');
  },

  update(dt) {
    if (Input.hit('no') || Input.hit('menu')) { this.open = false; Audio_.sfx('cancel'); return; }
    const n = this.stock.length;
    if (Input.repeat('up', this.rep)) { this.cursor = (this.cursor - 1 + n) % n; Audio_.sfx('blip'); }
    if (Input.repeat('down', this.rep)) { this.cursor = (this.cursor + 1) % n; Audio_.sfx('blip'); }
    // A late-act shop stocks more than fits on a 180-pixel screen, so the list
    // scrolls. Without this, everything past the tenth line was unreachable.
    this.scroll = Math.max(0, Math.min(this.cursor - this.ROWS + 1,
                                       Math.max(0, n - this.ROWS)));
    if (this.cursor < this.scroll) this.scroll = this.cursor;
    if (Input.hit('ok')) this.buy(this.stock[this.cursor]);
  },

  draw() {
    rect(0, 0, W, H, 'rgba(4,4,8,0.9)');
    text(this.title || 'SHOP', 14, 10, '#f0ece2');
    text('RELL ' + Player.money, W - textWidth('RELL ' + Player.money) - 12, 10, '#e8d24a');
    rect(8, 22, W - 16, 1, '#3a3a44');
    const shown = Math.min(this.ROWS, this.stock.length - this.scroll);
    for (let r = 0; r < shown; r++) {
      const i = this.scroll + r, name = this.stock[i], e = this.entry(name), y = 30 + r * 12;
      const owned = e.gear && Player.owned[name];
      const afford = Player.money >= e.price && !owned;
      text(name, 22, y, i === this.cursor ? '#f0ece2' : (afford ? '#9a9aa4' : '#5f5f68'));
      text(String(e.price), W - 66, y, afford ? '#b8b8c2' : '#5f5f68');
      text(e.gear ? (owned ? 'HAVE' : e.slot.slice(0, 4).toUpperCase())
                  : 'x' + (Player.bag[name] || 0),
           W - 34, y, owned ? '#8ac06a' : '#70707c');
      if (i === this.cursor) text('>', 12, y, '#e8d24a');
    }
    if (this.scroll > 0) text('^', W - 16, 30, '#5a5a66');
    if (this.scroll + shown < this.stock.length) text('v', W - 16, 30 + (shown - 1) * 12, '#5a5a66');
    const sel = this.entry(this.stock[this.cursor]);
    if (sel) text(wrap(sel.blurb || '', W - 28)[0], 14, H - 26, '#8a8a94');
    text('Z BUY    X LEAVE', 14, H - 14, '#5a5a66');
  },
};

// --- fade / transitions ------------------------------------------------
const Fade = {
  a: 0, dir: 0, cb: null, hold: 0,
  out(cb, speed = 2.4) { this.dir = speed; this.cb = cb; },
  update(dt) {
    if (!this.dir) return;
    this.a += this.dir * dt;
    if (this.dir > 0 && this.a >= 1) {
      this.a = 1; this.dir = 0;
      const c = this.cb; this.cb = null;
      if (c) c();
      this.dir = -2.4;
    }
    if (this.dir < 0 && this.a <= 0) { this.a = 0; this.dir = 0; }
  },
  draw() { if (this.a > 0) { cx.globalAlpha = Math.min(1, this.a); rect(0, 0, W, H, '#000'); cx.globalAlpha = 1; } },
  get busy() { return this.dir !== 0 || this.a > 0.02; },
};
