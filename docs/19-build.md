# 19 — The Playable Build

**0.2.0 — the vertical slice, playable.** Title screen through the first boss, in a browser, in one
self-contained HTML file with no assets and no dependencies.

```
python3 tools/gen_sprites.py    # shape primitives -> game/src/15_sprites.js
python3 tools/build_game.py     # game/src/*.js + data/*.json -> game/overgrowth.html
python3 tools/playtest.py       # drives it in a real browser, fails on any error
python3 tools/playtest.py --shots
```

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

The slice specified in [18](18-vertical-slice.md), end to end:

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
- **Battle.** Physical / Special / Bag / Run, PP and SP with the +1/turn trickle, the flee rule,
  levelling with move unlocks, catch-up EXP, and `??` on the boss.

## Everything is generated

No image files, no audio files, no fonts.

- **Sprites** are composed from shape primitives by `tools/gen_sprites.py` and emitted as row
  strings with base36 palette indices, drawn pixel by pixel.
- **Tiles** — brick, grass, water, wood, drop-ceiling, carpet — are procedural, seeded by tile
  coordinate so the texture never shimmers between frames.
- **The font** is a 5×7 bitmap defined inline, including a solid block glyph for the one word the
  game will not show you.
- **Audio** is WebAudio synthesis: oscillators for the Okobo theme and the battle themes, filtered
  noise for footsteps and hits, and sustained drones for the liminal rooms, which have no melody at
  all.

The whole build is about 127 KB.

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

Stated plainly, because 0.1.0 is a slice and not a demo of the finished thing.

| Doc says | Build does | Why |
|---|---|---|
| 2D sprites inside low-poly 3D rooms | Top-down 2D throughout | The mismatch is the horror engine and it is the single biggest thing this build does not prove. Lighting, palette and grain carry the mood instead. |
| Battle camera behind the shoulder | Approximated — the top of his head at the bottom of frame | Correct framing, flat backdrop. |
| Stat stages, Fog/Static/Numb/Drained | Only `Homesick` is implemented | Nothing in the slice needs the rest. |
| Multi-enemy encounters | One enemy at a time | Same. |
| Equipment | Not in the slice | The slice ends before the first meaningful choice ([18](18-vertical-slice.md)). |
| Warp devices, collectible counter UI | Absent | Midpoint and later systems. |
| Accessibility toggles | Present — text speed, volume, flashing, grain | Added in 0.2.0. |
| Okobo's theme should be the prettiest music in the game | It is a detuned triangle-wave loop | It is a placeholder with the right shape. A composer replaces it. |

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

Everything left is the part a tool cannot do.
