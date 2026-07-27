# 16 — Combat Math

How enemy numbers are derived, what a fight is supposed to feel like, and how those two are kept
honest. Run `python3 tools/simulate.py` after changing anything here.

## Enemy stats are derived, not authored

No enemy has a hand-written stat block. Every one has a **level** and a **role**, and its stats fall
out of a curve:

```
HP  = (14 + 2.6·L + 0.65·L²) × role.HP
ATK = (3.36 + 0.688·L)       × role.ATK
DEF = (2.8 + 0.80·L)         × role.DEF
SPD = (4 + 1.10·L)           × role.SPD
enemy attack power = 20
```

| Role | HP | ATK | DEF | SPD | Reads as |
|---|---:|---:|---:|---:|---|
| standard | 1.00 | 1.00 | 1.00 | 1.00 | the baseline |
| brute | 1.25 | 1.25 | 0.85 | 0.70 | slow, heavy, hits back |
| wall | 1.20 | 0.70 | 1.50 | 0.75 | a chore, not a threat |
| glass | 0.65 | 1.20 | 0.60 | 1.45 | dies fast, hurts first |
| support | 0.85 | 0.55 | 1.00 | 1.05 | does something other than damage |

45 species need 45 levels and 45 role tags, not 270 hand-tuned numbers. Retuning the game is editing
five formulas.

**Bosses** use the same curve at their internal level ([08](08-bosses.md)), multiplied by a per-boss
HP and ATK factor in `data/statblocks.json`. Boss HP factors run 1.5–2.5× — modest, because the
quadratic HP term means being a few levels above the player is already most of the gap.

## Why HP is quadratic

The player's damage output compounds: `ATK` grows about 10× across the game *and* move power grows,
so raw output grows roughly 35×. Linear enemy HP grows about 11×. Left alone, those diverge until
every late-game enemy dies in one hit — which is exactly what the first simulator run found.

Two corrections, both load-bearing:

1. **Move power is a sidegrade axis, not a scaling axis.** Power differentiates options *at a given
   level* — `Haymaker` beats `Punch` because 48 beats 20 — but it is not also responsible for making
   the player stronger over time. That's what stats are for. Powers span 20→70 (3.5×), not 20→140.
2. **Enemy HP carries an L² term**, so it tracks output that is itself the product of two growing
   numbers.

Getting this wrong is the single easiest way to break the game, and it isn't visible by reading the
tables. It took a simulation to see it.

## The damage formula

```
raw   = (ATK · POWER) / 12 − DEF · 0.5
final = max(1, raw × uniform(0.90, 1.10))
```

Subtractive, SNES-style, and deliberately so — but subtractive formulas get fragile across a 45-level
span, which is why `wall` sits at 1.5× DEF and not the 1.9× first drafted. At 1.9× a low-level wall
subtracted almost the entire player's damage and the first mini-boss became unwinnable.

## What a fight should feel like

Targets live in `data/statblocks.json` and the simulator fails if a matchup falls outside them.

| | Turns | Win rate | Attrition |
|---|---|---|---|
| Regular encounter | 2–8 | ≥98% | band median 8–35% |
| Mini-boss | 6–15 | ≥80% | — |
| Main boss | 9–24 | ≥70% | — |

**Attrition** is HP lost *plus HP restored mid-fight*, over max HP — what the fight actually cost,
not where the bar happened to end up. Measuring the ending HP bar makes any encounter look free as
soon as the player can heal.

**Attrition is judged on the band median, not per species.** A glass enemy that dies in two turns
and a wall that grinds on for six are both correct; only the band as a whole has to cost something.

**Band 10 (the Root) is exempt from the attrition floor.** It is the one place the player outclasses
the world ([12](12-bestiary.md)), and cheap fights there are the payoff, not a bug.

## Measured difficulty curve

At the expected level for each fight, with the item budget in `statblocks.json`:

| Boss | Turns | With items | Without items |
|---|---:|---:|---:|
| The Fruiting Tree | 6 | 100% | 100% |
| The Memorial | 9 | 100% | 100% |
| Line Supervisor | 9 | 95% | 96% |
| Tenant | 9 | 98% | 98% |
| Account Manager | 6 | 100% | 100% |
| **The Custodian** | 22 | 94% | **0%** |
| Something Left Over | 15 | 94% | 88% |
| **The Custodian, Unfinished** | 24 | 100% | **3%** |

The shape this produced was not designed, it was measured, and it's better than what was drafted:
the first five encounters are teaching fights that a competent player will not lose, and then the
two Custodian fights become **hard resource checks** — clearable at level, unclearable without a
stocked bag.

That lands on the economy by accident and in the right direction. There are no sidequests in Act 5
and no friendly NPCs left ([13](13-sidequests.md)), so money is tightest exactly when items stop
being optional.

**Correction this forced:** [08](08-bosses.md) used to describe The Memorial as "the first fight the
player can lose." It isn't — it's a wall, it barely hits, and it wins 100% of simulated runs with no
items at all. That claim now sits where it's true.

## What the simulator does and doesn't model

**Models:** the damage formula and variance, crits, PP/SP costs and the +2/turn trickle, move
selection by expected damage, healing via `Mend`/`Mend+` and items, `Homesick` chip damage and
`Quiet Room` clearing it, boss HP restores, per-phase damage falloff, and enemy inaction (the
species built around *not* attacking — `Fence Post`, `Unit 4C`, `Fluorescent` and friends carry an
`inaction_rate`).

**Doesn't model:** stat stages, accuracy and `Fog`, multi-enemy fights, `Counter Stance`, turn order
and priority moves, equipment, or a player who plays well. It is a tuning tool and a floor, not a
proof — real play should be easier than these numbers, because the simulated player is a greedy
damage-picker who never sets up.

**And the levels it fights at are derived, not assumed.** `tools/curve.py` walks a playthrough and
reports where the player actually is when each boss arrives ([05](05-progression.md)); the
`player_expected` ranges here come from that walk. Two of them were originally a level too narrow
at the top and were widened to match what the model produced.

**It also fights each species at the right time.** An enemy at the top of a band is met later in the
area, so it's simulated against a player nearer the top of their expected range rather than the band
median. Fighting everything at the median made top-of-band enemies look like difficulty spikes when
they're just later.

## A caveat this simulator earned the hard way

A player report in 0.2.0 said early fights left them unable to act. The cause was not balance: the
**+1/turn trickle existed in this simulator and in `data/progression.json`, but had never been
built into the game.** The simulator was validating a mechanic the build did not have, and every
matchup passed while the real game ran dry.

Two things changed as a result.

`tools/build_game.py` now exports the regen figures into the build, and `tools/validate.py` fails
if the build's copy disagrees with the data *or* if the battle code never references it — a rule
the simulator relies on has to reach the game.

And the simulator now counts **turns with no affordable move** and fails any matchup with one. That
check is not about the trickle specifically; it catches the symptom whatever the cause, which is
what the earlier targets could not do. It immediately found the same problem in the two Custodian
fights, where a +1 trickle against a 2 PP move meant the player acted only on alternate turns once
their pools ran dry.

## How these numbers were reached

The constants above are not hand-picked. A random search over the enemy curve coefficients, attack
power and boss multipliers was scored against the targets with a deterministic mean-damage
evaluator, refined locally, and the winner verified against the stochastic simulator at 2000 trials
per matchup.

They remain **first-pass and untested by humans.** Nothing here has been playtested; it is a
starting point that is at least internally consistent, which the first draft was not.
