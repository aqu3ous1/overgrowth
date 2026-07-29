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
| [16 — Combat Math](docs/16-combat-math.md) | Enemy stat derivation, damage formula, measured difficulty |
| [17 — Economy](docs/17-economy.md) | Shops, prices, and the per-act ledger |
| [18 — Vertical Slice](docs/18-vertical-slice.md) | What to build first, and how to know it worked |
| [19 — The Playable Build](docs/19-build.md) | What 0.5.0 contains, and where it deviates |
| [Decisions](docs/open-questions.md) | Every design call made, with reasoning and reversal cost |

## Play it

**0.5.0 is playable — Acts 0 through 3, on a desktop or a phone.** `game/overgrowth.html` runs from
the bedroom to **Tenant** at the top of Bellhouse Commons: the Gallery, Okobo, the Sunken Orchard,
Ondo, Kestrel Works, the border, Sable City and the Commons — four bosses, forty-six rooms, an
illustrated world map, save anywhere, and touch controls, in one self-contained file with no assets
and no dependencies. Every sprite is drawn pixel by pixel at runtime, every tile texture is
procedural, the font is a 5x7 bitmap defined inline, and all the audio is WebAudio synthesis.

```
python3 tools/gen_sprites.py       # shape primitives -> the pixel art
python3 tools/build_game.py        # src + data -> game/overgrowth.html
python3 tools/playtest.py          # drives it with a keyboard, fails on any error
python3 tools/playtest_mobile.py   # drives it with a thumb, on an emulated phone
```

The game opens by asking which controls you want — **on-screen pad** or **keyboard** — answerable
with either. Keyboard is **arrows** to move, **Z** confirm, **X** cancel, **C** menu. `CONTROLS` in
the options changes it later.

The build's balance tables are *generated* from `data/*.json`, not copied, so the game people play
cannot drift from the game these documents describe — and `validate.py` fails if the checked-in
build is stale. See [19](docs/19-build.md) for what it contains and the deviations it makes.

## The numbers

`data/` holds the same balance figures as the systems docs, in a form something can read —
progression curve, move lists, enemy roster, boss table, items and equipment, world and quests.

Four tools keep the design honest, each checking a claim the documents make.

```
python3 tools/validate.py       # 587 checks: do the data, docs and build agree?
python3 tools/simulate.py       # 57 matchups x 2000 trials: do fights feel right?
python3 tools/economy.py        # per-act ledger: can the player afford them?
python3 tools/curve.py          # levelling walk: does the player reach the levels
                                #   everything else assumes? also the combat/playtime split
python3 tools/build_game.py     # build the playable slice
python3 tools/playtest.py       # play it in a browser and fail on any error
python3 tools/playtest_mobile.py # play it on an emulated phone, taps only
```

The four checkers are stdlib only. `playtest.py` needs `playwright`. Add `--verbose` to any of the
checkers.

It verifies the EXP curve against its own formula, that every move is castable at the level it's
learned, that every boss shows `??` and no regular enemy does, that the Root is the only encounter
band the player outclasses, that every act from 2 to 4 offers a trade-off item in both equipment
slots, that the family's names are never rendered anywhere, that the scope table in
[00](docs/00-overview.md) still matches the rosters, and that no doc links to a file that isn't
there — 587 checks in total, including that the checked-in build is not stale.

**Run both after changing any number.** The validator caught four real inconsistencies on its first
run, including two arithmetic errors in the EXP table and a boss the player could have fled from.

The simulator caught something bigger: **player damage was outgrowing enemy HP by roughly 70×.**
Move power and stats were both scaling, so they compounded — every late-game enemy died in one hit
while the early bosses were unwinnable. Fixing it meant treating move power as a sidegrade axis
rather than a scaling one, and giving enemy HP a quadratic term. Neither problem is visible from
reading the tables. See [16](docs/16-combat-math.md).

The economy model found the healing ladder had **Spray and Spray II at identical value per Rell**,
which makes one of them pointless, and confirmed something better than it disproved: acts 4 and 5
run at a *loss*. The player spends the endgame burning savings earned back when the world still
talked to them. That was never designed — it fell out of putting 13 of 20 sidequests before the end
of Act 2, and it lands on exactly the point where the simulator says items stop being optional.
See [17](docs/17-economy.md).

A player report closed a gap none of them could see: the **+1 PP/turn trickle lived in the data and
in the simulator but had never been built into the game**, so the sim was validating a mechanic the
build did not have. The simulator now counts turns where the player has *no affordable move* and
fails on any, and the validator checks both that the trickle reaches the build and that it is at
least as large as the cheapest attack's cost. See [19](docs/19-build.md).

Building Act 2 turned up the same class of problem four more times, and the browser playtest is the
only tool that can see it: **content that exists and cannot be reached.** A lore note written but
never placed in a room, a light switch attached to the wrong object, a sidequest that could be
accepted and never finished, an NPC meant to be seen once who could be talked to forever. None of
those are *inconsistent*, so none of the checkers had anything to compare. `playtest.py` now walks
every one of them.

Then a player found the worst one: **Kestrel Works had one way in, and it was one tile wide.** The
factory door sat in the middle of a fifteen-tile wall with nothing leading to it, so the area read
as a dead end. The playtest now sweeps the whole wall and fails if fewer than three approaches work.

0.3.1 also closed a rule that had been documented since the first draft and never built: **turn
order.** The player always acted first, SPD did nothing outside the crit roll, and `Wind-Up Punch`
— a move whose whole identity is *hits harder but goes last* — was a more expensive Punch that lied
about it. The simulator had not been modelling it either; adding it moved measured attrition from
15% to 19%, which is the honest price of the rule. Every matchup still lands inside target.

The levelling walk closed the last unverified assumption. Every other tool takes the
`player_expected` range at each boss on faith; `curve.py` derives it instead, and found two ranges a
level too narrow. It also motivated **catch-up EXP** — the game quietly pays more per fight when the
player is behind — because a game that lets you flee half its encounters and then walls you for
doing it has set a trap. See [05](docs/05-progression.md).

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

**If you are here to build something**, read [18](docs/18-vertical-slice.md) instead. It is the
first 45 minutes of the game specified room by room, with an asset list, the systems to defer, and
six done criteria — five of which are arithmetic and one of which is whether a playtester calls the
Sunken Orchard *sad* rather than *scary*.

## Status

The design bible is complete through the endgame. **The build runs Acts 0 through 3** — roughly the
first seven hours, ending on Main Boss 2 — and everything past Bellhouse Commons is documented but
not yet built. The next thing to add is equipment, which is the oldest system still missing.

Numbers in the systems docs (damage values, PP/SP costs, level curve, prices, enemy levels) are
**first-pass and meant to be tuned**, not final. They're written down so balance discussions have
something concrete to argue with.

Every design question raised in the first pass has been decided, so **nothing here blocks work.**
The calls and their reasoning are in [Decisions](docs/open-questions.md), each with a reversal cost
— two of them invalidate every number in the systems docs if overturned, and the rest are cheap.

Anything marked **PROPOSAL** is an addition beyond the original brief, flagged so it stays easy to
cut.
