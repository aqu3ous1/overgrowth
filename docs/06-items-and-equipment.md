# 06 — Items & Equipment

Currency is **Rell** (placeholder name — flagged in [open-questions.md](open-questions.md)).

## Bag structure

The bag has two tabs and the split between them is enforced by context, not by player choice:

| Tab | Usable in overworld | Usable in battle |
|---|---|---|
| **Special Items** | Yes | **No** — greyed out |
| **Battle Items** | No | **Yes** |

This split exists so the player never has to scroll past 40 lore notes to find a healing spray
mid-fight, and so overworld tools can't be balance problems in combat.

---

## Special Items

Overworld only. Never consumed by a battle. Five categories:

### Readable notes

The primary lore-delivery vehicle. Layoff notices from Kestrel Works, a tenant's letter from
Bellhouse Commons, internal Vixtry memos, a child's drawing. Kept permanently in the bag and
re-readable from the menu — the player should be able to sit down at hour 11 and re-read something
from hour 2 that means something different now.

**Rule:** no note ever contains critical-path information. Every note is optional. See pillar 3 in
[00](00-overview.md).

### Keys and access items

Standard dungeon gating. One or two per liminal zone, consumed on use, never carried between areas.

### Warp devices

See below — significant enough to have their own section.

### Quest items

Sidequest deliverables. Auto-removed on turn-in so they don't clutter the bag.

### The ten collectibles

One per major area. See [09](09-collectibles-and-endings.md).

---

## Warp devices

**Not available until roughly the midpoint** (Act 3, after Bellhouse Commons). Before that, all
travel is on foot, and the game is deliberately a little tiring to cross.

The rule, from the brief:

- The **first** warp device found unlocks fast travel to **every previously discovered major
  location at once.** This is a deliberate catch-up moment — the whole explored map opens back up
  in a single beat, and it should feel like a reward, not a convenience.
- **Every subsequent** warp device only unlocks travel to the specific area it was found in.

So late-game exploration stays meaningfully gated, but backtracking stops being punishing the moment
the game starts asking for it. This also means the collectible hunt (which requires revisiting early
areas with late-game tools) becomes practical at exactly the point the player is likely to start
caring about it.

Warp devices are found, never bought.

| Device | Where | Unlocks |
|---|---|---|
| Warp Device (first) | Bellhouse Commons, Act 3 | Everything discovered so far |
| Warp Device | Vixtry Regional Campus, Act 4 | Campus |
| Warp Device | The Long Hall, Act 4 | Long Hall |
| Warp Device | The Root, Act 5 | The Root |

---

## Battle items

Battle only. **All consumable**, except a small number of post-game finds
([11](11-pacing-and-systems.md)). Bought from shops or found in the world.

### Healing

| Item | Effect | Price |
|---|---|---|
| Spray | Restores 40 HP | 30 |
| Spray II | Restores 120 HP | 90 |
| Spray III | Restores 260 HP | 220 |
| Full Spray | Restores all HP | 600 |
| Chalk Tablet | Restores 25 PP | 60 |
| Bitter Tonic | Restores 25 SP | 60 |
| Clean Rag | Cures one status | 25 |

### Stat boosts (self)

| Item | Effect | Price |
|---|---|---|
| Knuckle Wrap | +1 ATK stage | 70 |
| Cold Compress | +1 DEF stage | 70 |
| Thin Static | +1 SPATK stage | 80 |
| Wool Lining | +1 SPDEF stage | 80 |
| Loose Laces | +2 SPD stages | 110 |
| Second Wind | +1 to all stages. Rare, not sold before Act 4. | 400 |

### Enemy debuffs

| Item | Effect | Price |
|---|---|---|
| Dropped Call | Inflicts Fog | 55 |
| Loose Wire | Inflicts Static | 65 |
| Dead Battery | Inflicts Drained | 90 |
| Shed Skin | −2 DEF stages on one enemy | 120 |

Debuff items matter more here than in a party RPG: with one combatant, the player can't afford to
spend three turns setting up, so an item that debuffs in a single action is doing real work.

---

## Equipment

Two slots: **Body** and **Weapon**. Two items equipped at any time. No accessories, no set bonuses,
no sockets — the whole equipment system is two decisions, made repeatedly.

Equipment can be a clean upgrade or a **trade-off**, and the trade-off items are the interesting
ones. They're how a game with no party still supports build variety: glass-cannon, tank, and
speed-flee runs are all viable, and the flee rules ([04](04-battle-system.md)) make a speed build
meaningfully different to play even though SPD doesn't affect flee odds — it affects how often you
get to act before the thing that won't let you leave.

### Weapons

| Item | ATK | SPATK | DEF | SPD | Act |
|---|---:|---:|---:|---:|---|
| Bare Hands | — | — | — | — | 1 |
| Tent Stake | +3 | — | — | — | 1 |
| Magic Baton | — | +5 | — | +1 | 2 |
| Anvil-Laden Sword | +5 | — | +1 | **−4** | 2 |
| Length of Pipe | +7 | — | — | −1 | 3 |
| Signal Rod | −2 | +9 | — | — | 3 |
| Foreman's Wrench | +11 | — | +2 | **−3** | 4 |
| Quiet Instrument | +4 | +12 | — | +2 | 5 |

### Body

| Item | DEF | SPDEF | SPD | HP | Act |
|---|---:|---:|---:|---:|---|
| School Clothes | — | — | — | — | 1 |
| Patched Coat | +3 | +1 | — | — | 1 |
| Fancy Suit | +2 | +5 | — | — | 2 |
| Featherweight Coat | **−2** | — | +3 | — | 2 |
| Work Jacket | +8 | +2 | −1 | — | 3 |
| Static Vest | +1 | +10 | — | — | 4 |
| Lead Apron | +14 | +6 | **−6** | — | 4 |
| Overgrown Coat | +6 | +6 | +2 | +20 | 5 |

### Rules

- Equipment is **never** a stat stick alone past Act 1 — every item from Act 2 onward should have at
  least one number the player has to think about.
- Nothing is missable. Every equipment tier is purchasable in at least one shop, with the strongest
  version of each tier found in the world.
- The **Overgrown Coat** is the only piece with no downside, it is found rather than bought, and it
  is covered in grass. Its flavour text is one word long.
