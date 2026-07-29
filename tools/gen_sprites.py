#!/usr/bin/env python3
"""Generate game/src/15_sprites.js — the pixel art, built from shape primitives.

Sprites are composed rather than typed out: a filled shape, a highlight pass
clipped to it, then an automatic dark outline. That gives every sprite the same
three-tone read, guarantees the rows stay rectangular, and makes a silhouette
tunable by changing a radius instead of retyping forty strings.

    python3 tools/gen_sprites.py
"""

import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "game" / "src" / "15_sprites.js"

EMPTY = "."


class Spr:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.g = [[EMPTY] * w for _ in range(h)]

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.g[y][x]
        return EMPTY

    def rect(self, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.set(xx, yy, c)

    def ellipse(self, cx, cy, rx, ry, c, only=None):
        for yy in range(self.h):
            for xx in range(self.w):
                dx, dy = (xx - cx) / max(0.5, rx), (yy - cy) / max(0.5, ry)
                if dx * dx + dy * dy <= 1.0:
                    if only is None or self.get(xx, yy) in only:
                        self.set(xx, yy, c)

    def tri(self, x0, y0, x1, y1, x2, y2, c):
        def sign(ax, ay, bx, by, cx_, cy_):
            return (ax - cx_) * (by - cy_) - (bx - cx_) * (ay - cy_)
        for yy in range(self.h):
            for xx in range(self.w):
                d1 = sign(xx, yy, x0, y0, x1, y1)
                d2 = sign(xx, yy, x1, y1, x2, y2)
                d3 = sign(xx, yy, x2, y2, x0, y0)
                neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
                pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
                if not (neg and pos):
                    self.set(xx, yy, c)

    def outline(self, c, targets=None):
        """Wrap filled pixels in a dark edge — the thing that makes it read."""
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.get(x, y) != EMPTY:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    n = self.get(x + dx, y + dy)
                    if n != EMPTY and n != c and (targets is None or n in targets):
                        add.append((x, y))
                        break
        for x, y in add:
            self.set(x, y, c)

    def rows(self):
        return ["".join(r) for r in self.g]


def body(s, top, w_top, w_bot, height, mid, light, dark, hands=None, legs=None):
    """A small blocky torso with sleeves, a highlight and feet."""
    cx = s.w // 2
    for i in range(height):
        t = i / max(1, height - 1)
        w = round(w_top + (w_bot - w_top) * t)
        s.rect(cx - w // 2, top + i, w, 1, mid)
    # highlight down the left third
    for i in range(height):
        t = i / max(1, height - 1)
        w = round(w_top + (w_bot - w_top) * t)
        s.rect(cx - w // 2, top + i, max(1, w // 3), 1, light)
    if hands:
        s.rect(cx - w_bot // 2 - 1, top + height - 3, 2, 2, hands)
        s.rect(cx + w_bot // 2 - 1, top + height - 3, 2, 2, hands)
    if legs:
        lc, sc = legs
        s.rect(cx - 3, top + height, 2, 2, lc)
        s.rect(cx + 1, top + height, 2, 2, lc)
        s.rect(cx - 3, top + height + 2, 2, 1, sc)
        s.rect(cx + 1, top + height + 2, 2, 1, sc)
    return s


def head(s, cx, cy, rx, ry, mid, light, dark):
    """A shaded ball: mid fill, highlight up-left, occlusion under the chin.

    The dark tone is its own palette entry, not the outline — using the outline
    colour here reads as a hole in the face.
    """
    s.ellipse(cx, cy, rx, ry, mid)
    s.ellipse(cx - rx * 0.32, cy - ry * 0.34, rx * 0.60, ry * 0.56, light, only={mid})
    s.ellipse(cx, cy + ry * 0.82, rx * 0.74, ry * 0.30, dark, only={mid})
    return s


SPRITES = {}


def make_player(face, step=0):
    """The head is kept clear of the canvas edge so the outline pass has room.

    `step` is the walk frame: 0 is the contact pose used standing still, 1 and 2
    are the two strides. The whole upper body lifts a pixel on the strides, which
    is what sells the walk far more than the legs do — without it the sprite
    reads as a torso sliding along with its feet scissoring underneath.
    """
    s = Spr(14, 18)
    lift = 1 if step else 0                   # body rises on the passing pose
    head(s, 6.5, 5.4 - lift, 5.2, 4.9, "1", "2", "3")
    if face == "down":
        for ex in (3, 8):
            s.rect(ex, 4 - lift, 3, 3, "5")   # sclera
            s.rect(ex + 1, 5 - lift, 1, 1, "6")   # pupil
        s.rect(5, 9 - lift, 4, 1, "3")        # one expression, forever
    elif face == "side":
        # The base sprite faces RIGHT; the renderer mirrors it for left.
        for ex in (5, 9):
            s.rect(ex, 4 - lift, 3, 3, "5")
            s.rect(ex + 2, 5 - lift, 1, 1, "6")
        s.rect(9, 9 - lift, 3, 1, "3")

    top = 11 - lift
    s.rect(3, top, 8, 5, "7")                 # torso
    s.rect(3, top, 3, 5, "8")                 # lit left third

    # The print on his shirt. Small, off-centre-proof, and never explained.
    s.rect(6, top + 1, 2, 1, "c")
    s.rect(5, top + 2, 1, 1, "c")
    s.rect(8, top + 2, 1, 1, "c")
    s.rect(6, top + 2, 2, 1, "d")
    s.rect(6, top + 3, 2, 1, "c")

    # Arms swing opposite the legs; facing sideways they swing fore and aft
    # instead of hanging, or the walk looks like a shuffle.
    if face == "side":
        fwd, back = (0, 0) if step == 0 else ((1, -1) if step == 1 else (-1, 1))
        s.rect(2, top + 1 + back, 1, 3, "7")
        s.rect(11, top + 1 + fwd, 1, 3, "7")
        s.rect(2, top + 3 + back, 2, 2, "1")
        s.rect(10, top + 3 + fwd, 2, 2, "1")
    else:
        swing = 0 if step == 0 else (1 if step == 1 else -1)
        s.rect(2, top + 1, 1, 3, "7")
        s.rect(11, top + 1, 1, 3, "7")
        s.rect(2, top + 3 + swing, 2, 2, "1")
        s.rect(10, top + 3 - swing, 2, 2, "1")

    # Legs. Frame 0 stands square; 1 and 2 are mirror strides with one leg
    # planted on the ground row and the other lifted a pixel clear of it.
    # (x, top, bottom) - the shoe is always the leg's own last row.
    if step == 0:
        legs = [(4, 16, 17), (8, 16, 17)]
    elif step == 1:
        legs = [(3, 16, 17), (9, 15, 16)]
    else:
        legs = [(9, 16, 17), (3, 15, 16)]
    for lx, ly, lb in legs:
        s.rect(lx, ly, 2, lb - ly + 1, "a")
        s.rect(lx, lb, 2, 1, "b")

    s.outline("9", targets={"7", "8"})
    s.outline("4", targets={"1", "2", "3"})
    s.outline("b", targets={"a"})
    # The outline pass closes the gap between the legs from both sides and welds
    # them into one block, which kills the whole stride. Re-open it.
    left, right = min(l[0] for l in legs), max(l[0] for l in legs)
    for gy in range(min(l[1] for l in legs), 18):
        for gx in range(left + 2, right):
            s.set(gx, gy, EMPTY)
    return s.rows()


def make_person(hair=None, hat=None, glasses=False, beard=False, child=False,
                stout=False, apron=False, coat=False, satchel=False, stoop=False):
    """One villager body, dressed. Every NPC in the game is a call to this.

    Twelve by sixteen leaves about five usable pixels of face and four of torso,
    so distinctness has to come from silhouette first — hat brim, hair falling
    past the jaw, a stoop, a wider build — and only then from colour. Two people
    who differ only in shirt hue read as the same person twice.

    Palette: 1/2/3 skin, 4 sclera, 5 pupil, 6/7/8 shirt mid/light/dark,
    9 hair, a hat, b accent (apron, strap, buttons), c trousers, d shoes.
    """
    h = 15 if child else 17
    s = Spr(12, h)
    hy = 4.2 if child else 4.4
    hrx, hry = (3.9, 3.7) if child else (4.3, 4.0)
    drop = 1 if stoop else 0                  # shoulders and head sit lower
    hy += drop

    head(s, 5.5, hy, hrx, hry, "1", "2", "3")
    eye_y = int(hy - 1)
    for ex in (3, 6):
        s.rect(ex, eye_y, 2, 2, "4")
        s.rect(ex, eye_y + 1, 1, 1, "5")
    if glasses:
        # Rims around the eyes, not across them. A solid bar at this size reads
        # as a blindfold — the lenses have to keep showing sclera.
        s.rect(2, eye_y - 1, 8, 1, "5")       # brow bar
        s.rect(2, eye_y + 2, 3, 1, "5")       # under each lens
        s.rect(6, eye_y + 2, 3, 1, "5")
        for fx in (2, 5, 9):                  # outer posts and the bridge
            s.rect(fx, eye_y, 1, 2, "5")
    s.rect(4, int(hy + 2.6), 3, 1, "3")       # mouth
    if beard:
        s.rect(3, int(hy + 2), 6, 2, "9")
        s.rect(4, int(hy + 4), 4, 1, "9")

    if hair == "short":
        s.rect(2, int(hy - 3), 8, 2, "9")
        s.rect(1, int(hy - 2), 1, 2, "9")
        s.rect(10, int(hy - 2), 1, 2, "9")
    elif hair == "long":
        s.rect(2, int(hy - 3), 8, 2, "9")
        s.rect(1, int(hy - 2), 1, 6, "9")     # falls past the jaw on both sides
        s.rect(10, int(hy - 2), 1, 6, "9")
    elif hair == "bun":
        s.rect(2, int(hy - 3), 8, 2, "9")
        s.rect(4, int(hy - 5), 4, 2, "9")     # knot above the crown
    elif hair == "wild":
        s.rect(2, int(hy - 3), 8, 2, "9")
        for tx in (1, 4, 7, 10):              # tufts, deliberately uneven
            s.rect(tx, int(hy - 5), 1, 2, "9")
    elif hair == "thin":                      # a fringe of it, and scalp
        s.rect(1, int(hy - 1), 1, 3, "9")
        s.rect(10, int(hy - 1), 1, 3, "9")

    if hat == "cap":                          # peaked, and the peak faces us
        s.rect(2, int(hy - 4), 8, 3, "a")
        s.rect(2, int(hy - 1), 8, 1, "a")
    elif hat == "brim":                       # wide, flat, farmer's
        s.rect(0, int(hy - 2), 12, 1, "a")
        s.rect(3, int(hy - 5), 6, 3, "a")
    elif hat == "wool":                       # pulled down over the ears
        s.rect(2, int(hy - 4), 8, 4, "a")
        s.rect(1, int(hy - 1), 10, 1, "b")
    elif hat == "baker":                      # tall and soft
        s.rect(3, int(hy - 6), 6, 4, "a")
        s.rect(2, int(hy - 2), 8, 1, "a")

    # Legs are pinned to the bottom rows and the torso fills what is left, so a
    # coat lengthens the coat rather than eating the legs.
    top = (9 if child else 10) + drop
    leg_y = h - (2 if child else 3) + (1 if coat else 0)
    tw = 8 if stout else 6
    tx = (12 - tw) // 2
    th = leg_y - top
    s.rect(tx, top, tw, th, "6")
    s.rect(tx, top, max(2, tw // 3), th, "7")
    if coat:                                  # lapels down the front
        s.rect(tx + 1, top, 1, th - 1, "8")
        s.rect(tx + tw - 2, top, 1, th - 1, "8")
    if apron:                                 # a pale panel from chest to hem
        s.rect(tx + 1, top + 1, tw - 2, th - 1, "b")
    if satchel:                               # strap one way, bag on the hip
        for i in range(th - 1):
            s.set(tx + 1 + i, top + i, "b")
        s.rect(tx + tw - 2, top + th - 2, 3, 2, "b")

    arm_y = top + 1
    s.rect(tx - 1, arm_y, 1, 2, "6")
    s.rect(tx + tw, arm_y, 1, 2, "6")
    s.rect(tx - 1, arm_y + 2, 1, 2, "1")      # hands
    s.rect(tx + tw, arm_y + 2, 1, 2, "1")

    # Trousers and shoes get their own tones. Drawn in the shirt's dark they
    # vanished into the torso's own outline, which read as a legless block.
    for lx in (3, 7):
        s.rect(lx, leg_y, 2, h - leg_y - 1, "c")
        s.rect(lx, h - 1, 2, 1, "d")

    s.outline("8", targets={"6", "7"})
    s.outline("d", targets={"c"})
    s.outline("3", targets={"1", "2"})
    # The outline pass fills the gap between the legs from both sides, which
    # welds them back into one block. Re-open it.
    for gy in range(leg_y, h):
        for gx in (5, 6):
            s.set(gx, gy, EMPTY)
    return s.rows()


# Every speaking NPC, by silhouette first. The comment on each is the read the
# player should get in the half-second before the text box opens.
PEOPLE = {
    "vlg_woman":    dict(hair="long"),                          # unremarkable, kind
    "vlg_man":      dict(hat="brim", hair="short"),             # out in the sun all day
    "vlg_child":    dict(child=True, hair="wild"),              # small, scruffy
    "vlg_elder":    dict(hat="brim", hair="thin", beard=True, stoop=True),
    "vlg_shop":     dict(hair="bun", apron=True, stout=True),   # behind a counter
    "vlg_inn":      dict(hair="short", apron=True),
    "vlg_hess":     dict(hair="long", coat=True),               # dressed to travel
    "ond_clerk":    dict(hair="short", glasses=True, coat=True),  # municipal
    "ond_baker":    dict(hat="baker", apron=True, stout=True),
    "ond_bench":    dict(hair="thin", beard=True, stoop=True, coat=True),
    "ond_courier":  dict(hat="cap", satchel=True),
    "ond_shop":     dict(hair="bun", apron=True),
    "ond_inn":      dict(hair="short", stout=True),
    "boarder":      dict(hair="wild", coat=True),               # not quite kept
    "landlady":     dict(hair="bun", stout=True, glasses=True),
    "tenant_three": dict(hair="short", stoop=True),             # braced for an argument
    "tenant_five":  dict(hat="wool", hair="thin"),              # dressed for indoors
    "records":      dict(hair="long", glasses=True, apron=True),
    "ond_grocer":   dict(hair="thin", stout=True, apron=True, beard=True),
    # Act 3. Yettallia dresses better and looks more tired.
    "sab_local":    dict(hair="short", coat=True, satchel=True),
    "sab_kid":      dict(child=True, hair="bun"),
    "sab_rail":     dict(hat="cap", coat=True),
    "sab_shop":     dict(hair="bun", apron=True, glasses=True),
    "sab_inn":      dict(hair="long", stout=True),
    "sab_wait":     dict(hair="thin", stoop=True, coat=True),
    "sab_flat":     dict(hair="wild", glasses=True),
    "vix_rep":      dict(hair="short", coat=True),          # the clean one
    "bell_super":   dict(hair="thin", beard=True, stout=True, apron=True),
    "bell_7b":      dict(hair="long", stoop=True),
}


def make_custodian():
    s = Spr(14, 18)
    # No shading: he is flat white, which is why he never looks lit by the room.
    s.ellipse(6.5, 5.4, 5.2, 4.9, "1")
    for ex in (3, 9):                         # two black pits
        s.rect(ex, 3, 2, 4, "2")
    s.rect(4, 8, 6, 1, "2")                   # the grin, wide and fixed
    s.rect(3, 7, 1, 1, "2")
    s.rect(10, 7, 1, 1, "2")
    s.rect(3, 11, 8, 5, "1")                  # torso
    s.rect(2, 12, 1, 3, "1")
    s.rect(11, 12, 1, 3, "1")
    s.rect(4, 16, 2, 2, "1")
    s.rect(8, 16, 2, 2, "1")
    s.outline("2")
    return s.rows()


def make_dog():
    s = Spr(14, 11)
    s.rect(2, 4, 10, 4, "1")            # body
    s.rect(2, 4, 10, 1, "2")            # back highlight
    s.ellipse(11, 4, 3.0, 2.8, "1")     # head
    s.ellipse(10, 3, 1.8, 1.6, "2")
    s.rect(9, 1, 2, 3, "1")             # ears
    s.rect(12, 1, 2, 3, "1")
    s.rect(12, 3, 1, 1, "4")            # eye
    s.rect(0, 2, 3, 2, "1")             # tail
    for lx in (3, 6, 9):
        s.rect(lx, 8, 2, 3, "1")
        s.rect(lx, 10, 2, 1, "3")
    s.outline("3")
    return s.rows()


def make_postbox():
    s = Spr(12, 15)
    s.rect(2, 1, 8, 9, "1")
    s.ellipse(6, 2, 4.0, 2.2, "1")
    s.rect(2, 1, 3, 9, "2")             # lit face
    s.rect(3, 4, 6, 2, "3")             # slot
    s.rect(4, 10, 4, 4, "4")            # post
    s.rect(3, 14, 6, 1, "4")
    s.outline("5")
    return s.rows()


def make_melon():
    s = Spr(13, 12)
    s.ellipse(6, 6, 6.0, 5.4, "1")
    s.ellipse(4, 4, 3.4, 3.0, "2", only={"1"})
    for sx in (3, 6, 9):                # stripes
        s.rect(sx, 1, 1, 10, "3")
    s.rect(5, 0, 2, 2, "4")             # stem
    s.outline("5")
    return s.rows()


def make_post():
    s = Spr(10, 14)
    s.rect(3, 1, 4, 13, "1")
    s.rect(3, 1, 1, 13, "2")
    s.rect(1, 4, 8, 2, "1")             # cross-piece
    s.rect(1, 4, 8, 1, "2")
    s.rect(4, 3, 2, 1, "3")             # a nail
    s.outline("4")
    return s.rows()


def make_ladder():
    s = Spr(10, 14)
    s.rect(1, 0, 2, 14, "1")
    s.rect(7, 0, 2, 14, "1")
    s.rect(1, 0, 1, 14, "2")
    s.rect(7, 0, 1, 14, "2")
    for ry in (2, 6, 10):
        s.rect(3, ry, 4, 2, "1")
        s.rect(3, ry, 4, 1, "2")
    s.outline("3")
    return s.rows()


def make_wader():
    s = Spr(12, 15)
    head(s, 5, 4, 4.2, 4.0, "1", "2", "3")
    for ex in (3, 6):
        s.rect(ex, 3, 2, 2, "4")
    body(s, 8, 7, 8, 4, "1", "2", "3")
    s.rect(2, 12, 2, 3, "3")            # legs, in the water
    s.rect(7, 12, 2, 3, "3")
    s.outline("3")
    return s.rows()


def make_tree(w, h, canopy_r, trunk_w):
    s = Spr(w, h)
    cx = w // 2
    ch = int(h * 0.62)
    s.ellipse(cx, ch // 2 + 1, canopy_r, canopy_r * 0.86, "1")
    s.ellipse(cx - canopy_r * 0.36, ch // 2 - canopy_r * 0.3, canopy_r * 0.6,
              canopy_r * 0.5, "2", only={"1"})
    # a couple of fruit
    s.rect(cx - 2, ch // 2, 2, 2, "4")
    s.rect(cx + 2, ch // 2 + 2, 2, 2, "4")
    s.rect(cx - trunk_w // 2, ch, trunk_w, h - ch, "3")
    s.rect(cx - trunk_w // 2, ch, 1, h - ch, "5")
    s.rect(cx - trunk_w // 2 - 1, h - 2, trunk_w + 2, 2, "3")
    s.outline("6")
    return s.rows()


# --- band 3: the road to Ondo -------------------------------------------
def make_milepost():
    s = Spr(10, 16)
    s.rect(3, 3, 4, 13, "1")
    s.rect(3, 3, 1, 13, "2")
    s.ellipse(5, 3, 3.0, 2.6, "1")
    s.ellipse(4, 2, 1.8, 1.4, "2", only={"1"})
    s.rect(4, 2, 3, 1, "3")             # a number nobody reads any more
    s.rect(4, 4, 3, 1, "3")
    s.outline("4")
    return s.rows()


def make_ration_tin():
    s = Spr(12, 13)
    s.rect(2, 3, 8, 9, "1")
    s.ellipse(6, 3, 4.0, 1.8, "1")
    s.rect(2, 3, 2, 9, "2")             # lit side
    s.rect(3, 6, 6, 3, "3")             # label
    s.rect(4, 7, 4, 1, "4")
    s.ellipse(6, 12, 4.0, 1.4, "5")
    s.outline("5")
    return s.rows()


def make_bicycle():
    s = Spr(18, 13)
    for wx in (4, 13):
        s.ellipse(wx, 8, 4.0, 4.0, "1")
        s.ellipse(wx, 8, 2.6, 2.6, ".")   # hollow rims
    s.rect(4, 4, 10, 1, "2")            # frame
    s.rect(8, 4, 1, 5, "2")
    s.rect(12, 2, 1, 3, "2")
    s.rect(11, 2, 4, 1, "3")            # handlebars
    s.rect(3, 3, 3, 1, "3")             # saddle
    s.outline("4")
    return s.rows()


def make_weather():
    s = Spr(18, 14)
    s.ellipse(6, 5, 5.0, 3.4, "1")
    s.ellipse(12, 5, 4.4, 3.0, "1")
    s.ellipse(9, 4, 5.2, 3.2, "1")
    s.ellipse(6, 4, 3.4, 2.2, "2", only={"1"})
    for rx, ry in ((3, 9), (7, 10), (11, 9), (15, 10), (5, 12), (13, 12)):
        s.rect(rx, ry, 1, 3, "3")       # rain, always the same rain
    s.outline("4", targets={"1", "2"})
    return s.rows()


def make_shrine():
    s = Spr(14, 16)
    s.rect(3, 5, 8, 9, "1")
    s.rect(3, 5, 2, 9, "2")
    s.tri(7, 0, 12, 5, 2, 5, "1")       # little roof
    s.rect(5, 8, 4, 5, "3")             # the alcove, empty
    s.rect(6, 10, 2, 2, "4")            # something left in it
    s.rect(2, 14, 10, 2, "1")
    s.outline("5")
    return s.rows()


# --- band 4: Kestrel Works ----------------------------------------------
def make_glove():
    s = Spr(12, 14)
    s.rect(3, 5, 6, 8, "1")             # palm
    s.rect(3, 5, 2, 8, "2")
    for fx in (3, 5, 7):                # fingers
        s.rect(fx, 1, 2, 5, "1")
    s.rect(9, 6, 2, 4, "1")             # thumb
    for i in range(9):                  # frost
        s.rect(3 + (i * 5) % 6, 6 + (i * 3) % 7, 1, 1, "3")
    s.outline("4")
    return s.rows()


def make_coil():
    s = Spr(14, 14)
    for i, ry in enumerate(range(1, 13, 3)):
        s.ellipse(7, ry + 1, 5.4, 1.7, "1")
        s.ellipse(6, ry + 1, 3.0, 1.0, "2", only={"1"})
    s.rect(11, 0, 2, 4, "3")            # loose end, sparking
    s.outline("4")
    return s.rows()


def make_conveyor():
    s = Spr(20, 12)
    s.rect(1, 4, 18, 5, "1")
    s.rect(1, 4, 18, 1, "2")
    for rx in range(2, 19, 4):          # rollers, still turning
        s.ellipse(rx, 6, 1.6, 1.6, "3")
    s.rect(0, 9, 20, 2, "4")
    s.outline("5")
    return s.rows()


def make_yard_light():
    s = Spr(12, 18)
    s.rect(5, 6, 2, 12, "1")            # pole
    s.rect(3, 17, 6, 1, "1")
    s.tri(6, 1, 11, 6, 1, 6, "2")       # shade
    s.rect(4, 5, 5, 2, "3")             # the bulb, still on
    s.rect(5, 4, 3, 1, "3")
    s.outline("4")
    return s.rows()


def make_worker():
    """Second Shift. A person, clocking in, in a factory that closed."""
    s = Spr(12, 17)
    head(s, 5.5, 5.4, 4.0, 3.8, "1", "2", "3")
    for ex in (3, 6):
        s.rect(ex, 4, 2, 2, "4")
        s.rect(ex, 5, 1, 1, "5")
    s.rect(1, 2, 10, 2, "6")            # hard hat
    s.rect(3, 1, 6, 2, "6")
    s.rect(3, 10, 6, 5, "7")            # overalls
    s.rect(3, 10, 2, 5, "8")
    s.rect(2, 11, 1, 3, "7")
    s.rect(9, 11, 1, 3, "7")
    s.rect(2, 13, 1, 2, "1")
    s.rect(9, 13, 1, 2, "1")
    s.rect(4, 15, 2, 2, "9")
    s.rect(7, 15, 2, 2, "9")
    s.outline("8", targets={"7"})
    s.outline("3", targets={"1", "2"})
    return s.rows()


def make_memorial():
    """Main Boss 1. A war memorial: tall, vertical, and it comes apart in tiers."""
    s = Spr(20, 34)
    s.rect(6, 0, 8, 12, "1")            # top tier
    s.rect(6, 0, 3, 12, "2")
    s.rect(5, 11, 10, 2, "3")
    s.rect(5, 13, 10, 10, "1")          # middle tier
    s.rect(5, 13, 3, 10, "2")
    s.rect(4, 22, 12, 2, "3")
    s.rect(4, 24, 12, 8, "1")           # base tier
    s.rect(4, 24, 4, 8, "2")
    s.rect(2, 31, 16, 3, "3")
    for ly in range(2, 10, 2):          # the list of names
        s.rect(8, ly, 4, 1, "4")
    for ly in range(15, 22, 2):
        s.rect(7, ly, 6, 1, "4")
    s.outline("5")
    return s.rows()



# --- Act 3 ---------------------------------------------------------------
def make_checkpoint():
    """Border country. A barrier that has outlived the border."""
    s = Spr(20, 14)
    s.rect(1, 2, 18, 4, "1")            # the boom, red and white
    for i in range(0, 18, 4):
        s.rect(1 + i, 2, 2, 4, "2")
    s.rect(15, 0, 4, 12, "3")           # the post
    s.rect(15, 0, 2, 12, "4")
    s.rect(13, 11, 8, 3, "5")
    s.rect(2, 7, 3, 5, "3")             # counterweight
    s.outline("5")
    return s.rows()


def make_hare():
    """Frozen Hare. Already leaving."""
    s = Spr(14, 13)
    head(s, 9.5, 5.0, 3.4, 3.2, "1", "2", "3")
    s.rect(8, 0, 2, 5, "1")             # ears, laid back
    s.rect(11, 0, 2, 5, "1")
    s.rect(8, 0, 1, 5, "2")
    s.rect(11, 0, 1, 5, "2")
    s.rect(11, 4, 1, 1, "4")            # the eye, wide
    s.ellipse(5.0, 8.0, 4.6, 3.4, "1")
    s.ellipse(4.0, 7.0, 3.0, 2.2, "2", only={"1"})
    s.rect(1, 6, 2, 2, "2")             # scut
    s.rect(3, 11, 2, 2, "3")
    s.rect(7, 11, 2, 2, "3")
    s.outline("5")
    return s.rows()


def make_crate():
    """Surplus Crate. Something is in it. Nobody knows what."""
    s = Spr(15, 14)
    s.rect(0, 1, 15, 13, "1")
    s.rect(0, 1, 15, 3, "2")
    s.rect(0, 6, 15, 1, "3")
    s.rect(0, 10, 15, 1, "3")
    s.rect(6, 1, 2, 13, "3")
    s.rect(2, 4, 5, 2, "4")             # a stencil, half worn off
    s.rect(9, 8, 4, 2, "4")
    s.outline("5")
    return s.rows()


def make_coat():
    """Long Coat. A person. Does not speak, does not stop."""
    s = Spr(13, 18)
    head(s, 6.0, 4.6, 3.9, 3.7, "1", "2", "3")
    s.rect(1, 1, 11, 3, "6")            # brim, pulled low
    s.rect(3, 0, 7, 2, "6")
    s.rect(3, 4, 6, 1, "3")             # the face, in its shadow
    s.rect(3, 9, 8, 9, "7")             # the coat, to the ankle
    s.rect(3, 9, 3, 9, "8")
    s.rect(2, 10, 1, 5, "7")
    s.rect(10, 10, 1, 5, "7")
    s.rect(6, 9, 1, 9, "8")             # the seam down the front
    s.outline("8", targets={"7"})
    s.outline("3", targets={"1", "2"})
    return s.rows()


def make_commuter():
    """Running late. Has been running late for some time."""
    s = Spr(13, 17)
    head(s, 6.0, 4.4, 3.8, 3.6, "1", "2", "3")
    for ex in (4, 7):
        s.rect(ex, 3, 2, 2, "4")
        s.rect(ex, 4, 1, 1, "5")
    s.rect(2, 1, 9, 2, "9")             # hair, blown back
    s.rect(1, 2, 2, 2, "9")
    s.rect(3, 9, 7, 6, "6")
    s.rect(3, 9, 2, 6, "7")
    s.rect(2, 10, 1, 3, "6")
    s.rect(10, 10, 1, 3, "6")
    s.rect(9, 11, 4, 4, "8")            # case, swinging
    s.rect(4, 15, 2, 2, "8")
    s.rect(7, 15, 2, 2, "8")
    s.outline("8", targets={"6", "7"})
    s.outline("3", targets={"1", "2"})
    return s.rows()


def make_kiosk():
    """Sells to you first. Then attacks."""
    s = Spr(16, 20)
    s.rect(1, 2, 14, 14, "1")
    s.rect(1, 2, 4, 14, "2")
    s.rect(0, 0, 16, 3, "3")            # awning
    for i in range(0, 16, 4):
        s.rect(i, 0, 2, 3, "4")
    s.rect(3, 6, 10, 6, "5")            # the hatch, lit
    s.rect(4, 7, 8, 4, "6")
    s.rect(2, 16, 2, 4, "3")            # legs
    s.rect(12, 16, 2, 4, "3")
    s.outline("7")
    return s.rows()


def make_neon():
    """Neon Sign. Nothing in Limpo is this bright."""
    s = Spr(18, 16)
    s.rect(0, 0, 18, 12, "1")           # the dark backing
    s.rect(1, 1, 16, 10, "2")
    s.rect(3, 3, 3, 7, "3")             # a letter, or most of one
    s.rect(3, 3, 8, 2, "3")
    s.rect(3, 6, 6, 2, "3")
    s.rect(12, 3, 3, 7, "4")
    s.rect(12, 8, 3, 2, "4")
    s.rect(8, 12, 2, 4, "5")            # the bracket
    s.rect(6, 15, 6, 1, "5")
    s.outline("6")
    return s.rows()


def make_canvasser():
    """The first Vixtry enemy. Genuinely polite, and means it."""
    s = Spr(13, 18)
    head(s, 6.0, 4.6, 3.9, 3.7, "1", "2", "3")
    for ex in (4, 7):
        s.rect(ex, 3, 2, 2, "4")
        s.rect(ex, 4, 1, 1, "5")
    s.rect(3, 7, 7, 1, "3")             # the smile, held
    s.rect(2, 1, 9, 2, "9")
    s.rect(3, 9, 7, 7, "6")             # a clean uniform
    s.rect(3, 9, 2, 7, "7")
    s.rect(6, 9, 1, 7, "8")
    s.rect(2, 10, 1, 4, "6")
    s.rect(10, 10, 1, 4, "6")
    s.rect(4, 11, 2, 3, "a")            # the lanyard
    s.rect(4, 14, 3, 3, "a")
    s.rect(4, 16, 2, 2, "8")
    s.rect(7, 16, 2, 2, "8")
    s.outline("8", targets={"6", "7"})
    s.outline("3", targets={"1", "2"})
    return s.rows()


def make_mirror():
    """Hall Mirror. Gives back a quarter of whatever you put in."""
    s = Spr(14, 20)
    s.rect(0, 0, 14, 18, "1")
    s.rect(2, 2, 10, 14, "2")
    s.rect(3, 3, 8, 6, "3")             # the bright half
    s.rect(3, 9, 8, 6, "4")
    s.rect(4, 4, 2, 10, "5")            # a streak of glare
    s.rect(0, 17, 14, 3, "1")
    s.outline("6")
    return s.rows()


def make_cat():
    """Tenant's Cat. Ignores you one turn in three."""
    s = Spr(15, 12)
    s.ellipse(6.5, 7.5, 5.4, 3.6, "1")
    s.ellipse(5.5, 6.6, 3.6, 2.2, "2", only={"1"})
    head(s, 11.5, 5.0, 3.0, 2.8, "1", "2", "3")
    s.rect(9, 1, 2, 3, "1")             # ears
    s.rect(13, 1, 2, 3, "1")
    s.rect(11, 4, 1, 1, "4")
    s.rect(13, 4, 1, 1, "4")
    s.rect(0, 3, 2, 6, "1")             # tail, up
    s.rect(1, 2, 2, 2, "1")
    s.rect(3, 10, 2, 2, "3")
    s.rect(8, 10, 2, 2, "3")
    s.outline("5")
    return s.rows()


def make_door4c():
    """Unit 4C. A door. Enormous, and blocks nothing at all."""
    s = Spr(18, 30)
    s.rect(0, 0, 18, 30, "1")
    s.rect(1, 1, 16, 28, "2")
    s.rect(2, 2, 14, 12, "3")           # two panels
    s.rect(2, 16, 14, 12, "3")
    s.rect(13, 14, 3, 3, "4")           # the handle
    s.rect(6, 4, 6, 3, "5")             # the number plate
    s.outline("6")
    return s.rows()


def make_mural():
    """The wall art, animate. It matches nothing about the building."""
    s = Spr(22, 20)
    s.rect(0, 0, 22, 20, "1")
    for i in range(6):
        s.ellipse(3 + i * 3.2, 6 + (i % 3) * 4, 4.5, 4.0, str((i % 4) + 2))
    s.rect(4, 8, 3, 3, "6")             # two eyes in it, if you look
    s.rect(14, 11, 3, 3, "6")
    s.outline("7")
    return s.rows()


def make_super():
    """Building Super. Apologizes, then fights."""
    s = Spr(14, 18)
    head(s, 6.5, 4.8, 4.2, 3.9, "1", "2", "3")
    for ex in (4, 8):
        s.rect(ex, 3, 2, 2, "4")
        s.rect(ex, 4, 1, 1, "5")
    s.rect(2, 1, 10, 2, "9")
    s.rect(4, 8, 3, 1, "9")             # moustache
    s.rect(3, 10, 9, 6, "6")            # overalls, stout
    s.rect(3, 10, 3, 6, "7")
    s.rect(2, 11, 1, 4, "6")
    s.rect(11, 11, 1, 4, "6")
    s.rect(1, 12, 2, 3, "1")
    s.rect(11, 12, 2, 3, "1")
    s.rect(6, 11, 3, 2, "a")            # keys on his belt
    s.rect(4, 16, 3, 2, "8")
    s.rect(8, 16, 3, 2, "8")
    s.outline("8", targets={"6", "7"})
    s.outline("3", targets={"1", "2"})
    return s.rows()


def make_supervisor():
    """Mini-Boss 2. The first fight in the game against a person."""
    s = Spr(16, 24)
    head(s, 8.0, 5.4, 4.6, 4.3, "1", "2", "3")
    for ex in (5, 9):
        s.rect(ex, 4, 3, 2, "4")
        s.rect(ex + 1, 5, 1, 1, "5")
    s.rect(2, 1, 13, 3, "6")            # hard hat, and a good one
    s.rect(4, 0, 9, 2, "6")
    s.rect(5, 9, 6, 1, "3")
    s.rect(3, 12, 11, 9, "7")
    s.rect(3, 12, 4, 9, "8")
    s.rect(2, 13, 1, 5, "7")
    s.rect(13, 13, 1, 5, "7")
    s.rect(1, 17, 2, 3, "1")
    s.rect(13, 17, 2, 3, "1")
    s.rect(7, 12, 2, 9, "8")            # the zip
    s.rect(9, 14, 3, 2, "9")            # a clipboard, held flat
    s.rect(4, 21, 3, 3, "a")
    s.rect(9, 21, 3, 3, "a")
    s.outline("8", targets={"7"})
    s.outline("3", targets={"1", "2"})
    return s.rows()


def make_tenant():
    """Main Boss 2. A cube, and it splits. It was never a person."""
    s = Spr(26, 26)
    s.rect(2, 2, 22, 22, "1")
    s.rect(2, 2, 22, 6, "2")            # the lit top face
    s.rect(2, 2, 7, 22, "2")
    s.rect(9, 8, 15, 16, "3")           # the face in shadow
    s.rect(6, 10, 5, 5, "4")            # two windows, or two eyes
    s.rect(15, 10, 5, 5, "4")
    s.rect(6, 18, 14, 2, "5")
    s.outline("6")
    return s.rows()

for _face in ("down", "up", "side"):
    for _step in (0, 1, 2):
        SPRITES[f"player_{_face}" + ("" if _step == 0 else f"_{_step}")] = \
            make_player(_face, _step)
for _key, _kw in PEOPLE.items():
    SPRITES[_key] = make_person(**_kw)
SPRITES["custodian"] = make_custodian()
SPRITES["dog"] = make_dog()
SPRITES["postbox"] = make_postbox()
SPRITES["melon"] = make_melon()
SPRITES["post"] = make_post()
SPRITES["ladder"] = make_ladder()
SPRITES["wader"] = make_wader()
SPRITES["tree"] = make_tree(14, 16, 5.6, 4)
SPRITES["bigtree"] = make_tree(20, 22, 8.4, 5)

PALETTES = {
    # 1 mid, 2 light, 4 outline, 5 sclera, 6 pupil, 7 shirt, 8 shirt light,
    # 9 shirt outline, a trouser, b shoe
    # c/d are the print on his shirt — see make_player.
    "player": {
        1: "#4a7fc1", 2: "#79a8dd", 3: "#35618f", 4: "#1d3757", 5: "#f2f4f8",
        6: "#12121a", 7: "#4f9440", 8: "#77c064", 9: "#2c5c26",
        "a": "#3b4359", "b": "#171a24", "c": "#eef2e4", "d": "#e8c24a",
    },
    "custodian": {1: "#f0f0f0", 2: "#08080a"},
    # People are built by person_pal below; these are only the non-people.
    "dog":      {1: "#8a7256", 2: "#a9906e", 3: "#3d3122", 4: "#f2f4f8"},
    "postbox":  {1: "#9a5a4a", 2: "#bc7565", 3: "#241a18", 4: "#5a5a62", 5: "#241a18"},
    "melon":    {1: "#c8a83c", 2: "#e6cb63", 3: "#8a7020", 4: "#5c4a16", 5: "#3d3110"},
    "post":     {1: "#8a7a5a", 2: "#a89a78", 3: "#57493a", 4: "#33291d"},
    "ladder":   {1: "#7a6a4a", 2: "#9c8b66", 3: "#33291d"},
    "wader":    {1: "#5a6a7a", 2: "#7e8fa0", 3: "#1e2630", 4: "#0a0a0a"},
    "tree":     {1: "#4a8a3a", 2: "#68ab55", 3: "#6a5030", 4: "#c05a6a",
                 5: "#8a6a44", 6: "#1f3a19"},
    "bigtree":  {1: "#5aa04a", 2: "#7dc26a", 3: "#7a5a34", 4: "#d0707e",
                 5: "#9a7448", 6: "#24421c"},
    "fruiting": {1: "#c05a6a", 2: "#dd8090", 3: "#7a4a34", 4: "#f0d070",
                 5: "#9a6448", 6: "#4a1f27"},
    # Same tree shape, no leaves and no fruit. Nothing on the winter road is
    # in season, and a green orchard tree standing in snow reads as a mistake.
    "winter":   {1: "#57545c", 2: "#6e6b74", 3: "#4a4048", 4: "#7c7982",
                 5: "#5e5158", 6: "#2b2830"},
}


def _shade(hexstr, f):
    """Lighten (f > 1) or darken (f < 1) a hex colour, clamped."""
    r, g, b = (int(hexstr[i:i + 2], 16) for i in (1, 3, 5))
    return "#%02x%02x%02x" % tuple(min(255, max(0, round(v * f))) for v in (r, g, b))


def person_pal(skin, shirt, hair, hat="#3a3a44", accent="#e6e2d4", trousers="#3e3a46"):
    """Three tones each for skin and shirt, derived so nobody is flat.

    Limpo's people are meant to look slightly wrong rather than sickly, so the
    skins here run through greens and blues on purpose — see 07. What keeps it
    from reading as a bug is that the shading is consistent with everything else
    in the frame.
    """
    return {
        1: skin, 2: _shade(skin, 1.18), 3: _shade(skin, 0.62),
        4: "#f2f4f8", 5: "#12121a",
        6: shirt, 7: _shade(shirt, 1.2), 8: _shade(shirt, 0.52),
        9: hair, "a": hat, "b": accent,
        "c": trousers, "d": _shade(trousers, 0.55),
    }


# Skin, shirt, hair, hat, accent. Chosen so no two people standing in the same
# room share a silhouette *and* a colour.
PALETTES.update({
    "vlg_woman":    person_pal("#c98b6a", "#a05a8c", "#4a3324"),
    "vlg_man":      person_pal("#9fbe74", "#d0a24a", "#3f4a2a", "#9a7c4a", "#5c5340"),
    "vlg_child":    person_pal("#7fb6c6", "#c56a5a", "#2f4650", "#4a4258"),
    "vlg_elder":    person_pal("#b8a48c", "#6f7a86", "#d8d4cc", "#8a7c62", "#4c4640"),
    "vlg_shop":     person_pal("#c98b6a", "#5f8f7a", "#54321f", "#3a3a44", "#e4e0d2"),
    "vlg_inn":      person_pal("#9fbe74", "#7a6ba8", "#3f4a2a", "#3a3a44", "#dcd6c4"),
    "vlg_hess":     person_pal("#c98b6a", "#8a5a3a", "#3a2a1c"),
    "ond_clerk":    person_pal("#b9a58e", "#4a5a7a", "#3a3730"),
    "ond_baker":    person_pal("#c98b6a", "#b06a4a", "#442d1c", "#efe9dc", "#efe9dc"),
    "ond_bench":    person_pal("#b8a48c", "#5a5f52", "#ded9d0", "#494438"),
    "ond_courier":  person_pal("#9fbe74", "#38607a", "#3f4a2a", "#2c4658", "#c2a25a", "#2f3a48"),
    "ond_shop":     person_pal("#7fb6c6", "#8a5f8f", "#2f4650", "#3a3a44", "#e4e0d2"),
    "ond_inn":      person_pal("#c98b6a", "#6a7f4a", "#4a3324"),
    "boarder":      person_pal("#a8a094", "#4c4a54", "#5a5650", "#39373e"),
    "landlady":     person_pal("#c98b6a", "#7a3f4a", "#8e8478", "#4a3a40"),
    "tenant_three": person_pal("#9fbe74", "#7a5a3a", "#3f4a2a"),
    "tenant_five":  person_pal("#b9a58e", "#4a6a6a", "#7a6a58", "#9a4a44", "#6a2f2c", "#43413a"),
    "records":      person_pal("#7fb6c6", "#5a5a6e", "#2f4650", "#3a3a44", "#d6d2c6"),
    "ond_grocer":   person_pal("#9fbe74", "#4a6a4a", "#c8c0b0", "#3a3a44", "#dcd6c4"),
    "sab_local":    person_pal("#b9a58e", "#3f4654", "#2e2a26", "#3a3a44", "#8a7a4a"),
    "sab_kid":      person_pal("#c98b6a", "#8a4a7a", "#3a2a1c"),
    "sab_rail":     person_pal("#9fbe74", "#2f4658", "#3f4a2a", "#1f3040"),
    "sab_shop":     person_pal("#7fb6c6", "#6a4a7a", "#2f4650", "#3a3a44", "#e4e0d2"),
    "sab_inn":      person_pal("#c98b6a", "#7a5a3a", "#54321f"),
    "sab_wait":     person_pal("#b8a48c", "#4a4a52", "#c8c0b4", "#3a3a44", "#8a8478"),
    "sab_flat":     person_pal("#9fbe74", "#7a3f4a", "#3f4a2a"),
    # Vixtry is the cleanest thing in the frame, everywhere it appears.
    "vix_rep":      person_pal("#c2a086", "#eef1f5", "#3c3630", "#3a3a44", "#4a8ad0"),
    "bell_super":   person_pal("#c98b6a", "#4a5f4a", "#8e8478", "#3a3a44", "#c9c4bc"),
    "bell_7b":      person_pal("#b9a58e", "#5a5a6e", "#8a8478"),
})


SPRITES["checkpoint"] = make_checkpoint()
SPRITES["hare"] = make_hare()
SPRITES["crate"] = make_crate()
SPRITES["coat"] = make_coat()
SPRITES["commuter"] = make_commuter()
SPRITES["kiosk"] = make_kiosk()
SPRITES["neon"] = make_neon()
SPRITES["canvasser"] = make_canvasser()
SPRITES["mirror"] = make_mirror()
SPRITES["cat"] = make_cat()
SPRITES["door4c"] = make_door4c()
SPRITES["mural"] = make_mural()
SPRITES["super"] = make_super()
SPRITES["supervisor"] = make_supervisor()
SPRITES["tenant"] = make_tenant()

SPRITES["milepost"] = make_milepost()
SPRITES["ration_tin"] = make_ration_tin()
SPRITES["bicycle"] = make_bicycle()
SPRITES["weather"] = make_weather()
SPRITES["shrine"] = make_shrine()
SPRITES["glove"] = make_glove()
SPRITES["coil"] = make_coil()
SPRITES["conveyor"] = make_conveyor()
SPRITES["yard_light"] = make_yard_light()
SPRITES["worker"] = make_worker()
SPRITES["memorial"] = make_memorial()

PALETTES.update({
    "milepost":   {1: "#8d8d84", 2: "#adada2", 3: "#4c4c46", 4: "#2a2a26"},
    "ration_tin": {1: "#9aa2a8", 2: "#bcc4ca", 3: "#8a5a3a", 4: "#d8cba0", 5: "#3a3f44"},
    "bicycle":    {1: "#5c6068", 2: "#8d3f3a", 3: "#3f434a", 4: "#1e2126"},
    "weather":    {1: "#6a7280", 2: "#8e97a6", 3: "#9fc4d8", 4: "#31363f"},
    "shrine":     {1: "#8a8276", 2: "#a8a094", 3: "#2c2822", 4: "#c8a24a", 5: "#3a352c"},
    "glove":      {1: "#6a5a4a", 2: "#8a7864", 3: "#cfe4ee", 4: "#2e2720"},
    "coil":       {1: "#7a7f88", 2: "#9ea4ae", 3: "#d8c060", 4: "#2a2d33"},
    "conveyor":   {1: "#5f6168", 2: "#82858e", 3: "#3a3d43", 4: "#44474d", 5: "#212328"},
    "yard_light": {1: "#5a5d64", 2: "#7a7e86", 3: "#f0e0a0", 4: "#26282d"},
    "worker":     {1: "#c98b6a", 2: "#e2ab89", 3: "#6f4630", 4: "#f2f4f8", 5: "#12121a",
                   6: "#d8a838", 7: "#4a6a8a", 8: "#2b3f52", 9: "#2a2a30"},
    "memorial":   {1: "#8d8d84", 2: "#a9a99f", 3: "#6d6d66", 4: "#5a5a54", 5: "#2a2a26"},
})




def main():
    # Every sprite must be a rectangle, or the renderer silently drops columns.
    for name, rows in SPRITES.items():
        widths = {len(r) for r in rows}
        assert len(widths) == 1, f"{name} has ragged rows: {sorted(widths)}"

    out = ["// GENERATED by tools/gen_sprites.py — do not edit by hand.",
           "// Shapes are composed, highlighted, then auto-outlined; see the generator.",
           "const SPR = {"]
    for name, rows in SPRITES.items():
        out.append(f"  {name}: [")
        for r in rows:
            out.append(f"    '{r}',")
        out.append("  ],")
    out.append("};")
    out.append("")
    out.append("const PAL = {")
    for name, pal in PALETTES.items():
        entries = ", ".join(f"{k}: '{v}'" for k, v in pal.items())
        out.append(f"  {name}: {{ {entries} }},")
    out.append("};")
    out.append("")
    OUT.write_text("\n".join(out) + "\n")

    total = sum(len(r) * len(r[0]) for r in SPRITES.values())
    print(f"wrote {OUT.relative_to(ROOT)}: {len(SPRITES)} sprites, "
          f"{len(PALETTES)} palettes, {total} pixels")
    for name, rows in SPRITES.items():
        print(f"  {name:14} {len(rows[0])}x{len(rows)}")


if __name__ == "__main__":
    main()

PALETTES.update({
    "checkpoint": {1: "#c8c4bc", 2: "#a8443c", 3: "#6e6a62", 4: "#8a867e",
                   5: "#26241f"},
    "hare":       {1: "#b9bec6", 2: "#d8dde4", 3: "#5e626a", 4: "#c05a6a",
                   5: "#2a2c32"},
    "crate":      {1: "#8a6a44", 2: "#a5814f", 3: "#5c4429", 4: "#c9bfa2",
                   5: "#2f2318"},
    "coat":       {1: "#a8998a", 2: "#c2b3a2", 3: "#4e453c", 4: "#f2f4f8",
                   5: "#12121a", 6: "#33353c", 7: "#3f424a", 8: "#22242a"},
    "commuter":   {1: "#c98b6a", 2: "#e2ab89", 3: "#6f4630", 4: "#f2f4f8",
                   5: "#12121a", 6: "#4a5a7a", 7: "#63769a", 8: "#25292f",
                   9: "#3a3128"},
    "kiosk":      {1: "#4a4e58", 2: "#5e646f", 3: "#8a3f44", 4: "#c9c4bc",
                   5: "#2a2e36", 6: "#e8d88a", 7: "#181a20"},
    "neon":       {1: "#191c24", 2: "#23273040".replace("40", ""), 3: "#4ad8e0",
                   4: "#e04a9a", 5: "#5a5f6a", 6: "#0d0f14"},
    "canvasser":  {1: "#c2a086", 2: "#dcbb9f", 3: "#6a4c38", 4: "#f2f4f8",
                   5: "#12121a", 6: "#dfe4ea", 7: "#f2f5f9", 8: "#8d99a8",
                   9: "#3c3630", "a": "#4a8ad0"},
    "mirror":     {1: "#6a5a3a", 2: "#8a7a52", 3: "#b9c6cf", 4: "#7d8b98",
                   5: "#e4edf3", 6: "#2a2418"},
    "cat":        {1: "#4a4550", 2: "#635d6c", 3: "#2a2730", 4: "#c8d84a",
                   5: "#16141a"},
    "door4c":     {1: "#3f2d1e", 2: "#5d4630", 3: "#4a3524", 4: "#c8a860",
                   5: "#c9c4bc", 6: "#1e150e"},
    "mural":      {1: "#2a1f38", 2: "#c04a7a", 3: "#4ac0b0", 4: "#e0a83a",
                   5: "#6a4ac0", 6: "#f2f4f8", 7: "#140e1c"},
    "super":      {1: "#c98b6a", 2: "#e2ab89", 3: "#6f4630", 4: "#f2f4f8",
                   5: "#12121a", 6: "#4a5f4a", 7: "#5f7a5f", 8: "#25301f",
                   9: "#8e8478", "a": "#c8a860"},
    "supervisor": {1: "#c2a086", 2: "#dcbb9f", 3: "#6a4c38", 4: "#f2f4f8",
                   5: "#12121a", 6: "#d8a83a", 7: "#3f4a5a", 8: "#232a35",
                   9: "#c9c4bc", "a": "#2a2e36"},
    "tenant":     {1: "#5a5f70", 2: "#767d92", 3: "#3f4352", 4: "#c8d0e0",
                   5: "#2a2d38", 6: "#14161d"},
})
