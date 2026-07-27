# 18 — Vertical Slice

What to build first. One continuous 45–60 minute stretch from the title screen to the first boss,
containing at least one instance of every system in the game.

## Scope

**Title screen → bedroom → the Gallery → arrival → Okobo Village → the Sunken Orchard →
Mini-Boss 1 → fade.**

That's Act 0 through the end of Act 1's dungeon: roughly 18 rooms, 11 enemy species, one boss, one
shop, one save point, three sidequests, three lore notes, one collectible, and the first Custodian
sighting.

## Why this slice

It is the only stretch of the game that contains **every system at least once** and **both
palettes**, and it ends on a note that proves the tone works or doesn't.

| System | Where it appears in the slice |
|---|---|
| Name entry, save files | Title screen |
| Unintelligible dialogue, room-scale interaction | Bedroom |
| Liminal exploration, impossible geometry, the overgrowth motif | The Gallery |
| Palette inversion (underlit → oversaturated) | Arrival in Limpo |
| NPC dialogue, the Limpo verbal tic, sidequests, a shop, an inn/save | Okobo |
| Random encounters, PP/SP, the bag, fleeing, the level readout | Okobo outskirts, the Orchard |
| `??`, a fight you cannot leave, boss phases | The Fruiting Tree |
| A hidden collectible, readable notes | Okobo well, the Orchard |
| A non-interactive Custodian sighting | Okobo, ~30 min in |

If this slice is fun and unsettling in the right proportion, the game works. If it's boring, no
amount of Act 4 will save it — and finding that out costs 18 rooms instead of 180.

## Room list

### Act 0 — The Bedroom *(1 room, ~5 min)*

Five interactables, one of which is the door and does nothing four times
([14](14-script-samples.md)). Nothing else. No combat, no menu, no music — furnace and clock only.

**Proves:** the game can hold a player's attention with almost nothing, and that the block-glyph
dialogue reads as intended rather than as a bug.

### Act 0.5 — The Gallery *(6 rooms, ~15 min)*

| Room | Contents |
|---|---|
| Dark expanse | Nothing, for slightly longer than is comfortable. One direction eventually resolves. |
| Building exterior | The brick box (Images 1, 4). One steel door. No approach path. |
| Entry hall | Grass floor, brick walls, drop-tile fluorescent ceiling. First "this is wrong" beat. |
| Gallery room | The five paintings ([08](08-bosses.md)). Four near-identical descriptions plus one variation. |
| Looping corridor ×2 | Longer than the building's exterior allows. Player must notice this unprompted. |
| The door | Steps through, falls. |

**Proves:** the sprite-in-low-poly-room mismatch reads as intentional; the flicker and hum carry a
room with no music; a player will keep walking with no reward for four minutes.

**No enemies.** The Gallery is the only area in the game with none.

### Act 1 — Arrival and Okobo *(6 rooms, ~20 min)*

| Room | Contents |
|---|---|
| Arrival field | Wakes face-down. Palette snaps to oversaturated. First encounters (band 1). |
| Village square | Well, war memorial, ~6 NPCs, the verbal tic, the first Custodian sighting. |
| Shop | Four items on a counter ([17](17-economy.md)). |
| Inn | Save point. Full restore. |
| One house | Sidequest giver, one lore note. |
| North road | Band 1 encounters, route to the Orchard. |

**Sidequests in slice:** The Well Bucket, Someone's Brother, Melon Opinion
([13](13-sidequests.md)). *Someone's Brother* is the one to get right — it's four minutes of errand
and the saddest thing in the act.

**Proves:** the tonal hinge. Okobo has to be genuinely charming, because everything later depends on
the player having something to miss.

### Act 1 — The Sunken Orchard *(5 rooms, ~15 min)*

Ankle-deep water, every tree the same tree, reflections correct for the sky and wrong for the trees.
Band 2 encounters including `Wader` — the first `Homesick`, uncurable at this level and deliberately
frightening ([12](12-bestiary.md)).

Ends in the deep clearing: **The Fruiting Tree**, the player's first `??`.

**Proves:** the horror register works without a jump scare, and that `??` communicates "you are not
leaving" with no tutorial text.

## Asset list

Deliberately small. Almost everything here is reused for the rest of the game.

**Characters**
- Player sprite: 4 facings × 3 walk frames + idle breathing bob. One facial expression, forever.
- 8 Okobo villager sprites (2 body types × 4 palettes is enough).
- Custodian sprite: 1 idle frame, front-facing. Used once here, four more times across the game.
- 11 enemy sprites: bands 1 and 2, plus The Fruiting Tree.

**Environments**
- Brick wall, drop-tile ceiling, fluorescent panel, grass floor, steel door.
- 5 painting textures (obelisk, sphere, pyramid, cube, spire).
- Okobo building kit: 3 façades, 1 interior shell, well, memorial stone.
- Orchard: 1 tree model, water plane with reflection, fruit.
- Bedroom: bed, dresser, window, poster, light switch.

**Audio**
- Okobo theme (the prettiest music in the game — budget accordingly).
- Battle theme, upbeat, dissonant against the setting.
- Gallery: fluorescent hum, irregular flicker tick.
- Orchard: footsteps in water, one sustained tone.
- Bedroom: furnace, clock. No music.

**UI**
- Text box with three font treatments (NPC, system, degrading).
- Battle menu: Physical / Special / Bag / Run, with the level readout and its `??` state.
- Bag with the two enforced tabs.
- Name entry, save/load.

## Systems required

**Build:** turn-based battle loop, the damage formula, PP/SP with the +1/turn trickle, the flee rule
and the `??` state, visible overworld encounters with back-attacks, the bag split, one shop, save
points with full restore, level-up with move unlocks, EXP with the catch-up term, dialogue with
per-speaker fonts.

**Defer:** equipment (the slice ends before the first meaningful choice), warp devices (midpoint),
stat stages and status beyond `Homesick`, multi-enemy encounters, the collectible counter UI (it
appears only after the first find — showing `1/10` is enough), sidequest tracking UI.

## Done criteria

The slice is finished when all of these are true:

1. A player who has never seen the game reaches The Fruiting Tree in **45–60 minutes** without being
   told where to go.
2. At least one playtester **notices the corridor is too long** in the Gallery, unprompted.
3. No playtester asks what `??` means after beating The Fruiting Tree.
4. Combat is **10–22% of the elapsed time** ([11](11-pacing-and-systems.md)) — measured, not
   estimated.
5. The measured numbers land inside the simulator's targets: band 1 and 2 encounters at 2–8 turns,
   The Fruiting Tree at 6–15 turns, ≥80% win rate at level 9.
6. At least one playtester describes Okobo as *nice* and the Orchard as *sad* rather than *scary*.

Criterion 6 is the one that matters. The others are arithmetic.

## After the slice

| Milestone | Content | Why this order |
|---|---|---|
| **1. Vertical slice** | Above | Proves the tone and the loop |
| **2. Act 2** | Ondo, Kestrel Works, The Memorial | Proves the sidequest economy and the first multi-phase boss; Kestrel is the first real dungeon |
| **3. Act 3** | Sable City, Bellhouse Commons, Vixtry intro | Proves non-Euclidean level design and the corporate voice |
| **4. Acts 4–5** | Campus, Long Hall, the Root, both Custodians | The payoff; needs everything before it working |
| **5. Collectibles & secret ending** | 10 placements, the Spire | Requires all ten areas to exist before any of it can be placed |

The collectible pass is **last on purpose.** Placements depend on knowing what a finished room looks
like, and the grass-density tell ([09](09-collectibles-and-endings.md)) can't be authored against
rooms that don't exist yet.
