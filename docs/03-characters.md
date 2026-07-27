# 03 — Characters

## The protagonist

**Silent.** He has no dialogue, no internal monologue, and no battle barks. Every reaction he has is
inferred from how other characters respond to him. The player names him at file creation and NPCs
use that name throughout.

**Design (per Images 1 and 3):** rounded blue head, plain black dot eyes on white sclera, flat
neutral mouth, green shirt, dark pants. Deliberately plain and doll-like — simpler than the
environments he's standing in and simpler than most NPCs. He does not look like he belongs in the
real world or the dream world, which is correct in both cases.

**Sprite rules:**
- Exactly one facial expression for the entire game. He never emotes. Not once, not at the ending.
- No idle animation beyond a slow breathing bob. He does not fidget.
- In battle, only the top of his head is visible at the bottom of frame (Image 2). The player
  fights from behind him and never sees him take a hit.

**Characterization budget:** everything we know about him comes from three sources — what NPCs
assume about him, what the environment implies he grew up with, and what moves he learns. The move
list is the arc: he starts with `Punch` and ends with `Wake Up`.

**His family's names are never revealed** — surname, father, mother, none of them, anywhere in the
game. He knows them; the player doesn't. The player supplies his first name and nothing else, and
nobody ever asks for the rest.

The sole exception is **the father's initial**, printed once on a staff roster in Act 4 and never
corroborated anywhere else. One letter, deliberately not enough to be worth anything. Hard rule and
the three dodge sites in [15](15-lore-notes.md).

---

## The Custodian

**Role:** Main Boss 3 (first form, end of Act 4) and Main Boss 4 (true form, climax).

**Design (per Image 2):** a white humanoid figure with EarthBound proportions — round head, black
pit eyes, wide fixed grin, blank limbs with no detail. He casts a shadow in rooms where nothing else
does. He is always lit from the front by a source that isn't in the room.

**Appearance schedule:**

| # | When | Behaviour |
|---|---|---|
| 1 | Act 1, Okobo, ~30 min in | Non-interactive. Visible for ~2s at the end of an unreachable street. No music change, no acknowledgement. |
| 2 | Act 2, Kestrel Works | Standing in a room the player has already cleared, on the way back out. Gone if the player leaves and re-enters. |
| 3 | Act 3, Bellhouse Commons | Occupies one apartment. Speaks for the first time: `Never leave.` — filling the box, all four lines (Image 2). Cannot be attacked. |
| 4 | Act 4, the Long Hall | Main Boss 3. |
| 5 | Act 5, the Root | Main Boss 4, true form. |

**Dialogue rules — these are hard rules:**
- He says `Never leave.` and nothing else until the true final confrontation.
- His text box degrades: kerning collapses, the line repeats to fill all available lines, the box
  overflows its border.
- He has **no advance prompt**. The player does not control when he's finished.
- At the true final confrontation he is allowed **one** short additional passage. Under four lines.
  If a draft of that passage explains his motives, it is wrong and should be cut back until it only
  states what he wants.

Petscop's power comes from restraint, not exposition. The temptation to give him a monologue will be
enormous. Do not.

**Who he is:** deliberately underdetermined. The environmental lore supports at least three readings
— a containment process personified, a previous test subject who stayed, and the boy's own
attachment to being kept. The game never picks. The secret ending narrows it to two.

---

## Vixtry Co.

**Public face:** an "online co-living" company. Full digital life integration — convenience,
always-on connection, escape from real-world hardship. In Limpo that pitch reads as a lifeline. In
Yettallia it reads as a product. Both are on purpose.

**Actual goal:** total dependency on their neural-interface hardware, and past dependency, direct
behavioural manipulation of connected users at scale.

**Structure of the reveal:**

| Tier | Where | What they know | How they talk |
|---|---|---|---|
| Grunts | Act 3 | Almost nothing. They think they work in customer retention. | Cheerful, scripted, corporate-pleasant. |
| Field staff | Act 3–4 | Enough to be uneasy, not enough to leave. | Deflection, policy language, "that's above my level." |
| Officers | Act 4 | Everything. | Perfectly calm. Discuss neural dependency the way you'd discuss a quarterly target. |

**Writing rule:** Vixtry never winks at the player. No villain relish, no rubbing hands. The horror
is that they sincerely believe this is good, and their internal logic is coherent enough that the
player can follow it. If a Vixtry line would be at home in a real product launch, it's correct.

**The father.** He works for Vixtry in the real world. This is dropped flatly in Act 3 by someone
who doesn't know it's significant. The reveal that the boy is an unconsenting test subject lands in
Act 4 and should recontextualize several earlier throwaway lines — write those lines early, and
write them so they read as nothing on first pass.

Whether the father knew is never answered. See [02](02-story.md).

---

## NPC archetypes

### Family and "friends" (real world, and their dream-world mirrors)

Polite, distracted, technically responsive, never actually present. They answer questions. They do
not ask any. They are in the middle of something.

**Never cruel.** Indifference reads as lonelier than melodrama and ages far better. The test for one
of these lines: if it would sting to hear, rewrite it. If it would be forgotten by the person who
said it, it's right.

Dream-world mirrors are NPCs who occupy the same social role as someone from the boy's real life
(a mother-figure shopkeeper, a father-figure foreman, a kid his age who has other plans). They are
never called out as mirrors. Some players will never notice. Fine.

### Okobo and Limpo villagers

EarthBound-style whimsy: odd turns of phrase, small comic asides, harmless local superstitions,
strong opinions about a fruit. This is where the game breathes and is genuinely charming, and the
charm is load-bearing — the liminal dread later only works because the player has something to miss.

They are also poor, and quietly grieving a two-century war, and both of those facts show up in
passing without ever becoming a speech.

### Yettallia citizens

Busier, blunter, more transactional. Not unkind — just running late. Where a Limpo villager gives
you three paragraphs about their nephew, a Yettallia citizen gives you one sentence and walks off.

### Enemies

Most random encounters are not people and shouldn't be written as if they are. The ones that *are*
people — Vixtry staff, a few Yettallia holdouts — get names, and beating them makes the player feel
slightly bad. That's intended and should not be smoothed over with a "they had it coming" line.
