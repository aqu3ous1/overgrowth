#!/usr/bin/env python3
"""Play the build with nothing but taps, on an emulated phone.

The desktop playtest drives the keyboard, so it cannot see a control that has
been moved under a text box, a button that stopped responding, or a screen the
touch layout makes unreachable. This walks the same ground with a thumb.

    python3 tools/playtest_mobile.py            # scripted run
    python3 tools/playtest_mobile.py --shots    # also write screenshots
"""

import argparse
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playtest import WRAPPER, BUILD, SHOTS
from playwright.sync_api import sync_playwright

args = argparse.ArgumentParser()
args.add_argument("--shots", action="store_true")
args = args.parse_args()

OUT = SHOTS
tmp = pathlib.Path(__file__).resolve().parent.parent / "game" / "_mobile.tmp.html"
tmp.write_text(WRAPPER.replace("{body}", BUILD.read_text()))
bad = []

with sync_playwright() as pw:
    b = pw.chromium.launch(
        executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
        args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(viewport={"width": 390, "height": 844},
                        device_scale_factor=3, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: bad.append(f"pageerror {e}"))
    pg.goto(tmp.as_uri())
    pg.wait_for_timeout(800)

    # Canvas rect, so we can aim taps at game coordinates.
    box = pg.evaluate("() => { const r = document.getElementById('screen').getBoundingClientRect();"
                      " return {x: r.x, y: r.y, w: r.width, h: r.height}; }")

    def at(gx, gy):
        return (box["x"] + gx / 320 * box["w"], box["y"] + gy / 180 * box["h"])

    def tap(gx, gy, *, ms=90):
        x, y = at(gx, gy)
        pg.touchscreen.tap(x, y)
        pg.wait_for_timeout(ms)

    def hold_pad(gx, gy, ms):
        """Press and hold a point on the d-pad, via raw touch events."""
        x, y = at(gx, gy)
        pg.evaluate("""([x, y, cx, cy]) => {
          const cv = document.getElementById('screen');
          const mk = (type, cx_, cy_) => {
            const t = new Touch({identifier: 7, target: cv, clientX: cx_, clientY: cy_});
            cv.dispatchEvent(new TouchEvent(type, {touches: type === 'touchend' ? [] : [t],
              changedTouches: [t], bubbles: true, cancelable: true}));
          };
          window.__mk = mk; mk('touchstart', x, y);
        }""", [x, y, 0, 0])
        pg.wait_for_timeout(ms)
        pg.evaluate("([x, y]) => window.__mk('touchend', x, y)", [x, y])
        pg.wait_for_timeout(80)

    # Read the control layout from the game instead of hard-coding it, so
    # moving a button does not silently stop this test from pressing anything.
    lay = pg.evaluate("() => ({pad: [TouchPad.padX, TouchPad.padY, TouchPad.padR],"
                      " btn: Object.fromEntries(TouchPad.buttons.map(b => [b.k, [b.x, b.y]]))})")
    BTN = lay["btn"]
    PAD = lay["pad"]

    def tap_btn(k, ms=90):
        tap(*BTN[k], ms=ms)

    def shot(n):
        if args.shots:
            pg.locator("#screen").screenshot(path=str(OUT / f"{n}.png"))

    # The controls question comes first, and on a phone it has to be answerable
    # by touch alone - which is the whole reason it is there.
    if pg.evaluate("() => Game.mode") != "controls":
        bad.append("the phone does not get the controls question first")
    shot("m0-controls")
    card = pg.evaluate("() => { const b = ControlPick.boxes()[0];"
                       " return [b.x + b.w / 2, b.y + b.h / 2]; }")
    tap(card[0], card[1], ms=500)
    if pg.evaluate("() => Game.mode") != "title":
        bad.append("tapping ON-SCREEN did not get past the controls question")
    if not pg.evaluate("() => TouchPad.on"):
        bad.append("choosing ON-SCREEN did not turn the on-screen pad on")

    shot("m1-title")

    # Title: the whole screen advances nothing here, so use the Z button.
    tap_btn('ok'); pg.wait_for_timeout(400)
    if pg.evaluate("() => Game.mode") != "name":
        bad.append(f"tapping Z on the title did not start a new game "
                   f"(mode={pg.evaluate('() => Game.mode')})")

    # Name entry: pick a letter with Z, confirm with the menu button.
    tap_btn('ok'); pg.wait_for_timeout(200)
    shot("m2-name")
    tap_btn('menu'); pg.wait_for_timeout(700)
    if pg.evaluate("() => Game.mode") != "field":
        bad.append("tapping C did not confirm the name")

    shot("m3-bedroom")

    # The pad must move him.
    pg.evaluate("() => { Player.flags.canSleep = true; World.load('okobo');"
                " Game.mode = 'field'; }")
    pg.wait_for_timeout(400)
    x0 = pg.evaluate("() => Player.x")
    hold_pad(PAD[0] + PAD[2] - 5, PAD[1], 700)                       # right arm of the pad
    x1 = pg.evaluate("() => Player.x")
    if x1 - x0 < 8:
        bad.append(f"the d-pad did not move him right: {x0} -> {x1}")
    if pg.evaluate("() => held.right"):
        bad.append("the d-pad stayed held after the touch ended")
    shot("m4-field")

    # The menu button, and closing it again.
    tap_btn('menu'); pg.wait_for_timeout(300)
    if pg.evaluate("() => Game.mode") != "menu":
        bad.append("tapping C did not open the pause menu")
    shot("m5-menu")
    tap_btn('no'); pg.wait_for_timeout(300)
    if pg.evaluate("() => Game.mode") != "field":
        bad.append("tapping X did not close the pause menu")

    # A text box: tapping anywhere should advance it.
    pg.evaluate("() => Dialogue.say([{text:'One.',speaker:'system'},"
                "{text:'Two.',speaker:'system'}])")
    pg.wait_for_timeout(300)
    shot("m6-dialogue")
    for _ in range(8):
        if not pg.evaluate("() => Dialogue.active"):
            break
        tap(160, 70, ms=220)
    if pg.evaluate("() => Dialogue.active"):
        bad.append("tapping the screen does not advance a text box")

    # A fight, driven entirely by taps.
    pg.evaluate("""() => {
      const e = Battle.makeEnemy('Yard Dog', {level: 2});
      Game.mode = 'battle'; Battle.start(e, null, () => { Game.mode = 'field'; });
    }""")
    pg.wait_for_timeout(400)
    for _ in range(60):
        if not pg.evaluate("() => Battle.active"):
            break
        st = pg.evaluate("() => Battle.state")
        if st == "message":
            tap(160, 70, ms=130)
        else:
            tap_btn('ok', ms=160)
        if pg.evaluate("() => Battle.state === 'sub'"):
            shot("m7-battle")
    if pg.evaluate("() => Battle.active"):
        bad.append("a fight cannot be finished by tapping")

    ctx.close()
    b.close()

tmp.unlink(missing_ok=True)
for e in bad:
    print("FAIL:", e)
if bad:
    print(f"\n{len(bad)} problem(s)")
    sys.exit(1)
print("mobile playtest clean")
