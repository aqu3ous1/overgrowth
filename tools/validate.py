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


def load(name):
    return json.loads((DATA / name).read_text())


progression = load("progression.json")
moves = load("moves.json")
enemies = load("enemies.json")
bosses = load("bosses.json")
items = load("items.json")
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
check(
    progression["flee"]["enemy_level_at_or_below_player"] == 0.5,
    "Flee chance at or below player level must be a flat 50%",
)
check(
    progression["flee"]["speed_affects_flee"] is False,
    "SPD must not modify flee odds (04-battle-system.md)",
)


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

shops = load("shops.json")
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

check(
    sum(world["lore_notes_per_area"].values()) == 30,
    "There must be 30 lore notes in total",
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


# --- report ----------------------------------------------------------------

for w in warnings:
    print(f"warn: {w}")

if failures:
    for f in failures:
        print(f"FAIL: {f}")
    print(f"\n{len(failures)} failed, {passed} passed")
    sys.exit(1)

print(f"{passed} checks passed" + (f", {len(warnings)} warnings" if warnings else ""))
