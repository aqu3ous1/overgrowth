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
    });
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
  values: { controls: 0, textSpeed: 1, volume: 2, flashing: 1, grain: 1 },
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
  { label: 'OKOBO',           rooms: ['arrival', 'okobo', 'shop', 'inn', 'house'],
    at: [56, 82], kind: 'town', short: 'OKOBO' },
  { label: 'THE NORTH ROAD',  rooms: ['north_road'], at: [74, 70], kind: 'road' },
  { label: 'SUNKEN ORCHARD',  rooms: ['orchard1', 'orchard2', 'orchard3', 'clearing'],
    at: [100, 60], kind: 'orchard', short: 'ORCHARD' },
  { label: 'THE ROAD TO ONDO', rooms: ['road_ondo'], at: [124, 50], kind: 'road' },
  { label: 'ONDO',            rooms: ['ondo', 'ondo_shop', 'ondo_inn', 'ondo_grocer',
                                      'boarding_house', 'records_room'],
    at: [148, 40], kind: 'city', short: 'ONDO' },
  { label: 'THE WINTER ROAD', rooms: ['winter_road'], at: [162, 24], kind: 'road' },
  { label: 'KESTREL WORKS',   rooms: ['kestrel_yard', 'kestrel_f1', 'kestrel_f2', 'kestrel_f3',
                                      'kestrel_boiler', 'kestrel_office', 'kestrel_locker'],
    at: [190, 13], kind: 'works', short: 'KESTREL' },
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
           blob(196, 20, 62, 22) || blob(64, 52, 44, 26) || blob(120, 30, 46, 22);
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

    // Yettallia, across the water. No label: he has only heard about it.
    c.fillStyle = '#232a33';
    for (let y = 0; y < MAP_H; y += 2) {
      const w = 16 + Math.round(Math.sin(y * 0.09) * 5);
      c.fillRect(MAP_W - w, y, w, 2);
    }
    c.fillStyle = '#2c343e'; c.fillRect(MAP_W - 3, 0, 3, MAP_H);
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
const TAB_STATUS = 0, TAB_BAG = 1, TAB_MOVES = 2, TAB_MAP = 3, TAB_NOTES = 4,
      TAB_SAVE = 5, TAB_OPTIONS = 6;

const Menu = {
  open: false, tab: 0, cursor: 0, rep: {},
  tabs: ['STATUS', 'BAG', 'MOVES', 'MAP', 'NOTES', 'SAVE', 'OPTIONS'],
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
    }
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
    return [];
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
               : (this.tab === TAB_MAP || this.tab === TAB_SAVE) ? '' : 'C / X  CLOSE';
    if (hint) text(hint, W - textWidth(hint) - 10, H - 12, '#5a5a66');
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

    // The one place on his walk that this map has no square for.
    const label = here >= 0 && ROUTE[here].at ? ROUTE[here].label
                : here >= 0 ? 'NOT ON ANY MAP' : '';
    if (label) text(label, 16, H - 12, here >= 0 && ROUTE[here].at ? '#e8d24a' : '#8a7a4a');
    const count = `${reached.length} / ${ROUTE.filter(a => a.at).length}`;
    text(count, W - textWidth(count) - 16, H - 12, '#5a5a66');
  },
};

// --- shop --------------------------------------------------------------
const Shop = {
  open: false, cursor: 0, rep: {}, stock: [],
  start(stock, title) { this.open = true; this.stock = stock; this.cursor = 0; this.title = title || 'SHOP'; },
  update(dt) {
    if (Input.hit('no') || Input.hit('menu')) { this.open = false; Audio_.sfx('cancel'); return; }
    if (Input.repeat('up', this.rep)) { this.cursor = (this.cursor - 1 + this.stock.length) % this.stock.length; Audio_.sfx('blip'); }
    if (Input.repeat('down', this.rep)) { this.cursor = (this.cursor + 1) % this.stock.length; Audio_.sfx('blip'); }
    if (Input.hit('ok')) {
      const name = this.stock[this.cursor];
      const it = DATA.items[name];
      if (Player.money >= it.price) {
        Player.money -= it.price; Player.addItem(name);
        Audio_.sfx('found');
      } else Audio_.sfx('wrong');
    }
  },
  draw() {
    rect(0, 0, W, H, 'rgba(4,4,8,0.9)');
    text(this.title || 'SHOP', 14, 10, '#f0ece2');
    text('RELL ' + Player.money, W - textWidth('RELL ' + Player.money) - 12, 10, '#e8d24a');
    rect(8, 22, W - 16, 1, '#3a3a44');
    for (let i = 0; i < this.stock.length; i++) {
      const name = this.stock[i], it = DATA.items[name], y = 32 + i * 12;
      const afford = Player.money >= it.price;
      text(name, 22, y, i === this.cursor ? '#f0ece2' : (afford ? '#9a9aa4' : '#5f5f68'));
      text(String(it.price), W - 60, y, afford ? '#b8b8c2' : '#5f5f68');
      text('x' + (Player.bag[name] || 0), W - 30, y, '#70707c');
      if (i === this.cursor) text('>', 12, y, '#e8d24a');
    }
    const sel = DATA.items[this.stock[this.cursor]];
    if (sel) text(wrap(sel.effect || '', W - 28)[0], 14, H - 26, '#8a8a94');
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
