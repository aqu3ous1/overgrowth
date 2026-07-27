# 05 — Stats & Progression

## Stats

| Stat | Name | Role |
|---|---|---|
| **HP** | Health Points | Damage pool. Zero = defeat. |
| **PP** | Physical Points | Fuel for Physical moves. |
| **SP** | Special Points | Fuel for Special moves. |
| **ATK** | Physical Attack | Scales Physical damage dealt. |
| **SPATK** | Special Attack | Scales Special damage dealt. |
| **DEF** | Defense | Reduces Physical damage taken. |
| **SPDEF** | Special Defense | Reduces Special damage taken. |
| **SPD** | Speed | Turn order, crit rate, dodge chance. |

### Two notes on this list

**1. `PP` was disambiguated.** The original brief listed "Physical points (HP)" — the same
abbreviation as Health Points. It's **PP** everywhere in this document, matching how it was
referred to elsewhere in the brief, so HP / PP / SP stay distinct in the UI and in conversation.

**2. `ATK` and `SPATK` were added, and this needs sign-off.** The brief's stat list was HP, PP, SP,
DEF, SPDEF, SPD — no offensive stats — but the equipment example (*"Anvil-Laden Sword increases
physical attack by 5"*) references a physical attack stat directly. Without ATK/SPATK, DEF and
SPDEF have nothing to oppose, equipment can't do what the brief's own example does, and move power
has nothing to scale off.

The alternative reading is that PP and SP double as offensive scalars — but that makes spending
resources actively weaken your damage, which is a punishing and unintuitive loop for a solo
character. **Decided: ATK and SPATK are real stats** ([Decisions #1](open-questions.md)). This is the one call
in the document that can't be cheaply reversed — every balance number in the systems docs is built
on it.

## Level curve

Cap is **45**. A player on the critical path arrives at the finale around level 40–43.

**Bosses are not on this scale.** They display `??` rather than a number, so their internal levels
are balance figures the player never sees and the cap does not constrain — the final boss sits at an
internal 48, above anything the player can reach ([08](08-bosses.md)).

EXP required to reach level *n*:

```
exp_to_reach(n) = round(1.2 * n^3)
```

| Level | Cumulative EXP | Roughly when |
|---|---|---|
| 5 | 150 | Sunken Orchard |
| 10 | 1,200 | Mini-Boss 1 |
| 15 | 4,050 | Main Boss 1 |
| 16 | 4,915 | Entering Yettallia |
| 22 | 12,778 | Main Boss 2 |
| 30 | 32,400 | Vixtry Campus |
| 35 | 51,450 | Main Boss 3 |
| 43 | 95,408 | Main Boss 4 |
| 45 | 109,350 | Cap |

Deliberately generous early — EarthBound's forgiving curve is the model, and a player should never
feel they need to grind to clear a main-path boss. Difficulty lives in boss *design*, not in the
required level.

## EXP rewards and catch-up

A regular enemy is worth:

```
exp = round(0.20 × level^2.32 × role.HP × catchup)
catchup = clamp(1 + 0.12 × (enemy level − player level), 0.5, 2.0)
```

Two things are doing work there.

**Payment scales with the role's HP multiplier.** A wall that takes six turns pays more than a glass
enemy that dies in two. You're paid for the work, not for the kill.

**Catch-up EXP.** The game quietly pays more per fight when the player is behind, and less when
they're ahead — up to double and down to half.

This exists because of the flee rule. Overgrowth lets the player walk away from roughly half its
encounters ([04](04-battle-system.md)), and a game that offers that option and then punishes it with
an under-levelled wall has set a trap. With catch-up, avoiding fights costs time and money but never
digs a hole that only grinding fills. It also compresses the gap between a thorough player and a
minimal one, which keeps boss tuning meaningful for both.

It is never surfaced. No message says "bonus EXP." The numbers are just quietly kind.

## Does the player actually get there?

Everything else in these documents — boss tuning, the simulator's matchups, the `player_expected`
ranges in [08](08-bosses.md) — assumes the player arrives at each fight around a particular level.
`tools/curve.py` walks a playthrough band by band and checks it, for three play styles.

| Act ends | Minimal (60% of fights) | Normal | Thorough (130%) | Target |
|---|---|---|---|---|
| 1 | 8 | 9 | 9 | 9 |
| 2 | 15 | 16 | 17 | 16 |
| 3 | 25 | 27 | 28 | 26 |
| 4 | 34 | 36 | 37 | 36 |
| 5 | 40 | 42 | 44 | 43 |

The three styles stay within about four levels of each other for the whole game, which is the
catch-up term earning its place. A normal player reaches 42 of a possible 45 by the finale — short
of the cap, so the last few levels remain something to find rather than something everyone has.

## Stat growth

Base values at level 1 and at cap. Growth is roughly linear with a small bump at levels 10, 20, 30
and 40 (the four "act break" levels), so the player gets a noticeable spike right when the story
escalates.

| Stat | Lv 1 | Lv 10 | Lv 22 | Lv 36 | Lv 45 |
|---|---|---|---|---|---|
| HP | 30 | 84 | 172 | 296 | 380 |
| PP | 14 | 24 | 44 | 72 | 90 |
| SP | 10 | 22 | 45 | 78 | 95 |
| ATK | 8 | 20 | 37 | 61 | 75 |
| SPATK | 6 | 18 | 38 | 66 | 80 |
| DEF | 7 | 18 | 34 | 56 | 70 |
| SPDEF | 6 | 17 | 34 | 58 | 72 |
| SPD | 9 | 20 | 35 | 55 | 68 |

SPATK overtakes ATK around level 24 — intentional. Physical is the early game's backbone; Special
becomes the late game's, which mirrors the story's shift from a kid throwing punches to a kid doing
things that shouldn't be possible.

## Move learnset

Moves are learned automatically on level-up, announced with a short box. Nothing is missable and
nothing is chosen — a solo character with a build-your-own kit would be a balance nightmare, and the
learnset *is* the character arc.

### Physical (PP)

| Lv | Move | PP | Power | Notes |
|---|---|---|---|---|
| 1 | **Punch** | 2 | 20 | Baseline. Always affordable. |
| 6 | **Multi-Jab** | 5 | 9 × 2–4 hits | Great vs. low DEF, poor vs. high DEF. Each hit rolls separately. |
| 10 | **Wind-Up Punch** | 9 | 34 | Always acts **last** in the turn regardless of SPD. |
| 14 | **Counter Stance** | 6 | — | Halves Physical damage this turn; returns 50% of what was blocked. |
| 18 | **Gut Check** | 8 | 30 | 40% chance to drop target ATK one stage. |
| 24 | **Haymaker** | 14 | 48 | 80% accuracy. |
| 30 | **Rush Down** | 12 | 24 × 2 | Always acts **first**. Second hit only lands if the first connects. |
| 38 | **Last Word** | 20 | 36–72 | Power scales inversely with the player's remaining HP. Max power below 15%. |

### Special (SP)

| Lv | Move | SP | Power | Notes |
|---|---|---|---|---|
| 4 | **Telekinesis** | 3 | 22 | First special learned. Cheap chip damage. |
| 9 | **Mend** | 6 | — | Restores 35% max HP. The only self-heal that isn't an item. |
| 12 | **Health Steal** | 7 | 26 | Heals the player for 50% of damage dealt. |
| 16 | **Mind Fog** | 5 | — | Inflicts **Fog**. |
| 20 | **Static Pulse** | 6 | — | Inflicts **Static**; drops target SPD one stage. |
| 26 | **Aura Barrage** | 13 | 17 × 3 | Hits all enemies. |
| 31 | **Quiet Room** | 10 | — | Halves Special damage taken for 3 turns. Also clears **Homesick**. |
| 34 | **Mend+** | 12 | — | Restores 70% max HP and cures one status. |
| 40 | **Severance** | 18 | 56 | Ignores the target's SPDEF term entirely. |
| 43 | **Wake Up** | 30 | 70 | Learned immediately before the final area. |

`Wake Up` is the last thing he learns and it is the title of the ending. Whether the player uses it
on the Custodian or not, the game should notice.

### Notes on the kit

- **He can always afford `Punch`.** The trickle is **+2 PP and +2 SP per turn**, which is not an
  arbitrary number: it is the cost of the cheapest attack in the game. A trickle *below* that cost
  does not deliver the promise — it lets the player act on alternating turns and stand there on the
  others, which reads as a bug rather than as attrition. `tools/validate.py` fails if the trickle
  ever drops below the cheapest move's cost, and `tools/simulate.py` fails any matchup where the
  player has a turn with no affordable move at all.
- **Sustain arrives at level 9.** Before `Mend`, healing is 100% items, which makes the Sunken
  Orchard and Kestrel Works genuinely tense on a first run. That's the intended difficulty shape and
  shops in Okobo and Ondo are priced with it in mind.
- **`Counter Stance` and `Quiet Room` are the two defensive pillars**, one per resource. Both main
  boss fights in Acts 4 and 5 are designed assuming the player has at least one of them and are
  clearable with neither, just slower.
- **`Last Word`** is the game's only comeback mechanic. It is named for a kid who never got one.
