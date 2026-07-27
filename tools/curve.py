#!/usr/bin/env python3
"""Levelling model for Overgrowth.

Every other tool assumes the player arrives at each boss inside its
`player_expected` range. Nothing checked that they get there. This walks a
playthrough — encounters plus boss EXP, act by act — and reports the level the
player actually reaches, for three play styles.

    python3 tools/curve.py             # per-act table for all three styles
    python3 tools/curve.py --verbose   # plus per-boss arrival levels

Exit code 0 means a normal player lands inside every boss's expected range, and
the minimal and thorough players stay within the tolerances in
data/statblocks.json.
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
bosses = load("bosses.json")
blocks = load("statblocks.json")
enemies = load("enemies.json")
progression = load("progression.json")

CAP = progression["level_cap"]
ECON = world["economy"]
TARGETS = blocks["progression_targets"]
ROLES = blocks["roles"]
ACTS = [1, 2, 3, 4, 5]


def exp_to_reach(level):
    return round(1.2 * level**3)


def level_from_exp(exp):
    level = 1
    while level < CAP and exp_to_reach(level + 1) <= exp:
        level += 1
    return level


def mean_role_hp(band):
    """Average HP multiplier for a band — the average enemy's payout there."""
    mults = [ROLES[e["role"]]["HP"] for e in enemies["roster"] if e["band"] == band]
    return sum(mults) / len(mults)


BAND_ROLE_AVG = {b["band"]: mean_role_hp(b["band"]) for b in enemies["bands"]}
CATCHUP = blocks["exp_reward"]["catchup"]


def encounter_exp(band, enemy_level, player_level):
    """EXP for one fight, scaled by role and by how far ahead the enemy is.

    The catch-up term means a player who flees a lot or explores little is paid
    more per fight, so avoiding combat never digs a hole that only grinding
    fills.
    """
    catchup = min(2.0, max(0.5, 1 + 0.12 * (enemy_level - player_level)))
    return round(0.20 * enemy_level**2.32 * BAND_ROLE_AVG[band] * catchup)


BANDS = sorted(enemies["bands"], key=lambda b: b["band"])
BOSS_AT = {}
for e in bosses["encounters"]:
    pos = e["encounter_position"]
    BOSS_AT.setdefault(pos["band"], []).append((pos["through_band"], e))
for v in BOSS_AT.values():
    v.sort()


def walk(completion):
    """Play through at a given share of the modelled encounters, band by band."""
    exp = 0
    arrivals = {}
    by_act = {}
    for band in BANDS:
        n = round(band["encounters"] * completion)
        mid_level = sum(band["enemy_levels"]) / 2
        done = 0
        for frac, boss in BOSS_AT.get(band["band"], []):
            upto = round(n * frac)
            for _ in range(upto - done):
                exp += encounter_exp(band["band"], mid_level, level_from_exp(exp))
            done = upto
            arrivals[boss["name"]] = level_from_exp(exp)
            exp += boss["exp"]
        for _ in range(n - done):
            exp += encounter_exp(band["band"], mid_level, level_from_exp(exp))
        by_act[band["act"]] = level_from_exp(exp)
    rows = [(a, by_act[a]) for a in ACTS]
    return rows, arrivals


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    failures, warnings = [], []
    styles = TARGETS["encounter_completion"]
    results = {name: walk(share) for name, share in styles.items()}

    print(f"{'act':>3} " + " ".join(f"{n:>10}" for n in styles) + "   target")
    for i, act in enumerate(ACTS):
        line = f"{act:>3} "
        for name in styles:
            rows, _ = results[name]
            line += f"{'lv ' + str(rows[i][1]):>10} "
        target = TARGETS["level_at_act_end"][str(act)]
        print(line + f"  lv {target}")

    # A normal player must land inside every boss's expected range.
    _, normal_arrivals = results["normal"]
    print()
    for enc in bosses["encounters"]:
        lo, hi = enc["player_expected"]
        got = normal_arrivals[enc["name"]]
        mark = "ok" if lo <= got <= hi else "OUT"
        if args.verbose or mark == "OUT":
            print(f"  {enc['name']:30} arrives lv {got:>2}  expected {lo}-{hi}  {mark}")
        if not lo <= got <= hi:
            failures.append(
                f"{enc['name']}: normal player arrives at level {got}, "
                f"expected {lo}-{hi} — every simulated fight assumes this range"
            )

    # The other two styles may diverge, but only so far.
    over = TARGETS["max_overshoot_levels"]
    under = TARGETS["max_undershoot_levels"]
    for i, act in enumerate(ACTS):
        target = TARGETS["level_at_act_end"][str(act)]
        lo_lvl = results["minimal"][0][i][1]
        hi_lvl = results["thorough"][0][i][1]
        if target - lo_lvl > under:
            failures.append(
                f"act {act}: a minimal player ends at level {lo_lvl}, "
                f"{target - lo_lvl} below the target of {target}"
            )
        if hi_lvl - target > over:
            failures.append(
                f"act {act}: a thorough player ends at level {hi_lvl}, "
                f"{hi_lvl - target} above the target of {target}"
            )

    # How much of the game is actually spent in battle. Overgrowth is a game
    # about walking through empty places; if this creeps toward a normal JRPG's
    # share, something has gone wrong with the encounter counts.
    pacing = TARGETS["time_budget"]
    regular_turns = sum(
        b["encounters"] * pacing["median_regular_turns"] for b in BANDS
    )
    boss_turns = pacing["measured_boss_turns"]
    combat_min = (
        regular_turns * pacing["seconds_per_turn"]
        + boss_turns * pacing["seconds_per_boss_turn"]
    ) / 60
    hours = world["pacing_hours"]
    main_path_min = sum(v[1] for k, v in hours.items() if k != "optional") * 60
    share = combat_min / main_path_min
    print(
        f"\ncombat is {combat_min:.0f} min of a {main_path_min / 60:.1f}h main path "
        f"({share:.0%})"
    )
    lo, hi = pacing["combat_share"]
    if not lo <= share <= hi:
        failures.append(
            f"combat is {share:.0%} of playtime, target {lo:.0%}-{hi:.0%} — "
            "this is a game about walking through empty places"
        )

    final_normal = results["normal"][0][-1][1]
    if final_normal >= CAP:
        warnings.append(
            f"a normal player hits the cap ({CAP}) by the end — nothing left to gain in Act 5"
        )
    if results["thorough"][0][2][1] >= CAP:
        failures.append("a thorough player caps out before Act 4, flattening the back half")

    for w in warnings:
        print(f"warn: {w}")
    if failures:
        print()
        for f in failures:
            print(f"FAIL: {f}")
        sys.exit(1)
    print("\nlevelling curve holds for all three play styles")


if __name__ == "__main__":
    main()
