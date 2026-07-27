# 04 — Battle System

Turn-based. One player combatant versus one to three enemies. No party, no swapping, no summons,
no revives. All numbers here are first-pass and meant to be tuned.

## Battle framing

Camera sits behind and slightly below the player, showing only the top of his head at the bottom of
frame (Image 2). Enemies occupy the middle distance against the room they were encountered in. The
player never watches his own sprite take damage.

## The menu

Four options, always in this order:

```
  PHYSICAL    SPECIAL
  BAG         RUN
```

### PHYSICAL — costs **PP** (Physical Points)

Reliable, cheap, front-loaded. Physical is the answer to most fights and the *only* answer when SP
is dry. Scales off **ATK**, reduced by enemy **DEF**.

### SPECIAL — costs **SP** (Special Points)

Expensive, situational, higher ceiling. Covers everything Physical can't do: sustain, debuffs,
barriers, and defence-ignoring damage. Scales off **SPATK**, reduced by enemy **SPDEF**.

Full move lists with costs and unlock levels: [05](05-progression.md).

### BAG

Two tabs, and the split is enforced:

- **Special Items** — overworld use only. Greyed out in battle. Notes, keys, warp devices, quest
  items, area tools, the ten collectibles.
- **Battle Items** — battle use only. Healing sprays, stat boosters, enemy debuffs. All consumable
  except a small number of post-game finds.

Using an item takes the whole turn and resolves at the player's speed priority like any other action.

### RUN

| Condition | Outcome |
|---|---|
| Enemy level **>** player level | **Cannot flee.** The option is visible and greyed, with the enemy's level shown as the reason. |
| Enemy level **≤** player level | **50% chance**, flat, regardless of the gap. |
| Enemy level shown as **`??`** | **Cannot flee.** See below. |

A failed flee consumes the turn and the enemy acts. The flat 50% is deliberate: it stops
over-levelled players from treating the world as empty corridor, and keeps late-game tension
identical to early-game tension. Do not add a speed modifier to it.

## Enemy level display

**Every enemy's level is shown** next to its name in the battle UI. The player must always be able
to read "can I leave?" off the screen before committing. It is the game's only difficulty signal,
and it quietly does thematic work: every fight tells you upfront whether leaving is allowed.

### `??`

**Bosses do not show a number. They show `??`.**

This is the one exception, and the exception is the signal. `??` resolves as *unknown, and therefore
not below yours*, so the existing flee rule closes RUN without needing a special case bolted onto
it — the UI and the mechanic finally say the same thing.

What this buys:

- **Bosses stop being tied to the level cap.** A boss's internal level is a balance number, never a
  displayed one, so it can sit anywhere — including above 45, where the player can never reach it.
  The final boss does exactly that.
- **`??` is the boss indicator.** No nameplate flourish, no music sting, no "A CHALLENGER
  APPROACHES." The player looks at the level readout, sees two question marks, and knows both that
  this is not a normal fight and that they are not walking out of it. One UI element, doing all of
  it.
- **Nothing is hidden that the player was shown.** The alternative — a numeric boss level plus a
  concealed no-flee flag overriding it — hands the player a figure to reason about and then quietly
  ignores their reasoning. `??` tells the truth: you don't get to know, and that's the answer.

`??` appears on all eight bosses and the secret encounter, and nowhere else. Regular enemies always
show a real number — including the `Retention Specialist` ([12](12-bestiary.md)), who is the only
*numbered* enemy in the game that cannot be fled, and who exists two encounters before the Custodian
so that "some things don't let you leave" is established before it matters.

## Turn flow

1. Player selects an action.
2. Enemies select actions (hidden).
3. All actions sort by **SPD**, ties broken by a coin flip. Some moves override priority — e.g.
   `Wind-Up Punch` always acts last, `Rush Down` always acts first.
4. Actions resolve in order. Dead combatants' queued actions are dropped.
5. End-of-turn: status ticks, buff/debuff durations decrement, PP/SP regen (see below).

## Damage formula (first pass)

```
raw   = (ATK * POWER) / 12 - (DEF / 2)
final = max(1, raw * variance * type_mods * stage_mods)
variance = uniform(0.90, 1.10)
```

Special moves substitute SPATK and SPDEF. Critical hits (base 4%, modified by SPD) apply 1.75× and
ignore the target's DEF/SPDEF term entirely.

## Resource regeneration

The player regenerates **+1 PP and +1 SP at the end of each turn**, capped at max.

This exists because a solo combatant with no party has no way to stall for resources, and running
completely dry in a long fight is a lose-state with no counterplay. The trickle is small enough that
it never replaces resting or items — it just guarantees `Punch` is always affordable. Full restore
happens at save points and inns.

**HP does not trickle** — decided, see [Decisions #2](open-questions.md). Passive HP regen would
make attrition meaningless and defang **Homesick**, which is the one thing in this game the bag
can't fix.

## Status effects

Kept deliberately small — five statuses, all curable, none permanent.

| Status | Effect | Cure |
|---|---|---|
| **Static** | 25% chance to lose the turn. | 3 turns, or an item. |
| **Fog** | −40% accuracy. | 4 turns, or an item. |
| **Drained** | PP/SP regen suppressed; SP costs +50%. | 4 turns, or an item. |
| **Numb** | DEF and SPDEF halved. | 3 turns, or an item. |
| **Homesick** | Lose 5% max HP at end of each turn. Cannot be cured by items — only by winning, fleeing, or the `Quiet Room` special. | — |

**Homesick** is the thematic status and should be rare: two enemy species, one mini-boss, and the
Custodian both times. It's the only status the bag can't fix.

## Stat stages

Buffs and debuffs move a stat by stages, EarthBound-style, ±3 max in either direction. Each stage is
±25% of base. Stages reset at end of battle and are shown as small arrows next to the affected
combatant.

Affectable: ATK, SPATK, DEF, SPDEF, SPD, and accuracy.

## Encounters

- **Visible on the overworld**, not random-triggered from tall grass. Enemies wander their room and
  can be avoided by a patient player — important, because in liminal zones the *quiet* is the point
  and a fight every eight steps would ruin it.
- Touching an enemy from behind grants the player a free first turn. Being touched from behind
  grants the enemy one.
- Encounter density is low in liminal zones and higher in the connective wilderness between towns.
- Enemies do not respawn while the player remains in a zone; leaving and re-entering respawns them.

## Defeat

Losing all HP returns the player to the last save point with **half his carried money** and all
items intact, plus a short black-screen beat before he wakes up. No permadeath, no item loss, no
lost progress on cleared rooms.

The money penalty is the whole punishment. This game's difficulty is meant to live in boss design,
not in punishing failure — see [11](11-pacing-and-systems.md).
