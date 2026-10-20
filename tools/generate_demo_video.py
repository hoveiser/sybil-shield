#!/usr/bin/env python3
"""Render the 48 second SybilShield demo video.

Frames are drawn at 1280x720 with PIL, then encoded with ffmpeg together with
the synthesized soundtrack and burned in English subtitles from docs/demo.srt.
The output is docs/demo-video-subtitled.mp4 and is intentionally gitignored.
"""

import math
import shutil
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "artifacts" / "demo"
FRAMES = DEMO / "frames"
SOUNDTRACK = DEMO / "soundtrack.wav"
SUBTITLES = ROOT / "docs" / "demo.srt"
OUTPUT = ROOT / "docs" / "demo-video-subtitled.mp4"
LOGO = ROOT / "docs" / "logo.png"

W, H = 1280, 720
FPS = 30
DURATION = 48
SCENE_SECONDS = 8
SCENES = 6

INK = (8, 9, 26)
PANEL = (13, 15, 39)
EDGE = (35, 38, 77)
MIST = (154, 160, 199)
WHITE = (244, 246, 255)
CYAN = (34, 211, 238)
VIOLET = (167, 139, 250)
LIME = (163, 230, 53)
ROSE = (251, 113, 133)
AMBER = (251, 191, 36)

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
BOLD = FONT_DIR / "DejaVuSans-Bold.ttf"
REGULAR = FONT_DIR / "DejaVuSans.ttf"
MONO = FONT_DIR / "DejaVuSansMono.ttf"

_font_cache = {}
_logo_cache = {}


def logo_image(size: int) -> Image.Image:
    if size not in _logo_cache:
        base = Image.open(LOGO).convert("RGBA").resize((size, size), Image.LANCZOS)
        # Fade the square backdrop of the icon into the video background.
        yy, xx = np.mgrid[0:size, 0:size]
        dist = np.sqrt((xx - size / 2) ** 2 + (yy - size / 2) ** 2) / (size / 2)
        alpha = np.clip((0.99 - dist) / 0.30, 0.0, 1.0) ** 1.1
        base.putalpha(Image.fromarray((alpha * 255).astype(np.uint8), "L"))
        _logo_cache[size] = base
    return _logo_cache[size]


def font(path: Path, size: int):
    key = (str(path), size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(str(path), size)
    return _font_cache[key]


def scene_alpha(u: float) -> float:
    if u <= 0 or u >= 1:
        return 0.0
    return min(1.0, u / 0.07, (1.0 - u) / 0.07)


def make_background() -> Image.Image:
    yy, xx = np.mgrid[0:H, 0:W]
    cx, cy = W * 0.48, H * 0.42
    dist = np.sqrt(((xx - cx) / W) ** 2 + ((yy - cy) / H) ** 2)
    t = np.clip(dist * 1.75, 0.0, 1.0)[..., None]
    inner = np.array([17, 21, 54], dtype=np.float64)
    outer = np.array([5, 6, 14], dtype=np.float64)
    array = inner * (1 - t) + outer * t

    # Cyan glow bottom left, violet glow top right.
    glow_a = np.exp(-(((xx - W * 0.08) / (W * 0.45)) ** 2 + ((yy - H * 1.02) / (H * 0.5)) ** 2))
    glow_b = np.exp(-(((xx - W * 0.94) / (W * 0.42)) ** 2 + ((yy - H * 0.02) / (H * 0.45)) ** 2))
    array += glow_a[..., None] * np.array([8, 60, 70]) * 0.55
    array += glow_b[..., None] * np.array([60, 40, 95]) * 0.55

    # Vignette.
    vignette = np.clip(1.0 - ((dist - 0.32) * 1.15), 0.35, 1.0)[..., None]
    array *= vignette
    base = Image.fromarray(np.clip(array, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, 48):
        gd.line([(x, 0), (x, H)], fill=EDGE + (26,))
    for y in range(0, H, 48):
        gd.line([(0, y), (W, y)], fill=EDGE + (26,))
    return Image.alpha_composite(base, grid)


def dashed_line(draw, p1, p2, color, width=2, dash=10, gap=8, offset=0.0):
    dx, dy = p2[0] - p1[0], p2[1] - p1[1]
    length = math.hypot(dx, dy)
    if length < 1:
        return
    ux, uy = dx / length, dy / length
    position = -offset
    while position < length:
        start = max(0.0, position)
        end = min(length, position + dash)
        if end > start:
            draw.line(
                [(p1[0] + ux * start, p1[1] + uy * start), (p1[0] + ux * end, p1[1] + uy * end)],
                fill=color,
                width=width,
            )
        position += dash + gap


def text(draw, xy, value, f, fill, anchor="la"):
    draw.text(xy, value, font=f, fill=fill, anchor=anchor)


def chip(draw, xy, label, color, size=11, pad=10):
    f = font(MONO, size)
    width = draw.textlength(label, font=f) + pad * 2
    height = size + 12
    x, y = xy
    draw.rounded_rectangle([x, y, x + width, y + height], radius=height / 2, fill=color + (26,), outline=color + (120,), width=1)
    text(draw, (x + width / 2, y + height / 2 - 1), label, f, color, anchor="mm")
    return width


def wrap(draw, value, f, max_width):
    words = value.split()
    lines = []
    current = ""
    for word in words:
        candidate = (current + " " + word).strip()
        if draw.textlength(candidate, font=f) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def chrome(base: Image.Image, frame_index: int) -> Image.Image:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    logo = logo_image(34)
    layer.paste(logo, (52, 30), logo)
    text(d, (96, 32), "SybilShield", font(BOLD, 21), WHITE)
    text(d, (97, 57), "STAKED TRUST GRAPH", font(MONO, 8), MIST)

    d.ellipse([W - 232, 42, W - 224, 50], fill=LIME + (220,))
    text(d, (W - 216, 39), "GENLAYER / STUDIONET", font(MONO, 10), MIST)
    d.line([(52, 84), (W - 52, 84)], fill=EDGE + (90,), width=1)

    # Progress rail.
    total_seconds = DURATION
    played = (frame_index / FPS) / total_seconds
    x0, x1 = 52, W - 52
    y = H - 14
    d.rounded_rectangle([x0, y, x1, y + 3], radius=2, fill=EDGE + (160,))
    d.rounded_rectangle([x0, y, x0 + (x1 - x0) * played, y + 3], radius=2, fill=CYAN + (210,))
    for marker in range(1, SCENES):
        mx = x0 + (x1 - x0) * (marker / SCENES)
        d.line([(mx, y - 2), (mx, y + 5)], fill=INK + (255,), width=2)
    return Image.alpha_composite(base, layer)


def scene_title(d, u, t):
    logo_size = 176
    logo = logo_image(logo_size)
    bob = math.sin(t * 1.6) * 5
    return logo, (W // 2 - logo_size // 2, int(112 + bob))


def draw_scene_1(layer, d, u, t):
    logo, position = scene_title(d, u, t)
    layer.paste(logo, position, logo)
    cx, cy = W // 2, position[1] + 88
    for index, (radius, color, spread) in enumerate(((126, CYAN, 70), (146, VIOLET, 50), (168, CYAN, 30))):
        start = (t * (18 + index * 6)) % 360
        d.arc([cx - radius, cy - radius, cx + radius, cy + radius], start=start, end=start + spread, fill=color + (150 - index * 35,), width=2)

    text(d, (W // 2, 336), "SybilShield", font(BOLD, 78), WHITE, anchor="mm")
    text(d, (W // 2, 414), "Staked credential and anti sybil trust graph passport", font(REGULAR, 25), MIST, anchor="mm")
    labels = [("STAKE", CYAN), ("VOUCH", VIOLET), ("CONSENSUS", LIME), ("SLASH", ROSE)]
    widths = [d.textlength(label, font=font(MONO, 11)) + 20 for label, _ in labels]
    total = sum(widths) + 12 * (len(labels) - 1)
    cursor = W / 2 - total / 2
    for (label, color), width in zip(labels, widths):
        d.rounded_rectangle([cursor, 452, cursor + width, 478], radius=13, fill=color + (24,), outline=color + (130,), width=1)
        text(d, (cursor + width / 2, 464), label, font(MONO, 11), color, anchor="mm")
        cursor += width + 12
    text(d, (W // 2, 516), "live on GenLayer studionet  /  chain 61999", font(MONO, 12), MIST, anchor="mm")


def draw_scene_2(layer, d, u, t):
    text(d, (70, 140), "THE PROBLEM", font(MONO, 12), ROSE)
    text(d, (70, 176), "One handle.", font(BOLD, 54), WHITE)
    text(d, (70, 240), "Many wallets.", font(BOLD, 54), ROSE)
    text(d, (70, 322), "Reputation that costs nothing", font(REGULAR, 20), MIST)
    text(d, (70, 350), "is reputation that means nothing.", font(REGULAR, 20), MIST)
    bullets = [
        "Free vouches cost zero SST",
        "Proof pages are copied in minutes",
        "Sybil clusters recycle one identity",
    ]
    for index, bullet in enumerate(bullets):
        y = 412 + index * 38
        d.rounded_rectangle([70, y + 4, 80, y + 14], radius=3, fill=ROSE + (180,))
        text(d, (94, y), bullet, font(REGULAR, 17), WHITE)

    cx, cy = 930, 350
    d.ellipse([cx - 188, cy - 188, cx + 188, cy + 188], outline=ROSE + (55,), width=1)
    for index in range(9):
        angle = (index / 9) * math.tau + 0.2
        radius = 158 + (index % 2) * 22
        x = cx + math.cos(angle) * radius
        y = cy + math.sin(angle) * radius * 0.72
        dashed_line(d, (cx, cy), (x, y), ROSE + (95,), width=2, dash=8, gap=7, offset=(t * 26) % 15)
        d.ellipse([x - 22, y - 22, x + 22, y + 22], fill=PANEL + (255,), outline=ROSE + (140,), width=2)
        text(d, (x, y - 1), "w" + str(index + 1), font(MONO, 10), ROSE, anchor="mm")
    d.ellipse([cx - 58, cy - 58, cx + 58, cy + 58], fill=(10, 12, 30, 255), outline=ROSE, width=2)
    d.ellipse([cx - 44, cy - 44, cx + 44, cy + 44], outline=ROSE + (70,), width=1)
    text(d, (cx, cy - 6), "identity", font(BOLD, 15), WHITE, anchor="mm")
    text(d, (cx, cy + 14), "1 handle", font(MONO, 9), ROSE, anchor="mm")
    d.rounded_rectangle([cx - 96, cy + 208, cx + 96, cy + 240], radius=16, fill=ROSE + (20,), outline=ROSE + (100,), width=1)
    text(d, (cx, cy + 224), "reputation for sale", font(MONO, 11), ROSE, anchor="mm")


def icon_lock(d, x, y, color):
    d.rounded_rectangle([x, y + 14, x + 40, y + 44], radius=7, outline=color, width=2)
    d.arc([x + 9, y, x + 31, y + 30], start=180, end=360, fill=color, width=2)
    d.ellipse([x + 18, y + 24, x + 22, y + 28], fill=color)


def icon_users(d, x, y, color):
    d.ellipse([x + 14, y + 2, x + 30, y + 18], outline=color, width=2)
    d.arc([x + 4, y + 22, x + 24, y + 48], start=180, end=360, fill=color, width=2)
    d.arc([x + 20, y + 22, x + 40, y + 48], start=180, end=360, fill=color, width=2)
    d.ellipse([x + 2, y + 10, x + 12, y + 20], outline=color + (150,), width=1)
    d.ellipse([x + 32, y + 10, x + 42, y + 20], outline=color + (150,), width=1)


def icon_sword(d, x, y, color):
    d.line([(x + 4, y + 40), (x + 36, y + 8)], fill=color, width=2)
    d.line([(x + 24, y + 4), (x + 42, y + 10)], fill=color, width=2)
    d.line([(x + 2, y + 30), (x + 14, y + 42)], fill=color, width=2)


def draw_scene_3(layer, d, u, t):
    text(d, (W // 2, 132), "Stake, vouch, challenge", font(BOLD, 46), WHITE, anchor="mm")
    cards = [
        ("01", "LOCK STAKE", "The applicant escrows real SST in vault custody before any review.", "50 SST", CYAN, icon_lock),
        ("02", "STAKED VOUCH", "Peers add their own SST. A self vouch reverts before any funds move.", "25 SST", VIOLET, icon_users),
        ("03", "CHALLENGE BOND", "A challenger locks a bond equal to the stake and adds fraud evidence.", "50 SST", ROSE, icon_sword),
    ]
    for index, (number, title, body, metric, color, icon) in enumerate(cards):
        delay = index * 0.12
        appear = max(0.0, min(1.0, (u - delay) * 3.4))
        x = 66 + index * 388
        y = 214 + (1 - appear) * 26
        d.rounded_rectangle([x, y, x + 360, y + 306], radius=18, fill=PANEL + (235,), outline=EDGE + (255,), width=1)
        d.rounded_rectangle([x, y, x + 360, y + 5], radius=2, fill=color + (220,))
        text(d, (x + 26, y + 26), number, font(MONO, 12), color)
        icon(d, x + 288, y + 20, color)
        text(d, (x + 26, y + 58), title, font(BOLD, 24), WHITE)
        for line_index, line in enumerate(wrap(d, body, font(REGULAR, 15), 300)):
            text(d, (x + 26, y + 104 + line_index * 24), line, font(REGULAR, 15), MIST)
        d.line([(x + 26, y + 242), (x + 334, y + 242)], fill=EDGE + (200,), width=1)
        text(d, (x + 26, y + 260), metric, font(MONO, 15), color)
        text(d, (x + 334, y + 263), "in vault", font(MONO, 10), MIST, anchor="ra")
        if index < 2:
            ax = x + 366
            d.line([(ax, y + 152), (ax + 12, y + 160), (ax, y + 168)], fill=EDGE + (255,), width=2)
    text(d, (W // 2, 574), "no free vouches  /  no owner override  /  no deterministic badge", font(MONO, 13), MIST, anchor="mm")


def draw_scene_4(layer, d, u, t):
    text(d, (W // 2, 132), "Validators decide the band", font(BOLD, 46), WHITE, anchor="mm")
    tiles = [
        ("0", "SYBIL SLASH", "stake slashed to challenger or reserve", ROSE),
        ("40", "PROVISIONAL", "fail closed, stake stays locked", AMBER),
        ("75", "VERIFIED", "active passport, reduced reward", VIOLET),
        ("100", "DIAMOND", "active passport, full reward", CYAN),
    ]
    highlight = int((u * 4.4) % 4)
    for index, (anchor, band, note, color) in enumerate(tiles):
        x = 54 + index * 297
        y = 216
        width = 270
        active = index == highlight
        d.rounded_rectangle(
            [x, y, x + width, y + 224],
            radius=18,
            fill=(PANEL if not active else (18, 22, 52)) + (240,),
            outline=color + ((220,) if active else (90,)),
            width=2 if active else 1,
        )
        text(d, (x + width / 2, y + 28), "ANCHOR", font(MONO, 10), MIST, anchor="mm")
        text(d, (x + width / 2, y + 96), anchor, font(BOLD, 62), color, anchor="mm")
        text(d, (x + width / 2, y + 150), band, font(BOLD, 14), WHITE, anchor="mm")
        for line_index, line in enumerate(wrap(d, note, font(REGULAR, 11), 226)):
            text(d, (x + width / 2, y + 176 + line_index * 16), line, font(REGULAR, 11), MIST, anchor="mm")
    text(d, (W // 2, 492), "exact agreement required", font(MONO, 11), MIST, anchor="mm")
    text(d, (W // 2, 520), "trust_band  /  authenticity_anchor  /  fingerprint_matched", font(MONO, 16), WHITE, anchor="mm")
    chip(d, (W // 2 - 92, 548), "prompt_comparative", CYAN, size=11)
    text(d, (W // 2, 600), "a disagreement on any one field fails equivalence and forces a rotation", font(REGULAR, 13), MIST, anchor="mm")


def draw_scene_5(layer, d, u, t):
    text(d, (66, 128), "VAULT CUSTODY", font(MONO, 11), CYAN)
    text(d, (66, 152), "The vault never loses a liability", font(BOLD, 44), WHITE)
    text(d, (66, 224), "773 SST", font(BOLD, 62), WHITE)
    text(d, (66, 292), "locked across stakes, vouches, bonds and the fraud reserve", font(REGULAR, 15), MIST)

    grow = max(0.0, min(1.0, u * 2.6))
    segments = [
        ("protocol reserve", 638, VIOLET),
        ("applicant stake", 50, CYAN),
        ("voucher stake", 35, (56, 189, 248)),
        ("challenger bond", 50, AMBER),
    ]
    total = sum(value for _, value, _ in segments)
    x = 66
    width = W - 132
    y = 350
    d.rounded_rectangle([x, y, x + width, y + 42], radius=8, fill=(6, 7, 20, 255), outline=EDGE + (255,), width=1)
    cursor = x
    for label, value, color in segments:
        segment_width = (value / total) * width * grow
        if segment_width > 0:
            d.rectangle([cursor, y + 1, cursor + segment_width, y + 41], fill=color + (235,))
        cursor += segment_width
    cursor = x
    for label, value, color in segments:
        segment_width = (value / total) * width
        d.ellipse([cursor, y + 58, cursor + 9, y + 67], fill=color)
        text(d, (cursor + 16, y + 54), label, font(REGULAR, 12), MIST)
        text(d, (cursor + 16, y + 72), str(value) + " SST", font(MONO, 13), color)
        cursor += segment_width

    checks = [
        "vault = reserve + locked stakes + vouch escrow + bonds + pending claims",
        "supply conserved: 2200 minted = 1427 circulating + 773 custody",
        "rewards are drawn only from slashed fraud, never minted per verification",
    ]
    for index, check in enumerate(checks):
        y = 470 + index * 34
        d.ellipse([66, y + 4, 82, y + 20], fill=LIME + (30,), outline=LIME + (180,), width=1)
        d.line([(70, y + 12), (74, y + 16), (79, y + 8)], fill=LIME, width=2)
        text(d, (94, y + 4), check, font(MONO, 12), WHITE)
    text(d, (W - 66, 596), "check_vault_invariants() = true", font(MONO, 12), LIME, anchor="ra")


def draw_scene_6(layer, d, u, t):
    d.ellipse([66, 132, 80, 146], fill=LIME + (240,))
    text(d, (92, 124), "Live on studionet", font(BOLD, 44), WHITE)
    text(d, (W - 66, 132), "chain 61999  /  finality observed", font(MONO, 11), MIST, anchor="ra")

    rows = [
        ("deploy contract", "FINALIZED", "MAJORITY_AGREE", LIME),
        ("verify passport (alpha)", "FINALIZED", "MAJORITY_AGREE", LIME),
        ("verify passport (gamma)", "FINALIZED", "MAJORITY_AGREE", LIME),
        ("claim stake and reward", "FINALIZED", "MAJORITY_AGREE", LIME),
        ("vouch for passport", "FINALIZED", "MAJORITY_AGREE", LIME),
        ("withdraw while challenged", "ERROR", "expected revert", AMBER),
    ]
    visible = int(max(0.0, min(len(rows), (u - 0.05) * 10)))
    x, y, width = 66, 196, 768
    d.rounded_rectangle([x, y - 34, x + width, y + 34 + len(rows) * 42], radius=16, fill=PANEL + (230,), outline=EDGE + (255,), width=1)
    text(d, (x + 20, y - 20), "STEP", font(MONO, 9), MIST)
    text(d, (x + 500, y - 20), "EXECUTION", font(MONO, 9), MIST)
    text(d, (x + 660, y - 20), "CONSENSUS", font(MONO, 9), MIST)
    for index, (step, status, consensus, color) in enumerate(rows[:visible]):
        row_y = y + 10 + index * 42
        d.line([(x + 16, row_y - 8), (x + width - 16, row_y - 8)], fill=EDGE + (90,), width=1)
        text(d, (x + 20, row_y), step, font(MONO, 11), WHITE)
        text(d, (x + 500, row_y), status, font(MONO, 10), color)
        text(d, (x + 660, row_y), consensus, font(MONO, 10), MIST)

    cards = [
        ("18", "finalized transactions", LIME),
        ("3 / 3", "guard rollbacks", AMBER),
        ("4 / 4", "sha256 sources", CYAN),
    ]
    for index, (value, label, color) in enumerate(cards):
        y = 186 + index * 92
        d.rounded_rectangle([872, y, W - 66, y + 76], radius=14, fill=PANEL + (235,), outline=EDGE + (255,), width=1)
        text(d, (892, y + 14), value, font(BOLD, 28), color)
        text(d, (892, y + 50), label, font(REGULAR, 12), MIST)

    text(d, (66, 506), "0x2b7162AdC6F112dC03A746Ead039e44059639A04", font(MONO, 12), WHITE)
    text(d, (66, 530), "github.com/hoveiser/sybil-shield", font(MONO, 12), CYAN)
    text(d, (66, 552), "hoveiser.github.io/sybil-shield", font(MONO, 12), CYAN)
    text(d, (66, 586), "source sha256 e156f1a0f875bd82c39c376dfbc023ce10b8a2501f96b9be82fad5f2b073bbf2", font(MONO, 8), MIST)


SCENE_DRAWERS = [draw_scene_1, draw_scene_2, draw_scene_3, draw_scene_4, draw_scene_5, draw_scene_6]


def render_frames():
    if FRAMES.exists():
        shutil.rmtree(FRAMES)
    FRAMES.mkdir(parents=True, exist_ok=True)
    background = make_background()
    total_frames = FPS * DURATION
    for frame_index in range(total_frames):
        t = frame_index / FPS
        scene_index = min(SCENES - 1, int(t // SCENE_SECONDS))
        u = (t % SCENE_SECONDS) / SCENE_SECONDS
        base = chrome(background, frame_index)

        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        SCENE_DRAWERS[scene_index](layer, draw, u, t)

        # Soft vertical light sweep.
        sweep_x = int((t * 95) % (W + 260)) - 130
        sweep = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sweep)
        sd.rectangle([sweep_x, 0, sweep_x + 150, H], fill=(120, 220, 255, 7))
        sd.rectangle([sweep_x + 60, 0, sweep_x + 78, H], fill=(160, 235, 255, 7))
        base = Image.alpha_composite(base, sweep)

        alpha = scene_alpha(u) * min(1.0, t / 0.8, (DURATION - t) / 0.9)
        alpha = max(0.0, min(1.0, alpha))
        if alpha < 0.999:
            channel = layer.getchannel("A").point(lambda value: int(value * alpha))
            layer.putalpha(channel)
        frame = Image.alpha_composite(base, layer)

        # Subtle top and bottom darkening for subtitle legibility.
        shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        shd = ImageDraw.Draw(shade)
        for offset in range(64):
            shd.line([(0, H - offset), (W, H - offset)], fill=(4, 5, 14, int(90 * (offset / 64) ** 2)))
        frame = Image.alpha_composite(frame, shade)

        frame.convert("RGB").save(FRAMES / ("%05d.png" % frame_index), "PNG", optimize=False)
        if frame_index % 120 == 0:
            print("frame", frame_index, "/", total_frames, flush=True)


def encode():
    if OUTPUT.exists():
        OUTPUT.unlink()
    style = (
        "FontName=DejaVu Sans,FontSize=21,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00101010,BorderStyle=1,Outline=2,Shadow=0,MarginV=30,Bold=1"
    )
    command = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "warning",
        "-framerate",
        str(FPS),
        "-i",
        str(FRAMES / "%05d.png"),
        "-i",
        str(SOUNDTRACK),
        "-vf",
        "subtitles=" + str(SUBTITLES) + ":force_style='" + style + "'",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "24",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-shortest",
        "-movflags",
        "+faststart",
        str(OUTPUT),
    ]
    print("running ffmpeg")
    subprocess.run(command, check=True)
    print("wrote", OUTPUT, OUTPUT.stat().st_size, "bytes")


def main():
    DEMO.mkdir(parents=True, exist_ok=True)
    if not SOUNDTRACK.exists():
        raise SystemExit("soundtrack missing, run tools/generate_soundtrack.py first")
    render_frames()
    encode()


if __name__ == "__main__":
    main()
