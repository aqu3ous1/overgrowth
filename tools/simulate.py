#!/usr/bin/env python3
"""Combat simulator for the Overgrowth balance numbers.

The design bible claims every boss is beatable at the expected level with items
and no grinding, and that random encounters cost a few turns and a slice of HP.
Those are testable claims. This runs them.

    python3 tools/simulate.py              # summary table, fails on target misses
    python3 tools/simulate.py --verbose    # per-matchup detail
    python3 tools/simulate.py --trials N   # default 2000

Exit code 0 means every matchup landed inside the windows in
data/statblocks.json. It is a tuning tool, not a proof — the AI on both sides is
deliberately simple, and it models damage, resources and healing only.
"""

import argparse
import json
import pathlib
import random
import statistics
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def load(name):
    return json.loads((DATA / name).read_text())


progression = load("progression.json")
moves_data = load("moves.json")
enemies_data = load("enemies.json")
bosses_data = load("bosses.json")
blocks = load("statblocks.json")
items = load("items.json")

CURVE = {int(k): v for k, v in progression["stat_curve"].items()}
DIVISOR = 12.0
DEF_COEFF = 0.5
CRIT = progression["crit"]
REGEN = progression["resource_regen"]


def player_stats(level):
    """Interpolate the authored stat curve to any level."""
    keys = sorted(CURVE)
    lo = max(k for k in keys if k <= level)
    hi = min(k for k in keys if k >= level)
    if lo == hi:
        return dict(CURVE[lo])
    t = (level - lo) / (hi - lo)
    return {s: CURVE[lo][s] + t * (CURVE[hi][s] - CURVE[lo][s]) for s in CURVE[lo]}


def enemy_stats(level, role):
    c, m = blocks["enemy_curve"], blocks["roles"][role]
    hp = (
        c["HP"]["base"]
        + c["HP"]["per_level"] * level
        + c["HP"].get("per_level_squared", 0) * level**2
    )
    return {
        "HP": hp * m["HP"],
        "ATK": (c["ATK"]["base"] + c["ATK"]["per_level"] * level) * m["ATK"],
        "DEF": (c["DEF"]["base"] + c["DEF"]["per_level"] * level) * m["DEF"],
        "SPD": (c["SPD"]["base"] + c["SPD"]["per_level"] * level) * m["SPD"],
        "power": c["attack_power"],
        "inaction_rate": 0.0,
    }


def damage(atk, power, defence, spd=0):
    raw = (atk * power) / DIVISOR - defence * DEF_COEFF
    roll = raw * random.uniform(0.90, 1.10)
    if random.random() < CRIT["base_chance"] + spd / 4000:
        roll = ((atk * power) / DIVISOR) * CRIT["multiplier"]
    return max(1, roll)


def known_moves(level):
    phys = [m for m in moves_data["physical"] if m["level"] <= level]
    spec = [m for m in moves_data["special"] if m["level"] <= level]
    return phys, spec


def best_attack(moves, stat, target_def, pp):
    """Highest expected damage the player can currently afford."""
    best, best_dmg = None, 0
    for m in moves:
        if m["cost"] > pp or not m.get("power"):
            continue
        power = m["power"]
        if isinstance(power, list):
            power = sum(power) / 2
        hits = m.get("hits", 1)
        if isinstance(hits, list):
            hits = sum(hits) / 2
        if not hits:
            continue
        expected = max(1, (stat * power) / DIVISOR - target_def * DEF_COEFF) * hits
        if expected > best_dmg:
            best, best_dmg = m, expected
    return best


def fight(level, enemy, heal_items, homesick=False, boss=None, max_turns=60):
    """One fight. Returns (won, turns, attrition_fraction).

    Attrition is HP lost plus HP restored mid-fight, over max HP — what the
    encounter actually cost, rather than where the bar happened to end up.
    """
    ps = player_stats(level)
    hp_max = ps["HP"]
    hp, pp, sp = hp_max, ps["PP"], ps["SP"]
    phys, spec = known_moves(level)
    mend = [m for m in spec if m.get("heal_fraction")]
    quiet_room = any(m["name"] == "Quiet Room" for m in spec)
    ehp = enemy["HP"]
    healed = 0.0
    restored = False
    afflicted = homesick and not quiet_room
    turns = 0

    while turns < max_turns:
        turns += 1

        # --- player acts
        acted = False
        if hp < hp_max * 0.35:
            best_mend = max(
                (m for m in mend if m["cost"] <= sp),
                key=lambda m: m["heal_fraction"],
                default=None,
            )
            if best_mend:
                before = hp
                hp = min(hp_max, hp + hp_max * best_mend["heal_fraction"])
                healed += hp - before
                sp -= best_mend["cost"]
                acted = True
            elif heal_items > 0:
                before = hp
                hp = min(hp_max, hp + hp_max * 0.45)
                healed += hp - before
                heal_items -= 1
                acted = True
        if not acted and homesick and quiet_room and afflicted:
            qr = next(m for m in spec if m["name"] == "Quiet Room")
            if qr["cost"] <= sp:
                sp -= qr["cost"]
                afflicted = False
                acted = True
        if not acted:
            p_move = best_attack(phys, ps["ATK"], enemy["DEF"], pp)
            s_move = best_attack(spec, ps["SPATK"], enemy["DEF"], sp)
            pick, stat, pool = None, None, None
            for m, st, pl in ((p_move, ps["ATK"], "pp"), (s_move, ps["SPATK"], "sp")):
                if not m:
                    continue
                power = m["power"] if not isinstance(m["power"], list) else sum(m["power"]) / 2
                hits = m.get("hits", 1)
                hits = hits if not isinstance(hits, list) else sum(hits) / 2
                exp = max(1, (st * power) / DIVISOR - enemy["DEF"] * DEF_COEFF) * hits
                if pick is None or exp > pick[0]:
                    pick, stat, pool = (exp, m), st, pl
            if pick:
                m = pick[1]
                power = m["power"] if not isinstance(m["power"], list) else sum(m["power"]) / 2
                hits = m.get("hits", 1)
                hits = hits if not isinstance(hits, list) else random.randint(*hits) if isinstance(hits, list) else hits
                for _ in range(int(hits)):
                    ehp -= damage(stat, power, enemy["DEF"], ps["SPD"])
                if pool == "pp":
                    pp -= m["cost"]
                else:
                    sp -= m["cost"]

        if ehp <= 0:
            if boss and boss.get("restores_once_to") and not restored:
                ehp = enemy["HP"] * boss["restores_once_to"]
                restored = True
            else:
                return True, turns, (hp_max - hp + healed) / hp_max

        # --- enemy acts
        falloff = 1.0
        if boss and boss.get("damage_falloff_per_phase"):
            phases = boss.get("phases", 1)
            done = min(phases - 1, int((1 - ehp / enemy["HP"]) * phases))
            falloff = max(0.4, 1 - boss["damage_falloff_per_phase"] * done)
        if random.random() >= enemy.get("inaction_rate", 0.0):
            hp -= damage(enemy["ATK"] * falloff, enemy["power"], ps["DEF"])
        if afflicted:
            hp -= hp_max * 0.05
        if hp <= 0:
            return False, turns, 1.0

        pp = min(ps["PP"], pp + REGEN["PP"])
        sp = min(ps["SP"], sp + REGEN["SP"])

    return False, turns, (hp_max - hp + healed) / hp_max


def run(matchups, trials):
    rows = []
    for m in matchups:
        results = [
            fight(
                m["player_level"],
                m["enemy"],
                m["heal_items"],
                homesick=m.get("homesick", False),
                boss=m.get("boss"),
            )
            for _ in range(trials)
        ]
        wins = [r for r in results if r[0]]
        rows.append(
            {
                "name": m["name"],
                "kind": m["kind"],
                "player_level": m["player_level"],
                "win_rate": len(wins) / trials,
                "median_turns": statistics.median([r[1] for r in wins]) if wins else None,
                "median_attrition": statistics.median([r[2] for r in wins]) if wins else None,
                "band": m.get("band"),
            }
        )
    return rows


def build_matchups():
    out = []
    roster = {(e["name"], e["band"]): e for e in enemies_data["roster"]}
    budget = blocks["player_item_budget"]

    for band in enemies_data["bands"]:
        plo, phi = band["player_expected"]
        elo, ehi = band["enemy_levels"]
        for e in enemies_data["roster"]:
            if e["band"] != band["band"]:
                continue
            # An enemy at the top of a band is met later in the area, when the
            # player is nearer the top of their expected range. Fighting every
            # species at the band median misrepresents both ends.
            t = 0.5 if ehi == elo else (e["level"] - elo) / (ehi - elo)
            level = round(plo + t * (phi - plo))
            out.append(
                {
                    "name": f"{e['name']} (band {band['band']})",
                    "kind": "regular_encounter",
                    "player_level": max(1, level),
                    "band": band["band"],
                    "enemy": {
                        **enemy_stats(e["level"], e["role"]),
                        "inaction_rate": e.get("inaction_rate", 0.0),
                    },
                    "heal_items": budget["regular_encounter"],
                    "homesick": e.get("inflicts") == "Homesick",
                }
            )

    for enc in bosses_data["encounters"]:
        b = blocks["bosses"][enc["name"]]
        base = enemy_stats(enc["internal_level"], b["role"])
        base["HP"] *= b["hp_multiplier"]
        base["ATK"] *= b["atk_multiplier"]
        kind = "mini_boss" if enc["kind"] == "mini" else "main_boss"
        out.append(
            {
                "name": enc["name"],
                "kind": kind,
                "player_level": enc["player_expected"][1],
                "enemy": base,
                "heal_items": budget[kind],
                "homesick": b.get("inflicts") == "Homesick",
                "boss": b,
            }
        )
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--trials", type=int, default=2000)
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    random.seed(args.seed)

    rows = run(build_matchups(), args.trials)
    targets = blocks["targets"]
    failures = []

    for r in rows:
        t = targets[r["kind"]]
        if r["median_turns"] is None:
            failures.append(f"{r['name']}: unwinnable at level {r['player_level']}")
            continue
        lo, hi = t["turns"]
        if not lo <= r["median_turns"] <= hi:
            failures.append(
                f"{r['name']}: {r['median_turns']:.0f} turns, target {lo}-{hi} "
                f"(player level {r['player_level']})"
            )
        wlo, whi = t["win_rate"]
        if not wlo <= r["win_rate"] <= whi:
            failures.append(
                f"{r['name']}: {r['win_rate']:.0%} win rate, target {wlo:.0%}-{whi:.0%}"
            )

    # Attrition is judged per band, not per species: a glass enemy that dies in
    # two turns and a wall that grinds on for six are both correct, and only the
    # band's median says whether the area as a whole costs the player anything.
    reg = targets["regular_encounter"]
    alo, ahi = reg["band_median_attrition"]
    by_band = {}
    for r in rows:
        if r["kind"] == "regular_encounter" and r["median_attrition"] is not None:
            by_band.setdefault(r["band"], []).append(r["median_attrition"])
    for band, values in sorted(by_band.items()):
        if band in reg["attrition_exempt_bands"]:
            continue
        med = statistics.median(values)
        if not alo <= med <= ahi:
            failures.append(
                f"band {band}: {med:.0%} median attrition, target {alo:.0%}-{ahi:.0%}"
            )

    if args.verbose:
        print(f"{'encounter':38} {'lvl':>4} {'turns':>6} {'attrit':>7} {'win':>6}")
        for r in rows:
            turns = f"{r['median_turns']:.0f}" if r["median_turns"] else "—"
            att = f"{r['median_attrition']:.0%}" if r["median_attrition"] is not None else "—"
            print(
                f"{r['name'][:38]:38} {r['player_level']:>4} {turns:>6} "
                f"{att:>7} {r['win_rate']:>6.0%}"
            )
        print()

    bosses = [r for r in rows if r["kind"] != "regular_encounter"]
    regular = [r for r in rows if r["kind"] == "regular_encounter"]
    print(
        f"{len(regular)} regular matchups: "
        f"median {statistics.median([r['median_turns'] for r in regular if r['median_turns']]):.1f} turns, "
        f"{statistics.median([r['median_attrition'] for r in regular if r['median_attrition'] is not None]):.0%} attrition"
    )
    for r in bosses:
        turns = f"{r['median_turns']:.0f}" if r["median_turns"] else "unwinnable"
        print(f"  {r['name']:30} lvl {r['player_level']:>2}  {turns:>10} turns  {r['win_rate']:>4.0%} win")

    if failures:
        print()
        for f in failures:
            print(f"OUT OF TARGET: {f}")
        print(f"\n{len(failures)} matchup(s) outside target, {len(rows) - len(failures)} inside")
        sys.exit(1)

    print(f"\nall {len(rows)} matchups inside target")


if __name__ == "__main__":
    main()
