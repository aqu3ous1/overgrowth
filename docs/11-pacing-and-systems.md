# 11 — Pacing & Supporting Systems

## Pacing target: 10–15 hours

| Segment | Content | Est. time |
|---|---|---|
| Act 0 + 0.5 | Bedroom, the Gallery, the fall | 25–35 min |
| Act 1 | Okobo, Sunken Orchard, Mini-Boss 1 | 2–2.5 hrs |
| Act 2 | Ondo + sidequests, Kestrel Works, **Main Boss 1** | 2.5–3 hrs |
| Act 3 | Sable City, Vixtry intro, Mini-Boss 2, Bellhouse Commons, **Main Boss 2** | 2.5–3 hrs |
| Act 4 | Vixtry Campus, Mini-Boss 3, the Long Hall, **Main Boss 3** | 2–2.5 hrs |
| Act 5 | The Root, Mini-Boss 4, **Main Boss 4**, ending | 1.5–2 hrs |
| **Main path total** | | **11–13.5 hrs** |
| Optional sidequests + collectible hunt | Fully optional | +2–3 hrs |
| **Completionist total** | | **13–16.5 hrs** |

### Combat is 13% of the game

104 minutes of battle across a 13.6-hour main path — 255 encounters at a measured 3 turns each, plus
100 turns of boss across all eight fights ([16](16-combat-math.md)).

That is **low for the genre and correct for this one.** Overgrowth is about walking through empty
places alone; combat is what interrupts that, not what the game is made of. `tools/curve.py` fails
if the share drifts outside 10–22%, which is the guard against encounter counts creeping up during
production.

**Reconciliation note.** The original brief's pacing table put Main Boss 1 inside Act 1, while its
act breakdown and boss table both put it at the end of Act 2. This document follows the boss table:
**Mini-Boss 1 in Act 1, Main Boss 1 at the end of Act 2.** That spacing also gives Ondo — the
game's warmest, most EarthBound stretch — room to land before the first real threat, which is worth
protecting.

## Save system

**Framing device: a notebook.** The player saves by sitting down somewhere and writing in it. Save
points are benches, beds, stairwells, a stool in a shop — places a kid would actually sit. Multi-file
save, selectable from the title screen.

Saving also **fully restores HP, PP and SP**, which makes save-point placement a pacing tool: a
liminal zone's tension is set by how far apart its benches are.

**PROPOSAL — the notebook pays off late.** In Act 4, among the Vixtry Campus memos, the player can
find a document formatted exactly like their own save file: timestamps, session lengths, locations
visited. The notebook was never private. This is a two-asset gag with an enormous payoff, it never
touches a mechanic, and a player who doesn't find the memo loses nothing.

## Name entry

Required at new game. Standard grid entry, used throughout NPC dialogue.

**PROPOSAL — a second field.** After the player's name, ask for one more thing, phrased casually:
*"and what did you call your favourite thing?"* It's used exactly twice — once by a villager in
Okobo, harmlessly, and once by the Custodian. Cost: one text field. Very much the Petscop move, and
optional to implement.

## Difficulty curve

- **EarthBound-forgiving.** Random encounters give generous EXP early. A player on the critical path
  should never need to grind to clear a main-path boss ([05](05-progression.md)).
- **Difficulty lives in bosses**, and specifically in pattern-reading, not HP inflation
  ([08](08-bosses.md)).
- **Two intentional pressure points:** the stretch before `Mend` unlocks at level 9 (healing is
  100% items, and Mini-Boss 1 is designed to drain the player's stock), and Mini-Boss 3, which
  attacks the SP economy directly and punishes a pure-Special build for the first time.
- **Death penalty is money only** — half of carried Rell, everything else intact
  ([04](04-battle-system.md)). Failure should cost time and a little pride, never progress.
- **No difficulty setting.** The enemy level display is the difficulty signal, and it's always on.

## Economy

Currency: **Rell** ([Decisions #3](open-questions.md)).

| Source | Share of income |
|---|---|
| Sidequests (mostly Ondo) | 44% |
| Battle drops | 35% |
| Found in the world | 21% |

Modelled, not estimated — see [17](17-economy.md) for the per-act ledger and
`tools/economy.py`.

Deliberately sidequest-weighted. Ondo's errands are the money engine, which means the player's
financial security is tied to the friendliest stretch of the game — and the late game, where there
are no sidequests and no friendly NPCs, is where money gets tight. That's a theme doing a budget's
job.

**Pricing philosophy:** the player should be able to afford roughly 70% of what they want at any
given shop tier. Never comfortable, never desperate.

Acts 4 and 5 run at a **loss** — the player spends the endgame burning savings earned back when the
world still talked to them. That fell out of the sidequest distribution rather than being designed,
and it lands on the difficulty curve: money is tightest exactly where the simulator says items stop
being optional ([16](16-combat-math.md)).

## Sidequests

20 total, 8 of them in Ondo — full list in [13](13-sidequests.md). Deliberately mundane,
EarthBound-style: errands, a lost pet, delivery jobs, a neighbour dispute, a small mystery that has
a boring answer.

**Rules:**
- Every sidequest giver has a name and one thing about them that isn't the quest.
- No sidequest is failable or timed.
- Roughly a quarter of them end with the giver being *slightly less interested* in the player than
  when they started — the quest resolves, they thank him, they move on. That accumulates.
- No sidequest rewards equipment better than what's purchasable at the same act.

## Post-game

The only place **non-consumable, permanent battle items** exist. Everything else in the game is
consumable by design ([06](06-items-and-equipment.md)); the post-game is where that rule relaxes as
a reward.

Also the natural home for:
- Secret-ending content that a first-run player wouldn't have set up for
- A true-ending epilogue, if one is wanted
- Re-fights, if desired — though see the open question about whether this game should have them at
  all

## Controls & UX

- Move, interact/confirm, cancel, menu. Four inputs. No sprint button — pace is a design choice.
- Battle menus are navigable with the D-pad in one dimension per screen; no diagonal navigation
  anywhere in the UI.
- Text speed setting, damage-number toggle, and a reduce-flashing toggle that specifically tames the
  Custodian encounters and the Act 5 sequences.
- The bag sorts by category and never auto-sorts by recency — a player who memorized where their
  sprays are should find them in the same place at hour 12.
