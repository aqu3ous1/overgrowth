# 17 — Economy & Shops

Currency is **Rell**. Run `python3 tools/economy.py` after changing any price, reward, or shop.

## The ledger

Modelled income against modelled spend, per act. Upkeep is healing for that act's encounters plus
one weapon and one body purchase; boss kit is the item budget the simulator assumes
([16](16-combat-math.md)).

| Act | Income | Upkeep | Boss kit | Net | Carried |
|---|---:|---:|---:|---:|---:|
| 1 | 1,205 | 714 | 79 | +412 | 412 |
| 2 | 4,690 | 1,345 | 204 | +3,141 | 3,553 |
| 3 | 7,785 | 3,363 | 487 | +3,935 | 7,488 |
| 4 | 5,450 | 6,330 | 739 | **−1,620** | 5,868 |
| 5 | 2,290 | 5,672 | 938 | **−4,320** | 1,548 |

Total income across a full playthrough: **21,420 Rell.** A player who does every sidequest and buys
sensibly finishes with about 1,500 left — enough to have never been stuck, not enough to have been
comfortable.

### The shape is the theme

The two negative acts are not a balance failure, they're the point.

Income peaks in **Ondo and Sable City**, which is to say in the two warmest, busiest, most populated
stretches of the game — the places where people still need things from the boy. Acts 4 and 5 run at
a loss because the Vixtry campus has one sidequest and the Root has none, and there is nobody left
who wants anything from him.

So the player spends the endgame burning savings earned back when the world still talked to them.
That was not designed in; it fell out of putting 13 of 20 sidequests before the end of Act 2
([13](13-sidequests.md)) and then checking the arithmetic.

**It also lands on the difficulty curve.** The simulator found the two Custodian fights are
unwinnable without a stocked bag — 0% and 3% win with no items. So money gets tight at exactly the
point items stop being optional, and both facts arrived independently.

## Income sources

| Source | Share | Where |
|---|---:|---|
| Sidequests | 44% | Mostly Ondo (8 of 20) |
| Battle drops | 35% | `round(1 + 1.35 × enemy level)` per encounter |
| Found in the world | 21% | Chests, scenery, off-path rooms |

Deliberately sidequest-weighted, and the model confirms the weighting survives contact with the
other two sources.

## Shops

Four shops. That's all.

| Shop | Act | What it is |
|---|---|---|
| **Okobo Village** | 1 | A counter in someone's front room. Four things on it. |
| **Ondo** | 2 | A proper market row — the first time the player has choices they can't all afford. |
| **Sable City** | 3 | Six storefronts stacked vertically, treated as one shop UI. Loud. |
| **Vixtry Regional Campus** | 4 | A vending machine in a break room. Staff walk past the player to use it. |

**There is no shop in Act 5**, and the Root is not a place that sells things. Which means:

> **The last shop in the game is a Vixtry vending machine.** The player buys the supplies they need
> to escape the company from the company, out of a machine in a break room, while employees queue
> behind them.

Nothing points at this. No line of dialogue remarks on it. It is simply where the final loadout
comes from.

Shops stay open once found, and the warp network ([06](06-items-and-equipment.md)) makes returning
to them free from Act 3 onward — so "the last shop" means the last *new* shop, not a point of no
return.

## Pricing

### Healing ladder

| Item | Restores | Price | Rell per HP |
|---|---|---:|---:|
| Spray | 40 HP | 30 | 0.75 |
| Spray II | 120 HP | 100 | 0.83 |
| Spray III | 260 HP | 240 | 0.92 |
| Full Spray | all HP | 600 | — |

**Rell-per-HP ascends deliberately.** For a solo character the scarce resource in a fight is the
*turn*, not the money — there is no second party member to heal while you attack. Bigger sprays
carry a premium because you're buying an action, not just HP.

An earlier draft had Spray and Spray II at identical value (0.75 each), which made one of them
pointless. The economy model caught it.

### Equipment

| Weapon | Act | Price | | Body | Act | Price |
|---|---|---:|---|---|---|---:|
| Tent Stake | 1 | 150 | | Patched Coat | 1 | 200 |
| Anvil-Laden Sword | 2 | 560 | | Featherweight Coat | 2 | 500 |
| Magic Baton | 2 | 620 | | Fancy Suit | 2 | 700 |
| Length of Pipe | 3 | 1,400 | | Work Jacket | 3 | 1,500 |
| Signal Rod | 3 | 1,650 | | Lead Apron | 4 | 2,800 |
| Foreman's Wrench | 4 | 3,000 | | Static Vest | 4 | 3,200 |
| Quiet Instrument | 5 | 5,200 | | Overgrown Coat | 5 | *found* |

**The Quiet Instrument costs more than the whole of Act 5's income.** It is stocked in the Vixtry
vending machine, and a player who wants it has to have saved for it since Sable City. That's the
intended relationship between the endgame weapon and the endgame's poverty, and it's why the
Overgrown Coat — the only clean, downside-free piece in the game — is found rather than sold.

### Philosophy

The player should be able to afford roughly **70%** of what they want at any given shop tier. Never
comfortable, never desperate. The model checks the ledger stays solvent; the 70% figure is a
playtest question, not something arithmetic can settle.

## What the model does and doesn't do

**Models:** sidequest rewards, drop income by act, found money, healing upkeep derived from the
simulator's measured attrition, one equipment purchase per slot per act, and each act's boss item
budget priced at the best healing available by then.

**Doesn't model:** the player who buys nothing and grinds, the player who buys everything, stat
boosters and debuff items (bought situationally, not as upkeep), selling anything back, or the money
lost to defeat ([04](04-battle-system.md) — half of carried Rell).

It answers one question: *can a player who plays normally afford the fights the game is going to
give them?* The answer is yes, with margin in the middle and none at the end.
