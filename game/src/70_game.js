// ---------------------------------------------------------------- content & game loop
// Story triggers, NPC dialogue, notes, and the state machine that runs them.
// Nobody in Okobo ever asks the player a question.

const NOTES = {
  ration_card: {
    title: 'RATION CARD',
    pages: [
      'LIMPO DOMESTIC ALLOTMENT - BOOK 9. Household of four. Expires end of season.',
      'Three of the four columns have been used up. It is nine years out of date.',
    ],
  },
  tied_branch: {
    title: 'TIED TO A BRANCH',
    pages: ['If the water goes down, this is where the good tree was.'],
  },
};

const SHOP_STOCK = ['Spray', 'Clean Rag'];

// --- NPC lines ---------------------------------------------------------
// Limpo villagers attach a redundant location to statements about time.
// Nobody asks the player anything.
const NPCS = {
  okobo_woman: () => {
    if (Player.flags.wellDone) {
      return ['Oh - you got it. That is the bucket, alright.',
              'Back-when, over in the spring, that rope was new.'];
    }
    if (Player.flags.wellBucket) {
      Player.flags.wellBucket = false; Player.flags.wellDone = true;
      Player.money += 120;
      return ['Oh - you got it. That is the bucket, alright.',
              'Here. It is not much. Nothing is, back-when.',
              '(Got 120 Rell.)'];
    }
    if (Player.flags.wellQuest) {
      return ['It is down the well. That is rather the problem with it.'];
    }
    Player.flags.wellQuest = true;
    return ['Oh, you are the one who came down the hill.',
            'Everyone said someone came down the hill.',
            'Well. Welcome down, then.',
            'Say - the well bucket went in the well. Rope broke, later-on, up in the morning.',
            'If you are going past it anyway.'];
  },
  okobo_man: () => ([
    'You will want the well if you are thirsty. Middle of town, cannot miss it.',
    'Rope is broken, back-when, but the water is fine.',
    'Limpo? You are standing in it. Well - Okobo is in it, and it is in Limpo.',
    'Same thing from far enough off.',
  ]),
  okobo_child: () => ([
    'Are you staying? Everybody is leaving.',
    'Not in a bad way. Just - later-on, up in the spring, mostly.',
  ]),
  okobo_elder: () => ([
    'It has been thin here a long while. Two hundred years of thin.',
    'You get used to which fields you do not bother with.',
    'Over east they do alright. They have been doing alright at us for a while now.',
  ]),
  innkeeper: () => ([
    'Bed is there if you want it. No charge. Nobody else is using it.',
  ]),
  shopkeeper: () => ([
    'Haven\'t seen you. That is alright, I do not see everyone.',
  ]),
  hess: () => {
    if (Player.flags.letterDone) {
      return ['Thank you for going. I know what is out there.',
              'I wanted someone to go anyway.'];
    }
    if (Player.flags.letterDelivered) {
      Player.flags.letterDelivered = false; Player.flags.letterDone = true;
      Player.money += 200;
      return ['You went all the way out. There is nothing there, is there.',
              'No. I knew that.',
              'Take this. Please.',
              '(Got 200 Rell.)'];
    }
    if (Player.flags.letterQuest) {
      return ['North road. Past the trees. The address is out that way.'];
    }
    Player.flags.letterQuest = true;
    return ['You are going north? Take this, if you are.',
            'It is for my brother. The address is on the north road.',
            'He went off. Later-on, up in the spring. That was some springs ago now.',
            '(Got a letter.)'];
  },
};

// --- interactions ------------------------------------------------------
function interact() {
  const target = World.facing();
  const exit = World.exitAt(Player.x, Player.y);

  if (!target) {
    if (exit) return;
    return;
  }

  if (target.kind === 'npc') {
    if (target.shop) {
      Dialogue.say(NPCS.shopkeeper().map(t => ({ text: t, speaker: 'npc' })), () => {
        Shop.start(SHOP_STOCK); Game.mode = 'shop';
      });
      return;
    }
    Player.flags.talked = (Player.flags.talked || 0) + 1;
    const lines = NPCS[target.key] ? NPCS[target.key]() : ['...'];
    Dialogue.say(lines.map(t => ({ text: t, speaker: 'npc' })));
    return;
  }

  if (target.kind !== 'object') return;
  const o = target;

  switch (o.t) {
    case 'door':
      if (World.id === 'bedroom') { Story.bedroomDoor(); return; }
      break;
    case 'bed':
      if (World.id === 'bedroom') { Story.bedroomBed(); return; }
      if (o.save) {
        Player.restore();
        const ok = Save.write();
        Dialogue.say([{ text: 'He sat down and wrote in the notebook.', speaker: 'system' },
                      { text: ok ? 'SAVED. HP, PP AND SP RESTORED.' : 'HP, PP AND SP RESTORED.', speaker: 'system' }]);
        Audio_.sfx('found');
        return;
      }
      Dialogue.say([{ text: 'A bed.', speaker: 'system' }]);
      return;
    case 'window':
      Dialogue.say([{ text: "It's dark out. The neighbours' lights are off.", speaker: 'system' }]);
      return;
    case 'poster':
      Dialogue.say([{ text: "He's had it a long time.", speaker: 'system' }]);
      return;
    case 'dresser':
      Dialogue.say([{ text: 'The second drawer sticks.', speaker: 'system' }]);
      return;
    case 'switch':
      if (Player.flags.hallLight === false) {
        Player.flags.roomLight = true;
        Dialogue.say([{ text: 'The room light comes on.', speaker: 'system' }]);
      } else {
        Dialogue.say([{ text: 'Nothing happens. The hall light is the only one on.',
                        speaker: 'system' }]);
      }
      return;
    case 'well':
      if (Player.flags.wellQuest && !Player.flags.wellBucket && !Player.flags.wellDone) {
        Player.flags.wellBucket = true;
        Audio_.sfx('found');
        Dialogue.say([{ text: 'The bucket is at the bottom of the well, obviously.', speaker: 'system' },
                      { text: '(Got the well bucket.)', speaker: 'system' }]);
        return;
      }
      Dialogue.say([{ text: 'A well. The rope is broken.', speaker: 'system' }]);
      return;
    case 'memorial':
      Dialogue.say([{ text: 'A list of names, cut into stone.', speaker: 'system' },
                    { text: 'It is a long list for a village this size.', speaker: 'system' }]);
      return;
    case 'foundation':
      if (Player.flags.letterQuest && !Player.flags.letterDone) {
        Player.flags.letterDelivered = true;
        Dialogue.say([{ text: 'A foundation with nothing on it. Weeds in the corners.', speaker: 'system' },
                      { text: 'This is the address.', speaker: 'system' },
                      { text: 'He leaves the letter on the stone.', speaker: 'system' }]);
        return;
      }
      Dialogue.say([{ text: 'A foundation with nothing on it.', speaker: 'system' }]);
      return;
    case 'painting': {
      const desc = {
        obelisk: 'A tall stone, standing in water.',
        sphere: 'A round stone, standing in water.',
        pyramid: 'A pointed stone, standing in water.',
        cube: 'A square stone, standing in water.',
        spire: 'A tall stone, standing in water.\nIt is in a smaller frame than the others.',
      }[o.shape];
      Dialogue.say([{ text: desc, speaker: 'system' }]);
      return;
    }
    case 'note': {
      const n = NOTES[o.note];
      if (!Player.notes.includes(o.note)) Player.notes.push(o.note);
      Audio_.sfx('found');
      Dialogue.say(n.pages.map(t => ({ text: t, speaker: 'system' })));
      return;
    }
    case 'collectible': {
      Player.flags['got_' + o.which] = true;
      Player.collectibles++;
      World.entities = World.entities.filter(e => e !== o);
      Audio_.sfx('found');
      Dialogue.say([{ text: 'A marble. Cloudy, with a green thread in it.', speaker: 'system' },
                    { text: `FOUND ${Player.collectibles} OF 10.`, speaker: 'system' }]);
      return;
    }
  }
  Dialogue.say([{ text: 'Nothing to do with it.', speaker: 'system' }]);
}

// --- story beats -------------------------------------------------------
const Story = {
  bedroomDoor() {
    const n = (Player.flags.doorCount || 0) + 1;
    Player.flags.doorCount = n;
    // Procedurally generated per interaction: there is genuinely nothing to get.
    const blocks = () => {
      const w = () => '@'.repeat(2 + ((Math.random() * 5) | 0));
      return `${w()} ${w()}... ${w()} ${w()} ${w()}.`;
    };
    if (n >= 3) {
      Dialogue.say([
        { text: blocks(), speaker: 'system' },
        { text: "They're arguing again.", speaker: 'system' },
      ], () => this.slam());
      return;
    }
    Dialogue.say([
      { text: blocks(), speaker: 'system' },
      { text: "They're arguing again.", speaker: 'system' },
    ]);
  },

  slam() {
    Fade.out(() => {
      Audio_.sfx('slam');
      Player.flags.hallLight = false;
      Player.flags.canSleep = true;
      Audio_.stopDrones();
      Audio_.current = null;
      Audio_.play('bedroom');
    }, 1.6);
  },

  bedroomBed() {
    if (!Player.flags.canSleep) {
      Dialogue.say([{ text: 'He is not tired yet.', speaker: 'system' }]);
      return;
    }
    Dialogue.say([{ text: 'He goes to bed.', speaker: 'system' }], () => {
      Game.mode = 'cutscene';
      Cutscene.play('sleep');
    });
  },

  fall() { Game.mode = 'cutscene'; Cutscene.play('fall'); },

  // Non-interactive. No music change. The game does not acknowledge it.
  maybeCustodian() {
    if (Player.flags.sawCustodian) return;
    if (World.id !== 'okobo') return;
    if ((Player.flags.talked || 0) < 3) return;
    Player.flags.sawCustodian = true;
    // At the end of a street the player cannot reach - but on screen, or the
    // beat does not land. Placed relative to the camera, never behind him.
    const dirs = [[92, -40], [-92, -40], [0, -74], [92, 40]];
    const d = dirs[(Math.random() * dirs.length) | 0];
    const x = Math.max(20, Math.min(World.w * TS - 20, Player.x + d[0]));
    const y = Math.max(20, Math.min(World.h * TS - 20, Player.y + d[1]));
    World.entities.push({ kind: 'custodian', x, y, t: 2.4 });
  },

  bossRoom() {
    if (Player.flags.beatBoss) return;
    if (World.id !== 'clearing') return;
    if (Player.flags.bossStarting) return;
    Player.flags.bossStarting = true;
    Dialogue.say([
      { text: 'The water is deeper here.', speaker: 'system' },
      { text: 'One tree in the clearing is not the same tree.', speaker: 'system' },
    ], () => {
      const bd = DATA.bosses['The Fruiting Tree'];
      const enc = DATA.bossEncounters['The Fruiting Tree'];
      const e = Battle.makeEnemy('The Fruiting Tree', {
        name: 'THE FRUITING TREE', level: enc.internal_level, boss: true,
        hpMul: bd.hp_multiplier, atkMul: bd.atk_multiplier,
        phases: bd.phases, exp: enc.exp, scale: 4,
      });
      Game.mode = 'battle';
      Battle.start(e, null, (result) => {
        Player.flags.bossStarting = false;
        if (result === 'won') {
          Player.flags.beatBoss = true;
          Player.addItem('Spray II', 3);
          Game.mode = 'field';
          Audio_.play('orchard');
          Dialogue.say([
            { text: 'The tree came apart. The water is very still.', speaker: 'system' },
            { text: '(Got Spray II x3.)', speaker: 'system' },
          ], () => { Game.mode = 'cutscene'; Cutscene.play('slice_end'); });
        } else {
          Game.mode = 'field';
          Game.onDefeat();
        }
      });
    });
  },
};

// --- cutscenes ---------------------------------------------------------
const Cutscene = {
  name: null, t: 0,
  play(name) { this.name = name; this.t = 0; if (name === 'fall') Audio_.play('void'); },
  update(dt) {
    this.t += dt;
    const skip = Input.hit('ok');
    switch (this.name) {
      case 'sleep':
        if (this.t > 3.2 || skip) {
          this.name = null;
          Fade.out(() => { World.load('void'); Game.mode = 'field'; }, 1.4);
        }
        break;
      case 'fall':
        if (this.t > 7.5 || (skip && this.t > 1.5)) {
          this.name = null;
          Fade.out(() => {
            World.load('arrival');
            Game.mode = 'field';
            Dialogue.say([
              { text: 'He wakes face-down in grass.', speaker: 'system' },
              { text: 'The sky is the wrong colour. Not badly. Just wrong.', speaker: 'system' },
            ]);
          }, 1.2);
        }
        break;
      case 'slice_end':
        if (this.t > 6.5 || (skip && this.t > 1.2)) { this.name = null; Game.mode = 'end'; }
        break;
    }
  },
  draw() {
    switch (this.name) {
      case 'sleep':
        rect(0, 0, W, H, '#000');
        cx.globalAlpha = Math.max(0, 1 - this.t / 2.2);
        textCentered('...', W / 2, H / 2, '#3a3a44');
        cx.globalAlpha = 1;
        break;
      case 'fall': {
        rect(0, 0, W, H, '#000');
        // No ground, no end, no fall damage. Just falling.
        for (let i = 0; i < 40; i++) {
          const seed = hash2(i, 7);
          const y = ((seed * H + this.t * (60 + seed * 140)) % (H + 20)) - 10;
          const x = (hash2(i * 3, 11) * W) | 0;
          cx.globalAlpha = 0.12 + seed * 0.2;
          rect(x, H - y, 1, 3 + seed * 5, '#5a5a6a');
        }
        cx.globalAlpha = 1;
        const py = 60 + Math.sin(this.t * 1.6) * 8;
        cx.save();
        cx.translate(W / 2 - 14, py);
        cx.rotate(Math.sin(this.t * 0.9) * 0.28);
        cx.scale(2, 2);
        sprite('player_down', 0, 0, 'player');
        cx.restore();
        grain(0.07);
        vignette(1.0, W / 2, py + 16, 110);
        break;
      }
      case 'slice_end': {
        rect(0, 0, W, H, '#05050a');
        const a = Math.min(1, this.t / 1.2);
        cx.globalAlpha = a;
        textCentered('OVERGROWTH', W / 2, 52, '#e8e4da', 3);
        textCentered('0.1.0  -  vertical slice ends here', W / 2, 72, '#6a6a76');
        textCentered('Limpo Kingdom continues in a later build.', W / 2, 92, '#4a4a56');
        cx.globalAlpha = Math.max(0, Math.min(1, (this.t - 2.4) / 1.2));
        textCentered(`${Player.name}  -  Lv ${Player.level}  -  ${Player.collectibles}/10 found`,
                     W / 2, 116, '#8a8a94');
        cx.globalAlpha = 1;
        grain(0.05);
        break;
      }
    }
  },
};

// --- game --------------------------------------------------------------
const Game = {
  mode: 'title',      // title | name | field | battle | menu | shop | cutscene | end
  encounterCooldown: 0,

  startNewGame() {
    Player.level = 1; Player.exp = 0; Player.money = 0;
    Player.bag = {}; Player.flags = {}; Player.notes = []; Player.collectibles = 0;
    Player.restore();
    Player.addItem('Spray', 2);
    Save.clear();
    World.load('bedroom');
    this.mode = 'field';
  },

  onDefeat() {
    const lost = Math.floor(Player.money / 2);
    Player.money -= lost;
    Player.restore();
    Fade.out(() => {
      World.load('inn');
      Dialogue.say([
        { text: 'He wakes up somewhere else. Someone put him here.', speaker: 'system' },
        { text: `LOST ${lost} RELL.`, speaker: 'system' },
      ]);
    }, 1.4);
  },

  update(dt) {
    Fade.update(dt);
    if (Fade.busy && Fade.a > 0.99) return;

    if (this.mode === 'title') { Title.update(dt); return; }
    if (this.mode === 'name') { NameEntry.update(dt); return; }
    if (this.mode === 'options') { Options.update(dt); return; }
    if (this.mode === 'cutscene') { Cutscene.update(dt); return; }
    if (this.mode === 'end') {
      if (Input.hit('ok')) { this.mode = 'title'; Title.enter(); }
      return;
    }
    if (this.mode === 'shop') { Shop.update(dt); if (!Shop.open) this.mode = 'field'; return; }
    if (this.mode === 'menu') { Menu.update(dt); if (!Menu.open) this.mode = 'field'; return; }
    if (this.mode === 'battle') { Battle.update(dt); return; }

    // field
    if (Dialogue.active) { Dialogue.update(dt); return; }
    if (Fade.busy) return;

    if (Input.hit('menu')) { Menu.open = true; Menu.cursor = 0; this.mode = 'menu'; Audio_.sfx('ok'); return; }

    Player.update(dt);
    World.update(dt);
    this.encounterCooldown = Math.max(0, this.encounterCooldown - dt);

    // Custodian sighting: visible for a moment, then simply not there.
    for (const e of World.entities) {
      if (e.kind === 'custodian') {
        e.t -= dt;
        if (e.t <= 0) World.entities = World.entities.filter(x => x !== e);
      }
    }
    Story.maybeCustodian();
    Story.bossRoom();

    if (Input.hit('ok')) interact();

    const exit = World.exitArmed ? World.exitAt(Player.x, Player.y) : null;
    if (exit && !Fade.busy) {
      if (exit.to === 'fall') { Story.fall(); return; }
      if (exit.sfx) Audio_.sfx(exit.sfx);
      Fade.out(() => { World.load(exit.to, exit.at); this.encounterCooldown = 0.7; }, 3.2);
      return;
    }

    if (this.encounterCooldown <= 0) {
      const foe = World.touchedEnemy();
      if (foe) {
        const e = Battle.makeEnemy(foe.species);
        this.mode = 'battle';
        Battle.start(e, foe, (result, ref) => {
          this.mode = 'field';
          Audio_.play(World.room.music || 'none');
          this.encounterCooldown = 1.1;
          if (result === 'won') World.entities = World.entities.filter(x => x !== ref);
          else if (result === 'fled') { if (ref) ref.cool = 2.2; }
          else this.onDefeat();
        });
      }
    }
  },

  draw() {
    cx.clearRect(0, 0, W, H);
    if (this.mode === 'title') { Title.draw(); Fade.draw(); return; }
    if (this.mode === 'name') { NameEntry.draw(); Fade.draw(); return; }
    if (this.mode === 'options') { Options.draw(); Fade.draw(); return; }
    if (this.mode === 'cutscene' || this.mode === 'end') { Cutscene.draw(); Fade.draw(); return; }
    if (this.mode === 'battle') { Battle.draw(); Fade.draw(); return; }

    World.draw();

    // Custodian, drawn on top of everything, lit from a source not in the room.
    for (const e of World.entities) {
      if (e.kind !== 'custodian') continue;
      const px = Math.round(e.x - World.camX), py = Math.round(e.y - World.camY);
      const w = spriteWidth('custodian'), h = spriteHeight('custodian');
      cx.globalAlpha = 0.35; rect(px - 6, py + 1, 13, 3, '#000'); cx.globalAlpha = 1;
      sprite('custodian', px - w / 2, py - h + 3, 'custodian');
    }

    const r = World.room;
    let light = r.light !== undefined ? r.light : 0.4;
    let lx = Player.x - World.camX, ly = Player.y - World.camY;
    let radius = r.dark ? 62 : 128;
    if (World.id === 'bedroom') {
      if (Player.flags.roomLight) { light = 0.35; radius = 150; }
      else if (Player.flags.hallLight === false) { light = 1.15; radius = 46; }
      else {
        // Lit only by the strip under the door, from across the room.
        lx = r.lightAt[0] * TS - World.camX + TS / 2;
        ly = r.lightAt[1] * TS - World.camY;
        radius = 108;
      }
    }
    vignette(light, lx, ly, radius);
    if (r.bright) tintScreen('#ffe6b0', 0.05);
    grain(r.grain !== undefined ? r.grain : 0.04);

    if (this.mode === 'shop') Shop.draw();
    else if (this.mode === 'menu') Menu.draw();
    else Hud.draw();

    Dialogue.draw();
    Fade.draw();
  },
};

// Minimal field HUD — location and a nudge, nothing else.
const Hud = {
  draw() {
    if (Dialogue.active) return;
    const label = ROOM_LABEL[World.id];
    if (label) {
      rect(4, 4, textWidth(label) + 8, 11, 'rgba(6,6,10,0.6)');
      text(label, 8, 6, '#8a8a94');
    }
  },
};

const ROOM_LABEL = {
  bedroom: '', void: '', gallery_ext: '', gallery_hall: '', gallery_room: '',
  gallery_corridor: '', arrival: 'LIMPO KINGDOM', okobo: 'OKOBO VILLAGE',
  shop: 'OKOBO - SHOP', inn: 'OKOBO - INN', house: 'OKOBO - HOUSE',
  north_road: 'NORTH ROAD', orchard1: 'THE SUNKEN ORCHARD',
  orchard2: 'THE SUNKEN ORCHARD', orchard3: 'THE SUNKEN ORCHARD',
  clearing: 'THE SUNKEN ORCHARD',
};

// --- boot --------------------------------------------------------------
Options.load();
World.load('bedroom');
Title.enter();
Game.mode = 'title';
requestAnimationFrame(frame);
