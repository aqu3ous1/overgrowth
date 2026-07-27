# Open Questions

Decisions this document made provisionally, or couldn't make. Ranked by how much downstream work
they block.

---

## 1. Do ATK and SPATK exist as stats? — **BLOCKING**

The brief's stat list was HP, PP, SP, DEF, SPDEF, SPD, with no offensive stats — but the brief's own
equipment example ("*Anvil-Laden Sword increases physical attack by 5*") references a physical attack
stat, and without ATK/SPATK, DEF and SPDEF have nothing to oppose and move power has nothing to
scale off.

**This document assumes ATK and SPATK are real stats.** Every number in
[05](05-progression.md), [06](06-items-and-equipment.md) and [08](08-bosses.md) depends on it.

The alternative — PP and SP double as offensive scalars — is possible but means spending resources
actively weakens your damage, which is punishing and unintuitive for a solo character with no party
to cover the gap.

**Recommendation:** keep ATK and SPATK. Blocking because all balance work downstream is invalid if
this flips.

---

## 2. Does HP regenerate between turns? — **HIGH**

PP and SP trickle at +1/turn ([04](04-battle-system.md)) so the player can never be fully out of
options. HP currently does not.

**Recommendation: no HP trickle.** The player has `Mend`, `Mend+`, `Health Steal` and four tiers of
spray; adding passive HP regen on top makes attrition meaningless and defangs `Homesick`, which is
the game's one un-curable status and its most thematic mechanic.

---

## 3. Currency name — **LOW, but it's in every shop UI**

"**Rell**" is a placeholder used throughout [06](06-items-and-equipment.md) and
[11](11-pacing-and-systems.md).

Options worth considering: a name that means something in Limpo and something else in Yettallia, or
a deliberately mundane real-world-sounding unit that makes the dream world feel more borrowed. Worth
five minutes and a decision, because it appears on every price tag in the game.

---

## 4. Is the Custodian's true form larger or smaller? — **MEDIUM**

Main Boss 4 is written as "true, stronger form," per the brief. The secret encounter (*Spire*) is
written as **smaller** than his first form ([09](09-collectibles-and-endings.md)) — an unfinished
version rather than a completed one.

That's a deliberate contrast, but it means the player meets a bigger Custodian in the main ending
and a smaller one in the secret ending, and those two reads pull in different directions. Both work;
they may not work together.

**Needs a call on which one is the "truth."**

---

## 5. Do the four geometric primitives get used, and how hard? — **MEDIUM**

The painting-to-boss mapping ([08](08-bosses.md)) is a PROPOSAL, not from the brief.

The question isn't whether to do it — it costs nothing — but **how legible to make it.** Options:

- **Subtle:** arena silhouettes only. Most players never connect it; second-playthrough payoff.
- **Medium:** silhouettes plus one visual echo per fight (the Memorial's tiers, the Tenant's splits).
  This document assumes medium.
- **Overt:** the paintings visibly change or empty as bosses are beaten. Strong payoff, but it turns
  a secret into a progress tracker, which is against the grain of the whole design.

**Recommendation: medium**, with the Gallery revisit in Act 4 as the only place the connection is
ever made visible.

---

## 6. Does the game have boss re-fights or a post-game arena? — **LOW**

Post-game is currently the only source of permanent battle items
([11](11-pacing-and-systems.md)), which implies *something* to use them on.

**Concern:** re-fights are tonally wrong for this game. Every boss is a place and a moment; making
them repeatable turns the Custodian into a punching bag and undercuts an ending built on finally
being allowed to leave.

**Recommendation:** no re-fights. If post-game content is wanted, make it exploration — the ten
areas, changed — rather than combat.

---

## 7. Does the protagonist have a default name? — **LOW**

Name entry is required, but if a player just confirms an empty field, something has to happen.
EarthBound used a default. Petscop used the absence of one.

**Recommendation:** no default. An empty field is rejected with a single line of system text that
does not explain itself, and the player has to type something. It's the first time the game asks him
for anything.

---

## 8. Verbal tic for Limpo villagers — **LOW, needs a writing pass**

[10](10-writing-guide.md) proposes attaching a redundant location to statements about time
("back-when, over in the spring"). It's easy to write consistently and makes the ear itch without
being explained.

Needs someone to write forty lines with it and confirm it doesn't get annoying by hour three. If it
does, the fallback is a syntactic tic rather than a lexical one — e.g. Limpo villagers never use the
word "I" as a sentence's first word.
