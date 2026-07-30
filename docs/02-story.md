# 02 — Story

Act structure, beat by beat. Boss placement is cross-referenced in [08](08-bosses.md); area detail
is in [07](07-world-and-areas.md).

---

## Act 0 — The Real World (Prologue)

**Length:** ~10 minutes. **Playable:** minimally.

Open on the boy's bedroom. Underlit to near-silhouette; the only light is the strip bleeding under
a closed door. The player can walk around the room, interact with maybe five things (a bed, a
window, a poster, a dresser, a light switch that does nothing), and that's it.

Through the door, his parents are arguing. The dialogue is rendered as **unintelligible blocks** —
`▓▓▓ ▓▓▓▓... ▓▓▓ ▓▓ ▓▓▓▓▓.` — with the text box's only readable content being the game's own flat
description: *"They're arguing again."* Not a word of it is directed at him, and not a word of it
is decipherable. The player will try to listen at the door. There is nothing to get.

**Design note:** resist the temptation to hide a decipherable message in the blocks. Players will
datamine it. Let there genuinely be nothing there — the blocks should be procedurally generated per
playthrough so no two are the same. What his parents were fighting about is not information the
game has.

A door slams. The light under the door goes out. The room goes fully black. The only remaining
interaction is the bed.

He sleeps.

---

## Act 0.5 — The Threshold

**Length:** ~15–20 minutes. **Area:** The Gallery.

He wakes in a dark expanse — darker than his own room, no floor visible, no horizon. The player
walks. There is nothing to find for slightly longer than is comfortable.

Then: the brick building (Images 1 and 4). A squat one-storey box, edges barely resolving out of
the black, one grey steel door. No windows. No path leading to it.

**Inside**, the floor is grass. The walls are brick, the ceiling is drop-tile fluorescent office
panelling, and hung along both walls are large framed paintings of stone primitives standing in
still water under a dusk sky (Image 3):

- an **obelisk**
- a **sphere**
- a **pyramid**
- a **cube**
- and, in a smaller frame set slightly apart from the others, a **spire** — a narrower, taller
  pyramid that looks like a first draft of the one on the opposite wall

**PROPOSAL — the paintings are foreshadowing.** Each of the four large paintings maps to one of the
four main bosses, echoed in that boss's arena, silhouette, or fight pattern. The fifth, smaller
painting maps to the secret-ending encounter. On a first playthrough the gallery is atmosphere; on a
second it is a table of contents. Full mapping in [08](08-bosses.md). This costs nothing to
implement and is the single highest-value structural idea in the document.

The hallways loop and extend much further than the building's exterior could contain. The player
should notice this on their own — no text box says so. Eventually, a single door at the end of a
hall that has been getting narrower for a while.

He steps through, and falls. No ground, no end, no fall damage, no death. Just falling, long enough
that the player will put the controller down.

---

## Act 1 — Arrival: Limpo Kingdom

**Length:** ~2.5 hours. **Areas:** Okobo Village, the Sunken Orchard.

He wakes face-down in grass under a sky the wrong colour. Same physics as home, different colour
logic: saturated pinks, violets, mustard yellows where Earth would show muted tones.

**Okobo Village** is a few hundred residents of harmless, strange-looking people who talk almost
normally, with a shared verbal tic that marks them as not-quite-Earth (see
[10](10-writing-guide.md)). They are the friendliest the game ever gets. Asking around establishes:

- This is **Okobo Village**, in the **Limpo Kingdom**.
- Limpo has been in economic decline for two centuries, driven by sustained on-and-off conflict
  with its neighbour, **Yettallia**.
- Poverty, rationing, and quiet generational grief are ordinary background facts here. Nobody
  presents this as the plot. It's texture — mentioned the way weather is mentioned.
- Nobody finds the boy's arrival remarkable, which is itself remarkable, and one optional NPC late
  in the game explains why.

**First Custodian sighting.** Non-interactive, roughly 30 minutes in: the white figure standing at
the end of a street the player can't reach, or in an upstairs window, for about two seconds before a
camera cut. No music change. No dialogue. If the player runs toward him, he is simply not there, and
the game does not acknowledge it.

**The Sunken Orchard** is the first liminal zone — a flooded fruit orchard where the water is
ankle-deep everywhere and the trees are all the same tree. **Mini-Boss 1** waits at the centre as a
soft introduction to fights that can't be run from.

Act 1 ends with the road to the capital opening up.

---

## Act 2 — Deeper Into Limpo

**Length:** ~2.5–3 hours. **Areas:** Ondo (capital), Kestrel Works.

**Ondo**, Limpo's capital, is the economic and sidequest heart of the game. Errands, lost pets,
deliveries, small mysteries, a bakery with a grievance — deliberately mundane EarthBound-flavoured
busywork, and the primary source of money and consumables. This is the game at its warmest, on
purpose, immediately before it stops being warm.

Two things happen quietly in Ondo:
- The first **Vixtry Co.** signage appears — a single billboard, unremarkable, advertising "online
  co-living" in clean modern type that matches nothing else in the world's art.
- An optional NPC in a boarding house mentions a man who "went inside and got better." He is not
  available to speak to a second time.

**Kestrel Works** is an abandoned factory in a region of permanent, Siberia-grade winter, reachable
only via a rumour or an unmarked sign the player has to actually read. It is the game's first real
dungeon: multi-floor, cold, near-silent, and full of readable notes from workers who were laid off
in stages over a decade.

**Main Boss 1** caps the act, in the factory's yard, under a war memorial. (Obelisk.)

---

## Act 3 — Yettallia

**Length:** ~2.5–3 hours. **Areas:** Sable City, Bellhouse Commons.

The player crosses the border into **Yettallia**: hyper-industrial, neon-and-smoke, mechanized
excess set against Limpo's rural poverty. It is louder, richer, and worse.

**Vixtry Co. becomes unavoidable here.** Billboards, kiosks, storefront demos, a recruitment desk in
the transit hub. The pitch is always soft: connection, convenience, escape from hardship — a pitch
that lands very differently in a country that has been grinding through a two-century war economy.

**Mini-Boss 2** is an industrial-district encounter. Optional and mandatory fights against low-level
**Vixtry subordinates** begin here, each dropping a fragment of lore:

- Vixtry's product wires neural interfaces directly to a hosted environment.
- The company's stated ambition is connection. Their actual ambition is dependency, and past
  dependency, behavioural control at scale.
- **The player's father works for Vixtry.** Delivered flatly, by a grunt who doesn't know it's
  significant, and never dwelt on.

Early grunts barely understand what they're part of. Later officers are unsettlingly calm about it.
Nobody winks at the player. They mean it sincerely, which is the horror.

**Bellhouse Commons** is the second major liminal dungeon: a huge, mostly-empty apartment complex
whose interior is non-Euclidean — rooms that shouldn't connect, corridors longer than the building,
and trippy wall murals that don't match anything about the exterior. Roughly four apartments are
occupied, by tenants who are polite and completely uninterested in him.

**Main Boss 2** ends the act. (Cube.)

---

## Act 4 — The Penultimate Confrontation

**Length:** ~2–2.5 hours. **Areas:** Vixtry Regional Campus, the Long Hall.

Warp devices are online by now (see [06](06-items-and-equipment.md)), so the map opens back up and
the pace shifts from travel to escalation.

**Vixtry Regional Campus** is a corporate facility rendered as a liminal space *without ever being
abandoned* — it is fully staffed, brightly lit, and nobody stops the player from walking through it.
Employees greet him by name. He never gave anyone his name.

The full picture arrives here: total neural dependency as a business model, behavioural manipulation
as the endgame, and the confirmation that **the boy is not visiting this world — he is a test
subject inside it.**

**Mini-Boss 3** is a mid-tier Vixtry enforcer. Past him, the **Long Hall** — a corridor of drop-tile
ceiling and brick that the player will recognize as the Gallery's hallway, reskinned and much
longer. Grass on the floor.

At the end: **the Custodian**, the white figure from Image 2, fought as **Main Boss 3** in his first
and weaker form. He has been glimpsed three times before this and has said exactly one thing, on
repeat: *"Never leave."*

**Naming — recommend "the Custodian."** It means both a low-level building caretaker (the domestic,
empty-room aesthetic) and a legal guardian (the reveal that the boy is being *looked after* as a
subject). "The Steward" is the runner-up if a co-living/company-overseer read is preferred.

---

## Act 5 — Escalation & Finale

**Length:** ~1.5–2 hours. **Area:** the Root.

The dream world begins failing in the player's favour. Colour drains toward the real-world palette,
towns are empty, and the grass is everywhere.

**Mini-Boss 4** is the last obstacle before the climax. Then **Main Boss 4**: the Custodian's true,
stronger form, which recontextualizes *"Never leave"* from ambient dread into a literal instruction
he has been trying to enforce since the first sighting in Okobo.

The climax reveals the shape of the whole thing: the journey has been the boy's mind fighting its
way out of a Vixtry-engineered confinement, running on a neural link his father's company installed.

**Leave the father ambiguous.** Whether he knew what he was signing his son up for is never
resolved. The game should support both readings and commit to neither — the gut-punch is stronger
when the player has to decide, and it keeps the ending about the boy rather than about a villain.

**Ending.** He wakes — genuinely this time. The final scene mirrors the opening bedroom shot exactly:
same camera, same room, same five interactable objects. One thing is different in the framing. A
light is on, or the door is open, or someone is sitting on the end of the bed. Nothing narrates the
change. The player either notices or doesn't, and that is allowed.

He was changed by an ordeal that was as real to him as anything, regardless of where it took place.
The game does not argue this point. It just ends.

See [09](09-collectibles-and-endings.md) for the secret ending.

### What the Root is built out of

Every room in the Root is a room the player has already walked, wrong. That is the whole design
brief and it is also the whole point: the world is not inventing anything any more, because whatever
was inventing it has stopped.

| Room | What it is |
|---|---|
| Arrival | Okobo's geometry with Kestrel's lighting. The well is in it. |
| The field | The bedroom's five objects, standing in grass, in the order Act 0 has them. |
| The corridor | Bellhouse's hallway, opening onto the Sunken Orchard at the far end. |
| The orchard | The orchard, drained, with a tree in it that is not the good tree. |
| Okobo | Okobo, with grass over everything, and a note in his mother's handwriting. |
| The deep | Mini-Boss 4. |
| The last room | No walls. Lit like the bedroom in Act 0, because it is the bedroom in Act 0. |

The notes here are the only ones in the game written by nobody: the world is repeating things it has
already said, in handwriting it has no business having. `root_okobo_note` is the load-bearing one —
*"the handwriting is his mother's, and the game has never shown him his mother's handwriting. He
knows it anyway."*

### What the Custodian says before the last fight

This is the one place in the game where the shape of the whole thing is stated out loud, and it is
stated by the antagonist, briefly, without ceremony:

> *You have been asked nicely for nine years.*
> *They did not build me to keep you. They built me to keep you comfortable.*
> *I have been very good at my job.*

That is the reveal and it is five lines long. It does **not** say who signed, what was measured, or
how long precisely — those are the secret ending's, and only if the player earned them
([09](09-collectibles-and-endings.md)). It does not mention the father at all.

### The ending

A sixteen-second cutscene, unskippable, scored with a furnace and a clock and nothing else.

Black. Then the bedroom resolves out of it — the same camera as the opening shot of Act 0, the same
five objects, drawn in the colours of a real room at night. It holds for six seconds and fades.

**One thing is different**: someone is sitting on the end of the bed. Nothing narrates it, nobody is
named, and the game never returns to it. Then the credits.

With all ten collectibles, **two** things are different: the door is standing open, and there is
light in the hall behind it.

He was changed by an ordeal that was as real to him as anything, regardless of where it took place.
The game does not argue this point. It just ends.
