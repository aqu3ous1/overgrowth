// ---------------------------------------------------------------- UI
// Title, name entry, pause menu, shop, save. Menu text is monospace-cold and
// never uses contractions; NPC text does, constantly.

const SAVE_KEY = 'overgrowth.save.v1';

const Save = {
  write() {
    const d = {
      name: Player.name, level: Player.level, exp: Player.exp,
      hp: Player.hp, pp: Player.pp, sp: Player.sp, money: Player.money,
      bag: Player.bag, flags: Player.flags, notes: Player.notes,
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
      collectibles: d.collectibles || 0,
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
  values: { textSpeed: 1, volume: 2, flashing: 1, grain: 1 },
  rows: [
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
      const r = this.rows[i], y = 44 + i * 16, sel = this.cursor === i;
      text(r.label, 58, y, sel ? '#f0ece2' : '#8a8a94');
      const v = r.opts[this.values[r.key]];
      text('< ' + v + ' >', W - 58 - textWidth('< ' + v + ' >'), y, sel ? '#e8d24a' : '#70707c');
      if (sel) text('>', 46, y, '#e8d24a');
    }
    const by = 44 + this.rows.length * 16 + 8;
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

// --- pause menu --------------------------------------------------------
const Menu = {
  open: false, tab: 0, cursor: 0, rep: {}, tabs: ['STATUS', 'BAG', 'NOTES', 'OPTIONS'],
  toggle() { this.open = !this.open; this.cursor = 0; Audio_.sfx(this.open ? 'ok' : 'cancel'); },
  update(dt) {
    if (Input.hit('menu') || Input.hit('no')) { this.toggle(); return; }
    if (Input.repeat('left', this.rep)) { this.tab = (this.tab + 3) % 4; this.cursor = 0; Audio_.sfx('blip'); }
    if (Input.repeat('right', this.rep)) { this.tab = (this.tab + 1) % 4; this.cursor = 0; Audio_.sfx('blip'); }
    if (this.tab === 3 && Input.hit('ok')) {
      this.open = false; Options.enter('field'); Game.mode = 'options'; Audio_.sfx('ok'); return;
    }
    const list = this.list();
    if (list.length) {
      if (Input.repeat('up', this.rep)) { this.cursor = (this.cursor - 1 + list.length) % list.length; Audio_.sfx('blip'); }
      if (Input.repeat('down', this.rep)) { this.cursor = (this.cursor + 1) % list.length; Audio_.sfx('blip'); }
      if (Input.hit('ok') && this.tab === 2) {
        const note = list[this.cursor];
        Audio_.sfx('ok');
        this.open = false;
        Dialogue.say(NOTES[note].pages.map(t => ({ text: t, speaker: 'system' })));
      }
    }
  },
  list() {
    if (this.tab === 1) return Object.keys(Player.bag);
    if (this.tab === 2) return Player.notes;
    return [];
  },
  draw() {
    rect(0, 0, W, H, 'rgba(4,4,8,0.88)');
    for (let i = 0; i < 4; i++) {
      const x = 10 + i * 76;
      if (i === this.tab) rect(x - 4, 8, 70, 12, '#1e2630');
      text(this.tabs[i], x, 11, i === this.tab ? '#f0ece2' : '#70707c');
    }
    rect(8, 22, W - 16, 1, '#3a3a44');

    if (this.tab === 0) {
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
      for (let i = 0; i < rows.length; i++) {
        const x = i < 7 ? 14 : W / 2 + 6, y = 30 + (i % 7) * 11;
        text(rows[i][0], x, y, '#8a8a94');
        text(String(rows[i][1]), x + 52, y, '#e8e8ee');
      }
    } else if (this.tab === 3) {
      text('PRESS Z TO OPEN OPTIONS.', 14, 32, '#9a9aa4');
    } else {
      const list = this.list();
      if (!list.length) {
        text(this.tab === 1 ? 'NOTHING IN THE BAG.' : 'NOTHING READ YET.', 14, 32, '#70707c');
      }
      for (let i = 0; i < Math.min(11, list.length); i++) {
        const y = 30 + i * 11;
        const name = this.tab === 1 ? list[i] : NOTES[list[i]].title;
        text(name, 20, y, i === this.cursor ? '#f0ece2' : '#9a9aa4');
        if (this.tab === 1) text('x' + Player.bag[list[i]], W - 34, y, '#8a8a94');
        if (i === this.cursor) text('>', 12, y, '#e8d24a');
      }
      if (this.tab === 1 && list.length) {
        const it = DATA.items[list[this.cursor]];
        if (it) text(wrap(it.effect || '', W - 30)[0], 14, H - 16, '#8a8a94');
      }
    }
    text('C / X  CLOSE', W - textWidth('C / X  CLOSE') - 10, H - 12, '#5a5a66');
  },
};

// --- shop --------------------------------------------------------------
const Shop = {
  open: false, cursor: 0, rep: {}, stock: [],
  start(stock) { this.open = true; this.stock = stock; this.cursor = 0; },
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
    text('OKOBO', 14, 10, '#f0ece2');
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
