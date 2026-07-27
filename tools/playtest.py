#!/usr/bin/env python3
"""Drive the built game in a real browser and report errors.

Loads game/overgrowth.html, plays a scripted run through the vertical slice,
and fails on any uncaught exception or console error. Screenshots land in
game/shots/ so the art can be looked at without launching anything.

    python3 tools/playtest.py            # scripted run
    python3 tools/playtest.py --shots    # also write screenshots
"""

import argparse
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = ROOT / "game" / "overgrowth.html"
SHOTS = ROOT / "game" / "shots"

# The published artifact is wrapped in a document skeleton; do the same locally.
WRAPPER = """<!doctype html><html><head><meta charset="utf-8">
<style>*{margin:0;padding:0;box-sizing:border-box}</style></head><body>
{body}
</body></html>"""


def press(page, key, times=1, delay=90):
    for _ in range(times):
        page.keyboard.press(key)
        page.wait_for_timeout(delay)


def hold(page, key, ms):
    page.keyboard.down(key)
    page.wait_for_timeout(ms)
    page.keyboard.up(key)
    page.wait_for_timeout(60)


def put(page, room, tx, ty, face="down"):
    page.evaluate("""([room, tx, ty, face]) => {
      if (World.id !== room) World.load(room);
      Player.x = tx*16+8; Player.y = ty*16+8; Player.face = face;
      World.centerCamera(); Game.mode = 'field';
    }""", [room, tx, ty, face])
    page.wait_for_timeout(120)
    until(page, "!Fade.busy", 3000, 60)


def until(page, expr, ms=4000, step=100):
    waited = 0
    while waited < ms:
        if page.evaluate(f"() => !!({expr})"):
            return True
        page.wait_for_timeout(step)
        waited += step
    return False


def advance(page, n=40):
    """Press through dialogue until it actually closes."""
    for _ in range(n):
        if not page.evaluate("() => Dialogue.active"):
            break
        page.keyboard.press("z")
        page.wait_for_timeout(90)
    page.wait_for_timeout(80)


def fight(page, max_presses=400):
    """Press through a battle until it ends. Battles use their own log, not Dialogue."""
    for _ in range(max_presses):
        if not page.evaluate("() => Battle.active"):
            return True
        page.keyboard.press("z")
        page.wait_for_timeout(70)
    return False


def idle(page, ms=6000):
    """Wait until the game is accepting field input again."""
    return until(page, "!Dialogue.active && !Fade.busy && Game.mode === 'field'", ms, 80)


def state(page):
    return page.evaluate("() => ({mode: Game.mode, room: World.id, lvl: Player.level, "
                         "hp: Player.hp, name: Player.name, money: Player.money})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shots", action="store_true")
    ap.add_argument("--headed", action="store_true")
    args = ap.parse_args()

    if not BUILD.exists():
        print("FAIL: no build. Run python3 tools/build_game.py first.")
        sys.exit(1)

    html = WRAPPER.replace("{body}", BUILD.read_text())
    tmp = ROOT / "game" / ".playtest.html"
    tmp.write_text(html)
    SHOTS.mkdir(exist_ok=True)

    errors, warnings = [], []
    steps = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
            headless=not args.headed, args=["--no-sandbox", "--mute-audio"],
        )
        page = browser.new_page(viewport={"width": 1024, "height": 640})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on("console", lambda m: (errors if m.type == "error" else warnings)
                .append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)

        page.goto(tmp.as_uri())
        page.wait_for_timeout(700)

        def shot(name):
            steps.append((name, state(page)))
            if args.shots:
                page.locator("#screen").screenshot(path=str(SHOTS / f"{name}.png"))

        # --- title and name entry
        shot("01-title")
        press(page, "Enter")           # NEW GAME
        page.wait_for_timeout(300)
        for ch in ["ArrowRight", "Enter"]:
            pass
        # spell a short name from the grid: cursor starts on A
        press(page, "Enter")           # A
        press(page, "ArrowRight", 13)  # -> N (row wraps)
        press(page, "Enter")
        shot("02-name")
        press(page, "c")               # confirm
        page.wait_for_timeout(600)

        st = state(page)
        if st["mode"] != "field" or st["room"] != "bedroom":
            errors.append(f"after name entry expected bedroom/field, got {st}")
        shot("03-bedroom")

        # --- Act 0: the door, three times, then the slam and the bed
        put(page, "bedroom", 6, 6, "down")
        for i in range(3):
            press(page, "z")
            advance(page)
            page.wait_for_timeout(200)
        if not until(page, "Player.flags.hallLight === false", 5000):
            errors.append("three door interactions did not trigger the slam")
        page.wait_for_timeout(900)
        shot("04-lights-out")

        put(page, "bedroom", 2, 2, "up")
        press(page, "z")
        advance(page)
        if not until(page, "World.id === 'void'", 9000):
            errors.append(f"sleeping did not reach the void (room={state(page)['room']})")
        shot("05-void")

        # --- the Gallery
        put(page, "gallery_ext", 6, 6, "up")
        shot("06-gallery-ext")
        hold(page, "ArrowUp", 500)
        if not until(page, "World.id === 'gallery_hall'", 5000):
            errors.append("the gallery door did not open")
        shot("07-gallery-hall")

        put(page, "gallery_hall", 7, 2, "up")
        hold(page, "ArrowUp", 500)
        if not until(page, "World.id === 'gallery_room'", 5000):
            errors.append("could not reach the gallery room")
        shot("08-gallery-room")

        # every painting must have a description
        for i, shape in enumerate(["obelisk", "sphere", "pyramid", "cube", "spire"]):
            col = [2, 5, 9, 13, 16][i]
            put(page, "gallery_room", col, 1, "up")
            idle(page)
            press(page, "z")
            page.wait_for_timeout(280)
            if not page.evaluate("() => Dialogue.active"):
                errors.append(f"the {shape} painting has no description")
            advance(page)
        shot("09-painting")

        # the corridor and the fall
        idle(page)
        put(page, "gallery_room", 2, 3, "left")
        hold(page, "ArrowLeft", 900)
        if not until(page, "World.id === 'gallery_corridor'", 5000):
            errors.append("the corridor is unreachable from the gallery")

        idle(page)
        put(page, "gallery_corridor", 36, 2, "right")
        hold(page, "ArrowRight", 900)
        if not until(page, "World.id === 'arrival'", 14000):
            errors.append("the fall did not land in Limpo")
        advance(page)
        shot("10-arrival")

        # --- Okobo
        put(page, "okobo", 5, 6)
        shot("11-okobo")

        # every NPC must say something
        for key, tx, ty, face in [("okobo_woman", 5, 9, "up"), ("okobo_man", 12, 6, "up"),
                                  ("okobo_child", 16, 11, "up"), ("okobo_elder", 20, 8, "up")]:
            put(page, "okobo", tx, ty, face)
            idle(page)
            press(page, "z")
            page.wait_for_timeout(280)
            if not page.evaluate("() => Dialogue.active"):
                errors.append(f"{key} said nothing")
            advance(page)
        shot("12-dialogue")

        # the well sidequest should now be live
        if not page.evaluate("() => !!Player.flags.wellQuest"):
            errors.append("talking to the villager did not open the well errand")
        put(page, "okobo", 8, 7, "up")
        press(page, "z")
        advance(page)
        if not page.evaluate("() => !!Player.flags.wellBucket"):
            errors.append("the well did not give up the bucket")
        put(page, "okobo", 5, 9, "up")
        press(page, "z")
        advance(page)
        if page.evaluate("() => Player.money") < 120:
            errors.append("the well errand paid nothing")

        # each building must be enterable
        for room, tx, ty in [("shop", 5, 5), ("inn", 16, 5), ("house", 17, 10)]:
            idle(page)
            put(page, "okobo", tx, ty, "up")
            hold(page, "ArrowUp", 700)
            if not until(page, f"World.id === '{room}'", 4000):
                errors.append(f"could not enter the {room}")
            put(page, "okobo", 5, 6)

        # the Custodian appears once the player has spoken to a few people
        idle(page)
        page.evaluate("() => { Player.flags.sawCustodian = false; Player.flags.talked = 5; World.load('okobo'); }")
        page.wait_for_timeout(600)
        if not page.evaluate("() => World.entities.some(e => e.kind === 'custodian')"):
            errors.append("the Custodian never appeared in Okobo")
        shot("12b-custodian")

        # --- a real battle
        page.evaluate("""() => {
          const e = Battle.makeEnemy('Yard Dog');
          Game.mode = 'battle';
          Battle.start(e, null, r => { window.__battleResult = r; Game.mode = 'field'; });
        }""")
        page.wait_for_timeout(1200)
        advance(page)
        shot("13-battle")
        press(page, "z")
        page.wait_for_timeout(300)
        shot("14-battle-menu")
        press(page, "z")
        page.wait_for_timeout(500)
        fight(page)
        res = page.evaluate("() => window.__battleResult")
        if res != "won":
            errors.append(f"a level 1 player could not beat a Yard Dog (result={res})")
        steps.append(("battle-result", {"result": res}))

        # --- the boss
        page.evaluate("() => { Player.level = 9; Player.exp = Player.expToReach(9); Player.restore(); Player.flags.beatBoss=false; }")
        idle(page)
        put(page, "clearing", 6, 4)
        page.wait_for_timeout(400)
        advance(page)
        if not until(page, "Battle.active && Battle.enemy.boss", 6000):
            errors.append("the clearing did not start the boss fight")
        else:
            shot("15-boss")
            if page.evaluate("() => Battle.canFlee()"):
                errors.append("the boss can be fled from - ?? must close RUN")
            # RUN must be closed, and must name ?? as the reason
            log = page.evaluate("() => { Battle.log = []; Battle.tryFlee(); return Battle.log[0] || ''; }")
            if "??" not in log:
                errors.append(f"RUN on a boss did not name ?? as the reason (said: {log!r})")
            if not fight(page):
                errors.append("the boss fight never ended")
        page.wait_for_timeout(600)
        advance(page)
        page.wait_for_timeout(300)
        shot("16-after-boss")
        if not page.evaluate("() => !!Player.flags.beatBoss"):
            errors.append("the boss was never beaten")

        # --- menus
        page.evaluate("() => { World.load('okobo'); Game.mode='field'; }")
        page.wait_for_timeout(300)
        press(page, "c")
        page.wait_for_timeout(300)
        shot("17-menu")
        press(page, "ArrowRight")
        page.wait_for_timeout(200)
        shot("18-menu-bag")
        press(page, "c")

        browser.close()

    tmp.unlink(missing_ok=True)

    print(f"{'step':18} state")
    for name, st in steps:
        print(f"{name:18} {st}")
    if warnings:
        print()
        for w in warnings[:10]:
            print("warn:", w)
    if errors:
        print()
        for e in errors:
            print("FAIL:", e)
        print(f"\n{len(errors)} problem(s)")
        sys.exit(1)
    print(f"\nplaytest clean" + (f", {len(SHOTS.glob('*.png') and list(SHOTS.glob('*.png')))} shots" if args.shots else ""))


if __name__ == "__main__":
    main()
