#!/usr/bin/env python3
"""Consistency checks for the Overgrowth design data.

The design bible in docs/ is prose; data/ holds the same numbers in a form
something can read. This script checks that the two agree with each other and
with the rules the docs claim to follow.

Run it after changing any balance number:

    python3 tools/validate.py

Exit code 0 means every check passed. Warnings do not fail the run.
"""

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DOCS = ROOT / "docs"

failures: list[str] = []
warnings: list[str] = []
passed = 0


def check(condition, message):
    global passed
    if condition:
        passed += 1
    else:
        failures.append(message)


def warn(condition, message):
    global passed
    if condition:
        passed += 1
    else:
        warnings.append(message)


def _calls(src, fn):
    """The argument text of every `fn(...)` call in src, paren-matched.

    Paren-matched rather than regex'd because an argument can itself be a call,
    and an argument list can wrap across lines.
    """
    out = []
    for m in re.finditer(re.escape(fn) + r"\(", src):
        i, depth = m.end(), 1
        while depth and i < len(src):
            if src[i] == "(":
                depth += 1
            elif src[i] == ")":
                depth -= 1
            i += 1
        out.append(src[m.end():i - 1])
    return out


def _arity(args):
    """How many arguments an argument list has, counting only top-level commas."""
    if not args.strip():
        return 0
    depth, n = 0, 1
    for ch in args:
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        elif ch == "," and depth == 0:
            n += 1
    return n


def load(name):
    return json.loads((DATA / name).read_text())


progression = load("progression.json")
moves = load("moves.json")
enemies = load("enemies.json")
bosses = load("bosses.json")
items = load("items.json")
shops = load("shops.json")
world = load("world.json")

CAP = progression["level_cap"]


# --- progression -----------------------------------------------------------

for level, expected in progression["exp_milestones"].items():
    n = int(level)
    check(
        round(1.2 * n**3) == expected,
        f"EXP milestone for level {n} is {expected}, formula gives {round(1.2 * n**3)}",
    )
    check(n <= CAP, f"EXP milestone level {n} exceeds the level cap of {CAP}")

curve = {int(k): v for k, v in progression["stat_curve"].items()}
levels = sorted(curve)
check(levels[0] == 1 and levels[-1] == CAP, "Stat curve must span level 1 to the cap")

for stat in curve[1]:
    values = [curve[l][stat] for l in levels]
    check(
        all(b > a for a, b in zip(values, values[1:])),
        f"{stat} does not increase monotonically across the curve: {values}",
    )

# SPATK is meant to overtake ATK in the second half — the shift from a kid
# throwing punches to a kid doing things that shouldn't be possible.
check(
    curve[1]["SPATK"] < curve[1]["ATK"] and curve[CAP]["SPATK"] > curve[CAP]["ATK"],
    "SPATK should start below ATK and finish above it",
)

check(progression["resource_regen"]["HP"] == 0, "HP must not regenerate (Decisions #2)")
check(
    progression["resource_regen"]["PP"] > 0 and progression["resource_regen"]["SP"] > 0,
    "PP and SP must trickle so the player is never out of options",
)
# The trickle exists to guarantee the cheapest move is always affordable. If it
# is smaller than that move's cost, the player alternates between acting and
# standing there, which is worse than a hard wall because it looks like a bug.
cheapest = min(m["cost"] for m in moves["physical"] + moves["special"] if m.get("power"))
check(
    progression["resource_regen"]["PP"] >= cheapest,
    f"PP trickle is {progression['resource_regen']['PP']} but the cheapest attack "
    f"costs {cheapest} — the player will be able to act only every other turn",
)

# Drained is the only thing in the game that touches the trickle, and it must
# not switch it off. A player at 0 PP, Drained, in a fight they cannot flee has
# no move at all - which is precisely the lose-state the trickle exists to
# prevent. It shipped that way for exactly one playtest.
drained = next(s for s in moves["statuses"] if s["name"] == "Drained")
check("regen_multiplier" in drained["player_effect"],
      "Drained must state how much of the trickle it leaves, not merely suppress it")
check(drained["player_effect"].get("regen_multiplier", 0) > 0,
      "Drained must not stop the trickle entirely - see docs/05")
check("halved" in drained["effect"] or "reduced" in drained["effect"],
      f"Drained's prose still says {drained['effect']!r} — it no longer suppresses")

check(
    progression["flee"]["enemy_level_at_or_below_player"] == 0.5,
    "Flee chance at or below player level must be a flat 50%",
)
check(
    progression["flee"]["speed_affects_flee"] is False,
    "SPD must not modify flee odds (04-battle-system.md)",
)


# --- milestones ------------------------------------------------------------
# Every tenth level pays a flat regen bump and one choice of passive. The two
# rules that matter: a passive kind is unique across the whole table, because
# Player.passive(kind) answers with the first match and a duplicate would make
# one of the pair silently unreachable; and every kind is read somewhere.
ms = progression["milestones"]
check(ms["every"] > 0 and CAP // ms["every"] >= 2,
      f"a milestone every {ms['every']} levels gives fewer than two before the cap of {CAP}")
check(ms["regen_bonus"] > 0, "the milestone regen bonus must actually be a bonus")
seen_ids, seen_kinds = set(), set()
expected_levels = list(range(ms["every"], CAP + 1, ms["every"]))
check(sorted(int(k) for k in ms["choices"]) == expected_levels,
      f"milestone levels {sorted(int(k) for k in ms['choices'])} should be {expected_levels}")
for lv, pair in ms["choices"].items():
    check(int(lv) % ms["every"] == 0, f"milestone at level {lv} is not on the {ms['every']}s")
    check(int(lv) <= CAP, f"milestone at level {lv} is above the cap of {CAP}")
    check(len(pair) == 2, f"the level {lv} milestone offers {len(pair)} choices, not 2")
    for c in pair:
        for field in ("id", "name", "effect", "kind", "value"):
            check(field in c, f"the level {lv} passive {c.get('name', '?')!r} has no {field}")
        check(c["id"] not in seen_ids, f"two passives share the id {c['id']!r}")
        check(c["kind"] not in seen_kinds,
              f"two passives share the kind {c['kind']!r}; Player.passive() could only find one")
        seen_ids.add(c["id"])
        seen_kinds.add(c["kind"])
    check(pair[0]["kind"] != pair[1]["kind"],
          f"the level {lv} milestone offers the same kind twice — that is not a choice")

# --- drops -----------------------------------------------------------------
drops = load("drops.json")
ce = drops["common_enemy"]
check(0 < ce["chance"] < 1, f"a drop chance of {ce['chance']} is not a chance")
prices = [t["max_price"] for t in ce["tiers"] if "max_price" in t]
check(prices == sorted(prices), f"drop tiers are not in ascending price order: {prices}")
weights = [t["weight"] for t in ce["tiers"]]
check(all(w > 0 for w in weights), "a drop tier with no weight can never be rolled")
check(weights[-1] == min(weights), "the last drop tier should be the rarest one")
gear_tier = [t for t in ce["tiers"] if t.get("equipment")]
check(len(gear_tier) == 1, "there should be exactly one gear tier in the drop table")
equipment_names = {p["name"] for ps in items["equipment"].values() for p in ps}
for n in drops["gear"]["pool"]:
    check(n in equipment_names, f"the gear drop pool lists {n!r}, which is not equipment")
for slot, name in drops["starting"].items():
    check(name in equipment_names, f"the game starts in {name!r}, which is not equipment")
    check(any(p["name"] == name and p["act"] == 1 for p in items["equipment"][slot]),
          f"the starting {slot} {name!r} is not an act 1 {slot}")
# The rarest tier must actually be rare: a piece of gear roughly every few
# hundred fights, not every few dozen.
gear_odds = ce["chance"] * gear_tier[0]["weight"] / sum(weights)
check(gear_odds < 0.005,
      f"a common enemy drops gear once every {1 / gear_odds:.0f} fights — too often to be a find")


# --- moves -----------------------------------------------------------------

all_moves = moves["physical"] + moves["special"]

for group, name in ((moves["physical"], "physical"), (moves["special"], "special")):
    unlocks = [m["level"] for m in group]
    check(unlocks == sorted(unlocks), f"{name} moves are not listed in unlock order")
    check(len(set(unlocks)) == len(unlocks), f"{name} moves have duplicate unlock levels")
    check(max(unlocks) <= CAP, f"a {name} move unlocks above the level cap")

check(
    len({m["name"] for m in all_moves}) == len(all_moves),
    "Two moves share a name",
)

# The player must always be able to afford Punch: cost <= level-1 PP pool, and
# cost <= what the per-turn trickle sustains over a couple of turns.
punch = next(m for m in moves["physical"] if m["name"] == "Punch")
check(punch["level"] == 1, "Punch must be available from level 1")
check(
    punch["cost"] <= curve[1]["PP"],
    f"Punch costs {punch['cost']} PP but a level 1 player has {curve[1]['PP']}",
)
check(
    punch["cost"] <= progression["resource_regen"]["PP"] * 3,
    "Punch must be affordable from a few turns of PP trickle alone",
)

# Every move must be castable at the level it is learned.
for m in all_moves:
    pool = "PP" if m in moves["physical"] else "SP"
    lvl = m["level"]
    lower = max(l for l in levels if l <= lvl)
    upper = min(l for l in levels if l >= lvl)
    if lower == upper:
        available = curve[lvl][pool]
    else:
        span = upper - lower
        t = (lvl - lower) / span
        available = curve[lower][pool] + t * (curve[upper][pool] - curve[lower][pool])
    check(
        m["cost"] <= available,
        f"{m['name']} costs {m['cost']} {pool} but a level {lvl} player has ~{available:.0f}",
    )

statuses = {s["name"] for s in moves["statuses"]}
homesick = next(s for s in moves["statuses"] if s["name"] == "Homesick")
check(homesick["item_curable"] is False, "Homesick must not be curable by items")
quiet_room = next(m for m in moves["special"] if m["name"] == "Quiet Room")
check(
    "Homesick" in quiet_room["notes"],
    "Quiet Room must be documented as the only cure for Homesick",
)

# --- a status must mean something to whoever is carrying it ----------------
# Every one of these was inert until 0.4.2: four species inflicted statuses the
# game never applied, and Mind Fog, Static Pulse and every debuff item landed on
# an enemy that had no notion of carrying anything. The rule now is that each
# status states what it does on each side, and that the code reads it.
SIDES = ("player_effect", "enemy_effect")
battle_js = ROOT / "game" / "src" / "50_battle.js"
battle_text = battle_js.read_text() if battle_js.exists() else ""
kinds = set()
for s in moves["statuses"]:
    sides = [s.get(k) for k in SIDES]
    check(any(sides), f"{s['name']} does nothing to anyone — give it a player_ or enemy_effect")
    for key, side in zip(SIDES, sides):
        if side is None:
            continue
        check(isinstance(side, dict) and "kind" in side,
              f"{s['name']}.{key} must be an object with a `kind`")
        if isinstance(side, dict) and "kind" in side:
            kinds.add(side["kind"])
            check(len(side) > 1,
                  f"{s['name']}.{key} is a kind with no number — nothing to tune")
    if s["name"] == "Homesick":
        # The one the bag cannot fix, and the one no enemy ever carries.
        check(s["enemy_effect"] is None, "Homesick is the player's alone; it takes no enemy_effect")
        check(s["duration"] is None, "Homesick does not run out")
    else:
        check(s["item_curable"] is True, f"{s['name']} should be curable — only Homesick is not")
        check(isinstance(s["duration"], int) and s["duration"] > 0,
              f"{s['name']} needs a positive duration")

if battle_text:
    for kind in sorted(kinds):
        check(f"'{kind}'" in battle_text,
              f"no code reads the {kind!r} status effect — it is data nothing consults")
    # Homesick aside, statuses reach the fight through one accessor. If that name
    # changes, everything above is checking a table nobody opens.
    check("fx(kind, who)" in battle_text,
          "the two-sided status accessor is gone; the checks above prove nothing")



# --- enemies ---------------------------------------------------------------

bands = {b["band"]: b for b in enemies["bands"]}
roster = enemies["roster"]

check(len(bands) == 10, f"Expected 10 encounter bands, found {len(bands)}")

for e in roster:
    lo, hi = bands[e["band"]]["enemy_levels"]
    check(
        lo <= e["level"] <= hi,
        f"{e['name']} is level {e['level']}, outside band {e['band']} range {lo}-{hi}",
    )
    if "inflicts" in e:
        check(
            e["inflicts"] in statuses,
            f"{e['name']} inflicts unknown status {e['inflicts']!r}",
        )

recolours = [e for e in roster if "recolour_of" in e]
unique_species = len({e["name"] for e in roster})
check(
    unique_species == 45,
    f"Expected 45 unique enemy species, found {unique_species}",
)
check(len(roster) == 49, f"Expected 49 roster entries, found {len(roster)}")
for e in recolours:
    check(
        any(o["name"] == e["recolour_of"] and o["band"] != 10 for o in roster),
        f"{e['name']} is a recolour of a species that does not exist earlier",
    )

# Homesick is meant to be rare: two regular species, plus bosses.
homesick_species = [e for e in roster if e.get("inflicts") == "Homesick"]
check(
    len(homesick_species) == 2,
    f"Homesick should appear on exactly 2 regular species, found {len(homesick_species)}",
)

# Enemy levels sit at or above the player's expected level, so the world is a
# coin flip to leave and never free — except in the Root, where the player is
# meant to finally outclass it.
for b in enemies["bands"]:
    if b.get("player_outclasses"):
        check(
            b["enemy_levels"][1] < b["player_expected"][1],
            f"Band {b['band']} is flagged player_outclasses but does not top out "
            "below the player",
        )
    else:
        check(
            b["enemy_levels"][1] >= b["player_expected"][1],
            f"Band {b['band']} tops out below the player's expected level",
        )

check(
    [b["band"] for b in enemies["bands"] if b.get("player_outclasses")] == [10],
    "The Root must be the only band the player outclasses",
)

# Per-band encounter counts must reconcile with the per-act figures the economy
# model runs on — two files, one truth.
by_act: dict[int, int] = {}
for b in enemies["bands"]:
    check("act" in b and "encounters" in b, f"Band {b['band']} is missing act or encounters")
    by_act[b["act"]] = by_act.get(b["act"], 0) + b["encounters"]
for act, total in sorted(by_act.items()):
    claimed = world["economy"]["encounters_per_act"][str(act)]
    check(
        total == claimed,
        f"act {act}: bands sum to {total} encounters, world.json claims {claimed}",
    )

# Boss positions must point at real bands, in order.
last = (0, 0.0)
for e in sorted(bosses["encounters"], key=lambda e: e["order"]):
    pos = e.get("encounter_position")
    check(pos is not None, f"{e['name']} has no encounter_position")
    if pos:
        check(
            any(b["band"] == pos["band"] for b in enemies["bands"]),
            f"{e['name']} is positioned in band {pos['band']}, which does not exist",
        )
        here = (pos["band"], pos["through_band"])
        check(here > last, f"{e['name']} is positioned before the previous boss")
        last = here

# Only one regular enemy may block fleeing outright.
no_flee = [e for e in roster if e.get("no_flee")]
check(
    len(no_flee) == 1 and no_flee[0]["name"] == "Retention Specialist",
    "Retention Specialist must be the only regular enemy that blocks fleeing",
)


# --- bosses ----------------------------------------------------------------

encounters = bosses["encounters"]
check(len(encounters) == 8, f"Expected 8 boss encounters, found {len(encounters)}")
check(
    sum(1 for e in encounters if e["kind"] == "main") == 4,
    "Expected exactly 4 main bosses",
)
check(
    sum(1 for e in encounters if e["kind"] == "mini") == 4,
    "Expected exactly 4 mini-bosses",
)

boss_levels = [e["internal_level"] for e in encounters]
check(
    boss_levels == sorted(boss_levels) and len(set(boss_levels)) == len(boss_levels),
    f"Boss internal levels must strictly increase: {boss_levels}",
)

# Bosses show "??", never a number. That is what closes RUN, so it has to hold
# for every one of them — including the secret encounter.
for e in encounters + [bosses["secret_encounter"]]:
    check(
        e.get("display_level") == "??",
        f"{e['name']} must display '??' rather than a level (04-battle-system.md)",
    )
    check(
        "level" not in e and "no_flee" not in e,
        f"{e['name']} still carries a plain level or a no-flee flag; '??' replaces both",
    )

for e in encounters:
    check(
        e["internal_level"] > e["player_expected"][1],
        f"{e['name']} is internally level {e['internal_level']}, not above the player's "
        f"expected {e['player_expected'][1]}",
    )

final = encounters[-1]
check(
    final["internal_level"] > CAP,
    f"The final boss must sit above the player's cap of {CAP}, "
    f"got {final['internal_level']}",
)

# No regular enemy may show "??" — the exception is what makes it mean anything.
check(
    all(isinstance(e["level"], int) for e in roster),
    "Regular enemies must always show a real numeric level",
)

primitives = [e["primitive"] for e in encounters if e["kind"] == "main"]
check(
    sorted(primitives) == ["cube", "obelisk", "pyramid", "sphere"],
    f"The four main bosses must map to the four Gallery paintings, got {primitives}",
)
check(
    bosses["secret_encounter"]["primitive"] == "spire",
    "The secret encounter must map to the fifth painting",
)

boss_areas = {e["area"] for e in encounters}
area_names = {a["name"] for a in world["areas"]}
for a in boss_areas:
    check(a in area_names, f"Boss area {a!r} is not a known area")


# --- items -----------------------------------------------------------------

sprays = [i for i in items["battle_items"]["healing"] if i["name"].startswith("Spray")]
spray_prices = [i["price"] for i in sprays]
check(
    spray_prices == sorted(spray_prices),
    f"Spray tiers must be priced in ascending order: {spray_prices}",
)

for group in items["battle_items"].values():
    for i in group:
        check(i["price"] > 0, f"{i['name']} has a non-positive price")

STAT_KEYS = {"ATK", "SPATK", "DEF", "SPDEF", "SPD", "HP"}
for slot, pieces in items["equipment"].items():
    by_act: dict[int, list] = {}
    for p in pieces:
        by_act.setdefault(p["act"], []).append(p)
    acts = [p["act"] for p in pieces]
    check(acts == sorted(acts), f"{slot} equipment is not listed in act order")
    # Acts 2 to 4 must always offer at least one trade-off item per slot.
    for act in (2, 3, 4):
        pool = by_act.get(act, [])
        check(bool(pool), f"No {slot} equipment available in act {act}")
        check(
            any(any(p.get(k, 0) < 0 for k in STAT_KEYS) for p in pool),
            f"Act {act} {slot} equipment has no trade-off option "
            "(06-items-and-equipment.md equipment rules)",
        )

# --- nothing is missable, and nothing is a mystery -------------------------
# docs/06: "Nothing is missable. Every equipment tier is purchasable in at least
# one shop, with the strongest version of each tier found in the world." A piece
# with no source is a piece the player can never hold.
SOURCE_KINDS = ("shop", "drop", "found", "start", "boss")
shop_lists = {s["act"]: s["stock"] for s in shops["shops"]}
sold_anywhere = {n for stock in shop_lists.values() for n in stock}
boss_drops = {d.split(" x")[0] for e in bosses["encounters"] for d in e["drops"]}
for slot, pieces in items["equipment"].items():
    for p in pieces:
        srcs = p.get("sources", [])
        check(bool(srcs), f"{p['name']} has no way of being obtained")
        for s in srcs:
            kind = s.split(":")[0]
            check(kind in SOURCE_KINDS, f"{p['name']} lists unknown source {s!r}")
            if kind == "boss":
                who = s.split(":", 1)[1]
                check(any(e["name"] == who for e in bosses["encounters"]),
                      f"{p['name']} is dropped by {who!r}, who is not a boss")
                check(p["name"] in boss_drops,
                      f"{p['name']} claims a drop from {who} that bosses.json does not list")
        if "shop" in srcs:
            check(p["name"] in sold_anywhere,
                  f"{p['name']} says it is sold, but no shop in shops.json stocks it")
        check(bool(p.get("flavour")), f"{p['name']} has no flavour text")

# A boss drop naming something that does not exist is a message the player gets
# and an item they do not.
known = {i["name"] for g in items["battle_items"].values() for i in g}
known |= {p["name"] for ps in items["equipment"].values() for p in ps}
for e in bosses["encounters"]:
    for d in e["drops"]:
        check(d.split(" x")[0] in known, f"{e['name']} drops {d!r}, which does not exist")

overgrown = next(p for p in items["equipment"]["body"] if p["name"] == "Overgrown Coat")
check(
    all(overgrown.get(k, 0) >= 0 for k in STAT_KEYS) and overgrown.get("found_only"),
    "The Overgrown Coat must be the clean, found-only endgame piece",
)

# Rell per HP must ascend across the spray ladder: for a solo character the
# scarce resource in a fight is the turn, so bigger heals carry a premium.
spray_hp = {"Spray": 40, "Spray II": 120, "Spray III": 260}
ratios = [
    i["price"] / spray_hp[i["name"]]
    for i in items["battle_items"]["healing"]
    if i["name"] in spray_hp
]
check(
    all(b > a for a, b in zip(ratios, ratios[1:])),
    f"Spray Rell-per-HP must strictly ascend, got {[round(r, 2) for r in ratios]} "
    "— equal value makes a tier pointless",
)

known_items = {i["name"] for g in items["battle_items"].values() for i in g}
known_items |= {p["name"] for slot in items["equipment"].values() for p in slot}
for shop in shops["shops"]:
    for entry in shop["stock"]:
        check(entry in known_items, f"{shop['location']} stocks unknown item {entry!r}")
    check(
        shop["location"] in area_names,
        f"Shop location {shop['location']!r} is not a known area",
    )
check(
    not any(s["act"] >= 5 for s in shops["shops"]),
    "Act 5 must have no shop — the Root is not a place that sells things",
)
final_shop = [s for s in shops["shops"] if s.get("final_shop")]
check(len(final_shop) == 1, "Exactly one shop must be flagged as the final shop")
if final_shop:
    check(
        final_shop[0]["location"] == "Vixtry Regional Campus",
        "The last shop in the game must be the Vixtry vending machine",
    )
for area in shops["no_shop_areas"]:
    check(area in area_names, f"no_shop_areas names unknown area {area!r}")
    check(
        area not in {s["location"] for s in shops["shops"]},
        f"{area} is listed as having no shop but also has one",
    )

# Every purchasable piece of equipment must actually be stocked somewhere.
stocked = {e for s in shops["shops"] for e in s["stock"]}
for slot, pieces in items["equipment"].items():
    for p in pieces:
        if p.get("found_only") or p.get("price", 0) == 0:
            continue
        check(
            p["name"] in stocked,
            f"{p['name']} has a price but no shop sells it",
        )

first_warp = items["warp_devices"][0]
check(
    first_warp["unlocks"] != "self",
    "The first warp device must unlock every previously discovered location",
)
check(
    all(w["unlocks"] == "self" for w in items["warp_devices"][1:]),
    "Every warp device after the first must unlock only its own area",
)
check(
    first_warp["act"] >= 3,
    "Warp devices must not appear before roughly the midpoint of the game",
)


# --- world -----------------------------------------------------------------

areas = world["areas"]
check(len(areas) == 10, f"Expected 10 major areas, found {len(areas)}")
check(
    sum(1 for a in areas if a["collectible"]) == world["collectibles_total"] == 10,
    "There must be exactly one hidden collectible per area, ten in total",
)
check(
    not next(a for a in areas if a["name"] == "The Gallery")["enemies"],
    "The Gallery must have no enemies",
)

quests = world["sidequests"]
check(len(quests) == 20, f"Expected 20 sidequests, found {len(quests)}")
ondo = [q for q in quests if q["area"] == "Ondo"]
check(len(ondo) == 8, f"Expected 8 sidequests in Ondo, found {len(ondo)}")
check(
    sum(1 for q in quests if q["act"] <= 2) == 13,
    "13 sidequests should be available before the end of Act 2 "
    "so late-game money tightens on its own",
)
check(
    not any(q["act"] == 5 for q in quests),
    "There must be no sidequests in Act 5",
)
for q in quests:
    check(q["area"] in area_names, f"Sidequest {q['name']!r} is in an unknown area")

# Act 3 grew in 0.5.0 - the market row, the overpass, the service level under
# the rail, the mural corridor, 4C and the laundry all carry one - so the
# allocation grew with it rather than the new rooms being left blank.
NOTE_TOTAL = 38
check(
    sum(world["lore_notes_per_area"].values()) == NOTE_TOTAL,
    f"There must be {NOTE_TOTAL} lore notes in total, "
    f"not {sum(world['lore_notes_per_area'].values())}",
)
for a in world["lore_notes_per_area"]:
    check(a in area_names, f"Lore notes assigned to unknown area {a!r}")

check(
    abs(sum(world["income_share"].values()) - 1.0) < 1e-9,
    "Income shares must sum to 1.0",
)

pacing = world["pacing_hours"]
lo = round(sum(v[0] for v in pacing.values()), 1)
hi = round(sum(v[1] for v in pacing.values()), 1)
main_hi = round(sum(v[1] for k, v in pacing.items() if k != "optional"), 1)
check(10 <= lo and hi <= 17, f"Total pacing {lo}-{hi}h is outside the 10-15h target band")
warn(main_hi <= 14, f"Main-path estimate {main_hi}h is drifting past the 10-15h target")


# --- naming ----------------------------------------------------------------

# The family's names are never rendered anywhere, in any form. The protagonist
# knows them; the player never finds out.
naming = load("naming.json")
all_md = {f: f.read_text() for f in [ROOT / "README.md"] + sorted(DOCS.glob("*.md"))}

check(
    naming["permitted_family_names"] == [],
    "No family name may ever be permitted — surname, father's, or mother's",
)
check(
    naming["player_name_entry"]["surname"] is False,
    "The player must never be asked for a surname",
)
check(
    naming["permitted_initials"]["mother"] is None,
    "The mother is never initialled, listed, or named",
)

# The father's initial is the single permitted mark. It may be printed, but the
# surname after it may not be.
roster = naming["roster_line"]
roster_text = (ROOT / roster["doc"]).read_text()
roster_lines = [l for l in roster_text.splitlines() if roster["match"] in l]
check(len(roster_lines) == 1, f"Expected one roster line matching {roster['match']!r}")
for line in roster_lines:
    check(roster["must_contain"] in line, f"Roster line must read {roster['must_contain']}")
    check(
        re.search(roster["must_not_match"], line) is None,
        f"Roster line prints a surname after the initial: {roster['why']}",
    )

# The initial appears in exactly one lore note. One reads as an accident of
# paperwork; two read as a puzzle asking to be solved.
once = naming["initial_appears_once"]
notes_only = roster_text.split(once["notes_section_ends_at"])[0]
sightings = len(re.findall(once["pattern"], notes_only))
check(
    sightings == once["count"],
    f"The father's initial appears in {sightings} lore note(s), "
    f"expected {once['count']}: {once['why']}",
)
check(
    sum(
        len(re.findall(once["pattern"], text))
        for f, text in all_md.items()
        if f != ROOT / once["doc"]
    )
    == 0,
    "The father's initial must appear in one document only — do not corroborate it",
)

for site in naming["dodge_sites"]:
    target = ROOT / site["doc"]
    check(target.exists(), f"Naming dodge site {site['id']} points at a missing doc")
    if target.exists():
        check(
            site["must_contain"] in target.read_text(),
            f"Dodge site {site['id']} is not rendered as specified in {site['doc']}",
        )

for forbidden in naming["forbidden_renderings"]:
    pattern = re.compile(forbidden["pattern"])
    for f, text in all_md.items():
        check(
            not pattern.search(text),
            f"{f.name} contains a forbidden family-name rendering "
            f"({forbidden['pattern']}): {forbidden['why']}",
        )

for ref in naming["rule_must_be_referenced_from"]:
    text = (ROOT / ref).read_text()
    check(
        re.search(r"never (?:be )?(?:revealed|rendered)", text) is not None,
        f"{ref} must state the naming rule so a writer meets it from any entry point",
    )


# --- docs ------------------------------------------------------------------

md_files = list(all_md)
link = re.compile(r"\]\((?!https?:)([^)#]+\.md)\)")
for f in md_files:
    for target in link.findall(f.read_text()):
        resolved = (f.parent / target).resolve()
        check(resolved.exists(), f"{f.name} links to missing file {target}")

# The scope table in the overview is the doc most likely to drift from data.
overview = (DOCS / "00-overview.md").read_text()


def scope(label):
    m = re.search(rf"^\|\s*{re.escape(label)}\s*\|\s*(\d+)", overview, re.M)
    return int(m.group(1)) if m else None


check(scope("Level cap") == CAP, "Overview scope table disagrees with the level cap")
check(
    scope("Major areas") == len(areas),
    "Overview scope table disagrees with the number of areas",
)
check(
    scope("Enemy species") == unique_species,
    "Overview scope table disagrees with the enemy roster",
)
check(
    scope("Sidequests") == len(quests),
    "Overview scope table disagrees with the sidequest list",
)
check(
    scope("Main bosses") == 4 and scope("Mini-bosses") == 4,
    "Overview scope table disagrees with the boss roster",
)
check(
    scope("Hidden collectibles") == world["collectibles_total"],
    "Overview scope table disagrees with the collectible count",
)
check(
    scope("Endings") == len(world["endings"]),
    "Overview scope table disagrees with the ending count",
)

moves_row = re.search(r"^\|\s*Player moves\s*\|\s*(\d+) Physical, (\d+) Special", overview, re.M)
check(moves_row is not None, "Overview scope table has no player-moves row")
if moves_row:
    check(
        int(moves_row.group(1)) == len(moves["physical"])
        and int(moves_row.group(2)) == len(moves["special"]),
        "Overview scope table disagrees with the move lists",
    )


# --- playable build --------------------------------------------------------

# The build embeds the design tables. If it is stale, the game people play is
# not the game these documents describe.
blocks = load("statblocks.json")
build = ROOT / "game" / "overgrowth.html"
data_js = ROOT / "game" / "src" / "00_data.js"
check(build.exists(), "game/overgrowth.html is missing — run tools/build_game.py")
check(data_js.exists(), "game/src/00_data.js is missing — run tools/build_game.py")

if data_js.exists():
    embedded = json.loads(data_js.read_text().split("const DATA = ", 1)[1].rstrip().rstrip(";"))
    check(
        embedded["levelCap"] == CAP,
        "the build's level cap disagrees with progression.json — rebuild",
    )
    check(
        len(embedded["moves"]["physical"]) == len(moves["physical"])
        and len(embedded["moves"]["special"]) == len(moves["special"]),
        "the build's move lists disagree with moves.json — rebuild",
    )
    check(
        len(embedded["enemies"]) == unique_species,
        f"the build has {len(embedded['enemies'])} enemies against "
        f"{unique_species} in the roster — rebuild",
    )
    check(
        embedded["enemyCurve"] == {
            "HP": {
                "base": blocks["enemy_curve"]["HP"]["base"],
                "per_level": blocks["enemy_curve"]["HP"]["per_level"],
                "per_level_squared": blocks["enemy_curve"]["HP"].get("per_level_squared", 0),
            },
            "ATK": blocks["enemy_curve"]["ATK"],
            "DEF": blocks["enemy_curve"]["DEF"],
            "SPD": blocks["enemy_curve"]["SPD"],
            "attack_power": blocks["enemy_curve"]["attack_power"],
        },
        "the build's enemy stat curve is stale — rebuild",
    )
    # Rules the simulator reads must also reach the build. The 0.2.0 report was
    # caused by resource_regen existing in the data and in the simulator, but
    # never being exported to the game or referenced by the battle code.
    check(
        embedded.get("regen") == progression["resource_regen"],
        "the build's resource regen disagrees with progression.json — rebuild",
    )
    battle_src = (ROOT / "game" / "src" / "50_battle.js")
    if battle_src.exists():
        check(
            "DATA.regen" in battle_src.read_text(),
            "the battle code never reads DATA.regen — the trickle would be "
            "exported but not implemented",
        )

    # --- crits belong to the player, and to nobody else --------------------
    crit = progression["crit"]
    check(crit.get("player_only") is True,
          "crits must be marked player_only in the data, or the rule lives only in code")
    check(crit["base_chance"] < crit["max_chance"] <= 0.5,
          "the crit cap must sit above the base chance and below a coin flip")
    for key, want in (("critChance", crit["base_chance"]), ("critMult", crit["multiplier"]),
                      ("critPerSpd", crit["per_spd"]), ("critMax", crit["max_chance"])):
        check(embedded["damage"].get(key) == want,
              f"the build's {key} disagrees with progression.json — rebuild")
    if battle_src.exists():
        src = battle_src.read_text()
        # The rule is enforced by *not* handing roll() a speed, so check the
        # arity of every call site. Matching the argument text literally, which
        # is what this did first, meant renaming a local broke the check and
        # told you crits were off when nothing about them had moved.
        calls = _calls(src, "this.roll")
        check(len(calls) == 2, f"expected 2 roll() call sites, found {len(calls)}")
        against_player = [a for a in calls if "Player.def" in a]
        against_enemy = [a for a in calls if "Player.def" not in a]
        check(len(against_player) == 1 and _arity(against_player[0]) == 3,
              "the enemy's attack passes a speed to roll(), which lets enemies crit")
        check(len(against_enemy) == 1 and _arity(against_enemy[0]) == 4,
              "the player's attack passes no speed to roll(), so it can never crit")

    for name, spec in embedded["bosses"].items():
        check(
            spec == blocks["bosses"].get(name),
            f"the build's stats for {name} are stale — rebuild",
        )

    # --- an item the shop sells must do something in a fight ---------------
    # Eleven of the eighteen were inert until 0.4.2, and nothing caught it,
    # because the docs described them, the shop stocked them, and the fight
    # simply had no branch. The parse in build_game.py is what turns the prose
    # into a field; this is what proves the parse covered every line.
    DOES_SOMETHING = ("heal", "pp", "sp", "stage", "inflict", "cure")
    for _group, _entries in items["battle_items"].items():
        for _it in _entries:
            _built = embedded["items"].get(_it["name"], {})
            check(any(k in _built for k in DOES_SOMETHING),
                  f"{_it['name']} sells for {_it['price']} and does nothing in a fight")

    # --- the new systems have to reach the game, not just the data ---------
    # Equipment is the cautionary tale here: docs/06 described sixteen pieces,
    # shops.json stocked them, bosses.json dropped them, and for three acts the
    # build had no slots at all. Data that nothing reads is documentation.
    for _slot, _pieces in items["equipment"].items():
        for _p in _pieces:
            _built = embedded["equipment"].get(_p["name"])
            check(_built is not None, f"the build has no {_p['name']} — rebuild")
            if not _built:
                continue
            check(_built["slot"] == _slot, f"{_p['name']} is in the wrong slot in the build")
            _want = {k.lower(): _p[k] for k in ("ATK", "SPATK", "DEF", "SPDEF", "SPD", "HP")
                     if _p.get(k)}
            check(_built["stats"] == _want,
                  f"the build's stats for {_p['name']} are stale — rebuild")
    player_js = ROOT / "game" / "src" / "40_dialogue.js"
    player_text = player_js.read_text() if player_js.exists() else ""
    ui_text = (ROOT / "game" / "src" / "60_ui.js").read_text()
    game_text = (ROOT / "game" / "src" / "70_game.js").read_text()
    check("gearBonus" in player_text, "nothing applies an equipped piece's stats")
    check("DATA.equipment" in player_text, "the player code never looks at the equipment table")
    for lv, pair in ms["choices"].items():
        for c in pair:
            check(f"'{c['kind']}'" in battle_text or f"'{c['kind']}'" in player_text,
                  f"the {c['name']} passive ({c['kind']}) is offered and read by nothing")
    check("regenBonus" in battle_text,
          "the milestone regen bonus is never added to the trickle")
    check("Player.owed" in ui_text or "Player.owed" in game_text,
          "milestones are queued and never offered")
    check("DATA.drops" in battle_text, "the drop table is exported and never rolled")
    check("bossEncounters" in battle_text and "drops" in battle_text,
          "boss drops are in the data and never handed over")
    # Saves have to carry all of it, or a reload silently undresses the player.
    for field in ("equip", "owned", "passives", "owed"):
        check(f"{field}: Player.{field}" in ui_text or f'"{field}"' in ui_text
              or f"{field}: Player." in ui_text,
              f"saves do not record Player.{field}")
        check(f"d.{field}" in ui_text, f"loading a save ignores {field}")

        # Every move that deals no damage must be handled by name, or by the status
    # it inflicts. Counter Stance shipped for three acts as a no-op.
    for _m in moves["physical"] + moves["special"]:
        if _m.get("power"):
            continue
        _named = f"'{_m['name']}'" in battle_text
        check(_named or _m.get("inflicts") or _m.get("heal_fraction"),
              f"{_m['name']} deals no damage and the fight has no branch for it")

if build.exists():
    html = build.read_text()
    check("<!doctype" not in html.lower(), "the build must be a fragment, not a full document")
    check("src=\"http" not in html and "href=\"http" not in html,
          "the build must not reference anything external")




# --- world geometry --------------------------------------------------------
# Two doors on the same building leading to the same room has now shipped
# twice: Ondo's bottom-right house opened into the shop, and Sable City had two
# doors into the same flat. It is invisible in the source and obvious in play,
# so it gets a check rather than a promise to be careful.
CUTSCENE_EXITS = {"fall"}      # exits handled by a story beat, not a room load
_ui_src = (ROOT / "game" / "src" / "60_ui.js").read_text()

# Every row of a room's map must be the same width. A row one character short
# leaves the last column of that row undefined, which is invisible in the source
# and only shows up as a wall you can walk through - three Bellhouse rooms had
# shipped that way since Act 3.
_room_blocks = {}
for _m in re.finditer(r"^  ([a-z_0-9]+): \{", (ROOT / "game" / "src" / "30_world.js").read_text(), re.M):
    _src = (ROOT / "game" / "src" / "30_world.js").read_text()
    _body = _src[_m.end():]
    _body = _body[:_body.find("\n  },")]
    _room_blocks[_m.group(1)] = _body
for _name, _body in _room_blocks.items():
    _mm = re.search(r"map: \[(.*?)\]", _body, re.S)
    if not _mm:
        continue
    _rows = re.findall(r"'([^']*)'", _mm.group(1))
    _widths = sorted({len(r) for r in _rows})
    check(len(_widths) == 1,
          f"{_name}'s map rows are not all the same width: {_widths}")

# And every room has to appear on exactly one leg of the map's route, or the
# player can stand somewhere the map has no idea about - and, since 0.5.0, warp
# away from somewhere it cannot name.
_route = _ui_src[_ui_src.index("const ROUTE = ["):_ui_src.index("function routeIndexOf")]
# Only the `rooms:` arrays count. Matching every quoted word in the block also
# picked up each leg's `warpTo`, which named a room that was already listed.
_listed = []
for _m in re.finditer(r"rooms: \[(.*?)\]", _route, re.S):
    _listed += re.findall(r"'([a-z_0-9]+)'", _m.group(1))
for _name in _room_blocks:
    check(_listed.count(_name) == 1,
          f"{_name} appears on {_listed.count(_name)} legs of ROUTE, not exactly one")
_world = (ROOT / "game" / "src" / "30_world.js").read_text()
_game_src = (ROOT / "game" / "src" / "70_game.js").read_text()
_rooms = {}
for _m in re.finditer(r"\n  (\w+): \{", _world):
    _rest = _world[_m.end():]
    _rooms[_m.group(1)] = _rest[:_rest.find("\n  },")]

def _exits_of(body):
    """The exits array, sliced by bracket depth.

    Not by searching for the next "]," — an exit whose `at: [7, 5]` is followed
    by `sfx` ends in exactly that sequence, so the naive slice stopped after two
    exits and this check silently read a fraction of every room.
    """
    if "exits:" not in body:
        return []
    i = body.index("exits:")
    i = body.index("[", i)
    depth, j = 0, i
    while j < len(body):
        if body[j] == "[":
            depth += 1
        elif body[j] == "]":
            depth -= 1
            if depth == 0:
                break
        j += 1
    return re.findall(r"to: '(\w+)'", body[i:j])


for _name, _body in _rooms.items():
    _dests = _exits_of(_body)
    if not _dests:
        continue
    _dupes = sorted({d for d in _dests if _dests.count(d) > 1})
    # Bellhouse Commons is non-Euclidean by design and says so in the room. Any
    # room that has not claimed that is making a mistake.
    if "impossible: true" not in _body:
        check(not _dupes,
              f"{_name} has more than one exit leading to {', '.join(_dupes)} — "
              f"two doors on one street that go to the same room")
    else:
        check(bool(_dupes),
              f"{_name} is marked impossible but every exit goes somewhere different")
    for _d in _dests:
        # `fall` is a cutscene, not a room: the corridor ends by dropping him.
        check(_d in _rooms or _d in CUTSCENE_EXITS,
              f"{_name} has an exit to {_d}, which is neither a room nor a cutscene")

# Every room must be reachable from somewhere, or it is content that exists and
# cannot be walked to. Two are reached by a cutscene rather than by a door: the
# bedroom is where the game starts, and the void is where sleeping puts him.
CUTSCENE_ROOMS = {"bedroom", "void"}
_linked = {d for b in _rooms.values() for d in _exits_of(b)} | CUTSCENE_ROOMS
for _name in _rooms:
    check(_name in _linked, f"no exit or cutscene anywhere leads to {_name}")
for _r in CUTSCENE_ROOMS:
    check(f"World.load('{_r}')" in _game_src,
          f"{_r} is only reachable by cutscene, but nothing loads it")

# --- report ----------------------------------------------------------------

for w in warnings:
    print(f"warn: {w}")

if failures:
    for f in failures:
        print(f"FAIL: {f}")
    print(f"\n{len(failures)} failed, {passed} passed")
    sys.exit(1)

print(f"{passed} checks passed" + (f", {len(warnings)} warnings" if warnings else ""))
