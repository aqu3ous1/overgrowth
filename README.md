# OVERGROWTH

> A lonely boy, ignored by parents who only ever seem to argue, falls asleep and wakes inside a
> dream that refuses to end — a saturated, slightly-wrong world built from a shady tech company's
> digital afterlife. To wake up, he has to cross it on foot, alone, fighting what he finds, and
> slowly realizing the "dream" is something Vixtry Co. built specifically for him.

A single-player, turn-based RPG in the lineage of **EarthBound** (battle grammar, NPC whimsy,
forgiving curve) and **Petscop** (buried lore, restraint, low-poly wrongness). No party. One kid,
one long walk out.

**Target length:** 10–15 hours at a slow-to-moderate pace, ~15+ with the secret-ending hunt.

---

## Documentation

| Doc | Contents |
|---|---|
| [00 — Overview](docs/00-overview.md) | Pitch, pillars, themes, scope, production notes |
| [01 — Art & Audio](docs/01-art-and-audio.md) | Visual direction, palette, sound, UI and text boxes |
| [02 — Story](docs/02-story.md) | Full act-by-act narrative breakdown |
| [03 — Characters](docs/03-characters.md) | Protagonist, the Custodian, Vixtry Co., NPC archetypes |
| [04 — Battle System](docs/04-battle-system.md) | Turn flow, menus, PP/SP, fleeing, status effects |
| [05 — Progression](docs/05-progression.md) | Stats, level curve, full move learnset |
| [06 — Items & Equipment](docs/06-items-and-equipment.md) | Bag structure, battle items, equipment, warp devices |
| [07 — World & Areas](docs/07-world-and-areas.md) | Limpo, Yettallia, the ten major areas |
| [08 — Bosses](docs/08-bosses.md) | Four mains, four minis, the geometric motif |
| [09 — Collectibles & Endings](docs/09-collectibles-and-endings.md) | The ten hidden items, both endings |
| [10 — Writing Guide](docs/10-writing-guide.md) | Voice per faction, sample lines, dialogue rules |
| [11 — Pacing & Systems](docs/11-pacing-and-systems.md) | Hour-by-hour pacing, saves, economy, difficulty |
| [12 — Bestiary](docs/12-bestiary.md) | 45 enemy species across ten encounter bands |
| [13 — Sidequests](docs/13-sidequests.md) | All twenty quests, givers, and rewards |
| [14 — Script Samples](docs/14-script-samples.md) | Six scenes written in full, as tone reference |
| [15 — Lore Notes](docs/15-lore-notes.md) | All thirty readable notes, written out |
| [Decisions](docs/open-questions.md) | Every design call made, with reasoning and reversal cost |

## The numbers

`data/` holds the same balance figures as the systems docs, in a form something can read —
progression curve, move lists, enemy roster, boss table, items and equipment, world and quests.

`tools/validate.py` checks that the data and the docs agree with each other, and that both follow
the rules the design claims to follow:

```
python3 tools/validate.py     # stdlib only, no dependencies
```

It verifies the EXP curve against its own formula, that every move is castable at the level it's
learned, that every boss shows `??` and no regular enemy does, that the Root is the only encounter
band the player outclasses, that every act from 2 to 4 offers a trade-off item in both equipment
slots, that the family's names are never rendered anywhere, that the scope table in
[00](docs/00-overview.md) still matches the rosters, and that no doc links to a file that isn't
there — 389 checks in total.

**Run it after changing any number.** It caught four real inconsistencies the first time it ran,
including two arithmetic errors in the EXP table and a boss the player could have fled from.

## Two rules the validator enforces, not just documents

**Bosses show `??`, never a level.** It closes RUN through the ordinary flee rule with no special
case, it doubles as the game's only boss indicator, and it unbinds bosses from the player's level
cap — the final boss is internally 48 against a cap of 45, and nobody will ever know.

**The family's names are never revealed.** Not the surname, not the father's, not the mother's,
nowhere in the game. The protagonist knows them; the player doesn't. Parents are referred to by role
only, and the three places the name could structurally appear all dodge it. The single exception is
the father's initial, printed once on a staff roster and never corroborated — the validator fails if
a second sighting is ever added, or if a surname is printed after it.

## Reading order for a new collaborator

00 → 02 → 04 → 07. That's the pitch, the story, how fights work, and where you go. Everything
else is reference. If you only read one page for tone, read [14](docs/14-script-samples.md).

## Status

Pre-production. This repo is the design bible only — no engine code yet.

Numbers in the systems docs (damage values, PP/SP costs, level curve, prices, enemy levels) are
**first-pass and meant to be tuned**, not final. They're written down so balance discussions have
something concrete to argue with.

Every design question raised in the first pass has been decided, so **nothing here blocks work.**
The calls and their reasoning are in [Decisions](docs/open-questions.md), each with a reversal cost
— two of them invalidate every number in the systems docs if overturned, and the rest are cheap.

Anything marked **PROPOSAL** is an addition beyond the original brief, flagged so it stays easy to
cut.
