# Decisions & Open Questions

Every question raised in the first pass has now been called, so nothing in this document blocks
work. Decisions are recorded with their reasoning so they can be reversed deliberately rather than
by accident.

Anything a future collaborator wants to overturn should read the **Reversal cost** line first — some
of these are cosmetic, and two of them invalidate every number in the systems docs.

---

## RESOLVED — 1. ATK and SPATK exist as stats

The brief's stat list omitted offensive stats, but its own equipment example ("*Anvil-Laden Sword
increases physical attack by 5*") required one.

**Decision: ATK and SPATK are real stats.** The alternative — PP and SP doubling as offensive
scalars — makes spending resources actively weaken your damage, which is punishing and unintuitive
for a solo character with no party to cover the gap.

**Reversal cost:** total. Every number in [05](05-progression.md), [06](06-items-and-equipment.md),
[08](08-bosses.md) and [12](12-bestiary.md) is built on this.

## RESOLVED — 2. HP does not regenerate between turns

PP and SP trickle at +1/turn so the player can never be fully out of options
([04](04-battle-system.md)). HP does not.

**Reasoning:** the player has `Mend`, `Mend+`, `Health Steal` and four tiers of spray. Passive HP
regen on top of that makes attrition meaningless and defangs **Homesick** — the game's one
un-curable status, its most thematic mechanic, and the entire design of `The Argument` in Act 5
([12](12-bestiary.md)).

**Reversal cost:** high. Homesick, `Wader`, and the Act 5 payoff all stop working.

## RESOLVED — 3. Currency is Rell

Kept as-is. It's short, it reads cleanly on a price tag, and it doesn't sound like a real-world
unit, which keeps the dream world from feeling borrowed.

The rejected alternative — a currency that means one thing in Limpo and another in Yettallia — is a
good idea for a game with more economic plot than this one has, and would cost more player attention
than it returns.

**Reversal cost:** trivial. One find-and-replace across [06](06-items-and-equipment.md),
[11](11-pacing-and-systems.md) and [13](13-sidequests.md).

## RESOLVED — 3b. Bosses display `??` instead of a level

Regular enemies show a real number; **all eight bosses and the secret encounter show `??`.**

This replaced an earlier arrangement where bosses had visible numeric levels plus a hidden no-flee
flag — which meant the UI showed the player a number they could reason about while a rule they
couldn't see overrode it. `??` resolves as *unknown, therefore not below yours*, so the ordinary
flee rule closes RUN by itself and nothing is hidden that the player was ever shown.

It also unbinds boss tuning from the level cap. Internal levels are balance figures that never
reach the screen, so the final boss sits at 48 against a player cap of 45.

**Reversal cost:** low mechanically, high thematically. `??` is now the game's only boss indicator —
removing it means inventing a nameplate flourish or a music sting to replace it, both of which the
audio direction ([01](01-art-and-audio.md)) rules out.

## RESOLVED — 3c. The family's names are never revealed

Not the surname, not the father's name, not the mother's — nowhere in the game, in any form or
medium. The protagonist knows all three; the player never finds out.

Parents are referred to by role only, no NPC ever addresses a parent directly (an NPC who did would
have to use a name), and the player enters a first name only at file creation. The three places the
name could structurally appear all dodge it — see [15](15-lore-notes.md).

This was a proposal covering only the surname and has been promoted to a hard rule covering the
whole family. The earlier draft printed the father's initial on a staff roster; it no longer does,
and `tools/validate.py` guards against it coming back.

**Reversal cost:** high. It's load-bearing for the name-entry system (a player-entered name can
never match a printed surname) and for the prologue's block-glyph motif.

## RESOLVED — 4. The true form is larger; the secret encounter is not a "truer" version

The tension was that Main Boss 4 is written as a *stronger* form while the secret encounter (*Spire*)
is written as *smaller*.

**Decision: both, because they aren't on the same axis.** Main Boss 4 is what the Custodian became.
The Spire is what he was before — an unfinished draft, hung in a smaller frame, which is why the
painting is set apart from the other four.

Reframed this way the secret encounter isn't a bigger truth behind a smaller lie. It's an earlier
version of the same thing, and it's smaller because it never got finished. That also explains why it
doesn't attack.

**Reversal cost:** low. Affects [08](08-bosses.md) and [09](09-collectibles-and-endings.md) only.

## RESOLVED — 5. The geometric motif is played at medium legibility

Arena silhouettes plus one visual echo per fight — the Memorial's tiers, the Tenant's splits, the
Custodian's cornerless arena, the Pyramid's narrowing floor.

The **overt** option (paintings visibly emptying as bosses are beaten) was rejected: it converts a
secret into a progress tracker, which is against the grain of everything else in the design. The
**subtle** option was rejected as too subtle to be worth the arena work.

The Gallery revisit in Act 4 is the only place the connection is ever made visible, and even there
it's made by the room, not by a text box.

**Reversal cost:** low, if caught before arena art is built. High after.

## RESOLVED — 6. No boss re-fights, no post-game arena

Re-fights are tonally wrong for this game. Every boss is a place and a moment; making them
repeatable turns the Custodian into a punching bag and undercuts an ending built on finally being
allowed to leave.

**Post-game content is exploration instead:** the ten areas, changed. The permanent (non-consumable)
battle items that only exist in the post-game are for surviving the changed areas, not for grinding
a boss rush.

**Reversal cost:** low.

## RESOLVED — 7. No default name

An empty name field is rejected with a single line of system text that does not explain itself, and
the player has to type something.

It is the first time the game asks him for anything, and it should not be skippable.

**Reversal cost:** trivial.

## RESOLVED — 8. Limpo villagers get the temporal-location tic

"back-when, over in the spring" / "later-on, up in the spring." Confirmed across the Okobo scene in
[14](14-script-samples.md) — it survives repetition, marks the speaker instantly, and never needs
explaining.

**Still needs a volume test:** forty more lines written with it, checked at hour three for whether
it has become annoying. The fallback if it does is syntactic rather than lexical — Limpo villagers
never begin a sentence with the word "I."

**Reversal cost:** a dialogue pass.

---

## Still genuinely open

These are taste calls that don't block anything and are better made with the game in front of you
than on paper.

| Question | Notes |
|---|---|
| **What is on the poster in the bedroom?** | Referenced in [14](14-script-samples.md), never described. It should probably stay undescribed, but if it's ever named it should be named once and never again. |
| **Does the mother appear in the standard ending?** | Currently only in the secret ending. The standard ending's single change is the hall light and the open door. Adding her to both weakens the secret ending; adding her to neither makes the standard ending colder than intended. Current call — secret only — is the one to beat. |
| **Length of the Long Hall** | Written as "genuinely uncomfortable." Needs a real number, and the only way to get it is to walk it. Start at four minutes and cut until it stops being a joke. |
| **How many hidden collectibles does a blind player find?** | Design target is 2–4. If playtests come back at 6+, the placements are too generous and the secret ending stops meaning what it's supposed to mean ([09](09-collectibles-and-endings.md)). |
