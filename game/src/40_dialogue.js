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
    const mult = [0.6, 1, 1.7][(typeof Options !== 'undefined' && Options.values.textSpeed) ?? 1] || 1;
    const speed = (this.page.speaker === 'custodian' ? 44 : 62) * mult;
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
// Seconds per walk frame. At 62 px/s and 16 px tiles this puts a footfall
// every ~10 px, which is the rate that stops the stride reading as a skid.
const STEP_FRAME = 0.16;

const Player = {
  name: 'KID', x: 0, y: 0, face: 'down', walkT: 0, moving: false,
  level: 1, exp: 0, hp: 30, pp: 10, sp: 8, money: 0,
  bag: {}, flags: {}, collectibles: 0, notes: [],
  seen: [],                               // route indices reached, for the map
  stepAcc: 0,
  equip: { weapon: 'Bare Hands', body: 'School Clothes' },
  owned: {},                              // gear held, equipped or not
  passives: {},                           // milestone level -> chosen passive id
  owed: [],                               // milestones reached but not yet picked

  // --- equipment -------------------------------------------------------
  // Two slots and no accessories, so this stays a sum over two names rather
  // than anything with a loadout in it.
  gearBonus(stat) {
    let n = 0;
    for (const slot in this.equip) {
      const piece = DATA.equipment[this.equip[slot]];
      if (piece && piece.stats[stat]) n += piece.stats[stat];
    }
    return n;
  },

  ownGear(name) {
    if (!DATA.equipment[name]) return false;
    const isNew = !this.owned[name];
    this.owned[name] = true;
    return isNew;
  },

  wear(name) {
    const piece = DATA.equipment[name];
    if (!piece || !this.owned[name]) return false;
    this.equip[piece.slot] = name;
    // Wearing something with an HP bonus must not leave you above your own
    // maximum when you take it off again.
    this.hp = Math.min(this.hp, this.maxHp);
    return true;
  },

  // --- milestones ------------------------------------------------------
  // Every tenth level: the trickle goes up on its own, and one passive is
  // chosen. The choice is the only durable decision in the whole progression.
  get regenBonus() {
    const m = DATA.milestones;
    return Math.floor(this.level / m.every) * m.regen_bonus;
  },

  // The value of a chosen passive of this kind, or 0. Kinds are unique across
  // the table, so at most one pick can answer.
  passive(kind) {
    for (const lv in this.passives) {
      const pick = (DATA.milestones.choices[lv] || []).find(p => p.id === this.passives[lv]);
      if (pick && pick.kind === kind) return pick.value;
    }
    return 0;
  },

  milestonesUpTo(level) {
    const every = DATA.milestones.every;
    const out = [];
    for (let lv = every; lv <= level; lv += every) {
      if (DATA.milestones.choices[lv]) out.push(lv);
    }
    return out;
  },

  statAt(level, stat) {
    const keys = Object.keys(DATA.statCurve).map(Number).sort((a, b) => a - b);
    let lo = keys[0], hi = keys[keys.length - 1];
    for (const k of keys) { if (k <= level) lo = k; }
    for (let i = keys.length - 1; i >= 0; i--) { if (keys[i] >= level) hi = keys[i]; }
    if (lo === hi) return DATA.statCurve[lo][stat];
    const t = (level - lo) / (hi - lo);
    return Math.round(DATA.statCurve[lo][stat] + t * (DATA.statCurve[hi][stat] - DATA.statCurve[lo][stat]));
  },
  // Gear is added on top of the curve, and a stat can never be driven below 1:
  // the Lead Apron is meant to be slow, not motionless.
  stat(key, gearKey) {
    return Math.max(1, this.statAt(this.level, key) + this.gearBonus(gearKey));
  },
  get maxHp() { return this.stat('HP', 'hp'); },
  get maxPp() { return this.statAt(this.level, 'PP'); },
  get maxSp() { return this.statAt(this.level, 'SP'); },
  get atk()   { return this.stat('ATK', 'atk'); },
  get spatk() { return this.stat('SPATK', 'spatk'); },
  get def()   { return this.stat('DEF', 'def'); },
  get spdef() { return this.stat('SPDEF', 'spdef'); },
  get spd()   { return this.stat('SPD', 'spd'); },

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
      // Milestones are queued rather than prompted here: this runs mid-battle,
      // and a menu that opens over a fight is a menu that eats the win screen.
      for (const lv of this.milestonesUpTo(this.level)) {
        if (!this.passives[lv] && !this.owed.includes(lv)) this.owed.push(lv);
      }
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
    const interval = STEP_FRAME * 2;        // one footfall per stride frame
    if (this.moving) {
      World.move(this, dx * sp * dt, dy * sp * dt);
      // walkT counts animation frames, so the cycle and the footstep sound are
      // driven by the same number and cannot drift apart.
      this.walkT += dt / STEP_FRAME;
      this.stepAcc += dt;
      if (this.stepAcc > interval) {
        this.stepAcc = 0;
        Audio_.sfx(World.room.floor === 'water' ? 'water' : 'step');
      }
    } else { this.walkT = 0; this.stepAcc = interval; }
  },

  draw(px, py) {
    const base = this.face === 'up' ? 'player_up'
               : this.face === 'down' ? 'player_down' : 'player_side';
    // Four-beat cycle: stride, contact, other stride, contact. Going straight
    // between the two strides makes him skate; the contact pose in between is
    // what reads as a footfall — and it is the frame the step sound lands on.
    const CYCLE = ['_1', '', '_2', ''];
    const name = this.moving
      ? base + CYCLE[Math.floor(this.walkT) % 4]
      : base;
    const w = spriteWidth(name), h = spriteHeight(name);
    rect(px - 5, py + 1, 11, 2, 'rgba(0,0,0,0.32)');
    sprite(name, px - w / 2, py - h + 3, 'player', this.face === 'left');
  },
};
