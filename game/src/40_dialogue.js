// ---------------------------------------------------------------- dialogue & player
// Text boxes get a distinct treatment per speaker class. The Custodian's box
// degrades and has no advance prompt: the player does not control when he is
// finished.

const BOX_STYLE = {
  npc:       { font: '#f0ece2', border: '#e8e4da', bg: 'rgba(10,10,14,0.94)', prompt: true },
  system:    { font: '#cfe0e8', border: '#8fa8b4', bg: 'rgba(6,10,14,0.94)', prompt: true },
  vixtry:    { font: '#cfe0e8', border: '#8fa8b4', bg: 'rgba(6,10,14,0.94)', prompt: true },
  custodian: { font: '#ffffff', border: '#ffffff', bg: 'rgba(0,0,0,0.97)', prompt: false, degrade: true },
};

const Dialogue = {
  queue: [], page: null, chars: 0, done: false, hold: 0, active: false,
  onFinish: null,

  say(pages, onFinish) {
    if (typeof pages === 'string') pages = [{ text: pages, speaker: 'npc' }];
    pages = pages.map(p => (typeof p === 'string' ? { text: p, speaker: 'npc' } : p));
    this.queue = pages.slice();
    this.onFinish = onFinish || null;
    this.active = true;
    this.next();
  },

  next() {
    if (!this.queue.length) {
      this.active = false; this.page = null;
      const f = this.onFinish; this.onFinish = null;
      if (f) f();
      return;
    }
    this.page = this.queue.shift();
    this.page.lines = wrap(this.page.text, W - 24);
    this.chars = 0; this.done = false;
    this.hold = this.page.speaker === 'custodian' ? 2.6 : 0;
  },

  update(dt) {
    if (!this.active || !this.page) return;
    const total = this.page.lines.join('').length;
    const speed = this.page.speaker === 'custodian' ? 44 : 62;
    if (!this.done) {
      const before = this.chars | 0;
      this.chars = Math.min(total, this.chars + speed * dt);
      if ((this.chars | 0) > before && Time.frame % 2 === 0) Audio_.sfx('blip');
      if (this.chars >= total) this.done = true;
      if (Input.hit('ok')) { this.chars = total; this.done = true; }
      return;
    }
    if (this.page.speaker === 'custodian') {
      this.hold -= dt;
      if (this.hold <= 0) this.next();
      return;
    }
    if (Input.hit('ok')) { Audio_.sfx('ok'); this.next(); }
  },

  draw() {
    if (!this.active || !this.page) return;
    const st = BOX_STYLE[this.page.speaker] || BOX_STYLE.npc;
    const lines = this.page.lines;
    const boxH = Math.max(38, 12 + lines.length * 10);
    const y = H - boxH - 4;
    rect(6, y, W - 12, boxH, st.bg);
    rect(6, y, W - 12, 1, st.border); rect(6, y + boxH - 1, W - 12, 1, st.border);
    rect(6, y, 1, boxH, st.border); rect(W - 7, y, 1, boxH, st.border);

    let remaining = this.chars | 0;
    for (let i = 0; i < lines.length; i++) {
      const full = lines[i];
      const show = full.slice(0, Math.max(0, remaining));
      remaining -= full.length;
      // The Custodian's box loses its kerning as it goes.
      const spacing = st.degrade ? (i % 2 ? 0 : 2) : 1;
      text(show, 12, y + 7 + i * 10, st.font, spacing);
      if (remaining <= 0) break;
    }

    if (this.page.name) {
      rect(10, y - 9, textWidth(this.page.name) + 8, 10, st.bg);
      text(this.page.name, 14, y - 8, st.border);
    }
    if (this.done && st.prompt && Math.sin(Time.t * 5) > 0) {
      text('>', W - 16, y + boxH - 11, st.font);
    }
  },
};

// --- player ------------------------------------------------------------
const Player = {
  name: 'KID', x: 0, y: 0, face: 'down', walkT: 0, moving: false,
  level: 1, exp: 0, hp: 30, pp: 10, sp: 8, money: 0,
  bag: {}, flags: {}, collectibles: 0, notes: [],
  stepAcc: 0,

  statAt(level, stat) {
    const keys = Object.keys(DATA.statCurve).map(Number).sort((a, b) => a - b);
    let lo = keys[0], hi = keys[keys.length - 1];
    for (const k of keys) { if (k <= level) lo = k; }
    for (let i = keys.length - 1; i >= 0; i--) { if (keys[i] >= level) hi = keys[i]; }
    if (lo === hi) return DATA.statCurve[lo][stat];
    const t = (level - lo) / (hi - lo);
    return Math.round(DATA.statCurve[lo][stat] + t * (DATA.statCurve[hi][stat] - DATA.statCurve[lo][stat]));
  },
  get maxHp() { return this.statAt(this.level, 'HP'); },
  get maxPp() { return this.statAt(this.level, 'PP'); },
  get maxSp() { return this.statAt(this.level, 'SP'); },
  get atk()   { return this.statAt(this.level, 'ATK'); },
  get spatk() { return this.statAt(this.level, 'SPATK'); },
  get def()   { return this.statAt(this.level, 'DEF'); },
  get spdef() { return this.statAt(this.level, 'SPDEF'); },
  get spd()   { return this.statAt(this.level, 'SPD'); },

  moves(kind) {
    return DATA.moves[kind].filter(m => m.level <= this.level);
  },

  expToReach(n) { return Math.round(1.2 * n * n * n); },

  gainExp(amount) {
    this.exp += amount;
    const gained = [];
    while (this.level < DATA.levelCap && this.exp >= this.expToReach(this.level + 1)) {
      this.level++;
      gained.push(this.level);
    }
    if (gained.length) {
      this.hp = this.maxHp; this.pp = this.maxPp; this.sp = this.maxSp;
    }
    return gained;
  },

  // Moves learned across a span of levels, for the level-up message.
  movesLearnedAt(level) {
    const out = [];
    for (const k of ['physical', 'special'])
      for (const m of DATA.moves[k]) if (m.level === level) out.push(m.name);
    return out;
  },

  addItem(name, n = 1) { this.bag[name] = (this.bag[name] || 0) + n; },
  useItem(name) {
    if (!this.bag[name]) return false;
    this.bag[name]--; if (!this.bag[name]) delete this.bag[name];
    return true;
  },
  restore() { this.hp = this.maxHp; this.pp = this.maxPp; this.sp = this.maxSp; },

  update(dt) {
    if (Dialogue.active || Game.mode !== 'field') { this.moving = false; return; }
    const sp = 62;
    let dx = 0, dy = 0;
    if (Input.down('left')) dx -= 1;
    if (Input.down('right')) dx += 1;
    if (Input.down('up')) dy -= 1;
    if (Input.down('down')) dy += 1;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }
    this.moving = !!(dx || dy);
    if (dx) this.face = dx > 0 ? 'right' : 'left';
    else if (dy) this.face = dy > 0 ? 'down' : 'up';
    if (this.moving) {
      World.move(this, dx * sp * dt, dy * sp * dt);
      this.walkT += dt * 8;
      this.stepAcc += dt;
      const interval = 0.32;
      if (this.stepAcc > interval) {
        this.stepAcc = 0;
        Audio_.sfx(World.room.floor === 'water' ? 'water' : 'step');
      }
    } else { this.walkT = 0; this.stepAcc = 0.3; }
  },

  draw(px, py) {
    const name = this.face === 'up' ? 'player_up'
               : this.face === 'down' ? 'player_down' : 'player_side';
    const w = spriteWidth(name), h = spriteHeight(name);
    const bob = this.moving && Math.sin(this.walkT) > 0 ? 1 : 0;
    rect(px - 5, py + 1, 11, 2, 'rgba(0,0,0,0.32)');
    sprite(name, px - w / 2, py - h + 3 - bob, 'player', this.face === 'left');
  },
};
