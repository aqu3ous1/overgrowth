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
  // --- Act 3 ---------------------------------------------------------
  border_order: {
    title: 'BORDER ORDER',
    pages: ['Crossings are suspended until the review concludes.',
            'The review concluded. The order was not withdrawn.'],
  },
  transit_complaint: {
    title: 'TRANSIT COMPLAINT FORM',
    pages: ['Nature of complaint: the 6:40 does not stop at Vell Street anymore.',
            'Resolution: Vell Street has been deprioritised owing to reduced ridership.'],
  },
  vixtry_flyer: {
    title: 'FLYER',
    pages: ['VIXTRY CO. - online co-living.',
            'Why commute? Why queue? Why wait?',
            'Ask about family plans.'],
  },
  demo_terms: {
    title: 'DEMO POD TERMS',
    pages: ['Session data is retained to improve the experience.',
            'Retention is indefinite because improvement is ongoing.',
            'Users may request a summary of their data at any time.'],
  },
  rent_notice: {
    title: 'RENT NOTICE',
    pages: ['Owing to improvements to the building, rents will rise by 12% from the first.',
            'We are proud to be investing in your home.'],
  },
  artists_statement: {
    title: "ARTIST'S STATEMENT",
    pages: ['The murals are meant to make the halls feel less long.',
            'Management has asked me to note that the halls are not long.'],
  },
  maintenance_log: {
    title: 'MAINTENANCE LOG',
    pages: ['4C - door. 4C - door. 4C - door.',
            '7B - nothing wrong, tenant wanted company.',
            '7B - nothing wrong.'],
  },
  left_with_super: {
    title: 'LEFT WITH THE SUPER',
    pages: ["Marcy - I'm leaving the key with the super.",
            "I don't think I'm coming back for the rest of it.",
            'Sorry about the wall. It was like that.'],
  },
  under_a_door: {
    title: 'SLID UNDER A DOOR',
    pages: ['Whoever keeps turning my television around -',
            "I know it's off. I know. Please stop."],
  },
  last_one_out: {
    title: 'ON THE DOOR',
    pages: ["Whoever is last out, the yard lights are on the panel by the gate.",
            'Nobody is coming to do it.'],
  },
  // --- Act 3, the parts of Sable and Bellhouse that are optional ------
  market_pricing: {
    title: 'PRICING SHEET',
    pages: ['Stallholders are reminded that the rent is calculated on footfall.',
            'Footfall is measured at the entrance, not at the stall.'],
  },
  overpass_sign: {
    title: 'ON THE RAILING',
    pages: ['THIS WALKWAY IS FOR THE CONVENIENCE OF PEDESTRIANS.',
            'Underneath, in marker: it is for the convenience of the road.'],
  },
  under_the_rail: {
    title: 'SERVICE NOTICE',
    pages: ['Access below the line is restricted to authorised staff.',
            'The lock was replaced in the spring. The door was not.'],
  },
  four_c_door: {
    title: 'TAPED INSIDE 4C',
    pages: ['They came about the door four times.',
            'The door was never the thing that was wrong.'],
  },
  mural_key: {
    title: 'MURAL KEY',
    pages: ['Panel 1: the orchard. Panel 2: the works. Panel 3: the hill.',
            'Panel 4 is not listed. Panel 4 is a bedroom.'],
  },
  still_in_the_drum: {
    title: 'ON THE LID',
    pages: ['Sorry - back for these Tuesday.',
            'The load inside is dry. It has been dry a long time.'],
  },
  // --- Act 4. The campus is where the picture finishes assembling ------
  campus_welcome: {
    title: 'AT THE GATE',
    pages: ['VIXTRY REGIONAL CAMPUS. Visitors are welcome and are not signed in.',
            'Signing in was discontinued as a barrier to participation.'],
  },
  campus_directory: {
    title: 'FLOOR DIRECTORY',
    pages: ['Ground: reception, refreshment, demonstration.',
            'One: retention. Two: acquisition. Three: retention.',
            'There is no three.'],
  },
  campus_memo_retention: {
    title: 'INTERNAL - RETENTION',
    pages: ['Dependency is not a side effect of the product. Dependency is the product.',
            'A user who can leave is a user who has not finished onboarding.',
            'Please do not circulate this phrasing outside the floor.'],
  },
  campus_memo_subject: {
    title: 'INTERNAL - SUBJECT NINE',
    pages: ['Subject nine remains the only trial to hold shape past the second week.',
            'Subject nine is eleven years old and is not aware of the trial.',
            'Recommend no contact. Recommend observation only.',
            'Recommend we do not wake him while the numbers are this good.'],
  },
  campus_pod_terms: {
    title: 'DEMONSTRATION TERMS',
    pages: ['A demonstration lasts as long as the participant wishes.',
            'Wishing is measured by session length.'],
  },
  campus_retention_log: {
    title: 'RETENTION LOG',
    pages: ['Household 4114: four registered, four resident, four sessions open.',
            'Household 4114: three sessions open.',
            'Household 4114: one session open, duration nine years.',
            'Flag: do not close.'],
  },
  campus_apology_draft: {
    title: 'A DRAFT, TWICE',
    pages: ['I am sorry about this. I want to say that first.',
            'Beneath it, the same sentence, written out again, more slowly.'],
  },
  long_hall_inventory: {
    title: 'INVENTORY, HALLWAY',
    pages: ['Frames: 41. Works: 41.',
            'Frames: 41. Works: 0.',
            'No discrepancy noted.'],
  },
  long_hall_last: {
    title: 'ON THE FLOOR, FACE DOWN',
    pages: ['The grass is a maintenance issue and has been raised as one.',
            'It is not a maintenance issue.'],
  },
};

// Every counter sells the list data/shops.json gives its act, gear included.
// The lists used to be retyped here, which is how the game shipped three acts
// where no shop anywhere stocked a single piece of equipment: the design had
// them, the export only ever carried act 1, and this copy carried none.
const actStock = act => (DATA.shopStock[act] || []).slice();

// Food, not equipment. Cheaper per point than the market row and he knows it.
const GROCER_STOCK = ['Spray', 'Chalk Tablet', 'Bitter Tonic'];
const STOCKS = {
  okobo: actStock(1),
  ondo: actStock(2),
  grocer: GROCER_STOCK,
  sable: actStock(3),
  // A vending machine, which is the only shop on the campus and takes Rell
  // without commenting on it.
  campus: actStock(4),
};
const SHOP_STOCK = STOCKS.okobo;
const SHOP_TITLES = { okobo: 'OKOBO', ondo: 'ONDO', grocer: 'GROCER',
                      sable: 'SABLE CITY', campus: 'VENDING' };

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
  // He has heard about the note. He is not going to be the one to mention it.
  ondo_grocer: () => ([
    'Come in. Mind the step, it has been like that for years.',
    'You have been up the row, then. Talked to him.',
    'He is not wrong, is the thing. That is what gets me.',
  ]),
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
  // --- Act 3. Yettallia is louder, richer, and worse. -------------------
  sable_local: () => ([
    'You came in off the border road? Nobody comes in off the border road.',
    'It is all right here. It is loud. You stop hearing it.',
    'Everything you need is on this street. That is the idea.',
  ]),
  sable_kid: () => ([
    'My mum is in the pod at the arcade. She has been in since the morning.',
    'It is fine. You can wave and she waves.',
  ]),
  sable_rail: () => {
    if (Player.flags.railTold) {
      return ['Bellhouse. South end of the street, past the lights.'];
    }
    Player.flags.railTold = true;
    return ['Line is out to the Commons and back. Bellhouse Commons.',
            'Big place. Half of it empty and the rent still went up.',
            'If you are looking for somewhere to go, it is somewhere to go.'];
  },
  sable_waiting: () => ([
    'I am not waiting for a train. I am waiting for the desk to be free.',
    'They only take so many a day. It is fair, I suppose.',
  ]),
  sable_tenant: () => ([
    'Rent here is four times Ondo and I still could not tell you why.',
    'You get used to the light. The window does not open.',
  ]),
  arcade_attendant: () => ([
    'Six pods, all booked. It is always six pods and always booked.',
    'Sessions run as long as you like. That is the whole appeal.',
    'People do come out. I have seen it.',
  ]),
  // --- the market row -------------------------------------------------
  // Yettallians do the opposite of the Limpo tic: they strip time out of
  // sentences that need it, so everything sounds like it is happening now.
  market_fruit: () => ([
    'Fruit is fruit. You want the orchard stuff, that is two countries back.',
    'This is greenhouse. Grows under a light, tastes like it.',
    'Nobody complains. Everybody buys.',
  ]),
  market_repairs: () => {
    if (Player.flags.marketRepairs) {
      return ['Still here. Still fixing things nobody collects.'];
    }
    Player.flags.marketRepairs = true;
    return ['I fix things. Radios, mostly, and radios are mostly nothing now.',
            'People bring them in, I mend them, they do not come back for them.',
            'I have a shelf of other people\'s music at the back.',
            'You want a thing to carry? Take a look. It is not doing anything here.'];
  },
  market_leaving: () => ([
    'Selling up. Not going to Vixtry, before you ask - everyone asks.',
    'Just going. There is a difference and I am tired of explaining it.',
  ]),
  overpass_watcher: () => {
    if (Player.flags.overpassSeen) {
      return ['Still counting. It does not go down.'];
    }
    Player.flags.overpassSeen = true;
    return ['Good spot, this. You can see the whole line from here.',
            'I count the ones going in and the ones coming out.',
            'The numbers do not match. They have not matched for a while.',
            'I am not saying anything by that. I am just saying the numbers.'];
  },
  // --- Bellhouse: the occupied apartments -----------------------------
  tenant_4c: () => ([
    'The door was fine. I told them four times the door was fine.',
    'It is the hallway. The hallway is the wrong length on Tuesdays.',
    'They sent a man about the door.',
  ]),
  tenant_laundry: () => {
    if (Player.flags.laundrySeen) {
      return ['Tuesday. I said Tuesday.'];
    }
    Player.flags.laundrySeen = true;
    return ['That is not my load. Mine is the far one.',
            'That one has been in since before I moved up.',
            'You do not take somebody else\'s things out. That is not done.',
            'They will come back for it. Tuesday, probably.'];
  },
  // --- Act 4. Vixtry staff talk like the menu: no contractions, complete
  // sentences, and every one of them is pleased to see him.
  campus_greeter: () => ([
    'You are welcome to walk wherever you like. There is nowhere you should not go.',
    'People find that difficult at first.',
  ]),
  campus_desk: () => {
    if (Player.flags.deskAsked) {
      return ['You are still expected. That does not expire.'];
    }
    Player.flags.deskAsked = true;
    return ['Good morning. You are on the list.',
            'I did not ask for your name. It was already on the list.',
            'Is there anything you would like to know?',
            'That was not a question. I am sorry. It is on the card.'];
  },
  campus_intern: () => ([
    'First month. I am told the first month is the hardest and then it is not hard.',
    'I do not know what we make. I know what my part of it does.',
    'My part of it counts how long people stay.',
  ]),
  campus_engineer: () => {
    if (Player.flags.engineerSaid) {
      return ['I did say I would deny it. This is me denying it.'];
    }
    Player.flags.engineerSaid = true;
    return ['You are the trial. You know that.',
            'You are not the first. You are the first that held.',
            'The others came apart inside a fortnight. They went home.',
            'I am going to say something and then deny that I said it.',
            'Nobody is coming to get you. There is no one left at that address.'];
  },
  campus_byname: () => {
    // The greeting, again, from someone who has no reason to know it.
    const n = Player.name;
    return [`Morning, ${n}.`,
            'How is your mother?'];
  },
  campus_janitor: () => ([
    'I do the floors. Not the halls - the halls are not mine.',
    'There is grass in the halls. I have raised it.',
    'They keep telling me it is not a maintenance issue.',
  ]),
  campus_pod_host: () => ([
    'Any of them. They are all the same session.',
    'The open one is open because somebody finished. That does happen.',
  ]),
  sable_shopkeeper: () => ([
    'Everything is in. Everything is always in. That is Sable.',
  ]),
  sable_innkeeper: () => ([
    'Room is upstairs. Nobody signs anything here, we have a system.',
  ]),
  // The recruitment desk. Soft, sincere, and it means every word.
  vixtry_desk: () => {
    if (Player.flags.deskHeard) {
      return ['Take a flyer. Take two, if there is someone at home.'];
    }
    Player.flags.deskHeard = true;
    return ['Hello. Have you got a minute? It is only a minute.',
            'You would not commute. You would not queue. You would not wait.',
            'People say it sounds like giving something up. It is the opposite.',
            'You would be with everyone. All of the time. That is all it is.'];
  },
  // A grunt, who does not know which part of this is the significant part.
  vixtry_recruiter: () => {
    if (Player.flags.fatherLine) {
      return ['Intake is quarterly. Come back and ask for me.'];
    }
    Player.flags.fatherLine = true;
    return ['Intake, is it? You are young for it. That is not a no.',
            'We take from everywhere. Limpo, mostly, lately.',
            'Half the floor upstairs is Limpo. Good workers. Quiet.',
            'One of them has your face on him, actually. Older. Same look.',
            'Anyway. Fill this in and somebody will find you.'];
  },
  bellhouse_super: () => {
    if (Player.flags.superTold) {
      return ['Top floor is top floor. It is further than it looks.'];
    }
    Player.flags.superTold = true;
    return ['You will want the top. Everybody wants the top.',
            'The stairs do not go the way you would think. That is the building.',
            'I have written it up. I write everything up.',
            'Nothing is wrong with it. I want that on the record.'];
  },
  // Polite. Home. Completely uninterested in him.
  bellhouse_7b: () => {
    if (Player.flags.tvTurned) {
      return ['You turned it round. Thank you.',
              'Somebody keeps turning it back. It is not you. I know it is not you.'];
    }
    return ['Oh - hello. Do come in, it is open.',
            'No, I am fine. Thank you for asking. Nobody asks.',
            'Mind the television. It faces that way on purpose.'];
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
      const stock = STOCKS[target.shop] || SHOP_STOCK;
      const lines = (NPCS[target.key] || NPCS.shopkeeper)();
      Dialogue.say(lines.map(t => ({ text: t, speaker: 'npc' })), () => {
        Shop.start(stock, SHOP_TITLES[target.shop] || 'OKOBO'); Game.mode = 'shop';
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
    // A vending machine is the only shop on the campus, and it is the only one
    // in the game that does not have a person behind it.
    case 'machine':
      if (o.shop) {
        Dialogue.say([{ text: 'A vending machine. Everything in it is stocked to the front.',
                        speaker: 'system' }], () => {
          Shop.start(STOCKS[o.shop] || SHOP_STOCK, SHOP_TITLES[o.shop] || 'VENDING');
          Game.mode = 'shop';
        });
        return;
      }
      Dialogue.say(World.id === 'kestrel_boiler'
        ? [{ text: 'A boiler. It is the only warm thing left in the works.', speaker: 'system' },
            { text: 'Nobody has been down here to light it.', speaker: 'system' }]
        : [{ text: 'A machine, stopped mid-cycle. Cold all the way through.', speaker: 'system' }]);
      return;
    // The one the boy outside was talking about. He does not know that.
    case 'pod_mother':
      Dialogue.say([
        { text: 'A demo pod. A woman, lying back, eyes open.', speaker: 'system' },
        { text: 'The screen is showing her a kitchen. Somebody is at the table.', speaker: 'system' },
        { text: 'If you wave at the glass she waves back. It takes a moment.', speaker: 'system' },
      ]);
      return;
    case 'pod':
      Dialogue.say([
        { text: 'A demo pod. Somebody is inside it, lying back, eyes open.', speaker: 'system' },
        { text: 'The screen is showing them a room. The room is nicer than this one.', speaker: 'system' },
        { text: 'VIXTRY CO. - you are already home.', speaker: 'vixtry' },
      ]);
      return;
    case 'television':
      if (Player.flags.tvTurned) {
        Dialogue.say([{ text: 'It faces the room now. It is still off.', speaker: 'system' }]);
        return;
      }
      Player.flags.tvTurned = true;
      Player.money += 300;
      Audio_.sfx('found');
      Dialogue.say([
        { text: 'The television faces the wall.', speaker: 'system' },
        { text: 'He turns it round.', speaker: 'system' },
        { text: '(Got 300 Rell.)', speaker: 'system' },
      ]);
      return;
    case 'apartment':
      Dialogue.say([{ text: `Unit ${o.unit}. Nobody answers.`, speaker: 'system' },
                    { text: 'Somebody is in. He can hear a chair.', speaker: 'system' }]);
      return;
    case 'foreman':
      Story.supervisorFight();
      return;
    case 'bench':
      if (Save.write()) {
        Audio_.sfx('found');
        Dialogue.say([{ text: 'A bench, in a corridor, facing a wall.', speaker: 'system' },
                      { text: 'He sits down for a moment and writes down where he is.',
                        speaker: 'system' },
                      { text: 'SAVED.', speaker: 'system' }]);
      } else {
        Dialogue.say([{ text: 'A bench. He sits down. Nothing is written down.',
                        speaker: 'system' }]);
      }
      return;
    // The pod somebody finished with. It is the way into the Co-Living space.
    case 'pod_open':
      Dialogue.say([
        { text: 'This one is open. The headrest still has the shape of a head in it.',
          speaker: 'system' },
        { text: 'A demonstration lasts as long as the participant wishes.',
          speaker: 'vixtry' },
      ]);
      return;
    case 'desk':
      Dialogue.say([{ text: 'A desk, squared away. Pen lined up with the edge.', speaker: 'system' },
                    { text: 'Somebody signed every one of those notices from this chair.', speaker: 'system' },
                    { text: 'Then somebody signed theirs.', speaker: 'system' }]);
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
    // The first warp device (docs/06). It opens every place he has already
    // been, all at once, and that is deliberately one beat rather than a drip:
    // it is the moment the game stops being a corridor.
    case 'warp': {
      if (Player.flags.warp) {
        Dialogue.say([{ text: 'The lid is warm. It has been warm a while.',
                        speaker: 'system' }]);
        return;
      }
      Player.flags.warp = true;
      World.entities = World.entities.filter(e => e !== o);
      Audio_.sfx('found');
      Dialogue.say([
        { text: 'Something small and warm was sitting on the lid.', speaker: 'system' },
        { text: 'It is the shape of a place. Several places, if you turn it.',
          speaker: 'system' },
        { text: 'THE MAP OPENS. HE CAN GO BACK TO ANYWHERE HE HAS BEEN.',
          speaker: 'system' },
      ]);
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
            { text: 'The east gate is open. There is a road past it, and a border on it.',
              speaker: 'system' },
          ]);
        } else {
          Game.mode = 'field';
          Game.onDefeat();
        }
      });
    });
  },

// Mini-Boss 2. The first fight in the game against a person.
  supervisorFight() {
    if (Player.flags.beatSupervisor || Player.flags.supStarting) {
      Dialogue.say([{ text: 'The line is stopped. It stays stopped.', speaker: 'system' }]);
      return;
    }
    Player.flags.supStarting = true;
    Dialogue.say([
      { text: 'A supervisor, at the end of the line, with a clipboard.', speaker: 'system' },
      { text: '"You are not on the sheet."', speaker: 'npc' },
      { text: '"Everything that comes through here is on the sheet."', speaker: 'npc' },
    ], () => {
      const bd = DATA.bosses['Line Supervisor'];
      const enc = DATA.bossEncounters['Line Supervisor'];
      const e = Battle.makeEnemy('Line Supervisor', {
        name: 'LINE SUPERVISOR', level: enc.internal_level, boss: true,
        hpMul: bd.hp_multiplier, atkMul: bd.atk_multiplier,
        phases: bd.phases, exp: enc.exp, scale: 3,
      });
      Game.mode = 'battle';
      Battle.start(e, null, (result) => {
        Player.flags.supStarting = false;
        if (result === 'won') {
          Player.flags.beatSupervisor = true;
          Player.addItem('Spray III', 2);
          Game.mode = 'field';
          Audio_.play('sable');
          Dialogue.say([
            { text: 'He puts the clipboard down, carefully, the right way up.', speaker: 'system' },
            { text: '(Got Spray III x2.)', speaker: 'system' },
          ]);
        } else { Game.mode = 'field'; Game.onDefeat(); }
      });
    });
  },

  // Third sighting, and the first time he says anything.
  maybeCustodian3() {
    if (Player.flags.sawCustodian3) return;
    if (World.id !== 'bellhouse_2') return;
    if (!Player.notes.includes('maintenance_log')) return;
    Player.flags.sawCustodian3 = true;
    const x = Math.max(20, Math.min(World.w * TS - 20, Player.x + 80));
    World.entities.push({ kind: 'custodian', x, y: Player.y - 26, t: 3.4 });
    Dialogue.say([{ text: 'Never leave.', speaker: 'custodian' }]);
  },

  // Main Boss 2. A room that is a perfect cube and is bigger than the floor
  // it is on.
  tenantFight() {
    if (Player.flags.beatTenant || Player.flags.tenantStarting) return;
    if (World.id !== 'bellhouse_top') return;
    Player.flags.tenantStarting = true;
    Dialogue.say([
      { text: 'The room is square. It is squarer than the building allows.', speaker: 'system' },
      { text: 'There is one tenant left on this floor, and it is not a person.', speaker: 'system' },
    ], () => {
      const bd = DATA.bosses['Tenant'];
      const enc = DATA.bossEncounters['Tenant'];
      const e = Battle.makeEnemy('Tenant', {
        name: 'TENANT', level: enc.internal_level, boss: true,
        hpMul: bd.hp_multiplier, atkMul: bd.atk_multiplier,
        phases: bd.phases, exp: enc.exp, scale: 3,
      });
      Game.mode = 'battle';
      Battle.start(e, null, (result) => {
        Player.flags.tenantStarting = false;
        if (result === 'won') {
          Player.flags.beatTenant = true;
          Player.addItem('Second Wind', 1);
          Player.addItem('Loose Laces', 2);
          Game.mode = 'field';
          Audio_.play('bellhouse');
          Dialogue.say([
            { text: 'It comes apart into smaller squares, and then into none.', speaker: 'system' },
            { text: 'The room is the size of the floor it is on again.', speaker: 'system' },
            { text: '(Got Second Wind and Loose Laces x2.)', speaker: 'system' },
            { text: 'There is a way out of the Commons that was not there before.',
              speaker: 'system' },
          ], () => { Game.mode = 'field'; });
        } else { Game.mode = 'field'; Game.onDefeat(); }
      });
    });
  },

  // --- Act 4 --------------------------------------------------------
  // The greeting. He never gave anyone his name, and the game does not remark
  // on it - the greeter does, once, and then never again.
  campusGreeting() {
    if (Player.flags.campusNamed) return;
    if (World.id !== 'campus_approach') return;
    Player.flags.campusNamed = true;
    Dialogue.say([
      { text: `Good morning, ${Player.name}. You are expected.`, speaker: 'vixtry' },
      { text: 'Reception is straight through. Mind the step.', speaker: 'vixtry' },
    ]);
  },

  managerFight() {
    if (Player.flags.beatManager || Player.flags.managerStarting) return;
    if (World.id !== 'campus_office') return;
    Player.flags.managerStarting = true;
    Dialogue.say([
      { text: 'The office is the only room on this floor with a door that closes.',
        speaker: 'system' },
      { text: 'I am sorry about this. I want to say that first, and I want you to '
            + 'know I mean it.', speaker: 'vixtry' },
      { text: 'You are eleven. You are also the only one of these that took.',
        speaker: 'vixtry' },
      { text: 'I have a number for how much that is worth and I am not allowed to '
            + 'tell you what it is.', speaker: 'vixtry' },
    ], () => {
      const bd = DATA.bosses['Account Manager'];
      const enc = DATA.bossEncounters['Account Manager'];
      const e = Battle.makeEnemy('Account Manager', {
        name: 'ACCOUNT MANAGER', level: enc.internal_level, boss: true,
        hpMul: bd.hp_multiplier, atkMul: bd.atk_multiplier,
        phases: bd.phases, exp: enc.exp, scale: 2, inflicts: bd.inflicts,
      });
      Game.mode = 'battle';
      Battle.start(e, null, (result) => {
        Player.flags.managerStarting = false;
        if (result === 'won') {
          Player.flags.beatManager = true;
          Game.mode = 'field';
          Audio_.play('campus');
          Dialogue.say([
            { text: 'He sits back down. He does not look beaten, only finished.',
              speaker: 'system' },
            { text: 'The door behind the desk was always a door.', speaker: 'system' },
          ]);
        } else { Game.mode = 'field'; Game.onDefeat(); }
      });
    });
  },

  // Main Boss 3. He has said one thing, three times, and he says it again.
  custodianFight() {
    if (Player.flags.beatCustodian || Player.flags.custodianStarting) return;
    if (World.id !== 'long_hall_end') return;
    Player.flags.custodianStarting = true;
    Dialogue.say([
      { text: 'The hall stops. There is no door at this end and there never was.',
        speaker: 'system' },
      { text: 'Never leave.', speaker: 'custodian' },
      { text: 'Never leave.', speaker: 'custodian' },
      { text: 'Never leave.', speaker: 'custodian' },
    ], () => {
      const bd = DATA.bosses['The Custodian'];
      const enc = DATA.bossEncounters['The Custodian'];
      const e = Battle.makeEnemy('The Custodian', {
        name: 'THE CUSTODIAN', level: enc.internal_level, boss: true,
        hpMul: bd.hp_multiplier, atkMul: bd.atk_multiplier,
        phases: bd.phases, exp: enc.exp, scale: 4,
        restoresOnce: bd.restores_once_to, inflicts: bd.inflicts,
      });
      Game.mode = 'battle';
      Battle.start(e, null, (result) => {
        Player.flags.custodianStarting = false;
        if (result === 'won') {
          Player.flags.beatCustodian = true;
          Player.addItem('Full Spray', 2);
          Game.mode = 'field';
          Dialogue.say([
            { text: 'It goes in on itself, the way a held breath does.', speaker: 'system' },
            { text: 'The grass at the end of the hall is taller than the grass at the start.',
              speaker: 'system' },
            { text: '(Got Full Spray x2.)', speaker: 'system' },
          ], () => { Game.mode = 'cutscene'; Cutscene.play('slice_end'); });
        } else { Game.mode = 'field'; Game.onDefeat(); }
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
        textCentered('END OF ACT FOUR', W / 2, 72, '#6a6a76');
        textCentered('The Root, and what is left of him, in a later build.',
                     W / 2, 92, '#4a4a56');
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
    Player.seen = [];
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

    if (this.mode === 'controls') { ControlPick.update(dt); return; }
    if (this.mode === 'title') { Title.update(dt); return; }
    if (this.mode === 'name') { NameEntry.update(dt); return; }
    if (this.mode === 'options') { Options.update(dt); return; }
    if (this.mode === 'cutscene') { Cutscene.update(dt); return; }
    if (this.mode === 'end') {
      if (Input.hit('ok')) { this.mode = 'title'; Title.enter(); }
      return;
    }
    if (this.mode === 'shop') { Shop.update(dt); if (!Shop.open && this.mode === 'shop') this.mode = 'field'; return; }
    // The mode check matters: OPTIONS closes the menu *and* sets mode itself, so
    // an unconditional fall-back to 'field' here would immediately undo it.
    if (this.mode === 'menu') { Menu.update(dt); if (!Menu.open && this.mode === 'menu') this.mode = 'field'; return; }
    if (this.mode === 'battle') { Battle.update(dt); return; }

    if (this.mode === 'milestone') { Milestone.update(dt); return; }

    // field
    if (Dialogue.active) { Dialogue.update(dt); return; }
    if (Fade.busy) return;

    // A milestone earned mid-fight waits for the fight to be over and the
    // screen to be still. Checked here rather than on the victory screen so it
    // never lands on top of the level-up text.
    if (Player.owed.length) { Milestone.enter(); this.mode = 'milestone'; return; }

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
    Story.maybeCustodian3();
    Story.tenantFight();
    Story.campusGreeting();
    Story.managerFight();
    Story.custodianFight();

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
    if (this.mode === 'controls') { ControlPick.draw(); return; }
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
    // A room can push the whole frame toward a colour. Limpo is warm daylight;
    // Sable is the first place lit by something somebody is selling.
    if (r.tint) tintScreen(r.tint[0], r.tint[1]);
    else if (r.bright) tintScreen('#ffe6b0', 0.05);
    grain(r.grain !== undefined ? r.grain : 0.04);

    if (this.mode === 'shop') Shop.draw();
    else if (this.mode === 'milestone') Milestone.draw();
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
  kestrel_boiler: 'KESTREL WORKS - BOILER', kestrel_office: 'KESTREL WORKS - OFFICE',
  kestrel_locker: 'KESTREL WORKS - CHANGING ROOM',
  ondo_grocer: 'ONDO - GROCER',
  border: 'THE BORDER', sable_road: 'YETTALLIA', sable: 'SABLE CITY',
  sable_shop: 'SABLE CITY - SHOP', sable_inn: 'SABLE CITY - INN',
  sable_transit: 'SABLE CITY - TRANSIT', sable_flat: 'SABLE CITY - A FLAT',
  sable_works: 'SABLE CITY - WORKS', sable_floor: 'SABLE CITY - THE LINE',
  bellhouse_ext: 'BELLHOUSE COMMONS', bellhouse_1: 'BELLHOUSE COMMONS',
  bellhouse_2: 'BELLHOUSE COMMONS', bellhouse_3: 'BELLHOUSE COMMONS',
  bellhouse_7b: 'BELLHOUSE - 7B', bellhouse_top: 'BELLHOUSE - THE TOP',
};

// --- boot --------------------------------------------------------------
// The controls question comes before the title, once, and never again unless
// the player goes looking for it. Answering it is what makes the game playable
// at all on whatever they are holding.
Options.load();
World.load('bedroom');
if (Options.values.controlsAsked) { Title.enter(); Game.mode = 'title'; }
else { ControlPick.enter(); Game.mode = 'controls'; }
requestAnimationFrame(frame);
