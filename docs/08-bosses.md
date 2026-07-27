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
| Mini-Boss 1 | **The Fruiting Tree** | 1 | 10 | 5–9 | Teaches boss-fight stakes before the first main boss. |
| Main Boss 1 | **The Memorial** | 2 | 16 | 12–15 | First real threat. Limpo-themed. *(Obelisk)* |
| Mini-Boss 2 | **Line Supervisor** | 3 | 20 | 16–19 | Yettallia industrial threat. First fight against a person. |
| Main Boss 2 | **Tenant** | 3 | 26 | 21–25 | Yettallia's main threat / Vixtry muscle. *(Cube)* |
| Mini-Boss 3 | **Account Manager** | 4 | 32 | 27–31 | Vixtry mid-tier enforcer. Knows exactly what he's doing. |
| Main Boss 3 | **The Custodian** | 4 | 36 | 32–35 | The white figure, first form. *(Sphere)* |
| Mini-Boss 4 | **Something Left Over** | 5 | 40 | 37–39 | Final obstacle before the climax. |
| Main Boss 4 | **The Custodian, Unfinished** | 5 | 45 | 40–43 | True form. Climax. *(Pyramid)* |

## You cannot leave a boss fight

**Every boss carries an explicit no-flee flag.** RUN is greyed out in all eight encounters
regardless of levels.

The mechanic already exists in the game's vocabulary — the `Retention Specialist` on the Vixtry
Campus ([12](12-bestiary.md)) prevents fleeing outright at any level, and is introduced two
encounters before the Custodian specifically so the flag isn't new when it matters.

Boss levels are *also* set above the top of the player's expected range at every point, so in
practice the reason the UI displays is almost always the level, and the flag never has to announce
itself. The two systems agree; the flag is there for the over-levelled player, and because a game
about not being allowed to leave should not let you leave its most important rooms on a coin flip.

**Main Boss 4 is level 45** — the player's cap. He is the only encounter in the game the player can
never out-level, which is the correct shape for a final boss here and means the flee rule alone
would have failed at exactly the moment it mattered most.

---

## Main bosses

### Main Boss 1 — The Memorial *(Obelisk, Lv 16)*

Fought in the yard at Kestrel Works, beneath the war memorial, in snow.

**Pattern:** three vertical tiers, each with its own HP pool. Only the lowest exposed tier can be
attacked. Destroying a tier drops the boss's height, changes its moveset, and raises its speed.
Fully defensive in tier 1, mixed in tier 2, desperate in tier 3.

**Teaches:** that a fight can change shape mid-way, and that saving resources for a later phase
matters. This is the first fight the player can lose.

**Drops:** Second Wind ×1, 900 EXP.

### Main Boss 2 — Tenant *(Cube, Lv 26)*

Fought at the top of Bellhouse Commons, in a room that is a perfect cube and is bigger inside than
the floor it's on.

**Pattern:** splits at 60% and 30% HP into smaller copies, up to three combatants. Each copy has
reduced stats but the full moveset, and they act in the same turn. Damage is spread across the room
— this is the fight that makes `Aura Barrage` (learned at 26, or just missed) and multi-target
thinking matter.

**Drops:** Signal Rod, Full Spray ×2, 2,400 EXP.

### Main Boss 3 — The Custodian *(Sphere, Lv 36)*

Fought at the end of the Long Hall.

**Pattern:** cannot be fled from, obviously, but more importantly he cannot be *reduced* in the
normal way — at low HP he restores to 50% once. There is no second restore, and the game gives the
player no warning of the first. Inflicts **Homesick** on turn 1 and again whenever it's cleared,
which makes `Quiet Room` (learned at 31) the fight's answer and makes the fight noticeably longer
without it.

His only dialogue during the fight is his one line, in the degrading box, at 100%, 50%, and 1% HP.

**Drops:** Static Vest, 4,000 EXP.

### Main Boss 4 — The Custodian, Unfinished *(Pyramid, Lv 45)*

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

### Mini-Boss 1 — The Fruiting Tree *(Lv 10)*

At the centre of the Sunken Orchard, in the one clearing where the water is deep. The only tree that
isn't the same tree.

The player's introduction to a fight they cannot leave. Low damage, high HP, no gimmick — it exists
purely to teach that the RUN option can be closed off, and to burn through the player's healing
items right before the level 9 `Mend` unlock. **Drops:** Spray II ×3, 300 EXP.

### Mini-Boss 2 — Line Supervisor *(Lv 20)*

Sable City industrial district. The first boss who is a person, who has a job, and who talks to the
player before and after in perfectly reasonable terms.

Buffs himself twice before attacking. Teaches debuff items and `Gut Check`. **Drops:** Work Jacket,
1,200 EXP.

### Mini-Boss 3 — Account Manager *(Lv 32)*

Vixtry Regional Campus. Calm, friendly, and fully aware of what the company does and what the boy is
for. He apologizes before the fight, sincerely.

Heavy status pressure — inflicts **Drained** early to attack the player's SP economy directly, which
is the first time the game punishes a pure-Special build. **Drops:** Second Wind ×2, 2,900 EXP.

### Mini-Boss 4 — Something Left Over *(Lv 40)*

In the Root. A composite of enemy models from earlier areas, assembled wrong.

Uses moves from every earlier boss at reduced power, in a random order the player can't plan around.
It is the only fight in the game with no correct strategy — it's a resource check before the finale.
**Drops:** Full Spray ×3, 4,200 EXP.

---

## Boss design rules

1. **Every main boss changes shape at least once.** Phases, splits, or restores. No stat-check
   walls.
2. **Every boss is beatable at the expected level with items and no grinding.** Difficulty comes
   from pattern-reading, not from HP inflation.
3. **Drops are useful, not broken, and usually consumable.** Two exceptions (Signal Rod, Static
   Vest) are equipment, and both are sidegrades to something purchasable.
4. **No boss has a dialogue box longer than four lines**, including the Custodian, including the
   finale.
