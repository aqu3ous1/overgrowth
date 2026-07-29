// ---------------------------------------------------------------- battle
// Turn-based, one combatant, no party. The camera sits behind the player so
// only the top of his head is in frame; he is never seen taking a hit.

// "48 BASE POWER, 1 HIT" / "9 BASE POWER PER HIT, 2-4 HITS". Read off the data,
// so a retune in data/moves.json changes what the game says about itself.
// Uppercase because the font has no room below the baseline: lowercase p, g and
// y sit their descenders inside the glyph box and read as capitals.
function moveStatLine(m) {
  if (!m || m.cost === undefined) return '';
  const hits = Array.isArray(m.hits) ? `${m.hits[0]}-${m.hits[1]} HITS`
             : `${m.hits || 1} HIT${(m.hits || 1) > 1 ? 'S' : ''}`;
  if (!m.power) {
    if (m.heal_fraction) return `RESTORES ${Math.round(m.heal_fraction * 100)}% MAX HP`;
    if (m.inflicts) return `INFLICTS ${m.inflicts.toUpperCase()}`;
    return 'NO DAMAGE';
  }
  const per = Array.isArray(m.hits) || (m.hits || 1) > 1 ? ' PER HIT' : '';
  const pow = Array.isArray(m.power) ? `${m.power[0]}-${m.power[1]}` : m.power;
  return `${pow} BASE POWER${per}, ${hits}`;
}

const Battle = {
  active: false, enemy: null, state: 'intro', log: [], logT: 0,
  cursor: 0, sub: null, subCursor: 0, subScroll: 0, rep: {},
  shake: 0, flash: 0, enemyHurt: 0, playerHurt: 0, result: null,
  onEnd: null, backdrop: null, entityRef: null, turn: 0,
  homesick: false, mine: {}, stance: 0, blocked: 0,
  stages: { atk: 0, def: 0, spatk: 0, spdef: 0, spd: 0 },

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
    this.homesick = false; this.critFlash = 0; this.lastCrit = false;
    this.stance = 0;                      // turns of Counter Stance left
    this.blocked = 0;                     // damage it soaked, to hand back
    this.stages = { atk: 0, def: 0, spatk: 0, spdef: 0, spd: 0 };
    enemy.stages = { atk: 0, def: 0, spatk: 0, spdef: 0, spd: 0 };
    enemy.status = {};
    this.mine = {};        // the player's statuses; Homesick has its own flag
    this.enemyDone = false; this.pending = null;
    this.backdrop = { floor: World.room.floor, wall: World.room.wall, bright: World.room.bright };
    Audio_.play(enemy.boss ? 'boss' : 'battle');
    this.push(`${enemy.name.toUpperCase()} appeared.`);
    this.state = 'message';
    this.after = () => { this.state = 'menu'; };
  },

  push(msg) { this.log.push(msg); this.logT = 0; },

  // --- damage ----------------------------------------------------------
  // The player's chance to land a critical, at a given SPD. Capped, so a fast
  // late-game build does not crit every other swing.
  critChance(spd) {
    const d = DATA.damage;
    // Sharp Eye rides on top of the speed term but still under the same cap,
    // so the passive shortens the climb rather than raising the ceiling.
    return Math.min(d.critMax, d.critChance + spd * d.critPerSpd + Player.passive('crit_bonus'));
  },

  // `spd` is the attacker's speed, and passing it is what allows a critical.
  // Enemies never pass it, because enemies never crit: a critical the player
  // could not have played around lands as the game cheating, and this game
  // spends its difficulty on attrition and boss design instead. See
  // data/progression.json.
  roll(atk, power, def, spd) {
    const d = DATA.damage;
    const raw = (atk * power) / d.divisor - def * d.defCoeff;
    let dmg = raw * (0.9 + Math.random() * 0.2);
    let crit = false;
    if (spd !== undefined && Math.random() < this.critChance(spd)) {
      // A crit ignores the defence term entirely, which is what makes it worth
      // shouting about against a wall.
      dmg = (atk * power) / d.divisor * d.critMult;
      dmg *= 1 + Player.passive('crit_followup');
      crit = true;
    }
    this.lastCrit = crit;
    return Math.max(1, Math.round(dmg));
  },

  // --- stat stages and statuses ----------------------------------------
  // Stages move a stat by +/-25% each, capped at +/-3, and reset when the fight
  // ends (docs/04). Everything that referenced them - Counter Stance, Mind Fog,
  // Static Pulse, Gut Check, and every booster and debuff item - did nothing at
  // all before this existed.
  stageMul(n) { return 1 + 0.25 * Math.max(-3, Math.min(3, n || 0)); },

  bumpStage(who, stat, by) {
    const bag = who === 'enemy' ? this.enemy.stages : this.stages;
    const stats = stat === 'all' ? ['atk', 'def', 'spatk', 'spdef', 'spd'] : [stat];
    let moved = false;
    for (const k of stats) {
      const was = bag[k] || 0;
      const now = Math.max(-3, Math.min(3, was + by));
      if (now !== was) moved = true;
      bag[k] = now;
    }
    const name = who === 'enemy' ? this.enemy.name : Player.name;
    const label = stat === 'all' ? 'Everything' : stat.toUpperCase();
    if (!moved) this.push(`${label} will not go any further.`);
    else this.push(`${name}: ${label} ${by > 0 ? 'up' : 'down'}${Math.abs(by) > 1 ? ' sharply' : ''}.`);
    Audio_.sfx(by > 0 ? 'heal' : 'psy');
    return moved;
  },

  // Statuses land on either side. Homesick is the exception: it only ever goes
  // on the player, it has no duration, and the bag cannot lift it (docs/04), so
  // it keeps its own flag rather than sitting in the bag with a null timer.
  afflict(status, who) {
    const onEnemy = who !== 'player';
    const name = onEnemy ? this.enemy.name : Player.name;
    if (this.carrying(status, onEnemy ? 'enemy' : 'player')) {
      this.push(`${name} is already ${status}.`);
      return false;
    }
    const spec = (DATA.statuses || []).find(s => s.name === status);
    if (!onEnemy && status === 'Homesick') this.homesick = true;
    else {
      const bag = onEnemy ? (this.enemy.status = this.enemy.status || {}) : this.mine;
      bag[status] = (spec && spec.duration) || 3;
    }
    this.push(`${name} is ${status}.`);
    Audio_.sfx('psy');
    return true;
  },

  // Homesick gets its own line because it is the one the game is about; the
  // rest announce themselves plainly.
  inflictOnPlayer(e) {
    if (e.inflicts === 'Homesick') {
      this.homesick = true;
      this.push(`${e.name} made you think of home.`);
      Audio_.sfx('psy');
      return;
    }
    this.afflict(e.inflicts, 'player');
  },

  carrying(status, who) {
    if (who === 'enemy') return !!(this.enemy.status && this.enemy.status[status] > 0);
    if (status === 'Homesick') return this.homesick;
    return this.mine[status] > 0;
  },

  has(status) { return this.carrying(status, 'enemy'); },

  // Whatever numbers apply to whoever is carrying it, straight out of
  // data/moves.json. The two sides differ - an enemy has no PP to drain and no
  // bag to reach for - so each status carries both readings and none of those
  // figures are typed into this file.
  fx(kind, who) {
    const key = who === 'enemy' ? 'enemy_effect' : 'player_effect';
    const s = (DATA.statuses || []).find(
      x => x[key] && x[key].kind === kind && this.carrying(x.name, who));
    return s ? s[key] : null;
  },

  tickStatuses() {
    // Clear Head only shortens what is on the player; an enemy's Fog is not
    // the player's to shrug off.
    const shed = Player.passive('status_shed') || 1;
    for (const [bag, name, rate] of [[this.enemy.status, this.enemy.name, 1],
                                     [this.mine, Player.name, shed]]) {
      if (!bag) continue;
      for (const k in bag) {
        bag[k] -= rate;
        if (bag[k] <= 0) { delete bag[k]; this.push(`${name} is no longer ${k}.`); }
      }
    }
  },

  // The enemy's defence, after Numb and any stage changes.
  enemyDef() {
    const soft = this.fx('soften', 'enemy');
    return this.enemy.def * this.stageMul(this.enemy.stages.def) * (soft ? soft.multiplier : 1);
  },

  canFlee() {
    if (this.enemy.boss) return false;          // shows ??, and ?? is never below yours
    return this.enemy.level <= Player.level;
  },

  // --- turn order ------------------------------------------------------
  // Actions sort by SPD, ties broken by a coin flip, and a move's own priority
  // overrides both — see docs/04. Without this the player always acted first,
  // SPD did nothing outside the crit roll, and `Wind-Up Punch` was a worse
  // Punch that lied about it in its own description.
  playerFirst(move) {
    if (move && move.priority === 'first') return true;
    if (move && move.priority === 'last') return false;
    if (Player.spd === this.enemy.spd) return Math.random() < 0.5;
    return Player.spd > this.enemy.spd;
  },

  // Queue the player's action behind the enemy's. `why` is optional and is only
  // used where the delay is the move's own doing; losing a speed roll is not
  // announced, because the enemy's attack landing first says it already.
  yieldTo(act, why) {
    this.pending = act;
    if (why) {
      this.push(why);
      this.state = 'message';
      this.after = () => this.enemyTurn();
      return;
    }
    this.enemyTurn();
  },

  // Where every player action lands once it has resolved.
  afterPlayer() {
    if (this.enemy.hp <= 0) { this.checkEnemy(); return; }
    if (this.enemyDone) { this.startTurn(); return; }
    this.enemyTurn();
  },

  // --- player actions --------------------------------------------------
  // What the move costs right now. Drained makes specials dearer, so the number
  // the submenu prints and the number the check uses come from one place.
  moveCost(kind, move) {
    if (kind !== 'special') return move.cost;
    const discount = Player.passive('sp_discount');
    const cost = discount ? Math.max(1, Math.round(move.cost * discount)) : move.cost;
    const drain = this.fx('drain', 'player');
    // Drained is applied after the discount, so Open Line softens it rather
    // than being cancelled by it.
    return drain ? Math.ceil(cost * drain.sp_cost_multiplier) : cost;
  },

  useMove(kind, move) {
    const pool = kind === 'physical' ? 'pp' : 'sp';
    const cost = this.moveCost(kind, move);
    if (Player[pool] < cost) {
      // Not an action: the turn is not spent, and the menu goes back to the top
      // rather than leaving a dead submenu behind.
      Audio_.sfx('wrong');
      this.push('Not enough ' + pool.toUpperCase() + '.');
      this.state = 'message';
      this.after = () => { this.sub = null; this.state = 'menu'; };
      return;
    }
    Player[pool] -= cost;
    this.sub = null;
    if (!this.playerFirst(move)) {
      // "Winds up" is the move describing itself, not a turn-order caption, so
      // it stays. Losing on speed passes silently.
      this.yieldTo(() => this.resolveMove(kind, move),
                   move.priority === 'last' ? `${Player.name} winds up.` : null);
      return;
    }
    this.resolveMove(kind, move);
  },

  resolveMove(kind, move) {
    this.push(move.name.toUpperCase() + '!');

    if (move.heal_fraction) {
      const amt = Math.round(Player.maxHp * move.heal_fraction);
      Player.hp = Math.min(Player.maxHp, Player.hp + amt);
      Audio_.sfx('heal');
      this.push(`Recovered ${amt} HP.`);
      if (move.name === 'Mend+') this.homesick = false;
      this.state = 'message'; this.after = () => this.afterPlayer();
      return;
    }
    if (move.name === 'Quiet Room') {
      this.quiet = 3;
      if (this.homesick) { this.homesick = false; this.push('The room went quiet.'); }
      else this.push('The room went quiet.');
      Audio_.sfx('heal');
      this.state = 'message'; this.after = () => this.afterPlayer();
      return;
    }
    if (move.name === 'Counter Stance') {
      // Lasts through the enemy's next attack, not "this turn" literally: if it
      // expired at end of turn it would only ever work when the player was
      // already going second, which is the turn you least want to brace on.
      this.stance = 1;
      this.blocked = 0;
      this.push(`${Player.name} braces.`);
      Audio_.sfx('ok');
      this.state = 'message'; this.after = () => this.afterPlayer();
      return;
    }
    if (!move.power) {
      if (move.inflicts) {
        this.afflict(move.inflicts);
        // Static Pulse also takes a step off their speed.
        if (move.name === 'Static Pulse') this.bumpStage('enemy', 'spd', -1);
      } else this.push('Nothing obvious happened.');
      Audio_.sfx('psy');
      this.state = 'message'; this.after = () => this.afterPlayer();
      return;
    }

    // Last Word is a stage the player never spent a turn on, granted only while
    // the HP bar is in the red.
    const desperate = Player.passive('desperate');
    const cornered = desperate && Player.hp <= Player.maxHp * desperate ? 1 : 0;
    const stat = (kind === 'physical' ? Player.atk : Player.spatk)
               * this.stageMul(this.stages[kind === 'physical' ? 'atk' : 'spatk'] + cornered);
    let hits = move.hits || 1;
    if (Array.isArray(hits)) hits = hits[0] + ((Math.random() * (hits[1] - hits[0] + 1)) | 0);
    // Long Reach only ever adds to something that already swings more than once.
    const reach = Player.passive('extra_hit');
    if (hits > 1 && reach && Math.random() < reach) hits++;
    let power = move.power;
    if (Array.isArray(power)) {
      const lowHp = 1 - Player.hp / Player.maxHp;
      power = Math.round(power[0] + (power[1] - power[0]) * Math.min(1, lowHp / 0.85));
    }
    const blur = this.fx('miss', 'player');
    const acc = (move.accuracy || 1) * (blur ? 1 - blur.chance : 1);
    if (acc < 1 && Math.random() > acc) {
      this.push('It missed.');
      Audio_.sfx('wrong');
      this.state = 'message'; this.after = () => this.afterPlayer();
      return;
    }

    let total = 0, crits = 0;
    const spd = Player.spd * this.stageMul(this.stages.spd);
    // Severance ignores the defence term entirely, which is its whole point.
    const against = move.name === 'Severance' ? 0 : this.enemyDef();
    for (let i = 0; i < hits; i++) {
      total += this.roll(stat, power, against, spd);
      if (this.lastCrit) crits++;
    }
    this.enemy.hp -= total;
    // A crit is worth seeing as well as reading: harder shake, a white frame,
    // and its own sound on top of the hit.
    this.enemyHurt = crits ? 0.5 : 0.3;
    this.shake = crits ? 0.42 : 0.22;
    if (crits) { this.flash = 0.45; this.critFlash = 0.5; }
    Audio_.sfx(kind === 'physical' ? 'hit' : 'psy');
    if (crits) Audio_.sfx('crit');
    if (hits > 1) {
      this.push(crits
        ? `${hits} hits, ${crits} critical! ${total} damage.`
        : `${hits} hits! ${total} damage.`);
    } else {
      this.push(crits ? `CRITICAL HIT! ${total} damage.` : `${total} damage.`);
    }

    // Gut Check knocks a step off their attack when it lands.
    if (move.name === 'Gut Check' && Math.random() < 0.4) this.bumpStage('enemy', 'atk', -1);

    if (move.drain_fraction) {
      const back = Math.round(total * move.drain_fraction);
      Player.hp = Math.min(Player.maxHp, Player.hp + back);
      this.push(`Drained ${back} HP.`);
    }

    this.state = 'message';
    this.after = () => this.afterPlayer();
  },

  useItem(name) {
    const it = DATA.items[name];
    if (!it) return;
    Player.useItem(name);
    this.sub = null;
    // Items always resolve first, whatever the speed roll. Reaching for a spray
    // and dying before it opens is the kind of loss a player reads as the game
    // cheating, and there is no counterplay to being slow.
    this.resolveItem(name, it);
  },

  resolveItem(name, it) {
    this.push(`Used ${name}.`);
    if (it.heal) {
      const amt = it.heal === 'full' ? Player.maxHp : it.heal;
      const before = Player.hp;
      Player.hp = Math.min(Player.maxHp, Player.hp + amt);
      Audio_.sfx('heal');
      this.push(`Recovered ${Player.hp - before} HP.`);
    } else if (it.pp) { Player.pp = Math.min(Player.maxPp, Player.pp + it.pp); Audio_.sfx('heal'); this.push(`Recovered ${it.pp} PP.`); }
    else if (it.sp) { Player.sp = Math.min(Player.maxSp, Player.sp + it.sp); Audio_.sfx('heal'); this.push(`Recovered ${it.sp} SP.`); }
    else if (it.stage) this.bumpStage(it.at === 'enemy' ? 'enemy' : 'self', it.stat, it.stage);
    else if (it.inflict) this.afflict(it.inflict);
    else if (it.cure) {
      // "Cure one status", literally one: the first that came on. Homesick is
      // the one thing the bag cannot fix (docs/04), so it is skipped even when
      // it is the only thing wrong, and says so.
      const first = Object.keys(this.mine)[0];
      if (first) {
        delete this.mine[first];
        Audio_.sfx('heal');
        this.push(`No longer ${first}.`);
      } else if (this.homesick) {
        this.push('It will not touch that one.');
      } else {
        this.push('Nothing to clean off.');
      }
    }
    else { Audio_.sfx('ok'); this.push('Nothing obvious happened.'); }
    this.state = 'message';
    this.after = () => this.afterPlayer();
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
      this.state = 'message'; this.after = () => this.afterPlayer();
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
      this.state = 'message';
      this.after = () => (this.enemyDone ? this.startTurn() : this.enemyTurn());
      return;
    }
    this.victory();
  },

  enemyTurn() {
    if (!this.enemyDone) { this.turn++; if (this.quiet > 0) this.quiet--; }
    const e = this.enemy;
    // Dead before it acts - which is now reachable, because the player can
    // outspeed it. Any action it had queued is dropped, per docs/04.
    if (e.hp <= 0) { this.pending = null; this.checkEnemy(); return; }

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

    // Past this point the enemy is definitely taking its action this turn.
    this.enemyDone = true;

    const seize = this.fx('skip', 'enemy');
    if (seize && Math.random() < seize.chance) {
      this.push(`${e.name} seized up.`);
      this.tickStatuses();
      this.state = 'message'; this.after = () => this.afterEnemy();
      return;
    }

    // Five species carry a status. Only Homesick was ever wired up, so the
    // other four spent three acts hitting you with a plain attack instead.
    const canInflict = e.inflicts && !this.carrying(e.inflicts, 'player');

    if (Math.random() < e.inaction || !e.dealsDamage) {
      if (canInflict) this.inflictOnPlayer(e);
      else this.push(`${e.name} did nothing.`);
      this.tickStatuses();
      this.state = 'message'; this.after = () => this.afterEnemy();
      return;
    }

    if (canInflict && Math.random() < 0.6) {
      this.inflictOnPlayer(e);
      this.tickStatuses();
      this.state = 'message'; this.after = () => this.afterEnemy();
      return;
    }

    let falloff = 1;
    if (e.phases > 1) {
      const done = Math.min(e.phases - 1, Math.floor((1 - e.hp / e.maxHp) * e.phases));
      falloff = Math.max(0.45, 1 - 0.12 * done);
    }
    const blur = this.fx('miss', 'enemy');
    if (blur && Math.random() < blur.chance) {
      this.push(`${e.name} missed.`);
      this.tickStatuses();
      this.state = 'message'; this.after = () => this.afterEnemy();
      return;
    }

    // No spd argument: the enemy cannot crit, by design.
    const weak = this.fx('weaken', 'enemy');
    const eAtk = e.atk * falloff * this.stageMul(e.stages.atk) * (weak ? weak.multiplier : 1);
    const numb = this.fx('soften', 'player');
    let dmg = this.roll(eAtk, e.power,
      Player.def * this.stageMul(this.stages.def) * (numb ? numb.multiplier : 1));
    if (this.quiet > 0) dmg = Math.round(dmg * 0.5);
    const tough = Player.passive('damage_taken');
    if (tough) dmg = Math.max(1, Math.round(dmg * tough));
    if (this.stance > 0) {
      // Half the blow is soaked, and half of what was soaked comes back.
      const soaked = Math.round(dmg * 0.5);
      this.blocked = soaked;
      dmg -= soaked;
    }
    Player.hp -= dmg;
    this.playerHurt = 0.35; this.shake = 0.28; this.flash = 0.3;
    Audio_.sfx('hurt');
    if (dmg > 0) this.push(`${e.name} hit you for ${dmg}.`);
    else this.push(`${e.name}'s hit went nowhere.`);
    if (this.stance > 0) {
      this.stance = 0;
      const back = Math.round(this.blocked * 0.5);
      if (back > 0) {
        e.hp -= back;
        this.enemyHurt = 0.3; this.shake = 0.24;
        Audio_.sfx('hit');
        this.push(`Blocked, and gave back ${back}.`);
      } else {
        this.push('Blocked.');
      }
      this.blocked = 0;
    }
    this.tickStatuses();
    this.state = 'message';
    // The counter can kill. If it did and you are still up, the fight is over
    // now; if you went down to the same blow, you went down first.
    this.after = () => (e.hp <= 0 && Player.hp > 0 ? this.checkEnemy() : this.afterEnemy());
  },

  // If the player's action was queued behind the enemy's, it happens now.
  afterEnemy() {
    const p = this.pending;
    this.pending = null;
    if (p && Player.hp > 0) { p(); return; }
    this.startTurn();
  },

  startTurn() {
    this.enemyDone = false;
    this.pending = null;
    if (Player.hp <= 0) { this.defeat(); return; }
    // The trickle. With Punch at 2 PP this is what guarantees there is never a
    // state where the player has no move at all — see docs/05. Drained turns it
    // off, which is the whole reason Drained is frightening.
    if (!this.fx('drain', 'player')) {
      const extra = Player.regenBonus;
      Player.pp = Math.min(Player.maxPp, Player.pp + DATA.regen.PP + extra);
      Player.sp = Math.min(Player.maxSp, Player.sp + DATA.regen.SP + extra);
    }
    // Steady Breathing. Silent when it does nothing, so a full-HP turn does not
    // spend a message box saying so.
    const mend = Player.passive('hp_regen');
    if (mend && Player.hp > 0 && Player.hp < Player.maxHp) {
      const got = Math.min(mend, Player.maxHp - Player.hp);
      Player.hp += got;
      this.push(`Steady breathing. ${got} HP back.`);
    }
    if (this.homesick) {
      const chip = Math.max(1, Math.round(Player.maxHp * this.fx('chip', 'player').fraction));
      Player.hp -= chip;
      this.push(`You can't stop thinking about home. ${chip} damage.`);
      if (Player.hp <= 0) { this.state = 'message'; this.after = () => this.defeat(); return; }
    }
    // Anything pushed above needs reading before the menu opens, or it is
    // written into a log the player never sees.
    if (this.log.length) {
      this.state = 'message';
      this.after = () => this.mayAct();
      return;
    }
    this.mayAct();
  },

  // Static costs you the turn outright. It is checked here rather than after
  // the move is picked so the PP is not spent on a turn you never got.
  mayAct() {
    const seize = this.fx('skip', 'player');
    if (seize && Math.random() < seize.chance) {
      this.push(`${Player.name} seized up.`);
      Audio_.sfx('wrong');
      this.tickStatuses();
      this.state = 'message';
      this.after = () => this.enemyTurn();
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
    for (const line of this.awardDrops(e)) this.push(line);
    if (levels.length) setTimeout(() => Audio_.sfx('levelup'), 260);
    this.state = 'message';
    this.after = () => this.finish();
  },

  // --- what it left behind ---------------------------------------------
  // A boss hands over exactly what data/bosses.json says. Everything else rolls
  // against data/drops.json, where rarity is keyed to price: retuning what a
  // Spray III costs moves it through the tiers on its own.
  awardDrops(e) {
    const spec = DATA.bossEncounters[e.name];
    if (spec && spec.drops) return spec.drops.map(d => this.give(d));

    const cfg = DATA.drops.common_enemy;
    const designed = DATA.enemies[e.species] && DATA.enemies[e.species].drop_designed;
    const rules = DATA.drops.designed;
    if (!designed && Math.random() > cfg.chance) return [];

    let tiers = cfg.tiers;
    if (designed) tiers = tiers.slice(Math.min(rules.tier_shift, tiers.length - 1));
    const total = tiers.reduce((a, t) => a + t.weight, 0);
    let roll = Math.random() * total, tier = tiers[tiers.length - 1];
    for (const t of tiers) { roll -= t.weight; if (roll <= 0) { tier = t; break; } }

    const name = tier.equipment ? this.rollGear() : this.rollItem(tier, e.level);
    return name ? [this.give(name)] : [];
  },

  // Nothing drops that the player could not already have been sold at this
  // level, or a rat in the first field hands over the late-game spray.
  rollItem(tier, level) {
    const gate = DATA.drops.level_gate;
    const ceiling = Math.min(tier.max_price,
                             Math.max(gate.floor, gate.price_per_level * level));
    const pool = Object.keys(DATA.items).filter(n => {
      const it = DATA.items[n];
      return it.battle && it.price > 0 && it.price <= ceiling;
    });
    return pool.length ? pool[(Math.random() * pool.length) | 0] : null;
  },

  rollGear() {
    const pool = DATA.gearDrops.pool.filter(n => !Player.owned[n]);
    return pool.length ? pool[(Math.random() * pool.length) | 0] : null;
  },

  // `Spray II x3` or a bare name. Gear goes to the wardrobe, not the bag.
  give(text) {
    const m = /^(.+?)(?: x(\d+))?$/.exec(text);
    const name = m[1], n = parseInt(m[2] || '1', 10);
    if (DATA.equipment[name]) {
      const isNew = Player.ownGear(name);
      return isNew ? `Found: ${name}.` : `Another ${name}. Left it.`;
    }
    Player.addItem(name, n);
    return n > 1 ? `Found: ${name} x${n}.` : `Found: ${name}.`;
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
    this.critFlash = Math.max(0, (this.critFlash || 0) - dt * 2);
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
    if (this.critFlash > 0) {
      // A rim of white around the frame rather than a full-screen wash: the
      // enemy has to stay visible through the hit that is landing on it.
      const a = this.critFlash * 1.6;
      cx.globalAlpha = Math.min(0.85, a);
      rect(0, 0, W, 3, '#fff8e0'); rect(0, H - 3, W, 3, '#fff8e0');
      rect(0, 0, 3, H, '#fff8e0'); rect(W - 3, 0, 3, H, '#fff8e0');
      cx.globalAlpha = Math.min(0.30, a * 0.4);
      rect(0, 0, W, H, '#fff8e0');
      cx.globalAlpha = 1;
    }
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
    // Statuses stack downwards under the box. Homesick keeps its own colour and
    // sits first: it is the one that does not run out.
    let sy = by + 44;
    if (this.homesick) { text('HOMESICK', bx + 4, sy, '#c05a8a'); sy += 8; }
    for (const k in this.mine) {
      text(`${k.toUpperCase()} ${this.mine[k]}`, bx + 4, sy, '#c8a44a');
      sy += 8;
    }
    // And what the enemy is carrying, over on its side of the screen.
    let ey = by + 44;
    for (const k in (this.enemy.status || {})) {
      const s = `${k.toUpperCase()} ${this.enemy.status[k]}`;
      text(s, W - 6 - textWidth(s), ey, '#8ac0a0');
      ey += 8;
    }
    const st = this.enemy.stages || {};
    const up = Object.keys(st).filter(k => st[k] > 0).length;
    const dn = Object.keys(st).filter(k => st[k] < 0).length;
    if (up || dn) {
      const s = `${dn ? `-${dn} ` : ''}${up ? `+${up}` : ''}`.trim();
      text(s, W - 6 - textWidth(s), ey, dn > up ? '#8ac0a0' : '#c07a7a');
    }
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
      // Priced through moveCost, so a Drained special shows the higher number
      // it is actually about to charge rather than the one in the docs.
      const spend = m.cost !== undefined ? this.moveCost(this.sub, m) : undefined;
      const cost = spend !== undefined
        ? `${spend} ${this.sub === 'physical' ? 'PP' : 'SP'}`
        : `x${m.count}`;
      const pool = this.sub === 'physical' ? Player.pp : Player.sp;
      const afford = spend === undefined || pool >= spend;
      text(m.name.toUpperCase(), x + 14, yy, afford ? '#f0ece2' : '#6a6a74');
      text(cost, x + w - textWidth(cost) - 10, yy, afford ? '#b8b8c2' : '#6a6a74');
      if (idx === this.subCursor) text('>', x + 6, yy, '#e8d24a');
    }
    // No prose in a fight. The numbers, and nothing to read twice — what a move
    // actually does is spelled out in the pause menu's MOVES tab.
    const sel = list[this.subCursor];
    if (sel) {
      const line = this.sub === 'bag'
        ? ((DATA.items[sel.name] || {}).effect || '')
        : moveStatLine(sel);
      if (line) text(line, x + 8, y + h - 10, '#8a8a94');
    }
  },
};
