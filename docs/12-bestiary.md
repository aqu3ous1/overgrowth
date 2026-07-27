# 12 — Bestiary

**45 unique enemy species across ten encounter bands, 49 roster entries in total** — the Root's band
reuses four earlier species at new levels and new colours, which is the point of it. Bosses are in
[08](08-bosses.md).

## Design rules

1. **Enemies are mundane things made strange, or people who are busy.** Nothing is a monster.
   EarthBound's roster worked because a Cranky Lady is funnier and stranger than a goblin, and the
   same instinct applies here with the temperature turned down.
2. **Names are flat and descriptive.** `Yard Dog`, `Ration Tin`, `Second Shift`. The game never
   tells the player something is scary — it tells them what it is and lets the fact that it's
   fighting them do the work.
3. **Every enemy that is a person can be beaten without being killed.** The battle log says
   `THE COMMUTER STOPPED.` Never "defeated," never "died." This is not squeamishness; it's the
   difference between a game about escaping and a game about winning.
4. **Levels are visible always** ([04](04-battle-system.md)), so a species' level *is* its
   difficulty communication. No colour-coding, no skull icons.
5. **Late-game Root species are earlier species, recoloured and re-levelled.** Recognition is the
   horror; new art is not needed and would weaken it.

## Encounter bands

| Band | Area | Enemy levels | Player expected |
|---|---|---|---|
| 1 | Okobo & surrounds | 2–6 | 1–6 |
| 2 | The Sunken Orchard | 5–9 | 5–9 |
| 3 | Road to Ondo | 9–13 | 9–12 |
| 4 | Kestrel Works | 11–15 | 12–15 |
| 5 | Border country | 15–19 | 15–18 |
| 6 | Sable City | 17–21 | 17–21 |
| 7 | Bellhouse Commons | 21–26 | 21–25 |
| 8 | Vixtry Campus | 27–32 | 27–31 |
| 9 | The Long Hall | 31–36 | 32–35 |
| 10 | The Root | 36–42 | 37–43 |

Enemy level sits at or just above the player's expected level in every band — which, under the flee
rule, means **the world is roughly a coin flip to walk away from and never free.** That's the
intended texture and it should not be softened.

**Band 10 is the sole exception, and it's the payoff.** The Root's enemies top out at 42 against a
player who is 37–43 by then, so for the first and only time in the game he is stronger than the
place he's in. Every fight there becomes fleeable. He does not have to take any of them. That is
what Act 5 is *for*, and it costs nothing to build because the flee rule was already doing the work
— the numbers simply cross over.

The Gallery (Act 0.5) has no enemies at all.

---

## Band 1 — Okobo & surrounds *(Lv 2–6)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Yard Dog** | 2 | Won't come when called. Attacks, then spends a turn not attacking. |
| **Postbox** | 3 | Full of mail nobody collected. High DEF, no offence until turn 3. |
| **Sunned Melon** | 3 | Overripe. Bursts on defeat for minor damage. The game's joke enemy. |
| **Little Cousin** | 5 | A kid who won't leave you alone. Low damage, very high SPD, flees on its own at low HP. |
| **Fence Post** | 6 | Rare. Does nothing at all for two turns, then hits very hard once. |

Tutorial band. Nothing here can realistically kill a player who is paying attention, and `Yard Dog`
is deliberately the first thing in the game that ignores him.

## Band 2 — The Sunken Orchard *(Lv 5–9)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Windfall** | 5 | A fallen fruit in the water. Trivial. |
| **Drowned Ladder** | 6 | High DEF, low SPD. Teaches `Multi-Jab` is bad into armour. |
| **Same Tree** | 7 | Indistinguishable from scenery until approached. Ambushes — enemy gets the free turn. |
| **Wader** | 8 | **Inflicts Homesick on turn 1.** Otherwise almost harmless. |
| **Orchard Keeper** | 9 | Rare. Buffs its own DEF twice, then chips slowly. A patience check. |

**Wader is a deliberate difficulty spike and the first appearance of Homesick.** At this level the
player has no cure — `Quiet Room` is 23 levels away — so the status runs until the fight ends. It
costs ~25% max HP over a normal fight and will scare people. That's the entire point: the game
establishes early that one bad thing in it cannot be fixed with an item.

To keep it fair, Wader's own damage output is near zero and it appears in a single, avoidable
stretch of the orchard.

## Band 3 — Road to Ondo *(Lv 9–13)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Milepost** | 9 | Counts down. On turn 4 it hits for a lot. Kill it or leave. |
| **Ration Tin** | 10 | Drops food items. Only enemy in the game worth farming, and only barely. |
| **Someone's Bicycle** | 11 | Very high SPD, always acts first, low damage. |
| **Bad Weather** | 12 | Literally weather. Hits all-target every turn, cannot be debuffed. |
| **Roadside Shrine** | 13 | Heals other enemies. Kill first. Teaches target priority. |

First band with real multi-enemy compositions, and the last band before `Mend` is comfortably
online.

## Band 4 — Kestrel Works *(Lv 11–15)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Frostbitten Glove** | 11 | Inflicts Numb. |
| **Coil** | 13 | Inflicts Static. Low HP. |
| **Conveyor** | 14 | Never stops. Acts twice per turn at half power. |
| **Yard Light** | 14 | Inflicts Fog, then does nothing else, ever. |
| **Second Shift** | 15 | A worker who clocks in. Highest damage in the band. Log reads `SECOND SHIFT WENT HOME.` |

The status band. Every species here inflicts something, which is where `Clean Rag` stops being a
shop item the player scrolls past.

## Band 5 — Border country *(Lv 15–19)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Checkpoint** | 15 | Blocks. Halves incoming physical damage every other turn. |
| **Frozen Hare** | 16 | Flees from the player. Worth EXP only if caught. |
| **Surplus Crate** | 18 | Contains something. Drops a random battle item. |
| **Long Coat** | 19 | A person. Doesn't speak, doesn't stop. Balanced, dangerous, unremarkable. |

Short band — this is travel, not a dungeon. Four species is enough for the crossing.

## Band 6 — Sable City *(Lv 17–21)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Commuter** | 17 | Running late. High SPD, disengages after three turns regardless of HP. |
| **Kiosk** | 18 | Sells to the player mid-fight, then attacks. |
| **Neon Sign** | 19 | Inflicts Fog. High SPATK, paper DEF. |
| **Vixtry Canvasser** | 21 | **First Vixtry enemy.** Spends turn 1 delivering a sales line. Genuinely polite. |

`Vixtry Canvasser` is the tonal hinge of the mid-game: the first fight where the enemy is friendly,
means it, and has to be stopped anyway.

## Band 7 — Bellhouse Commons *(Lv 21–26)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Hall Mirror** | 21 | Reflects 25% of special damage. |
| **Tenant's Cat** | 22 | Ignores the player for one turn out of every three. |
| **Unit 4C** | 24 | A door. Enormous HP, no offence. Optional, and blocks nothing. |
| **Mural** | 25 | The wall art, animate. Hits all-target, changes element each turn. |
| **Building Super** | 26 | Apologizes, then fights. Buffs, heals himself once. |

`Unit 4C` is a pure resource sink with no reward and no consequence for walking past it. Some
players will fight it for twenty minutes. Let them.

## Band 8 — Vixtry Campus *(Lv 27–32)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Intern** | 27 | Barely fights. Apologizes constantly. |
| **Receptionist** | 28 | Greets the player **by name**. Inflicts Drained. |
| **Demo Pod** | 30 | Occupied. Attacks with the occupant's stats, which are low and getting lower. |
| **Server Rack** | 31 | Very high SPDEF, zero DEF. The band's `Severance` lesson in reverse. |
| **Retention Specialist** | 32 | Prevents fleeing outright, even at level parity. The only enemy that does. |

`Retention Specialist` is the one place the flee rule is overridden, and the overriding is the
joke — a company whose entire business model is preventing exit has an employee whose whole function
is preventing exit.

## Band 9 — The Long Hall *(Lv 31–36)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Ceiling Tile** | 31 | Falls. One-time high damage, then trivial. |
| **Empty Frame** | 33 | Contains nothing. Copies the player's last used move. |
| **Fluorescent** | 34 | Flickers. 50% chance to skip its own turn. |
| **Custodial Cart** | 36 | Slow, enormous, hits like a truck. Log reads `THE CART STOPPED.` |

Four species across a very long corridor at very low density. The Long Hall should feel *empty*, not
dangerous — an enemy every ninety seconds, at most.

## Band 10 — The Root *(Lv 36–42)*

| Enemy | Lv | Behaviour |
|---|---|---|
| **Yard Dog** | 36 | Recoloured. Same behaviour, 34 levels later. |
| **Second Shift** | 37 | Recoloured. Still going home. |
| **Commuter** | 38 | Recoloured. Still late. |
| **Little Cousin** | 39 | Recoloured. Still won't leave him alone. |
| **Dresser** | 40 | From the bedroom. Ordinary furniture, hostile, no explanation. |
| **Bedroom Door** | 41 | Very high DEF. Opens on defeat and leads nowhere. |
| **The Argument** | 42 | A wall of `▓▓▓ ▓▓▓▓`. **Inflicts Homesick.** Cannot be debuffed, cannot be silenced, deals no direct damage at all. |

**`The Argument`** is the last regular enemy in the game and the payoff for Act 0. It is the
unintelligible block-text from the prologue given an HP bar. It never attacks — it only inflicts
Homesick, repeatedly, and the player has `Quiet Room` by now and can simply clear it every time.

That's the design: the thing that hurt him for the entire game is now a fight he knows how to win,
and it still doesn't say anything he can understand.

---

## Drop philosophy

- Money from ~35% of encounters ([11](11-pacing-and-systems.md)).
- Consumables from ~15%, weighted toward whatever the current band is punishing (status cures in
  Kestrel, SP restores on Campus).
- **No equipment drops from regular encounters.** Equipment comes from shops, the world, and four
  bosses, so a player never feels they should be farming.
- `Ration Tin` and `Surplus Crate` are the only species designed around their drops, and both are
  low-value enough that farming them is a worse use of time than a sidequest.
