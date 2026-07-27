#!/usr/bin/env python3
"""Economy model for Overgrowth.

The simulator says the two Custodian fights are unwinnable without a stocked
bag. This checks whether the player can actually afford one — income per act
against what that act's fights and equipment cost.

    python3 tools/economy.py            # per-act ledger
    python3 tools/economy.py --verbose  # plus the healing derivation

Exit code 0 means every act ends solvent, every boss's item budget is
affordable, and the income split matches what world.json claims.
"""

import argparse
import json
import pathlib

import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def load(name):
    return json.loads((DATA / name).read_text())


world = load("world.json")
items = load("items.json")
shops = load("shops.json")
bosses = load("bosses.json")
blocks = load("statblocks.json")
progression = load("progression.json")

ECON = world["economy"]
ACTS = [1, 2, 3, 4, 5]
CURVE = {int(k): v for k, v in progression["stat_curve"].items()}

price = {}
for group in items["battle_items"].values():
    for it in group:
        price[it["name"]] = it["price"]
for slot in items["equipment"].values():
    for it in slot:
        if "price" in it:
            price[it["name"]] = it["price"]

stock_by_act = {s["act"]: set(s["stock"]) for s in shops["shops"]}
# Shops stay open once found — the warp network makes backtracking free from Act 3.
cumulative_stock = {}
seen = set()
for act in ACTS:
    seen |= stock_by_act.get(act, set())
    cumulative_stock[act] = set(seen)


def player_hp(level):
    keys = sorted(CURVE)
    lo = max(k for k in keys if k <= level)
    hi = min(k for k in keys if k >= level)
    if lo == hi:
        return CURVE[lo]["HP"]
    t = (level - lo) / (hi - lo)
    return CURVE[lo]["HP"] + t * (CURVE[hi]["HP"] - CURVE[lo]["HP"])


def best_heal_value(act):
    """Cheapest Rell-per-HP healing the player can buy by this act."""
    available = cumulative_stock[act]
    best = None
    for name, hp in (("Spray", 40), ("Spray II", 120), ("Spray III", 260)):
        if name in available:
            ratio = price[name] / hp
            if best is None or ratio < best[0]:
                best = (ratio, name)
    return best


def income(act):
    quests = sum(q["reward_rell"] for q in world["sidequests"] if q["act"] == act)
    n = ECON["encounters_per_act"][str(act)]
    lvl = ECON["mean_enemy_level_per_act"][str(act)]
    drops = n * round(1 + 1.35 * lvl)
    found = ECON["found_money_per_act"][str(act)]
    return {"sidequests": quests, "drops": drops, "found": found,
            "total": quests + drops + found}


def spend(act, verbose=False):
    """Healing to clear the act's encounters, plus one equipment purchase per slot."""
    n = ECON["encounters_per_act"][str(act)]
    lvl = ECON["mean_enemy_level_per_act"][str(act)]
    # Attrition per encounter, from the simulator's measured band medians.
    attrition = 0.15
    # Mend covers most of it from level 9; before that, healing is all items.
    self_heal_share = 0.0 if act == 1 else 0.65
    hp = player_hp(min(45, lvl + 2))
    hp_to_buy = n * attrition * hp * (1 - self_heal_share)

    ratio, item = best_heal_value(act)
    heal_cost = hp_to_buy * ratio

    # One weapon and one body piece per act, cheapest that is actually stocked.
    equip_cost = 0
    equip_bought = []
    for slot in ("weapon", "body"):
        options = [
            it for it in items["equipment"][slot]
            if it.get("act") == act and it["name"] in cumulative_stock.get(act, set())
        ]
        if options:
            pick = min(options, key=lambda it: it["price"])
            equip_cost += pick["price"]
            equip_bought.append(pick["name"])

    if verbose:
        print(
            f"  act {act}: {n} encounters x {attrition:.0%} of {hp:.0f} HP "
            f"x {1 - self_heal_share:.0%} not self-healed = {hp_to_buy:.0f} HP "
            f"@ {ratio:.2f} Rell/HP ({item}) = {heal_cost:.0f}"
        )
    return {"healing": heal_cost, "equipment": equip_cost,
            "equipment_bought": equip_bought, "total": heal_cost + equip_cost,
            "heal_item": item}


def boss_budget_cost(act):
    """What the act's boss item budget costs, at the best healing available."""
    encs = [e for e in bosses["encounters"] if e["act"] == act]
    if not encs:
        return 0, []
    ratio, item = best_heal_value(act)
    total, detail = 0, []
    for e in encs:
        kind = "mini_boss" if e["kind"] == "mini" else "main_boss"
        count = blocks["player_item_budget"][kind]
        hp = player_hp(e["player_expected"][1])
        # A budget "item" heals 45% max HP in the simulator.
        cost = count * 0.45 * hp * ratio
        total += cost
        detail.append(f"{e['name']} x{count}")
    return total, detail


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    failures, warnings = [], []
    running = 0
    totals = {"sidequests": 0, "drops": 0, "found": 0}

    print(f"{'act':>3} {'income':>8} {'upkeep':>8} {'boss kit':>9} {'net':>8} {'carried':>9}")
    for act in ACTS:
        inc = income(act)
        if args.verbose:
            print(f"  act {act} income: quests {inc['sidequests']}, "
                  f"drops {inc['drops']}, found {inc['found']}")
        sp = spend(act, args.verbose)
        boss_cost, boss_detail = boss_budget_cost(act)
        for k in totals:
            totals[k] += inc[k]
        net = inc["total"] - sp["total"] - boss_cost
        running += net
        print(
            f"{act:>3} {inc['total']:>8.0f} {sp['total']:>8.0f} "
            f"{boss_cost:>9.0f} {net:>8.0f} {running:>9.0f}"
        )
        if running < 0:
            failures.append(
                f"act {act}: player ends {running:.0f} Rell in the red — "
                "cannot afford this act's fights"
            )
        if boss_cost > inc["total"]:
            failures.append(
                f"act {act}: boss item budget ({boss_cost:.0f}) exceeds the act's "
                f"entire income ({inc['total']:.0f})"
            )
        if args.verbose and boss_detail:
            print(f"    boss kit: {', '.join(boss_detail)}")

    grand = sum(totals.values())
    print(f"\ntotal income {grand:.0f} Rell, ending balance {running:.0f}")

    # The income split the design claims.
    for source, claimed in world["income_share"].items():
        key = {"battle_drops": "drops"}.get(source, source)
        actual = totals[key] / grand
        if abs(actual - claimed) > 0.08:
            failures.append(
                f"income split: {source} is {actual:.0%}, design claims {claimed:.0%}"
            )
        elif abs(actual - claimed) > 0.04:
            warnings.append(f"{source} {actual:.0%} vs claimed {claimed:.0%}")
        else:
            print(f"  {source:14} {actual:>5.0%}  (design claims {claimed:.0%})")

    # The last shop must be able to equip the player for the finale — there is
    # no shop in Act 5.
    final_shops = [s for s in shops["shops"] if s.get("final_shop")]
    if len(final_shops) != 1:
        failures.append("exactly one shop must be flagged as the final shop")
    else:
        fs = final_shops[0]
        if not any(n.startswith("Full Spray") or n == "Spray III" for n in fs["stock"]):
            failures.append(f"{fs['location']} is the last shop but sells no top-tier healing")
        if fs["act"] >= 5:
            failures.append("the final shop must come before Act 5, which has none")

    act5_shop = [s for s in shops["shops"] if s["act"] == 5]
    if act5_shop:
        failures.append("Act 5 must have no shop — the Root is not a place that sells things")

    for w in warnings:
        print(f"warn: {w}")
    if failures:
        print()
        for f in failures:
            print(f"FAIL: {f}")
        sys.exit(1)
    print("\neconomy solvent")


if __name__ == "__main__":
    main()
