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
  water_board: {
    title: 'WATER BOARD NOTICE',
    pages: ['The board has reviewed the drainage petition and finds no fault in the current arrangement.',
            'The board thanks the petitioners for their continued patience.'],
  },
  work_order: {
    title: 'MUNICIPAL WORK ORDER',
    pages: ['Fountain, central park. Valve closed for the duration of rationing.',
            'Reopen at the direction of the parks office.',
            'No reopening order is attached.'],
  },
  ledger: {
    title: 'BOARDING HOUSE LEDGER',
    pages: ['Room 3 - paid. Room 5 - paid.',
            'Room 7 - no answer. Room 7 - no answer.',
            'Room 7 - took the sheets, left the key.'],
  },
  // The Kestrel sequence, found floor by floor going up.
  notice_year_one: {
    title: 'KESTREL NOTICE, YEAR ONE',
    pages: ['Owing to the reduced order book, third shift will be consolidated into second.',
            'No positions are affected.'],
  },
  notice_year_four: {
    title: 'KESTREL NOTICE, YEAR FOUR',
    pages: ['Effective the 14th, second shift is suspended.',
            'Affected staff should collect final pay from the yard office.',
            'We thank you for eleven years.'],
  },
  shift_schedule: {
    title: 'SHIFT SCHEDULE',
    pages: ['A duty roster for a week in winter. Eleven names.',
            'Four are crossed out in pen.',
            'One is crossed out and then written back in underneath, in different handwriting.'],
  },
  in_a_locker: {
    title: 'IN A LOCKER',
    pages: ['Ma - they say through spring at the latest.',
            'I will come see you either way. Do not do the stairs.'],
  },
  safety_inspection: {
    title: 'SAFETY INSPECTION',
    pages: ['Items 1 to 14: satisfactory.',
            'Item 15: heating, north floor - unsatisfactory.',
            'Item 15: heating, north floor - unsatisfactory.',
            'Item 15: heating, north floor - unsatisfactory.'],
  },
  last_one_out: {
    title: 'ON THE DOOR',
    pages: ["Whoever is last out, the yard lights are on the panel by the gate.",
            'Nobody is coming to do it.'],
  },
};

const SHOP_STOCK = ['Spray', 'Clean Rag'];
const ONDO_STOCK = ['Spray', 'Spray II', 'Chalk Tablet', 'Bitter Tonic',
                    'Clean Rag', 'Knuckle Wrap', 'Cold Compress', 'Dropped Call'];

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
  ondo_clerk: () => {
    if (Player.flags.fountainDone) return ['It is still closed. I know.'];
    Player.flags.fountainQuest = true;
    return ['You are looking at the fountain. Everyone looks at the fountain.',
            'It has not run since the rationing, back-when.',
            'The valve is closed. I know where the valve is.',
            'Nobody is in charge of opening it. That is the whole of it.'];
  },
  ondo_baker: () => ([
    'Do not buy from the grocer. I will say no more than that.',
    'Well - I will say one more thing. He knows what he did.',
    'Later-on, up in the summer, I might let it go.',
  ]),
  ondo_bench: () => {
    if (Player.flags.benchDone) {
      return ['Sit any time. I am generally here.'];
    }
    Player.flags.benchDone = true;
    Player.money += 250;
    return ['Sit down a minute, if you are not busy.',
            'My brother was at Kestrel. Eleven years, they said, when they let him go.',
            'Eleven years is a strange thing to thank somebody for.',
            'He went north after. Everyone goes north after.',
            'Anyway. That is all it was. Thank you for sitting.',
            '(Got 250 Rell.)'];
  },
  ondo_courier: () => {
    if (Player.flags.deliveryDone) return ['All three arrived. That is rare.'];
    if (Player.flags.deliveryQuest) return ['Northside. Past the winter road. It is a walk.'];
    Player.flags.deliveryQuest = true;
    return ['You are going out that way? Take these.',
            'Three parcels, Northside. Nobody has gone out there since the works closed.',
            'Pay is good because the walk is bad.'];
  },
  ondo_shopkeeper: () => (['Whole market row, and it is mostly me now.']),
  ondo_innkeeper: () => (['Bed is upstairs. Sign the book if you like. Nobody reads it.']),
  // Sidequest 6. Three overdue rents. Two pay. One has left.
  landlady: () => {
    if (Player.flags.ledgerDone) {
      return ['Rooms 3 and 5 are square. Room 7 I will leave in the book.',
              'It looks better with a name in it, back-when.'];
    }
    if (Player.flags.ledgerQuest) {
      const got = ['rent3', 'rent5', 'roomSeven'].filter(f => Player.flags[f]).length;
      if (got < 3) return ['Three rooms owing. 3, 5, and 7.',
                           'Knock. They are all in. Two of them, anyway.'];
      Player.flags.ledgerDone = true;
      Player.money += 400;
      Player.addItem('Chalk Tablet', 2);
      return ['Two paid and one is gone. That is the usual ratio now.',
              'Room 7. He said he was going inside. I said inside where.',
              'He did not answer that, and I did not ask twice.',
              '(Got 400 Rell and Chalk Tablet x2.)'];
    }
    Player.flags.ledgerQuest = true;
    return ['Rooms by the week. I have three owing and bad knees.',
            'Rooms 3, 5 and 7. Collect for me and I will make it worth it.',
            'Room 7 is free, if you are staying. It has been free a while.'];
  },
  tenant_three: () => {
    if (Player.flags.rent3) return ['Paid up. Do not look at me like that.'];
    if (!Player.flags.ledgerQuest) return ['I know what I owe. She knows what I owe.'];
    Player.flags.rent3 = true;
    return ['She sent a child. That is low, even for her.',
            'Here. It is all there. Count it in front of her, not me.'];
  },
  tenant_five: () => {
    if (Player.flags.rent5) return ['Tell her I paid the same day I was asked.'];
    if (!Player.flags.ledgerQuest) return ['Cold in the hall, is it not.'];
    Player.flags.rent5 = true;
    return ['Oh - the rent. Yes. I had it ready and then I forgot I had it ready.',
            'That happens more since the works closed. Here.'];
  },
  // Seen once. He is not in the hall the next time the player comes through,
  // and nothing in the game mentions that he was.
  boarder: () => {
    Player.flags.boarderSeen = true;
    return ['You are new. I was new.',
            'There was a man in room 7. Went inside and got better.',
            'That is how he put it. Went inside. Got better.',
            'I have been thinking about the order of those two things.'];
  },
  records_clerk: () => {
    if (Player.flags.recordsDone) return ['Filed. Properly, this time.'];
    if (Player.flags.recordsQuest) return ['It is in here. That is all I can tell you.'];
    Player.flags.recordsQuest = true;
    return ['I need a file and I cannot find it.',
            'It is misfiled. Everything in here is filed correctly except the one thing.',
            'Read the labels. That is the whole trick, back-when.'];
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
      const stock = target.shop === 'ondo' ? ONDO_STOCK : SHOP_STOCK;
      const lines = target.shop === 'ondo' ? NPCS.ondo_shopkeeper() : NPCS.shopkeeper();
      Dialogue.say(lines.map(t => ({ text: t, speaker: 'npc' })), () => {
        Shop.start(stock, target.shop === 'ondo' ? 'ONDO' : 'OKOBO'); Game.mode = 'shop';
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
    case 'fountain':
      if (Player.flags.fountainQuest && !Player.flags.fountainDone) {
        Player.flags.fountainDone = true;
        Player.money += 350;
        Dialogue.say([
          { text: 'The valve is behind a panel at the base. It is closed.', speaker: 'system' },
          { text: 'It is not stuck, or broken, or missing. Someone closed it during the rationing.', speaker: 'system' },
          { text: 'It opens easily.', speaker: 'system' },
          { text: '(Got 350 Rell.)', speaker: 'system' },
        ]);
        return;
      }
      Dialogue.say([{ text: Player.flags.fountainDone
        ? 'The fountain is running. Nobody has come to look at it.'
        : 'A dry fountain. Leaves in the basin.', speaker: 'system' }]);
      return;
    case 'billboard':
      Dialogue.say([
        { text: 'VIXTRY CO. - online co-living.', speaker: 'vixtry' },
        { text: 'Why commute? Why queue? Why wait?', speaker: 'vixtry' },
        { text: 'Ask about family plans.', speaker: 'vixtry' },
      ]);
      return;
    case 'milepost':
      Dialogue.say([{ text: 'A milepost. The number has worn off.', speaker: 'system' }]);
      return;
    case 'shrine':
      Dialogue.say([{ text: 'A roadside shrine. Someone has left a coin in it.', speaker: 'system' },
                    { text: 'It is a very old coin.', speaker: 'system' }]);
      return;
    case 'memorial_stone':
      Dialogue.say([{ text: 'A war memorial, in the yard of a factory that closed.', speaker: 'system' },
                    { text: 'The names are the same names as the shift roster inside.', speaker: 'system' },
                    { text: 'Not most of them. All of them.', speaker: 'system' }],
                   () => Story.memorialFight());
      return;
    case 'machine':
      Dialogue.say([{ text: 'A machine, stopped mid-cycle. Cold all the way through.', speaker: 'system' }]);
      return;
    case 'door7':
      if (Player.flags.roomSeven) {
        Dialogue.say([{ text: 'Room 7. Still open. Still nothing in it.', speaker: 'system' }]);
        return;
      }
      Player.flags.roomSeven = true;
      Audio_.sfx('door');
      Dialogue.say([{ text: 'Room 7. The door is not locked.', speaker: 'system' },
                    { text: 'Bed stripped, window shut, nothing on the floor.', speaker: 'system' },
                    { text: 'Nobody is going to be paying rent on this one.', speaker: 'system' }]);
      return;
    // Sidequest 8. Three parcels, three addresses, and no houses on the road.
    case 'parcel': {
      const key = 'parcel' + target.n;
      if (Player.flags[key]) {
        Dialogue.say([{ text: 'Delivered. The box has not been opened since.', speaker: 'system' }]);
        return;
      }
      if (!Player.flags.deliveryQuest) {
        Dialogue.say([{ text: 'A postbox. There is no house behind it.', speaker: 'system' }]);
        return;
      }
      Player.flags[key] = true;
      const left = [1, 2, 3].filter(n => !Player.flags['parcel' + n]).length;
      const lines = [{ text: 'A postbox. There is no house behind it.', speaker: 'system' },
                     { text: 'The address matches. He posts the parcel.', speaker: 'system' }];
      if (left === 0) {
        Player.flags.deliveryDone = true;
        Player.money += 500;
        lines.push({ text: 'That is all three. Northside is three postboxes.', speaker: 'system' });
        lines.push({ text: '(Got 500 Rell.)', speaker: 'system' });
      } else {
        lines.push({ text: left === 1 ? 'One more address, further out.'
                                      : 'Two more addresses, further out.', speaker: 'system' });
      }
      Dialogue.say(lines);
      return;
    }
    case 'locker':
      Dialogue.say([{ text: 'The lockers are open and empty.', speaker: 'system' },
                    { text: 'Every one of them. Nobody left anything behind.', speaker: 'system' }]);
      return;
    // Sidequest 13. No giver, no money, nobody to tell. The note asks; that is all.
    case 'panel':
      if (Player.flags.kestrelDark) {
        Dialogue.say([{ text: 'The breaker is off. It stays off.', speaker: 'system' }]);
        return;
      }
      if (!Player.notes.includes('last_one_out')) {
        Dialogue.say([{ text: 'A breaker panel by the gate. The yard lights run off it.', speaker: 'system' },
                      { text: 'They are somebody\'s to turn off. Not his.', speaker: 'system' }]);
        return;
      }
      Player.flags.yardLights = true;
      Audio_.sfx('door');
      Dialogue.say([
        { text: 'A breaker panel by the gate. Nobody is coming to do it.', speaker: 'system' },
        { text: 'He shuts the yard lights off.', speaker: 'system' },
      ], () => { Player.flags.kestrelDark = true; });
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
      if (o.note === 'work_order' && Player.flags.recordsQuest && !Player.flags.recordsDone) {
        Player.flags.recordsDone = true;
        Player.money += 450;
      }
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
      const found = {
        marble: 'A marble. Cloudy, with a green thread in it.',
        poster_corner: 'A torn corner of a poster. Blue, with part of a word on it.',
        loose_key: 'A loose key. It does not go to anything here.',
      }[o.which] || 'Something small. It does not belong here.';
      Dialogue.say([{ text: found, speaker: 'system' },
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

  // Second sighting: standing in a room the player has already cleared, on the
  // way back out. Gone if they leave and come back.
  maybeCustodian2() {
    if (Player.flags.sawCustodian2) return;
    if (World.id !== 'kestrel_f2') return;
    if (!Player.notes.includes('shift_schedule')) return;
    Player.flags.sawCustodian2 = true;
    const x = Math.max(20, Math.min(World.w * TS - 20, Player.x + 88));
    World.entities.push({ kind: 'custodian', x, y: Player.y - 30, t: 2.8 });
  },

  // The Memorial. Fought in the yard, beneath the war memorial, in snow.
  memorialFight() {
    if (Player.flags.beatMemorial || Player.flags.memorialStarting) return;
    if (World.id !== 'kestrel_yard') return;
    // Gated on reaching the bottom of the factory, not on the lights - sidequest
    // 13 is optional and gating the act's boss behind it would make it a lie.
    if (!Player.notes.includes('last_one_out')) return;
    Player.flags.memorialStarting = true;
    Dialogue.say([
      Player.flags.kestrelDark
        ? { text: 'With the lights off, the yard is much larger than it was.', speaker: 'system' }
        : { text: 'The yard lights hum. Under them, the yard is very quiet.', speaker: 'system' },
      { text: 'The memorial is still there. It is standing closer than it was.', speaker: 'system' },
    ], () => {
      const bd = DATA.bosses['The Memorial'];
      const enc = DATA.bossEncounters['The Memorial'];
      const e = Battle.makeEnemy('The Memorial', {
        name: 'THE MEMORIAL', level: enc.internal_level, boss: true,
        hpMul: bd.hp_multiplier, atkMul: bd.atk_multiplier,
        phases: bd.phases, exp: enc.exp, scale: 3, tiers: bd.tiers,
      });
      Game.mode = 'battle';
      Battle.start(e, null, (result) => {
        Player.flags.memorialStarting = false;
        if (result === 'won') {
          Player.flags.beatMemorial = true;
          Player.addItem('Second Wind', 1);
          Game.mode = 'field';
          Audio_.play('kestrel');
          Dialogue.say([
            { text: 'The last tier comes away and the yard is only a yard.', speaker: 'system' },
            { text: 'The names are still cut into it. They are not going anywhere.', speaker: 'system' },
            { text: '(Got Second Wind.)', speaker: 'system' },
          ], () => { Game.mode = 'cutscene'; Cutscene.play('slice_end'); });
        } else {
          Game.mode = 'field';
          Game.onDefeat();
        }
      });
    });
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
            { text: 'The far side of the orchard is open. There is a road out there.', speaker: 'system' },
          ]);
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
        if (this.t > 7.5 || (skip && this.t > 1.2)) { this.name = null; Game.mode = 'end'; }
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
        textCentered('END OF ACT TWO', W / 2, 72, '#6a6a76');
        textCentered('Yettallia, and Vixtry Co., in a later build.', W / 2, 92, '#4a4a56');
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
    Story.maybeCustodian2();
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
    if (World.id === 'kestrel_yard' && Player.flags.kestrelDark) {
      // Sidequest 13's only reward: the place gets darker and stays that way.
      light = 1.05; radius = 74;
    }
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
  road_ondo: 'THE ROAD TO ONDO', ondo: 'ONDO', ondo_shop: 'ONDO - MARKET ROW',
  ondo_inn: 'ONDO - INN', boarding_house: 'ONDO - BOARDING HOUSE',
  records_room: 'ONDO - RECORDS', winter_road: 'THE WINTER ROAD',
  kestrel_yard: 'KESTREL WORKS - YARD', kestrel_f1: 'KESTREL WORKS',
  kestrel_f2: 'KESTREL WORKS', kestrel_f3: 'KESTREL WORKS - LOCKERS',
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
