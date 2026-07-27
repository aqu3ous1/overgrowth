# 00 — Overview

## Logline

A lonely boy, ignored by parents who only ever seem to argue, falls asleep and wakes inside a
dream that refuses to end — a saturated, slightly-wrong world built from a shady tech company's
digital afterlife. To wake up, he has to cross it on foot, alone, fighting what he finds, and
slowly realizing the "dream" is something Vixtry Co. built specifically for him.

## The title

**Overgrowth.** It's the literal first strange thing the player sees — grass growing on the floor
*inside* a sealed brick building — and it's the metaphor the whole game runs on: something alive
pushing up through something manufactured. The boy is the grass. Vixtry built the floor.

Shortlist that lost, kept here in case of a rename: *Vacancy*, *Elsewhere*, *Idlewild*,
*Aftercare*, *Homesick*, *Undertow*, *Vixtry*.

## Design pillars

Four rules. When a design decision is contested, it gets resolved by whichever pillar it touches.

### 1. Alone is a mechanic, not a limitation

There is no party. One combatant, one power budget, one inventory, one set of stats. Every system
that would normally distribute load across four characters instead lands on the player: healing is
self-only, there is nobody to revive you, and a bad turn is entirely yours. This is not a scoped-down
version of a party RPG that we apologize for in the marketing — it's the thesis. Loneliness is the
one thing the player can never build around.

### 2. Indifference over malice

The horror is being *tolerated*. Family, friends, and their dream-world mirrors are polite,
distracted, technically responsive, and never actually present. Nobody in this game is cruel to the
protagonist until the Custodian, and even he is arguably just very invested. When writing an NPC who
is supposed to hurt, make them *busy*, not mean.

### 3. Lore is found, never given

Story-critical information is always delivered on the critical path. Everything that makes the story
*mean* something — what Vixtry actually did, who the Custodian is, what the paintings are, why the
grass is there — is optional, missable, and scattered. A player can finish Overgrowth having
understood a sad dream about a boy. A player who reads every note finishes a different game. Neither
one is punished.

### 4. Growth is literal

Stats, moves, and equipment are the mechanical expression of the kid changing. The final act must be
*playable proof* that he isn't the person who fell asleep in Chapter 0 — he moves faster, hits
harder, and has options the opening version of him couldn't imagine. Do not hand out a "you have
grown" cutscene. Let the move list say it.

## Core themes

1. **Loneliness as structure.** See pillar 1.
2. **Being tolerated, not loved.** See pillar 2.
3. **Digital dependency as a modern haunting.** Vixtry never needs to be cartoonishly evil until
   very late. For most of the game it should sound exactly like every other overreaching tech
   company: connection, convenience, "co-living." The player should be able to imagine using it.
4. **Growth through the ordeal.** The world is fake. The ordeal was not. He comes out different
   either way, and the ending refuses to relitigate whether it "counted."

## Core gameplay loop

1. **Arrive at a hub town.** Shops, sidequests, rumors, save point, the game breathing.
2. **Travel to a liminal zone.** The actual dungeons — off-map, underlit, sparsely populated.
   Encounters, hidden lore, one of the ten collectibles.
3. **Clear a mini-boss or main boss.** Generous EXP plus one useful-but-not-broken item, usually
   consumable.
4. **Return to a hub** (on foot early, by warp device after the midpoint). Spend, re-equip, advance.
5. **Repeat with escalating stakes** until the Vixtry reveal reframes what all of it was.

## Scope

| Metric | Target |
|---|---|
| Main story | 10–12 hours |
| Completionist / secret ending | 14–16 hours |
| Major areas | 10 (see [07](07-world-and-areas.md)) |
| Hub towns/cities | 5 |
| Liminal dungeons | 5 |
| Main bosses | 4 |
| Mini-bosses | 4 |
| Player moves | 8 Physical, 10 Special |
| Enemy species | 45 ([12](12-bestiary.md)) |
| Sidequests | 20 ([13](13-sidequests.md)) |
| Level cap | 45 |
| Hidden collectibles | 10 |
| Endings | 2 (standard, secret) |

## Production notes

- **Perspective:** 3/4 top-down free-roam overworld. Battles are first-person-ish framing behind
  the player's shoulder — the reference in Image 2 (the top of the player's blue head at the bottom
  of frame) is the intended battle camera and should be preserved. It puts the player *in* the
  fight without ever showing his face reacting, which supports the silent protagonist.
- **Silent protagonist.** He never speaks, in dialogue or in battle flavor text. Battle log says
  "PUNCH!", not "you punch." All characterization is refracted through how others respond to him.
- **Name entry** at file creation, used throughout NPC dialogue. Multi-file save.
- **No fail state outside battle.** Liminal zones are unsettling but not stealth or chase sequences.
  Dying in a fight is the only lose condition; see [11](11-pacing-and-systems.md) for the death
  penalty.
- **Accessibility:** enemy level is always visible (a core rule, not an option), damage numbers
  toggleable, a text-speed setting, and a "reduce flashing" toggle that specifically tames the
  Custodian encounters and the Act 5 sequences.
