# 19 — The Playable Build

**0.3.0 — Acts 0 through 2, playable.** Title screen through **Main Boss 1**, in a browser, in one
self-contained HTML file with no assets and no dependencies.

```
python3 tools/gen_sprites.py    # shape primitives -> game/src/15_sprites.js
python3 tools/build_game.py     # game/src/*.js + data/*.json -> game/overgrowth.html
python3 tools/playtest.py       # drives it in a real browser, fails on any error
python3 tools/playtest.py --shots
```

## 0.3.0 — Act 2

The build now runs past Mini-Boss 1 and out the far side of the Sunken Orchard, which was a locked
exit in 0.2.1. Eleven new rooms, twenty-seven in total.

**The Road to Ondo.** Encounter band 3 — `Milepost`, `Ration Tin`, `Someone's Bicycle`,
`Bad Weather`, `Roadside Shrine`. The letter from Okobo's second sidequest is delivered out here, to
a foundation with nothing standing on it, which is the first flat statement the world makes about
what happened to Limpo.

**Ondo.** The capital: market row, a shop with the mid-game stock, an inn, a boarding house, a
municipal records room, and a park with a dry fountain. The warmest and busiest stretch of the game,
placed immediately before the coldest — that adjacency is the point ([07](07-world-and-areas.md)).
Five of the eight designed sidequests are in: the dry fountain (the valve is closed, someone closed
it during rationing, nobody is in charge of opening it), the park bench, the Northside delivery, the
records request, and the boarding-house ledger. The area's hidden collectible is in the records
room, elsewhere, and the game does not connect the two.

Two of them are built to land on each other. **The ledger** is three overdue rents: rooms 3 and 5
pay, room 7 is unlocked and empty, and the landlady's payout is the only place the game says out
loud what the boarder implied. **The Northside delivery** is three parcels to three addresses on the
winter road, and the addresses are three postboxes with no houses behind them.

**The first Vixtry billboard**, in the `vixtry` voice from [10](10-writing-guide.md) — cleaner than
anything around it and pasted on top of the world rather than sitting in it.

**The boarding house.** A man on the landing mentions someone in room 7 who "went inside and got
better." Walk out and back in and he is not there — NPCs can now carry a `once` flag, and the game
does not remark on the empty landing any more than it remarks on the empty room.

**Kestrel Works.** Permanent winter, reached by a road nobody has walked since the works closed.
Three floors, encounter band 4 — `Frostbitten Glove`, `Coil`, `Conveyor`, `Yard Light`,
`Second Shift`. The lore is the six-part layoff sequence from [15](15-lore-notes.md), found floor by
floor, ending with `Last One Out` in the far corner of the third floor. The **second Custodian
sighting** is on the way back out, standing in a room the player has already cleared, and it is gone
if they leave and re-enter.

**Sidequest 13 — the yard lights.** `Last One Out` asks whoever finds it to shut the breaker off.
The panel is by the gate; before the note is read, the game says only that the lights are somebody's
to turn off and not his. Doing it has no giver, no money and no acknowledgement — the yard simply
gets darker and stays that way. **It does not gate the boss.** Gating Main Boss 1 behind an optional
errand would make the errand a lie; the boss is gated on reaching the bottom of the factory instead,
and only changes its opening line depending on whether the lights are still on.

**Main Boss 1 — The Memorial.** In the yard, in snow, beneath the war memorial whose names are the
same names as the shift roster inside. Not most of them. All of them.

It is a **walk-up boss, not a room trigger**: it starts from examining the monument, in the far
corner away from both exits, so the player commits to it. Its three tiers come off one at a time,
and the tier rule is *in `data/statblocks.json`*, not in the battle code —

```json
"def_multiplier": [1.90, 1.15, 0.70],
"atk_multiplier": [0.45, 0.85, 1.20]
```

— so `simulate.py` and the game read the same numbers. That placement was not an aesthetic choice.
The first attempt put the rule in the battle code only, which is exactly the bug 0.2.1 shipped a fix
for; the simulator would have kept passing a fight it could not see. The multipliers are absolute
per tier rather than compounding, so the fight trades guard for urgency instead of just getting
harder. Compounding them produced a 0% win rate, which the simulator caught in one run.

**Two new music beds.** `ondo` is the most melodic thing in the build — slower, warmer, more voices.
`kestrel` has no melody at all, just cold drones. They are next to each other on the map on purpose.

**Four new floor textures** — snow, concrete, pavement, and Ondo's masonry — and the tree sprite
takes a bare grey palette on snow, because the same green orchard tree standing in a snowfield reads
as a bug rather than as winter.

## 0.2.1 — the PP fix

A player report: early fights left them with no PP and nothing to do. The cause was not balance.

**The +1 PP/turn trickle existed in `data/progression.json` and in `tools/simulate.py`, but had
never been built into the game.** The simulator was validating a mechanic the build did not have,
so every matchup passed while the real game ran dry. `Fence Post` — a level 6 brute with 66 HP that
can appear while the player is still level 1 — was the one that exposed it: two turns with no
affordable move.

Three changes:

- The trickle is implemented, and `build_game.py` exports the figures so it comes from the data
  rather than a constant in the battle code.
- The trickle is **+2, not +1**. Its stated purpose is "Punch is always affordable"; Punch costs 2,
  so +1 only ever bought it on alternate turns. The validator now fails if the trickle drops below
  the cheapest attack's cost.
- Starting PP 10 → 14 and SP 8 → 10, for slack in the first hour.

Also fixed: choosing a move you could not afford left the submenu in a broken state showing the bag
list. It now says so, costs no turn, and returns to the command menu.

The simulator gained a check for **turns with no affordable move**, which fails any matchup with
one. It caught the same problem in both Custodian fights immediately. That check is the useful
part — it catches the symptom whatever the cause, which the old targets could not.

## What changed in 0.2.0

**Area transitions are paths, not spots.** Exits are rectangles sitting on a `P` path tile or a `D`
doorway — a run of worn dirt through a gap in the wall outdoors, stepping stones through the
orchard, a door punched into brick for interiors. The tile itself is the signpost, the way an older
Pokemon route reads. The floating pulsing marker is gone.

**And a transition can no longer bounce you back.** 0.1.0's Okobo→north road exit dropped the
player exactly on the return path, so they were sent straight back; an audit found three more of
those and thirteen more one tile away from it. Rather than nudge coordinates, exits are now
*armed*: after arriving, no exit can fire until the player has stood clear of every exit in the
room. The playtest checks all eighteen directions.

**Sprites are generated, not typed.** `tools/gen_sprites.py` composes each sprite from shape
primitives — a filled ellipse, a highlight pass clipped to it, an automatic dark outline — so
everything shares a three-tone read, rows can't go ragged, and a silhouette is tuned by changing a
radius. Palette indices are base36, so a sprite can carry more than ten tones.

**The player faced the wrong way.** The side sprite was drawn facing left while the renderer
mirrored it for left, so he walked backwards in both directions. The base sprite now faces right.

**The bedroom door moved to the far wall**, and the strip of light under it is the room's only
light source until the argument ends — the vignette is centred on the door, not on the boy. When
the door slams the light goes out and the radius collapses to almost nothing.

**Title screen** is the game's name, CONTINUE (when there's a save), NEW GAME, and OPTIONS. The
tagline is gone, and so is the duplicated wordmark that sat above the canvas.

**Options** — text speed, volume, flashing, film grain — reachable from the title and from the
pause menu, stored in `localStorage`.

## What's in it

The slice specified in [18](18-vertical-slice.md), end to end, plus Act 2:

- **Title, name entry, save.** An empty name is refused and the refusal does not explain itself
  ([Decisions #7](open-questions.md)). Multi-session save via `localStorage`.
- **Act 0 — the bedroom.** Five interactables. The door produces block glyphs, regenerated per
  interaction so there is genuinely nothing to decode. Three attempts and the argument ends the way
  it was always going to.
- **Act 0.5 — the Gallery.** The dark expanse, the brick building, grass on the floor indoors,
  drop-tile ceiling, and all five paintings — obelisk, sphere, pyramid, cube, and the spire in its
  smaller frame. Four near-identical descriptions and one variation. Then the corridor, and the
  fall.
- **Act 1 — Okobo.** Four villagers with the Limpo verbal tic, a shop, an inn that saves and
  restores, two sidequests (the well bucket, and the letter to an address that is a foundation with
  nothing on it), the well, the memorial, a lore note, and the **first Custodian sighting** —
  non-interactive, about two seconds, no music change, no acknowledgement.
- **Act 1 — the Sunken Orchard.** Four rooms of ankle-deep water, wandering enemies including
  `Wader` and its uncurable `Homesick`, a hidden collectible, and **The Fruiting Tree**.
- **Battle.** Physical / Special / Bag / Run, PP and SP with the +2/turn trickle, the flee rule,
  levelling with move unlocks, catch-up EXP, and `??` on the bosses.
- **Act 2 — the road, Ondo, Kestrel Works, and The Memorial.** Detailed above.

## Everything is generated

No image files, no audio files, no fonts.

- **Sprites** are composed from shape primitives by `tools/gen_sprites.py` and emitted as row
  strings with base36 palette indices, drawn pixel by pixel.
- **Tiles** — brick, grass, water, wood, drop-ceiling, carpet, snow, concrete, pavement, masonry —
  are procedural, seeded by tile coordinate so the texture never shimmers between frames.
- **The font** is a 5×7 bitmap defined inline, including a solid block glyph for the one word the
  game will not show you.
- **Audio** is WebAudio synthesis: oscillators for the Okobo, Ondo and battle themes, filtered noise
  for footsteps and hits, and sustained drones for the liminal rooms — the Gallery and Kestrel
  Works — which have no melody at all.

The whole build is about 160 KB.

## The data is not copied, it is generated

`tools/build_game.py` writes `game/src/00_data.js` from `data/*.json` — the stat curve, the move
lists with their costs and unlock levels, the 45 enemy species with their roles, the enemy stat
formulas, the boss multipliers, item prices, and the shop stock.

**The playable build therefore cannot drift from the design documents.** Retuning the game means
editing a formula in `data/statblocks.json` and rebuilding; the fight that comes out is the fight
`tools/simulate.py` predicted. `tools/validate.py` fails if the checked-in build is stale.

The one place prose is reconciled with numbers is battle-item effects: the docs say "restore 120
HP" and the game needs `120`, so the build parses it and fails loudly on anything it does not
recognise.

## Known deviations from the design

Stated plainly, because 0.3.0 is the first three acts and not a demo of the finished thing.

| Doc says | Build does | Why |
|---|---|---|
| 2D sprites inside low-poly 3D rooms | Top-down 2D throughout | The mismatch is the horror engine and it is the single biggest thing this build does not prove. Lighting, palette and grain carry the mood instead. |
| Battle camera behind the shoulder | Approximated — the top of his head at the bottom of frame | Correct framing, flat backdrop. |
| Stat stages, Fog/Static/Numb/Drained | Only `Homesick` is implemented | Ondo and Kestrel enemies that should inflict the rest hit for damage instead. The first real gap in the build. |
| Multi-enemy encounters | One enemy at a time | Same. |
| Eight Ondo sidequests | Six — fountain, ledger, delivery, records, bench, plus Kestrel's yard lights | The two cut (the lost dog, the market bird) are the comic ones. They are pure NPC writing, add no systems, and the bakery feud survives as flavour without its errand. |
| Equipment | Not in the build | Act 2 is where the first meaningful choice lands ([06](06-items-and-equipment.md)), and it is the next thing to add. |
| Warp devices, collectible counter UI | Absent | Midpoint and later systems. |
| Accessibility toggles | Present — text speed, volume, flashing, grain | Added in 0.2.0. |
| Okobo's theme should be the prettiest music in the game | It is a detuned triangle-wave loop, and Ondo's is prettier | Both are placeholders with the right shape. A composer replaces them. |

## The done criteria

Five of [18](18-vertical-slice.md)'s six criteria are arithmetic and can be checked now:

| Criterion | Status |
|---|---|
| Reaches the boss in 45–60 min without being told where to go | **Untested.** Needs a human. |
| A playtester notices the Gallery corridor is too long | **Untested.** The corridor is 40 tiles. |
| Nobody asks what `??` means after the boss | **Untested**, but the game teaches it — `??` greys RUN and says so. |
| Combat is 10–22% of elapsed time | Modelled at 13% ([11](11-pacing-and-systems.md)); not yet measured in play. |
| Numbers land inside the simulator's targets | **Holds.** The build uses the same tables `simulate.py` was tuned against. |
| A playtester calls Okobo *nice* and the Orchard *sad* | **Untested.** This is the one that matters. |

Act 2 adds one more, and it is the same shape as the last one: **a playtester should call Ondo
busy and Kestrel Works cold, and should not be able to say when it changed.** The road between them
is one screen long on purpose.

## What Act 2 cost, in bugs found

Four, all of them the same kind — content that existed but was unreachable, which is the failure
mode a checker cannot see because nothing about it is inconsistent.

- **`Last One Out` was written and never placed.** The note that motivates the yard-light errand,
  and the last beat of the layoff sequence, was in `NOTES` and in no room. The playtest now walks
  the whole sequence and counts it.
- **The yard-light switch was attached to a locker on the third floor** and described itself as "the
  panel by the gate." It is now a panel, by the gate.
- **The Northside delivery could be accepted and never finished** — nothing set the completion flag.
- **The boarding-house ledger had a giver and no quest**, and the boarder who is meant to be seen
  once could be talked to forever.

The playtest gained a check for each. It also gained the ability to use the bag mid-fight, through
the real menu rather than a back door, because a boss balanced around healing items cannot be beaten
by mashing the first physical move and the check was failing at random.

Everything left is the part a tool cannot do.
