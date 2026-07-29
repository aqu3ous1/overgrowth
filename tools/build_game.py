#!/usr/bin/env python3
"""Build game/overgrowth.html from game/src/*.js and the design data.

The game's balance tables are generated from data/*.json rather than
hand-copied, so the playable build cannot drift from the documents. Run after
changing either.

    python3 tools/build_game.py
"""

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
SRC = ROOT / "game" / "src"
OUT = ROOT / "game" / "overgrowth.html"


def load(name):
    return json.loads((DATA / name).read_text())


progression = load("progression.json")
moves = load("moves.json")
enemies = load("enemies.json")
bosses = load("bosses.json")
blocks = load("statblocks.json")
items = load("items.json")
shops = load("shops.json")
drops = load("drops.json")

# --- battle-item effects ---------------------------------------------------
# The docs describe effects in prose; the game needs numbers. This is the one
# place the two are reconciled, and it fails loudly on an unrecognised effect.
HEAL_RE = re.compile(r"restore (\d+|all) (HP|PP|SP)")
STAGE_RE = re.compile(r"([+-]\d+) (ATK|DEF|SPATK|SPDEF|SPD|all) stages?")
INFLICT_RE = re.compile(r"inflict (\w+)")


def item_effect(entry):
    m = HEAL_RE.match(entry["effect"])
    if m:
        amount, pool = m.group(1), m.group(2)
        value = "full" if amount == "all" else int(amount)
        return {"HP": "heal", "PP": "pp", "SP": "sp"}[pool], value
    return None, None


def item_extras(entry):
    """Everything an item does that is not a restore.

    Parsed from the same prose the docs print, so a booster cannot exist in the
    shop and do nothing in the fight - which is what every one of them did
    until 0.4.2.
    """
    effect = entry["effect"]
    out = {}
    m = STAGE_RE.match(effect)
    if m:
        out["stage"] = int(m.group(1))
        out["stat"] = m.group(2).lower()
        # A minus goes on the enemy; a plus goes on you.
        out["at"] = "enemy" if out["stage"] < 0 else "self"
        return out
    m = INFLICT_RE.match(effect)
    if m:
        out["inflict"] = m.group(1)
        return out
    if effect == "cure one status":
        out["cure"] = True
        return out
    return out


game_items = {}
for group_name, group in items["battle_items"].items():
    for it in group:
        key, value = item_effect(it)
        entry = {"price": it["price"], "effect": it["effect"], "battle": True}
        entry.update(item_extras(it))
        if key:
            entry[key] = value
            # Restoratives also work out of battle. Boosters and debuffs do not:
            # stat stages reset when a fight ends, so using one in a corridor
            # would spend the item on nothing.
            entry["field"] = True
        game_items[it["name"]] = entry

# Special items the game hands out that are not sold anywhere.
game_items["Letter"] = {"price": 0, "effect": "For someone on the north road.", "battle": False}

# --- enemies ---------------------------------------------------------------
game_enemies = {}
for e in enemies["roster"]:
    if e["name"] in game_enemies and e["band"] == 10:
        continue  # Root recolours reuse the earlier species' entry
    game_enemies[e["name"]] = {
        "level": e["level"],
        "role": e["role"],
        "band": e["band"],
        **({"inaction_rate": e["inaction_rate"]} if "inaction_rate" in e else {}),
        **({"inflicts": e["inflicts"]} if "inflicts" in e else {}),
        **({"deals_damage": False} if e.get("deals_damage") is False else {}),
        **({"drop_designed": True} if e.get("drop_designed") else {}),
    }

boss_encounters = {
    e["name"]: {
        "internal_level": e["internal_level"],
        "exp": e["exp"],
        "act": e["act"],
        "drops": e["drops"],
    }
    for e in bosses["encounters"]
}

# --- equipment -------------------------------------------------------------
# Flattened to one lookup by name, because a slot is a property of a piece and
# the game asks "what is this thing?" far more often than "what fits here?".
DROP_RE = re.compile(r"^(.+?)(?: x(\d+))?$")


def drop_entry(text):
    """`Spray II x3` -> ('Spray II', 3). A bare name is one of it."""
    m = DROP_RE.match(text)
    return m.group(1), int(m.group(2) or 1)


STAT_COLUMNS = ("ATK", "SPATK", "DEF", "SPDEF", "SPD", "HP")

game_equipment = {}
for slot, pieces in items["equipment"].items():
    for piece in pieces:
        game_equipment[piece["name"]] = {
            "slot": slot,
            "act": piece["act"],
            # The Overgrown Coat is found, not sold, so it carries no price.
            "price": piece.get("price", 0),
            **({"found": True} if piece.get("found_only") else {}),
            # Lowercased to match the keys Player.gearBonus asks for, and the
            # zeroes dropped: a piece's stat block should list what it changes.
            "stats": {k.lower(): piece[k] for k in STAT_COLUMNS if piece.get(k)},
            "flavour": piece["flavour"],
        }

# The shop's stock grows with the story rather than being frozen at act 1, which
# is what shipped before: every list after the first existed in the data and was
# never exported, so the Ondo shop sold act-1 goods for the rest of the game.
shop_stock = {s["act"]: s["stock"] for s in shops["shops"]}

DATA_JS = {
    "levelCap": progression["level_cap"],
    "statCurve": {int(k): v for k, v in progression["stat_curve"].items()},
    "moves": {"physical": moves["physical"], "special": moves["special"]},
    "statuses": moves["statuses"],
    "enemies": game_enemies,
    "roles": blocks["roles"],
    "enemyCurve": {
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
    "bosses": blocks["bosses"],
    "bossEncounters": boss_encounters,
    "items": game_items,
    # Crit figures come from the data rather than being retyped here, so the
    # simulator and the game cannot disagree about how often it happens.
    "damage": {
        "divisor": 12,
        "defCoeff": 0.5,
        "critChance": progression["crit"]["base_chance"],
        "critMult": progression["crit"]["multiplier"],
        "critPerSpd": progression["crit"]["per_spd"],
        "critMax": progression["crit"]["max_chance"],
        "critPlayerOnly": progression["crit"]["player_only"],
    },
    "regen": progression["resource_regen"],
    "milestones": progression["milestones"],
    "equipment": game_equipment,
    "equipStart": drops["starting"],
    "gearDrops": drops["gear"],
    "drops": drops,
    "shopStock": shop_stock,
    "currency": items["currency"],
}


def main():
    SRC.mkdir(parents=True, exist_ok=True)
    header = (
        "// GENERATED by tools/build_game.py from data/*.json — do not edit by hand.\n"
        "const DATA = "
    )
    (SRC / "00_data.js").write_text(
        header + json.dumps(DATA_JS, indent=1, ensure_ascii=False) + ";\n"
    )

    parts = []
    for f in sorted(SRC.glob("*.js")):
        parts.append(f"// ===== {f.name} " + "=" * (58 - len(f.name)) + "\n" + f.read_text())
    bundle = "\n\n".join(parts)

    shell = (ROOT / "game" / "shell.html").read_text()
    if "//<<<GAME>>>" not in shell:
        print("FAIL: shell.html has no //<<<GAME>>> marker")
        sys.exit(1)
    html = shell.replace("//<<<GAME>>>", bundle)
    OUT.write_text(html)

    kb = len(html.encode()) / 1024
    print(f"built {OUT.relative_to(ROOT)}  ({kb:.0f} KB, {len(parts)} modules)")
    print(f"  {len(game_enemies)} enemies, {len(game_items)} items, "
          f"{len(moves['physical']) + len(moves['special'])} moves")


if __name__ == "__main__":
    main()
