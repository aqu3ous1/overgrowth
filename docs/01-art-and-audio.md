# 01 — Art & Audio Direction

## The core visual idea

**Crisp 2D sprites standing inside grainy low-poly 3D rooms.** SNES-era JRPG character work —
EarthBound proportions, big round heads on small blocky bodies — dropped into PS1/N64-adjacent
texture-mapped environments with visible affine warping, low-res tiling textures, and short draw
distance.

The mismatch *is* the horror engine. The player sprite never quite sits in the room; the lighting
on him never quite matches the lighting on the walls. **This is never to be corrected or smoothed
out.** Any art pass that makes the sprite "blend in better" has broken the game.

## Palette by layer

| Layer | Treatment |
|---|---|
| **Real world** (bedroom, prologue, ending) | Underlit and desaturated to the edge of legibility. Reference Images 1, 2 and 4: near-silhouette against pure black, single light source, grain. |
| **Threshold** (the Gallery) | Black void exterior, sodium-lit interior. The only saturated thing in frame is the grass on the floor, which is *wrong* and should read as wrong immediately. |
| **Dream world** (Limpo, Yettallia) | Oversaturated and slightly too bright. Hot pinks, mustard yellows, violets where Earth would show muted greens and browns. It reads as *beautiful* first and *wrong* second — that delay is the point. |
| **Liminal zones** | Dream-world geometry drained back toward the real-world palette. As the player goes deeper into a dungeon, saturation falls. The last room of a dungeon should look like the bedroom. |

That last row is the whole visual arc in one rule: **the closer you get to the truth, the more it
looks like home.**

## The overgrowth motif

Grass, moss, and creeping green appear where they cannot possibly be — indoor floors, factory
catwalks, apartment hallways, inside a server rack. It is the game's title, its recurring image,
and (see [09](09-collectibles-and-endings.md)) a soft visual tell for the ten hidden collectibles.

Rules for placing it:
- Never comment on it. No NPC ever mentions the grass. No text box points at it.
- Density scales with how close the player is to something true. A room with a real lore note in it
  has a little more green than the room before it.
- In the final area it is everywhere, and by then it should feel like relief rather than dread.

## Lighting

- One dominant source per room, usually practical (a doorway, a fluorescent panel, a window).
- Hard falloff. Corners go to actual black, not dark grey. The player should routinely be walking
  into space he cannot see.
- Fluorescent panels in the Gallery and Vixtry interiors get a faint flicker with an irregular
  period — never a rhythmic strobe (see accessibility note in [00](00-overview.md)).
- The dream world's outdoor lighting has no visible sun and casts soft, directionless shadows.
  Nobody remarks on this either.

## Sound

| Context | Direction |
|---|---|
| **Towns** | EarthBound-style melodic themes, slightly detuned, warm. This is where the game is allowed to be charming. Okobo's theme should be genuinely lovely — it makes everything after it worse. |
| **Liminal zones** | Near-silence, or a single sustained tone: refrigerator hum, distant HVAC, a held synth note, a heartbeat. Footsteps and one ambient layer, nothing else. |
| **Battle** | Upbeat, almost cheerful, high-BPM — deliberately dissonant against what's being revealed. A Vixtry officer calmly explaining neural dependency over a bouncy battle theme is the tonal target. |
| **Custodian encounters** | The music does not stop, it *degrades* — the town or dungeon track keeps playing with progressively more sample corruption, dropped channels, and pitch drift. Never a sting. Never silence-then-scare. |
| **Real world** | No music. Room tone only. Both the prologue and the ending are scored with a furnace and a clock. |

**Rule:** Overgrowth has no jump scares. Not one. If a moment can only land with a volume spike, it
gets cut.

## Text boxes and UI

EarthBound-style scrolling dialogue in a bordered box at screen bottom, with a distinct font per
speaker class:

| Speaker class | Font treatment |
|---|---|
| NPCs / world | Clean pixel serif. Warm, readable, unremarkable. |
| System / menus / battle log | Monospace. Cold, technical, no personality. |
| Vixtry employees | The system font, not the NPC font. They talk like the menu. Nobody notices this until it's pointed out, and nobody points it out. |
| **The Custodian** | Degrading. Starts as the NPC font, loses kerning, repeats lines, overflows the box, fills all four lines (see the "Never leave." wall in Image 2). Never elaborates, only repeats. |

Additional rules:
- The Custodian's box has **no advance prompt**. It advances on its own, or it doesn't advance.
- Vixtry signage in-world uses a clean modern sans — the only non-pixel typography in the game,
  which makes their billboards feel pasted on top of reality. Because they are.
- Menu text never uses contractions. NPC text uses them constantly. Small thing; keeps the
  system voice inhuman without anyone consciously registering why.

## Restraint

Not every liminal space needs to be scary. Many should just be **sad** or **empty**. EarthBound's
real talent was making an abandoned place feel melancholy, and that register is available to us for
free — an empty apartment with the lights on and nobody home is more useful, more often, than a
monster.

Budget the genuinely unsettling beats: the Custodian's four appearances, the Bellhouse Commons
mural room, and the Act 5 opening. Everything else is allowed to just be lonely.
