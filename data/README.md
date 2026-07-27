# data/

The balance numbers from the systems docs, in JSON. Same figures, readable by tooling.

| File | Source doc | Contents |
|---|---|---|
| `progression.json` | [05](../docs/05-progression.md) | Level cap, EXP formula and milestones, stat curve, regen, flee odds, damage formula, death penalty |
| `moves.json` | [05](../docs/05-progression.md) | 8 Physical and 10 Special moves with costs, power and unlock levels; the five statuses |
| `enemies.json` | [12](../docs/12-bestiary.md) | Ten encounter bands and 49 roster entries (45 unique species) |
| `bosses.json` | [08](../docs/08-bosses.md) | Eight boss encounters, their primitives and drops; the secret encounter |
| `items.json` | [06](../docs/06-items-and-equipment.md) | Battle items with prices, both equipment slots, warp devices |
| `world.json` | [07](../docs/07-world-and-areas.md), [13](../docs/13-sidequests.md) | Areas, sidequests, lore-note distribution, pacing, economy |
| `statblocks.json` | [16](../docs/16-combat-math.md) | Enemy stat curve, the five roles, boss multipliers, encounter targets, item budgets |
| `naming.json` | [15](../docs/15-lore-notes.md) | The family-name rule, its three dodge sites, the one permitted initial, and renderings that must never appear |

## Rules

- **The docs are the source of truth for intent; this directory is the source of truth for
  numbers.** If they disagree, the validator fails and someone has to decide which is right.
- Every value here is **first-pass and meant to be tuned.** None of it has been playtested. It
  exists so balance discussions have something concrete to argue with, and so a change in one place
  can be checked against every place it touches.
- Run `python3 tools/validate.py` **and** `python3 tools/simulate.py` after any edit. The first
  checks internal consistency; the second checks that fights still feel the way
  [16](../docs/16-combat-math.md) says they should.

## Fields worth knowing

- `player_expected` — the level range a player on the critical path is likely to be in at that
  point. Boss internal levels must sit above the top of it; enemy bands must reach it.
- `display_level` / `internal_level` — bosses only. `display_level` is always `"??"`; the internal
  figure is a balance number that never reaches the screen and is not bound by the level cap. The
  final boss is internally 48 against a cap of 45.
- `player_outclasses` — set only on band 10 (the Root), where enemy levels deliberately fall below
  the player's so that every fight in Act 5 becomes optional.
- `no_flee` — exactly one regular enemy, the Retention Specialist, who exists to establish that
  some fights don't let you leave before it matters. Bosses do **not** carry this flag; their `??`
  closes RUN through the ordinary flee rule instead.
- `recolour_of` — Root-band species that reuse an earlier enemy at a new level. Four of them, which
  is why the roster has 49 entries and 45 species.
- `permitted_initials` — the father's initial is the one mark of the family the game ever prints.
  The mother's is `null` and must stay that way.
- `roster_line` / `initial_appears_once` — the initial may be printed, but never with a surname
  after it, and never more than once. Guarded so a later draft can't turn one letter into a thread.
- `forbidden_renderings` — regex patterns that must not appear in any doc.
- `role` — one of standard/brute/wall/glass/support. With `level`, it is the entire stat block;
  see [16](../docs/16-combat-math.md).
- `inaction_rate` — how often a species does nothing on its turn. Carried by the enemies whose
  whole gimmick is not attacking, so the simulator does not treat them as constant threats.
