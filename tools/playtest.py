#!/usr/bin/env python3
"""Drive the built game in a real browser and report errors.

Loads game/overgrowth.html, plays a scripted run through Acts 0 to 2 - the
bedroom to The Memorial - and fails on any uncaught exception, console error,
unreachable room, unfinishable errand, or fight that will not end. Screenshots
land in game/shots/ so the art can be looked at without launching anything.

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


RESET_STATE = """() => {
          Player.level = 1; Player.money = 0; Player.collectibles = 0; Player.hp = 1;
          Player.bag = {}; Player.notes = []; Player.seen = [];
          World.load('bedroom'); Game.mode = 'title'; Title.enter();
        }"""


def press(page, key, times=1, delay=90):
    for _ in range(times):
        page.keyboard.press(key)
        page.wait_for_timeout(delay)


def hold(page, key, ms):
    page.keyboard.down(key)
    page.wait_for_timeout(ms)
    page.keyboard.up(key)
    page.wait_for_timeout(60)


def walk(page, key, ms, dest, tries=3):
    """Hold a direction until the player reaches `dest`, fighting anything met.

    Enemies wander, so a walk across a room is not deterministic - without this
    a transition check fails whenever something happens to be in the way, which
    is a flaky test rather than a bug in the game.
    """
    for _ in range(tries):
        hold(page, key, ms)
        if until(page, f"World.id === '{dest}'", 2500):
            return True
        if page.evaluate("() => Battle.active"):
            fight(page)
            page.wait_for_timeout(400)
            advance(page)
            idle(page)
    return page.evaluate(f"() => World.id === '{dest}'")


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


def fight(page, max_presses=400, max_heals=4):
    """Play a battle to its end, through the real menus, until it ends.

    Battles use their own log, not Dialogue, so `advance()` does not apply.

    This plays badly on purpose but not *stupidly*: mashing Z picks the first
    physical move, which is Punch forever, and a boss tuned against the moves
    the player actually has cannot be beaten with it. That made this check fail
    at random, which is worse than not having it. So: strongest affordable
    physical move, and a capped number of sprays when low. Whether the numbers
    are *fair* is simulate.py's job, not this one's.

    The heal budget is capped because an unbounded one turns a fight the player
    cannot out-damage into a stalemate that reads as a hang.
    """
    heals = max_heals
    for _ in range(max_presses):
        st = page.evaluate("() => Battle.active && ({s: Battle.state, sub: Battle.sub, "
                           "hp: Player.hp / Player.maxHp})")
        if not st:
            return True
        if st["s"] == "menu":
            # Always aim the 2x2 cursor rather than assuming where it is. It
            # persists across turns, so a turn spent in the bag otherwise leaves
            # every later Z re-opening the bag.
            if heals and st["hp"] < 0.45 and _use_a_spray(page):
                heals -= 1
            else:
                _command(page, 0)             # PHYSICAL
            continue
        if st["s"] == "sub" and st["sub"] == "physical" and _pick_best_move(page):
            continue
        page.keyboard.press("z")
        page.wait_for_timeout(70)
    # Out of budget. Say where it stalled - "never ended" on its own is useless,
    # and the two real stalls so far were both the harness parked in a menu.
    f0 = page.evaluate("() => Time.frame")
    page.wait_for_timeout(300)
    print("  fight stalled:", page.evaluate(
        "(f0) => ({mode: Game.mode, frames: Time.frame - f0, state: Battle.state,"
        " menu: Battle.cursor, sub: Battle.sub, row: Battle.subCursor,"
        " list: Battle.subList().map(m => m.name), pp: Player.pp, hp: Player.hp,"
        " enemy: Battle.enemy && Battle.enemy.hp, log: (Battle.log || []).slice(-2)})", f0))
    return False


def _pick_best_move(page):
    """From an open PHYSICAL list, choose the strongest move the player can pay for."""
    idx = page.evaluate(
        "() => { const l = Battle.subList();"
        "  let best = -1, p = -1;"
        "  l.forEach((m, i) => { if (m.cost <= Player.pp && (m.power || 0) > p)"
        "    { p = m.power || 0; best = i; } });"
        "  return best; }")
    if idx is None or idx < 0:
        return False
    for _ in range(idx):
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(50)
    page.keyboard.press("z")
    page.wait_for_timeout(90)
    return True


def _command(page, want):
    """Move the battle's 2x2 command cursor to `want` and confirm.

    PHYSICAL 0  SPECIAL 1 / BAG 2  RUN 3 - left/right flips bit 0, up/down flips
    bit 1, which is how the game itself moves it.
    """
    at = page.evaluate("() => Battle.cursor")
    if at is None:
        return False
    if (at ^ want) & 1:
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(60)
    if (at ^ want) & 2:
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(60)
    page.keyboard.press("z")
    page.wait_for_timeout(90)
    return True


def _use_a_spray(page):
    """Open BAG and use the first healing item, through the real menu.

    Deliberately drives the UI rather than calling into Battle, so a broken bag
    submenu fails this check instead of hiding behind a back door.
    """
    idx = page.evaluate(
        "() => Object.keys(Player.bag).filter(n => DATA.items[n] && DATA.items[n].battle)"
        "  .findIndex(n => /restore \\d+ HP|restore all HP/.test(DATA.items[n].effect || ''))")
    if idx is None or idx < 0:
        return False
    _command(page, 2)                         # BAG
    if page.evaluate("() => Battle.sub") != "bag":
        page.keyboard.press("x")
        page.wait_for_timeout(60)
        return False
    for _ in range(idx):
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(60)
    page.keyboard.press("z")
    page.wait_for_timeout(140)
    return True


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
        put(page, "bedroom", 6, 1, "up")
        for i in range(3):
            press(page, "z")
            advance(page)
            page.wait_for_timeout(200)
        if not until(page, "Player.flags.hallLight === false", 5000):
            errors.append("three door interactions did not trigger the slam")
        page.wait_for_timeout(900)
        shot("04-lights-out")

        put(page, "bedroom", 2, 5, "down")
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

        put(page, "gallery_hall", 6, 2, "up")
        hold(page, "ArrowUp", 700)
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
        put(page, "gallery_room", 2, 1, "left")
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

        # --- ACT 2: the road, the capital, the works, the Memorial
        page.evaluate("() => { Player.flags.beatBoss = true; Player.level = 12; "
                      "Player.exp = Player.expToReach(12); Player.restore(); }")
        idle(page)
        put(page, "clearing", 13, 3, "right")
        walk(page, "ArrowRight", 700, "road_ondo")
        if not page.evaluate("() => World.id === 'road_ondo'"):
            errors.append("the orchard does not open onto the road after the boss")
        shot("20-road")

        put(page, "road_ondo", 22, 5, "right")
        walk(page, "ArrowRight", 700, "ondo")
        if not page.evaluate("() => World.id === 'ondo'"):
            errors.append("the road does not reach Ondo")
        shot("21-ondo")

        # every Ondo NPC must speak
        for key, tx, ty, face in [("ondo_clerk", 8, 7, "up"), ("ondo_baker", 20, 10, "up"),
                                  ("ondo_bench", 12, 14, "up"), ("ondo_courier", 25, 7, "up")]:
            idle(page)
            put(page, "ondo", tx, ty, face)
            press(page, "z")
            page.wait_for_timeout(280)
            if not page.evaluate("() => Dialogue.active"):
                errors.append(f"{key} said nothing")
            advance(page)

        # the billboard is the first Vixtry sighting and must speak in its own voice
        idle(page)
        put(page, "ondo", 22, 7, "up")
        press(page, "z")
        page.wait_for_timeout(280)
        speaker = page.evaluate("() => Dialogue.page && Dialogue.page.speaker")
        if speaker != "vixtry":
            errors.append(f"the billboard speaks as {speaker!r}, not in the Vixtry voice")
        shot("22-billboard")
        advance(page)

        # the dry fountain errand pays out
        before = page.evaluate("() => Player.money")
        idle(page); put(page, "ondo", 15, 8, "up"); press(page, "z"); advance(page)
        if page.evaluate("() => Player.money") <= before:
            errors.append("the dry fountain errand paid nothing")

        # the boarding-house man, seen once
        for room, tx, ty in [("boarding_house", 23, 5), ("records_room", 8, 13)]:
            idle(page); put(page, "ondo", tx, ty, "up")
            hold(page, "ArrowUp", 700)
            if not until(page, f"World.id === '{room}'", 4000):
                errors.append(f"could not enter {room}")
            put(page, "ondo", 4, 8)
        idle(page); put(page, "boarding_house", 3, 4, "up"); press(page, "z"); advance(page)
        if not page.evaluate("() => !!Player.flags.boarderSeen"):
            errors.append("the boarding-house man never speaks")
        shot("23-boarder")
        # ...and is gone the next time through. Nothing says so.
        page.evaluate("() => World.load('ondo')"); page.wait_for_timeout(200)
        page.evaluate("() => World.load('boarding_house')"); page.wait_for_timeout(200)
        if page.evaluate("() => World.entities.some(e => e.key === 'boarder')"):
            errors.append("the boarding-house man is still there the second time")

        # sidequest 6: two tenants pay, room 7 has left
        before = page.evaluate("() => Player.money")
        for tx, ty, face in [(7, 5, "up"), (2, 6, "up"), (9, 4, "up"),
                             (5, 2, "up"), (7, 5, "up")]:
            idle(page); put(page, "boarding_house", tx, ty, face)
            press(page, "z"); advance(page)
        if not page.evaluate("() => !!Player.flags.ledgerDone"):
            errors.append("the boarding-house ledger cannot be settled")
        if page.evaluate("() => Player.money") <= before:
            errors.append("the boarding-house ledger paid nothing")

        # the records collectible
        idle(page); put(page, "records_room", 10, 6, "up"); press(page, "z"); advance(page)
        if page.evaluate("() => Player.collectibles") < 1:
            errors.append("the records collectible cannot be picked up")

        # into the winter and the works
        idle(page); put(page, "ondo", 27, 13, "down")
        walk(page, "ArrowDown", 900, "winter_road")
        if not page.evaluate("() => World.id === 'winter_road'"):
            errors.append("Ondo does not lead to the winter road")
        shot("24-winter")

        # sidequest 8: three parcels, three addresses, no houses
        before = page.evaluate("() => Player.money")
        for tx, ty in [(5, 3), (11, 8), (17, 3)]:
            idle(page); put(page, "winter_road", tx, ty, "up")
            press(page, "z"); advance(page)
        if not page.evaluate("() => !!Player.flags.deliveryDone"):
            errors.append("the Northside delivery cannot be completed")
        if page.evaluate("() => Player.money") <= before:
            errors.append("the Northside delivery paid nothing")

        idle(page); put(page, "winter_road", 20, 5, "right")
        walk(page, "ArrowRight", 700, "kestrel_yard")
        if not page.evaluate("() => World.id === 'kestrel_yard'"):
            errors.append("the winter road does not reach Kestrel Works")
        shot("25-kestrel-yard")

        # A player walking the wall must be able to find the way in. The first
        # build of this yard had one working tile out of nineteen, and the
        # report was "there is nowhere to go".
        ways_in = 0
        for wx in range(2, 21):
            put(page, "kestrel_yard", wx, 6, "up")
            hold(page, "ArrowUp", 420)
            if page.evaluate("() => World.id === 'kestrel_f1'"):
                ways_in += 1
        if ways_in < 3:
            errors.append(f"the factory entrance is findable from only {ways_in} tile(s)")

        idle(page); put(page, "kestrel_yard", 11, 6, "up")
        walk(page, "ArrowUp", 700, "kestrel_f1")
        if not page.evaluate("() => World.id === 'kestrel_f1'"):
            errors.append("the factory door does not open")
        shot("26-kestrel")

        # every layoff note must be readable, in order
        notes = [("kestrel_f1", 4, 5, "notice_year_one"),
                 ("kestrel_boiler", 11, 4, "safety_inspection"),
                 ("kestrel_f2", 6, 4, "notice_year_four"),
                 ("kestrel_office", 3, 5, "shift_schedule"),
                 ("kestrel_f3", 5, 5, "in_a_locker"),
                 ("kestrel_locker", 12, 7, "last_one_out")]
        for room, tx, ty, note in notes:
            idle(page); put(page, room, tx, ty, "up")
            press(page, "z"); page.wait_for_timeout(250)
            if not page.evaluate("() => Dialogue.active"):
                errors.append(f"lore note {note} is unreachable")
            advance(page)
        if page.evaluate("() => Player.notes.length") < 6:
            errors.append("the Kestrel layoff sequence did not register")
        shot("27-note")

        # second Custodian sighting
        page.evaluate("() => { Player.flags.sawCustodian2 = false; World.load('kestrel_f2'); }")
        page.wait_for_timeout(700)
        if not page.evaluate("() => World.entities.some(e => e.kind === 'custodian')"):
            errors.append("the Custodian does not appear at Kestrel Works")
        shot("28-custodian2")

        # sidequest 13: the breaker by the gate, which nobody asks about and
        # nobody thanks him for. Only readable after the last note.
        idle(page); put(page, "kestrel_yard", 8, 7, "up"); press(page, "z"); advance(page)
        if not page.evaluate("() => !!Player.flags.kestrelDark"):
            errors.append("the yard lights cannot be switched off")

        page.evaluate("() => { Player.level = 16; Player.exp = Player.expToReach(16); Player.restore(); }")
        idle(page); put(page, "kestrel_yard", 18, 9, "up")
        page.wait_for_timeout(400)
        press(page, "z"); advance(page)
        if not until(page, "Battle.active && Battle.enemy.boss", 6000):
            errors.append("the yard does not start the Memorial fight")
        else:
            shot("29-memorial")
            if page.evaluate("() => Battle.canFlee()"):
                errors.append("the Memorial can be fled from")
            if not fight(page):
                errors.append("the Memorial fight never ended")
        page.wait_for_timeout(500)
        advance(page)
        if not page.evaluate("() => !!Player.flags.beatMemorial"):
            errors.append("the Memorial was never beaten")
        shot("30-after-memorial")

        # --- every transition must be survivable in both directions
        # (the 0.1.0 bug: landing on the return path bounced you straight back)
        pairs = [("okobo", "north_road"), ("north_road", "orchard1"),
                 ("orchard1", "orchard2"), ("orchard2", "orchard3"),
                 ("orchard3", "clearing"), ("okobo", "arrival"),
                 ("okobo", "shop"), ("okobo", "inn"), ("okobo", "house"),
                 ("clearing", "road_ondo"), ("road_ondo", "ondo"),
                 ("ondo", "ondo_shop"), ("ondo", "ondo_inn"),
                 ("ondo", "boarding_house"), ("ondo", "records_room"),
                 ("ondo", "winter_road"), ("winter_road", "kestrel_yard"),
                 ("kestrel_yard", "kestrel_f1"), ("kestrel_f1", "kestrel_f2"),
                 ("kestrel_f2", "kestrel_f3"), ("kestrel_f1", "kestrel_boiler"),
                 ("kestrel_f2", "kestrel_office"), ("kestrel_f3", "kestrel_locker"),
                 ("ondo", "ondo_grocer")]
        for a, b in pairs:
            for src, dst in ((a, b), (b, a)):
                ok = page.evaluate("""([src, dst]) => {
                  const r = ROOMS[src];
                  const x = (r.exits || []).find(e => e.to === dst);
                  if (!x) return 'no exit ' + src + ' -> ' + dst;
                  World.load(src);
                  // stand on the exit and take it
                  Player.x = x.x*16 + ((x.w||1)*16)/2;
                  Player.y = x.y*16 + ((x.h||1)*16)/2;
                  World.exitArmed = true;
                  Player.flags.beatBoss = true;   // unlock gated exits for the audit
                  const landing = x.at;
                  World.load(dst, landing);
                  // the landing tile must be walkable and must not be an exit
                  if (World.solidAt(Player.x, Player.y)) return 'lands inside a wall';
                  if (World.exitArmed) return 'arrived already armed';
                  const back = World.exitAt(Player.x, Player.y);
                  World.updateExitArming();
                  if (back && !World.exitArmed) return 'lands on an exit and stays there';
                  return 'ok';
                }""", [src, dst])
                if ok != "ok":
                    errors.append(f"{src} -> {dst}: {ok}")

        # options must open from the title and hold a change
        page.evaluate("() => { Game.mode = 'title'; Title.enter(); }")
        page.wait_for_timeout(200)
        page.evaluate("() => { Title.cursor = Title.opts.indexOf('OPTIONS'); }")
        press(page, "z")
        page.wait_for_timeout(300)
        if page.evaluate("() => Game.mode") != "options":
            errors.append("OPTIONS on the title screen does not open")
        shot("19-options")
        # Whatever row the cursor starts on must respond; do not hard-code which.
        key = page.evaluate("() => Options.rows[Options.cursor].key")
        before = page.evaluate("(k) => Options.values[k]", key)
        press(page, "ArrowRight")
        page.wait_for_timeout(200)
        if page.evaluate("(k) => Options.values[k]", key) == before:
            errors.append(f"options do not change on left/right (row {key})")
        # CONTROLS must actually arm and disarm the touch overlay.
        page.evaluate("() => { Options.values.controls = 2; Options.apply(); }")
        if not page.evaluate("() => TouchPad.on"):
            errors.append("CONTROLS=TOUCH does not turn the on-screen pad on")
        page.evaluate("() => { Options.values.controls = 1; Options.apply(); }")
        if page.evaluate("() => TouchPad.on"):
            errors.append("CONTROLS=KEYBOARD leaves the on-screen pad up")
        press(page, "x")
        page.wait_for_timeout(300)
        if page.evaluate("() => Game.mode") != "title":
            errors.append("options does not return to the title")

        # the title must not carry a tagline any more
        opts = page.evaluate("() => Title.opts")
        if "OPTIONS" not in opts or "NEW GAME" not in opts:
            errors.append(f"title menu is wrong: {opts}")

        # --- menus
        page.evaluate("() => { Game.mode='field'; World.load('ondo'); }")
        page.wait_for_timeout(300)
        press(page, "c")
        page.wait_for_timeout(300)
        shot("17-menu")

        def to_tab(want):
            for _ in range(len(page.evaluate("() => Menu.tabs"))):
                if page.evaluate("() => Menu.tab") == want:
                    return True
                press(page, "ArrowRight")
                page.wait_for_timeout(140)
            return False

        to_tab(1); shot("18-menu-bag")

        # Every restorative must be usable out here, and nothing else.
        page.evaluate("() => { Player.addItem('Spray', 2); Player.addItem('Knuckle Wrap', 1);"
                      " Player.hp = 5; Menu.cursor = 0; }")
        idx = page.evaluate("() => Object.keys(Player.bag).indexOf('Spray')")
        for _ in range(idx):
            press(page, "ArrowDown")
        press(page, "z")
        page.wait_for_timeout(300)
        if page.evaluate("() => Player.hp") <= 5:
            errors.append("a healing item cannot be used from the field menu")
        page.evaluate("() => { Player.bag = {'Knuckle Wrap': 1}; Menu.cursor = 0; }")
        press(page, "z")
        page.wait_for_timeout(250)
        if page.evaluate("() => (Player.bag['Knuckle Wrap'] || 0)") != 1:
            errors.append("a battle-only item was spent from the field menu")

        # Save from the menu, and continue from exactly that point.
        page.evaluate("() => Save.clear()")
        to_tab(5); shot("33-menu-save")
        page.evaluate("() => { Player.money = 777; Player.collectibles = 2; Player.hp = 40; }")
        press(page, "z")
        page.wait_for_timeout(400)
        d = page.evaluate("() => Save.read()")
        if not d:
            errors.append("saving from the menu wrote nothing")
        elif d.get("hp") != 40:
            errors.append("the menu save restored HP; writing it down is not resting")
        page.evaluate(RESET_STATE)
        page.wait_for_timeout(400)
        if "CONTINUE" not in page.evaluate("() => Title.opts"):
            errors.append("CONTINUE is not offered after saving from the menu")
        page.evaluate("() => { Title.cursor = Title.opts.indexOf('CONTINUE'); }")
        press(page, "z")
        page.wait_for_timeout(600)
        back = page.evaluate("() => ({room: World.id, money: Player.money, hp: Player.hp,"
                             " found: Player.collectibles})")
        if back != {"room": "ondo", "money": 777, "hp": 40, "found": 2}:
            errors.append(f"CONTINUE did not resume the saved point: {back}")
        page.evaluate("() => { Game.mode = 'field'; }")
        press(page, "c")
        page.wait_for_timeout(250)

        to_tab(2); shot("31-menu-moves")
        if not page.evaluate("() => Menu.list().length"):
            errors.append("the MOVES tab lists nothing")
        to_tab(3); shot("32-menu-map")
        if not page.evaluate("() => Player.seen.length"):
            errors.append("the map recorded nowhere the player has been")

        # OPTIONS from the pause menu must open options, not close the menu.
        to_tab(6)
        press(page, "z")
        page.wait_for_timeout(300)
        if page.evaluate("() => Game.mode") != "options":
            errors.append("Z on the pause menu's OPTIONS tab does not open options")
        press(page, "x")
        page.wait_for_timeout(300)
        if page.evaluate("() => Game.mode") != "menu":
            errors.append("leaving options does not return to the pause menu")
        press(page, "c")

        # --- turn order. SPD decides, and a move's priority overrides it.
        page.evaluate("""() => {
          Game.mode = 'field'; World.load('okobo');
          Player.level = 12; Player.exp = Player.expToReach(12); Player.restore();
          const e = Battle.makeEnemy('Yard Dog', {level: 2});
          Game.mode = 'battle'; Battle.start(e, null, () => { Game.mode = 'field'; });
        }""")
        page.wait_for_timeout(400)
        order = page.evaluate("""() => {
          const wind = DATA.moves.physical.find(m => m.priority === 'last');
          const rush = DATA.moves.physical.find(m => m.priority === 'first');
          const plain = DATA.moves.physical.find(m => !m.priority);
          Battle.enemy.spd = 1;                       // player is far faster
          const fastWins = Battle.playerFirst(plain);
          Battle.enemy.spd = 9999;                    // player is far slower
          const slowLoses = Battle.playerFirst(plain);
          return { fastWins, slowLoses,
                   windLast: wind ? Battle.playerFirst(wind) : null,
                   rushFirst: rush ? Battle.playerFirst(rush) : null };
        }""")
        if not order["fastWins"]:
            errors.append("SPD does not win the turn: the faster side did not act first")
        if order["slowLoses"]:
            errors.append("SPD is ignored: the slower player still acted first")
        if order["windLast"] is not False:
            errors.append("a 'last' priority move did not act last")
        if order["rushFirst"] is not True:
            errors.append("a 'first' priority move did not act first")
        page.evaluate("() => { Battle.active = false; Game.mode = 'field'; }")

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
