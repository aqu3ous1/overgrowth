# 08 — Bosses

Four main bosses, four mini-bosses. Every one drops generous EXP and **one useful-but-not-broken
item**, usually consumable — enough to feel like a real reward without trivializing what follows.

## The geometric motif

**PROPOSAL.** The five paintings in the Gallery (Image 3) map to the game's five boss-tier
encounters. Each boss's arena, silhouette, or fight pattern echoes its primitive. On a first
playthrough the opening gallery is atmosphere. On a second it is a table of contents.

| Painting | Encounter | The read |
|---|---|---|
| **Obelisk** | Main Boss 1 | A monument. Tall, vertical, defensive, and it comes apart in tiers. Limpo is full of memorials to a war it lost slowly. |
| **Cube** | Main Boss 2 | Industrial, modular, identical on every face. Splits into smaller copies of itself. Yettallia in one shape. |
| **Sphere** | Main Boss 3 | A shape with no corners, no edges, and no exit. The Custodian's first form, and the reason he only ever says one thing. |
| **Pyramid** | Main Boss 4 | Hierarchy. Everything supporting a single point at the top. Vixtry's org chart, and the Custodian's true form. |
| **Spire** (small frame) | Secret encounter | The narrower, taller pyramid in the odd frame — what the pyramid looked like before it was finished. Only reachable via the secret ending. See [09](09-collectibles-and-endings.md). |

The fifth painting is genuinely present in the reference image, set apart in a smaller frame beside
the cube. It costs nothing to make it mean something.

## Encounter table

| Order | Encounter | Act | Level | Player expected | Narrative role |
|---|---|---|---|---|---|
| Mini-Boss 1 | **The Fruiting Tree** | 1 | `??` | 5–9 | Teaches boss-fight stakes before the first main boss. |
| Main Boss 1 | **The Memorial** | 2 | `??` | 12–15 | First real threat. Limpo-themed. *(Obelisk)* |
| Mini-Boss 2 | **Line Supervisor** | 3 | `??` | 16–19 | Yettallia industrial threat. First fight against a person. |
| Main Boss 2 | **Tenant** | 3 | `??` | 21–26 | Yettallia's main threat / Vixtry muscle. *(Cube)* |
| Mini-Boss 3 | **Account Manager** | 4 | `??` | 27–31 | Vixtry mid-tier enforcer. Knows exactly what he's doing. |
| Main Boss 3 | **The Custodian** | 4 | `??` | 32–35 | The white figure, first form. *(Sphere)* |
| Mini-Boss 4 | **Something Left Over** | 5 | `??` | 37–40 | Final obstacle before the climax. |
| Main Boss 4 | **The Custodian, Unfinished** | 5 | `??` | 40–43 | True form. Climax. *(Pyramid)* |

## `??`

**No boss displays a level. Every one of them shows `??`.**

Regular enemies always show a real number — that's the player's read on whether they can walk away
([04](04-battle-system.md)). Bosses show two question marks instead, and that single UI difference
does all of the work:

- **It closes RUN without a special case.** `??` resolves as *unknown, and therefore not below
  yours*, so the existing flee rule greys the option out on its own. There is no hidden flag
  contradicting a number the player was shown and allowed to reason about.
- **It is the boss indicator.** No nameplate flourish, no music sting, no announcement. The level
  readout says `??` and the player knows exactly two things: this is not a normal fight, and they
  are not leaving it.
- **It unbinds bosses from the level cap entirely.** Internal levels are balance numbers that never
  appear on screen, so they can sit anywhere.

### Internal levels

Never displayed. Listed here so encounters can be tuned, and so nobody re-derives them later. The
**player expected** column is not a guess — `tools/curve.py` walks a playthrough and reports the
level a player actually arrives at, and these ranges are set from that.

| Encounter | Internal | Player expected |
|---|---:|---|
| The Fruiting Tree | 10 | 5–9 |
| The Memorial | 16 | 12–15 |
| Line Supervisor | 20 | 16–19 |
| Tenant | 28 | 21–26 |
| Account Manager | 32 | 27–31 |
| The Custodian | 36 | 32–35 |
| Something Left Over | 42 | 37–40 |
| **The Custodian, Unfinished** | **48** | 40–43 |

**The final boss is internally level 48 — three above the player's cap of 45.** He is the only thing
in the game that exists past the ceiling, and because his level is never shown, nothing about that
is a visible gimmick. The player just finds out he is heavier than anything else, and never learns
by how much.

---

## Main bosses

### Main Boss 1 — The Memorial *(Obelisk, `??`)*

Fought in the yard at Kestrel Works, beneath the war memorial, in snow.

**Pattern:** three vertical tiers, each with its own HP pool. Only the lowest exposed tier can be
attacked. Destroying a tier drops the boss's height, changes its moveset, and raises its speed.
Fully defensive in tier 1, mixed in tier 2, desperate in tier 3.

**Teaches:** that a fight can change shape mid-way, and that saving resources for a later phase
matters. It is not, despite an earlier draft saying so, a fight the player is likely to lose — it's
a wall, it barely hits, and simulation clears it 100% of the time with no items at all
([16](16-combat-math.md)). That's correct for what it is; the danger arrives later.

**Drops:** Second Wind ×1, 900 EXP.

### Main Boss 2 — Tenant *(Cube, `??`)*

Fought at the top of Bellhouse Commons, in a room that is a perfect cube and is bigger inside than
the floor it's on.

**Pattern:** splits at 60% and 30% HP into smaller copies, up to three combatants. Each copy has
reduced stats but the full moveset, and they act in the same turn. Damage is spread across the room
— this is the fight that makes `Aura Barrage` (learned at 26, or just missed) and multi-target
thinking matter.

**Drops:** Signal Rod, Full Spray ×2, 2,400 EXP.

### Main Boss 3 — The Custodian *(Sphere, `??`)*

Fought at the end of the Long Hall.

**Pattern:** cannot be fled from, obviously, but more importantly he cannot be *reduced* in the
normal way — at low HP he restores to 50% once. There is no second restore, and the game gives the
player no warning of the first. Inflicts **Homesick** on turn 1 and again whenever it's cleared,
which makes `Quiet Room` (learned at 31) the fight's answer and makes the fight noticeably longer
without it.

His only dialogue during the fight is his one line, in the degrading box, at 100%, 50%, and 1% HP.

**Drops:** Static Vest, 4,000 EXP.

### Main Boss 4 — The Custodian, Unfinished *(Pyramid, `??`)*

The climax, in the Root.

**Pattern:** four phases, one per painting — each phase borrows the pattern of a previous main boss
(tiers, splitting, restoring) before the final phase, which is his own. The arena narrows toward a
point as phases advance. Grass grows across the floor over the course of the fight, from the edges
inward, and the boss's damage output falls as it spreads.

He is allowed **one** short passage of new dialogue here, under four lines, and it states what he
wants rather than explaining why. See [03](03-characters.md).

**Drops:** ending.

---

## Mini-bosses

### Mini-Boss 1 — The Fruiting Tree *(`??`)*

At the centre of the Sunken Orchard, in the one clearing where the water is deep. The only tree that
isn't the same tree.

**The player's first `??`.** Low damage, high HP, no gimmick — it exists purely to teach what those
two question marks mean, five hours before the game uses them on something that matters, and to
burn through the player's healing items right before the level 9 `Mend` unlock.

By the time the Custodian shows up wearing the same readout, the player has learned to read it
without being told. **Drops:** Spray II ×3, 300 EXP.

### Mini-Boss 2 — Line Supervisor *(`??`)*

Sable City industrial district. The first boss who is a person, who has a job, and who talks to the
player before and after in perfectly reasonable terms.

Buffs himself twice before attacking. Teaches debuff items and `Gut Check`. **Drops:** Work Jacket,
1,200 EXP.

### Mini-Boss 3 — Account Manager *(`??`)*

Vixtry Regional Campus. Calm, friendly, and fully aware of what the company does and what the boy is
for. He apologizes before the fight, sincerely.

Heavy status pressure — inflicts **Drained** early to attack the player's SP economy directly, which
is the first time the game punishes a pure-Special build. **Drops:** Second Wind ×2, 2,900 EXP.

### Mini-Boss 4 — Something Left Over *(`??`)*

In the Root. A composite of enemy models from earlier areas, assembled wrong.

Uses moves from every earlier boss at reduced power, in a random order the player can't plan around.
It is the only fight in the game with no correct strategy — it's a resource check before the finale.
**Drops:** Full Spray ×3, 4,200 EXP.

---

## Where the difficulty actually is

Measured, not designed — see [16](16-combat-math.md) for the full table.

The first five encounters are teaching fights that a competent player at the expected level will not
lose. Then **both Custodian fights become hard resource checks**: 94% and 100% win with a stocked
bag, 0% and 3% without one.

That is the right shape for this game and it lands on the economy in the right direction. There are
no sidequests in Act 5 and nobody left who needs anything from the boy ([13](13-sidequests.md)), so
money is tightest exactly when items stop being optional.

## Boss design rules

1. **Every main boss changes shape at least once.** Phases, splits, or restores. No stat-check
   walls.
2. **Every boss is beatable at the expected level with items and no grinding.** Difficulty comes
   from pattern-reading, not from HP inflation.
3. **Drops are useful, not broken, and usually consumable.** Two exceptions (Signal Rod, Static
   Vest) are equipment, and both are sidegrades to something purchasable.
4. **No boss has a dialogue box longer than four lines**, including the Custodian, including the
   finale.
