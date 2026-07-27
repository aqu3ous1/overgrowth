// ---------------------------------------------------------------- battle
// Turn-based, one combatant, no party. The camera sits behind the player so
// only the top of his head is in frame; he is never seen taking a hit.

const Battle = {
  active: false, enemy: null, state: 'intro', log: [], logT: 0,
  cursor: 0, sub: null, subCursor: 0, subScroll: 0, rep: {},
  shake: 0, flash: 0, enemyHurt: 0, playerHurt: 0, result: null,
  onEnd: null, backdrop: null, entityRef: null, turn: 0,

  makeEnemy(species, opts = {}) {
    const def = DATA.enemies[species];
    const level = opts.level || (def ? def.level : 5);
    const role = DATA.roles[(def && def.role) || 'standard'];
    const c = DATA.enemyCurve;
    const hpMul = opts.hpMul || 1, atkMul = opts.atkMul || 1;
    const hp = Math.round(
      (c.HP.base + c.HP.per_level * level + c.HP.per_level_squared * level * level) * role.HP * hpMul);
    return {
      species, name: opts.name || species, level,
      boss: !!opts.boss,
      hp, maxHp: hp,
      atk: (c.ATK.base + c.ATK.per_level * level) * role.ATK * atkMul,
      def: (c.DEF.base + c.DEF.per_level * level) * role.DEF,
      spd: (c.SPD.base + c.SPD.per_level * level) * role.SPD,
      power: c.attack_power,
      roleHp: role.HP,
      inaction: (def && def.inaction_rate) || 0,
      inflicts: (def && def.inflicts) || opts.inflicts || null,
      dealsDamage: !(def && def.deals_damage === false),
      art: ENEMY_ART[species] || { spr: 'dog', pal: 'dog' },
      scale: opts.scale || null,
      exp: opts.exp || null,
      restoresOnce: opts.restoresOnce || 0,
      restored: false,
      phase: 1, phases: opts.phases || 1,
      tiers: opts.tiers || null, tier: 1, baseAtk: 0, baseDef: 0,
    };
  },

  start(enemy, entityRef, onEnd) {
    if (enemy.tiers) {
      enemy.baseAtk = enemy.atk; enemy.baseDef = enemy.def;
      enemy.atk = enemy.baseAtk * enemy.tiers.atk_multiplier[0];
      enemy.def = enemy.baseDef * enemy.tiers.def_multiplier[0];
    }
    this.active = true; this.enemy = enemy; this.entityRef = entityRef || null;
    this.state = 'intro'; this.log = []; this.cursor = 0; this.sub = null;
    this.subCursor = 0; this.subScroll = 0; this.turn = 0;
    this.shake = 0; this.flash = 0.5; this.enemyHurt = 0; this.playerHurt = 0;
    this.result = null; this.onEnd = onEnd || null;
    this.homesick = false;
    this.backdrop = { floor: World.room.floor, wall: World.room.wall, bright: World.room.bright };
    Audio_.play(enemy.boss ? 'boss' : 'battle');
    this.push(`${enemy.name.toUpperCase()} appeared.`);
    this.state = 'message';
    this.after = () => { this.state = 'menu'; };
  },

  push(msg) { this.log.push(msg); this.logT = 0; },

  // --- damage ----------------------------------------------------------
  roll(atk, power, def) {
    const raw = (atk * power) / DATA.damage.divisor - def * DATA.damage.defCoeff;
    let dmg = raw * (0.9 + Math.random() * 0.2);
    if (Math.random() < DATA.damage.critChance) dmg = (atk * power) / DATA.damage.divisor * DATA.damage.critMult;
    return Math.max(1, Math.round(dmg));
  },

  canFlee() {
    if (this.enemy.boss) return false;          // shows ??, and ?? is never below yours
    return this.enemy.level <= Player.level;
  },

  // --- player actions --------------------------------------------------
  useMove(kind, move) {
    const pool = kind === 'physical' ? 'pp' : 'sp';
    if (Player[pool] < move.cost) {
      // Not an action: the turn is not spent, and the menu goes back to the top
      // rather than leaving a dead submenu behind.
      Audio_.sfx('wrong');
      this.push('Not enough ' + pool.toUpperCase() + '.');
      this.state = 'message';
      this.after = () => { this.sub = null; this.state = 'menu'; };
      return;
    }
    Player[pool] -= move.cost;
    this.sub = null;
    this.push(move.name.toUpperCase() + '!');

    if (move.heal_fraction) {
      const amt = Math.round(Player.maxHp * move.heal_fraction);
      Player.hp = Math.min(Player.maxHp, Player.hp + amt);
      Audio_.sfx('heal');
      this.push(`Recovered ${amt} HP.`);
      if (move.name === 'Mend+') this.homesick = false;
      this.state = 'message'; this.after = () => this.enemyTurn();
      return;
    }
    if (move.name === 'Quiet Room') {
      this.quiet = 3;
      if (this.homesick) { this.homesick = false; this.push('The room went quiet.'); }
      else this.push('The room went quiet.');
      Audio_.sfx('heal');
      this.state = 'message'; this.after = () => this.enemyTurn();
      return;
    }
    if (!move.power) {
      if (move.inflicts) this.push(`${this.enemy.name} is ${move.inflicts}.`);
      else this.push('Nothing obvious happened.');
      Audio_.sfx('psy');
      this.state = 'message'; this.after = () => this.enemyTurn();
      return;
    }

    const stat = kind === 'physical' ? Player.atk : Player.spatk;
    let hits = move.hits || 1;
    if (Array.isArray(hits)) hits = hits[0] + ((Math.random() * (hits[1] - hits[0] + 1)) | 0);
    let power = move.power;
    if (Array.isArray(power)) {
      const lowHp = 1 - Player.hp / Player.maxHp;
      power = Math.round(power[0] + (power[1] - power[0]) * Math.min(1, lowHp / 0.85));
    }
    if (move.accuracy && Math.random() > move.accuracy) {
      this.push('It missed.');
      Audio_.sfx('wrong');
      this.state = 'message'; this.after = () => this.enemyTurn();
      return;
    }

    let total = 0;
    for (let i = 0; i < hits; i++) total += this.roll(stat, power, this.enemy.def);
    this.enemy.hp -= total;
    this.enemyHurt = 0.3; this.shake = 0.22;
    Audio_.sfx(kind === 'physical' ? 'hit' : 'psy');
    this.push(hits > 1 ? `${hits} hits! ${total} damage.` : `${total} damage.`);

    if (move.drain_fraction) {
      const back = Math.round(total * move.drain_fraction);
      Player.hp = Math.min(Player.maxHp, Player.hp + back);
      this.push(`Drained ${back} HP.`);
    }

    this.state = 'message';
    this.after = () => this.checkEnemy();
  },

  useItem(name) {
    const it = DATA.items[name];
    if (!it) return;
    Player.useItem(name);
    this.sub = null;
    this.push(`Used ${name}.`);
    if (it.heal) {
      const amt = it.heal === 'full' ? Player.maxHp : it.heal;
      const before = Player.hp;
      Player.hp = Math.min(Player.maxHp, Player.hp + amt);
      Audio_.sfx('heal');
      this.push(`Recovered ${Player.hp - before} HP.`);
    } else if (it.pp) { Player.pp = Math.min(Player.maxPp, Player.pp + it.pp); Audio_.sfx('heal'); this.push(`Recovered ${it.pp} PP.`); }
    else if (it.sp) { Player.sp = Math.min(Player.maxSp, Player.sp + it.sp); Audio_.sfx('heal'); this.push(`Recovered ${it.sp} SP.`); }
    else { Audio_.sfx('ok'); this.push('Nothing obvious happened.'); }
    this.state = 'message';
    this.after = () => this.enemyTurn();
  },

  tryFlee() {
    if (!this.canFlee()) {
      this.push(this.enemy.boss
        ? 'The level reads ??. You cannot run.'
        : `${this.enemy.name} is level ${this.enemy.level}. You cannot run.`);
      Audio_.sfx('wrong');
      this.state = 'message'; this.after = () => { this.state = 'menu'; };
      return;
    }
    if (Math.random() < 0.5) {
      this.push('Got away.');
      Audio_.sfx('ok');
      this.result = 'fled';
      this.state = 'message'; this.after = () => this.finish();
    } else {
      this.push("Couldn't get away.");
      Audio_.sfx('wrong');
      this.state = 'message'; this.after = () => this.enemyTurn();
    }
  },

  // --- enemy turn ------------------------------------------------------
  checkEnemy() {
    if (this.enemy.hp > 0) { this.enemyTurn(); return; }
    if (this.enemy.restoresOnce && !this.enemy.restored) {
      this.enemy.restored = true;
      this.enemy.hp = Math.round(this.enemy.maxHp * this.enemy.restoresOnce);
      Audio_.sfx('wrong');
      this.push(`${this.enemy.name} is still standing.`);
      this.state = 'message'; this.after = () => this.enemyTurn();
      return;
    }
    this.victory();
  },

  enemyTurn() {
    this.turn++;
    if (this.quiet > 0) this.quiet--;
    const e = this.enemy;
    if (e.hp <= 0) { this.victory(); return; }

    // Tiered boss: each tier lost drops its guard and raises its urgency.
    if (e.tiers) {
      const t = e.tiers;
      const tier = Math.min(t.count, 1 + Math.floor((1 - e.hp / e.maxHp) * t.count));
      if (tier > e.tier) {
        e.tier = tier;
        e.def = e.baseDef * t.def_multiplier[tier - 1];
        e.atk = e.baseAtk * t.atk_multiplier[tier - 1];
        this.shake = 0.4;
        Audio_.sfx('hit');
        this.push(tier >= t.count
          ? `${e.name} has nothing left to stand on.`
          : `A tier comes away from ${e.name}.`);
        this.state = 'message';
        this.after = () => this.enemyTurn();
        return;
      }
    }

    if (Math.random() < e.inaction || !e.dealsDamage) {
      if (e.inflicts === 'Homesick' && !this.homesick) {
        this.homesick = true;
        this.push(`${e.name} made you think of home.`);
      } else {
        this.push(`${e.name} did nothing.`);
      }
      this.state = 'message'; this.after = () => this.startTurn();
      return;
    }

    if (e.inflicts === 'Homesick' && !this.homesick && Math.random() < 0.6) {
      this.homesick = true;
      this.push(`${e.name} made you think of home.`);
      this.state = 'message'; this.after = () => this.startTurn();
      return;
    }

    let falloff = 1;
    if (e.phases > 1) {
      const done = Math.min(e.phases - 1, Math.floor((1 - e.hp / e.maxHp) * e.phases));
      falloff = Math.max(0.45, 1 - 0.12 * done);
    }
    let dmg = this.roll(e.atk * falloff, e.power, Player.def);
    if (this.quiet > 0) dmg = Math.round(dmg * 0.5);
    Player.hp -= dmg;
    this.playerHurt = 0.35; this.shake = 0.28; this.flash = 0.3;
    Audio_.sfx('hurt');
    this.push(`${e.name} hit you for ${dmg}.`);
    this.state = 'message';
    this.after = () => this.startTurn();
  },

  startTurn() {
    if (Player.hp <= 0) { this.defeat(); return; }
    // The trickle. With Punch at 2 PP this is what guarantees there is never a
    // state where the player has no move at all — see docs/05.
    if (!this.drained) {
      Player.pp = Math.min(Player.maxPp, Player.pp + DATA.regen.PP);
      Player.sp = Math.min(Player.maxSp, Player.sp + DATA.regen.SP);
    }
    if (this.homesick) {
      const chip = Math.max(1, Math.round(Player.maxHp * 0.05));
      Player.hp -= chip;
      this.push(`You can't stop thinking about home. ${chip} damage.`);
      if (Player.hp <= 0) { this.state = 'message'; this.after = () => this.defeat(); return; }
      this.state = 'message'; this.after = () => { this.state = 'menu'; };
      return;
    }
    this.state = 'menu';
  },

  victory() {
    Audio_.sfx('win');
    const e = this.enemy;
    // Catch-up EXP: the game quietly pays more when the player is behind.
    let exp = e.exp;
    if (exp === null) {
      const catchup = Math.min(2, Math.max(0.5, 1 + 0.12 * (e.level - Player.level)));
      exp = Math.round(0.20 * Math.pow(e.level, 2.32) * e.roleHp * catchup);
    }
    const money = Math.round(1 + 1.35 * e.level);
    Player.money += money;
    const levels = Player.gainExp(exp);
    this.result = 'won';
    const msgs = [`${e.name} stopped.`, `${exp} EXP.  ${money} Rell.`];
    this.pendingMsgs = msgs;
    this.pendingLevels = levels;
    this.push(msgs[0]); this.push(msgs[1]);
    for (const lv of levels) {
      this.push(`Level ${lv}.`);
      for (const mv of Player.movesLearnedAt(lv)) this.push(`You learned ${mv.toUpperCase()}.`);
    }
    if (levels.length) setTimeout(() => Audio_.sfx('levelup'), 260);
    this.state = 'message';
    this.after = () => this.finish();
  },

  defeat() {
    this.result = 'lost';
    Audio_.sfx('wrong');
    this.push('You went down.');
    this.state = 'message';
    this.after = () => this.finish();
  },

  finish() {
    this.active = false;
    const r = this.result, ref = this.entityRef, cb = this.onEnd;
    this.onEnd = null;
    if (cb) cb(r, ref);
  },

  // --- update ----------------------------------------------------------
  update(dt) {
    if (!this.active) return;
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt * 2);
    this.enemyHurt = Math.max(0, this.enemyHurt - dt);
    this.playerHurt = Math.max(0, this.playerHurt - dt);
    this.logT += dt;

    if (this.state === 'message') {
      if (this.log.length > 1) {
        if (this.logT > 0.85 || Input.hit('ok')) { this.log.shift(); this.logT = 0; }
        return;
      }
      if (this.logT > 0.5 || Input.hit('ok')) {
        this.log = []; this.logT = 0;
        const a = this.after; this.after = null;
        if (a) a();
      }
      return;
    }

    if (this.state === 'menu') this.updateMenu();
    else if (this.state === 'sub') this.updateSub();
  },

  updateMenu() {
    if (Input.repeat('left', this.rep) || Input.repeat('right', this.rep)) {
      this.cursor ^= 1; Audio_.sfx('blip');
    }
    if (Input.repeat('up', this.rep) || Input.repeat('down', this.rep)) {
      this.cursor ^= 2; Audio_.sfx('blip');
    }
    if (Input.hit('ok')) {
      Audio_.sfx('ok');
      const which = ['physical', 'special', 'bag', 'run'][this.cursor];
      if (which === 'run') { this.tryFlee(); return; }
      this.sub = which; this.subCursor = 0; this.subScroll = 0; this.state = 'sub';
    }
  },

  subList() {
    if (this.sub === 'physical' || this.sub === 'special') return Player.moves(this.sub);
    return Object.keys(Player.bag)
      .filter(n => DATA.items[n] && DATA.items[n].battle)
      .map(n => ({ name: n, count: Player.bag[n] }));
  },

  updateSub() {
    const list = this.subList();
    if (Input.hit('no')) { Audio_.sfx('cancel'); this.sub = null; this.state = 'menu'; return; }
    if (!list.length) {
      if (Input.hit('ok')) { Audio_.sfx('cancel'); this.sub = null; this.state = 'menu'; }
      return;
    }
    if (Input.repeat('up', this.rep)) { this.subCursor = (this.subCursor - 1 + list.length) % list.length; Audio_.sfx('blip'); }
    if (Input.repeat('down', this.rep)) { this.subCursor = (this.subCursor + 1) % list.length; Audio_.sfx('blip'); }
    const maxRows = 4;
    if (this.subCursor < this.subScroll) this.subScroll = this.subCursor;
    if (this.subCursor >= this.subScroll + maxRows) this.subScroll = this.subCursor - maxRows + 1;
    if (Input.hit('ok')) {
      Audio_.sfx('ok');
      const item = list[this.subCursor];
      if (this.sub === 'bag') this.useItem(item.name);
      else this.useMove(this.sub, item);
    }
  },

  // --- draw ------------------------------------------------------------
  draw() {
    if (!this.active) return;
    const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 5) : 0;
    const sy = this.shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
    cx.save(); cx.translate(sx, sy);

    // Backdrop: the room the fight started in, seen from behind the player.
    const b = this.backdrop;
    const dim = b.bright ? -6 : -34;
    const wallFn = WALLS[b.wall] || paintBrick;
    for (let y = 0; y < 6; y++) for (let x = -1; x <= W / TS + 1; x++) wallFn(x * TS, y * TS, x, y, dim - 10);
    const floorFn = FLOORS[b.floor] || paintGrass;
    for (let y = 6; y <= H / TS + 1; y++) for (let x = -1; x <= W / TS + 1; x++) floorFn(x * TS, y * TS, x, y, dim);
    rect(0, 92, W, 2, 'rgba(0,0,0,0.35)');

    // Enemy in the middle distance.
    const e = this.enemy;
    const art = e.art;
    const s = e.scale || Math.max(2, Math.round(46 / spriteHeight(art.spr)));
    const ew = spriteWidth(art.spr) * s, eh = spriteHeight(art.spr) * s;
    const ex = Math.round(W / 2 - ew / 2), ey = Math.round(100 - eh);
    const float = Math.sin(Time.t * 2) * 1.5;
    cx.save();
    cx.translate(ex, ey + float);
    cx.scale(s, s);
    if (this.enemyHurt > 0 && Time.frame % 4 < 2) cx.globalAlpha = 0.35;
    sprite(art.spr, 0, 0, art.pal);
    cx.globalAlpha = 1;
    cx.restore();
    cx.globalAlpha = 0.3;
    rect(W / 2 - ew / 3, 99, (ew / 3) * 2, 3, '#000');
    cx.globalAlpha = 1;

    // Enemy nameplate. Bosses read ??.
    const lvl = e.boss ? '??' : String(e.level);
    const label = `${e.name}   Lv ${lvl}`;
    const lw = Math.min(W - 116, textWidth(label) + 10);
    // Never overlap the player's stat box, which owns the left 102px.
    const nx = Math.max(106, Math.round(W / 2 - lw / 2));
    rect(nx, 10, lw, 13, 'rgba(8,8,12,0.85)');
    rect(nx, 10, lw, 1, '#8a8a94');
    text(e.name, nx + 5, 13, '#e8e8ee');
    text('Lv ' + lvl, nx + lw - textWidth('Lv ' + lvl) - 5, 13,
         e.boss ? '#e8d24a' : '#b8b8c2');
    const hpw = lw - 10;
    rect(nx + 5, 21, hpw, 2, '#2a2a32');
    rect(nx + 5, 21, Math.max(0, hpw * (e.hp / e.maxHp)), 2, '#c05a5a');

    // The player: only the top of his head, at the bottom of frame.
    const headY = 126 + (this.playerHurt > 0 ? Math.sin(Time.t * 60) * 2 : 0);
    cx.save(); cx.translate(W / 2 - 28, headY); cx.scale(4, 4);
    if (this.playerHurt > 0 && Time.frame % 4 < 2) cx.globalAlpha = 0.4;
    sprite('player_up', 0, 0, 'player');
    cx.globalAlpha = 1;
    cx.restore();

    cx.restore();

    if (this.flash > 0) tintScreen('#ff5050', this.flash * 0.35);
    grain(0.05);

    this.drawHud();
    if (this.state === 'message' && this.log.length) this.drawLog();
    else if (this.state === 'menu') this.drawMenu();
    else if (this.state === 'sub') this.drawSub();
  },

  drawHud() {
    const bw = 96, bx = 6, by = 6;
    rect(bx, by, bw, 40, 'rgba(8,8,12,0.86)');
    rect(bx, by, bw, 1, '#8a8a94'); rect(bx, by + 39, bw, 1, '#8a8a94');
    rect(bx, by, 1, 40, '#8a8a94'); rect(bx + bw - 1, by, 1, 40, '#8a8a94');
    text(Player.name.slice(0, 8), bx + 4, by + 3, '#e8e8ee');
    text('Lv' + Player.level, bx + bw - textWidth('Lv' + Player.level) - 4, by + 3, '#b8b8c2');
    const bar = (label, cur, max, y, col) => {
      text(label, bx + 4, y, '#9a9aa4');
      const w = 52, x = bx + 20;
      rect(x, y + 2, w, 3, '#2a2a32');
      rect(x, y + 2, Math.max(0, Math.round(w * Math.max(0, cur) / max)), 3, col);
      text(String(Math.max(0, Math.round(cur))), bx + 76, y, '#cfcfd6');
    };
    bar('HP', Player.hp, Player.maxHp, by + 13, '#5ac06a');
    bar('PP', Player.pp, Player.maxPp, by + 21, '#c8a44a');
    bar('SP', Player.sp, Player.maxSp, by + 29, '#6a8ad0');
    if (this.homesick) text('HOMESICK', bx + 4, by + 44, '#c05a8a');
  },

  boxAt(x, y, w, h) {
    rect(x, y, w, h, 'rgba(8,8,12,0.94)');
    rect(x, y, w, 1, '#c8c8d0'); rect(x, y + h - 1, w, 1, '#c8c8d0');
    rect(x, y, 1, h, '#c8c8d0'); rect(x + w - 1, y, 1, h, '#c8c8d0');
  },

  drawLog() {
    const y = H - 34;
    this.boxAt(6, y, W - 12, 28);
    const lines = wrap(this.log[0], W - 26);
    for (let i = 0; i < Math.min(2, lines.length); i++) text(lines[i], 12, y + 6 + i * 10, '#f0ece2');
  },

  drawMenu() {
    const y = H - 34, x = 6, w = W - 12;
    this.boxAt(x, y, w, 28);
    const labels = ['PHYSICAL', 'SPECIAL', 'BAG', 'RUN'];
    const canRun = this.canFlee();
    for (let i = 0; i < 4; i++) {
      const cxp = x + 14 + (i % 2) * (w / 2 - 8);
      const cyp = y + 6 + ((i / 2) | 0) * 11;
      const greyed = i === 3 && !canRun;
      const col = greyed ? '#5a5a64' : '#f0ece2';
      text(labels[i], cxp, cyp, col);
      if (this.cursor === i) text('>', cxp - 8, cyp, greyed ? '#7a7a84' : '#e8d24a');
    }
  },

  drawSub() {
    const list = this.subList();
    const y = H - 62, x = 6, w = W - 12, h = 56;
    this.boxAt(x, y, w, h);
    if (!list.length) {
      text(this.sub === 'bag' ? 'No battle items.' : 'Nothing here.', x + 12, y + 6, '#9a9aa4');
      return;
    }
    const maxRows = 4;
    for (let i = 0; i < Math.min(maxRows, list.length); i++) {
      const idx = this.subScroll + i;
      if (idx >= list.length) break;
      const m = list[idx];
      const yy = y + 5 + i * 10;
      const cost = m.cost !== undefined
        ? `${m.cost} ${this.sub === 'physical' ? 'PP' : 'SP'}`
        : `x${m.count}`;
      const pool = this.sub === 'physical' ? Player.pp : Player.sp;
      const afford = m.cost === undefined || pool >= m.cost;
      text(m.name.toUpperCase(), x + 14, yy, afford ? '#f0ece2' : '#6a6a74');
      text(cost, x + w - textWidth(cost) - 10, yy, afford ? '#b8b8c2' : '#6a6a74');
      if (idx === this.subCursor) text('>', x + 6, yy, '#e8d24a');
    }
    const sel = list[this.subCursor];
    const desc = sel && (sel.notes || (DATA.items[sel.name] && DATA.items[sel.name].effect) || '');
    if (desc) text(wrap(desc, w - 24)[0], x + 8, y + h - 10, '#8a8a94');
  },
};
