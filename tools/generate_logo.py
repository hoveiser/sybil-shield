#!/usr/bin/env python3
"""Generate the SybilShield logo as a crisp 512x512 PNG.

The artwork is drawn at 4x resolution and downsampled with Lanczos so the
gradient stroke, the tick ring and the fingerprint arcs stay clean at icon size.
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [ROOT / "frontend" / "public" / "logo.png", ROOT / "docs" / "logo.png"]

SCALE = 4
SIZE = 512 * SCALE
CYAN = (34, 211, 238)
VIOLET = (167, 139, 250)
LIME = (163, 230, 53)
INK = (8, 9, 26)


def mix(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def radial_background(size):
    image = Image.new("RGB", (size, size), (5, 6, 16))
    pixels = image.load()
    cx = cy = size / 2
    max_dist = math.hypot(cx, cy)
    inner = (18, 22, 58)
    outer = (4, 5, 13)
    for y in range(size):
        for x in range(size):
            dist = math.hypot(x - cx, y - cy) / max_dist
            shade = mix(inner, outer, min(1.0, dist * 1.25))
            pixels[x, y] = shade
    return image


def shield_points(cx, top, width, height):
    left = cx - width / 2
    right = cx + width / 2
    corner = width * 0.18
    points = [(left + corner, top)]
    points.append((right - corner, top))
    points.append((right - corner * 0.22, top + corner * 0.30))
    points.append((right, top + corner * 0.78))
    points.append((right, top + height * 0.46))
    for step in range(1, 61):
        t = step / 60
        x = (1 - t) ** 2 * right + 2 * (1 - t) * t * (cx + width * 0.30) + t * t * cx
        y = (1 - t) ** 2 * (top + height * 0.46) + 2 * (1 - t) * t * (top + height * 0.85) + t * t * (top + height)
        points.append((x, y))
    for step in range(60, 0, -1):
        t = step / 60
        x = (1 - t) ** 2 * right + 2 * (1 - t) * t * (cx + width * 0.30) + t * t * cx
        y = (1 - t) ** 2 * (top + height * 0.46) + 2 * (1 - t) * t * (top + height * 0.85) + t * t * (top + height)
        points.append((2 * cx - x, y))
    points.append((left, top + height * 0.46))
    points.append((left, top + corner * 0.78))
    points.append((left + corner * 0.22, top + corner * 0.30))
    points.append((left + corner, top))
    return points


def gradient_stroke(draw, points, width, start, end):
    total = len(points) - 1
    for index in range(total):
        t = index / max(1, total - 1)
        color = mix(start, end, t)
        draw.line([points[index], points[index + 1]], fill=color + (255,), width=width, joint="curve")


def main():
    size = SIZE
    image = radial_background(size).convert("RGBA")
    cx = cy = size / 2

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        [cx - size * 0.30, cy - size * 0.32, cx + size * 0.30, cy + size * 0.30],
        fill=(34, 211, 238, 40),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.05))
    image = Image.alpha_composite(image, glow)

    shield = shield_points(cx, size * 0.075, size * 0.72, size * 0.84)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).polygon(shield, fill=255)

    fill = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fill_draw = ImageDraw.Draw(fill)
    for y in range(int(size * 0.08), int(size * 0.91)):
        t = (y - size * 0.08) / (size * 0.83)
        fill_draw.line([(0, y), (size, y)], fill=mix((17, 21, 56), (6, 7, 20), t) + (255,))
    image.paste(fill, (0, 0), mask)

    draw = ImageDraw.Draw(image)
    gradient_stroke(draw, shield, int(size * 0.011) + 2, CYAN, VIOLET)

    inner_mask = Image.new("L", (size, size), 0)
    inner_draw = ImageDraw.Draw(inner_mask)
    inner_radius = size * 0.185
    inner_draw.ellipse(
        [cx - inner_radius, cy - inner_radius - size * 0.01, cx + inner_radius, cy + inner_radius - size * 0.01],
        fill=255,
    )
    inner_mask = Image.composite(inner_mask, Image.new("L", (size, size), 0), mask)

    rings = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(rings)
    ring_draw.ellipse(
        [cx - inner_radius, cy - inner_radius - size * 0.01, cx + inner_radius, cy + inner_radius - size * 0.01],
        outline=CYAN + (235,),
        width=int(size * 0.010),
    )
    mid_radius = inner_radius * 1.42
    ring_draw.ellipse(
        [cx - mid_radius, cy - mid_radius - size * 0.01, cx + mid_radius, cy + mid_radius - size * 0.01],
        outline=VIOLET + (150,),
        width=max(2, int(size * 0.005)),
    )

    tick_radius = size * 0.245
    for tick in range(48):
        angle = (tick / 48) * math.tau - math.pi / 2
        major = tick % 4 == 0
        r1 = tick_radius
        r2 = tick_radius + (size * 0.016 if major else size * 0.008)
        color = CYAN if major else (58, 63, 115)
        alpha = 210 if major else 120
        ring_draw.line(
            [(cx + math.cos(angle) * r1, cy + math.sin(angle) * r1), (cx + math.cos(angle) * r2, cy + math.sin(angle) * r2)],
            fill=color + (alpha,),
            width=max(2, int(size * 0.0035)),
        )

    image = Image.alpha_composite(image, rings)

    fingerprint = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fp_draw = ImageDraw.Draw(fingerprint)
    arcs = [
        (0.145, 210, 330, 4),
        (0.115, 200, 340, 3),
        (0.085, 190, 350, 3),
    ]
    for radius_ratio, start, end, width in arcs:
        radius = size * radius_ratio
        box = [cx - radius, cy - radius, cx + radius, cy + radius]
        fp_draw.arc(box, start=start, end=end, fill=CYAN + (220,), width=max(2, int(size * 0.005)))
        fp_draw.arc(box, start=end, end=start + 360, fill=CYAN + (110,), width=max(2, int(size * 0.003)))

    fp_draw.line(
        [(cx, cy - size * 0.20), (cx, cy + size * 0.20)],
        fill=CYAN + (235,),
        width=int(size * 0.008),
    )
    fp_draw.ellipse(
        [cx - size * 0.014, cy - size * 0.214, cx + size * 0.014, cy - size * 0.186],
        fill=CYAN + (255,),
    )
    fp_draw.ellipse(
        [cx - size * 0.014, cy + size * 0.186, cx + size * 0.014, cy + size * 0.214],
        fill=VIOLET + (255,),
    )
    fp_draw.ellipse(
        [cx - size * 0.028, cy - size * 0.028, cx + size * 0.028, cy + size * 0.028],
        outline=LIME + (180,),
        width=max(2, int(size * 0.004)),
    )
    fingerprint = Image.composite(fingerprint, Image.new("RGBA", (size, size), (0, 0, 0, 0)), inner_mask)
    image = Image.alpha_composite(image, fingerprint)

    # Vignette corners back to ink so the icon reads on any background.
    vignette = Image.new("L", (size, size), 0)
    vignette_draw = ImageDraw.Draw(vignette)
    vignette_draw.ellipse(
        [cx - size * 0.46, cy - size * 0.46, cx + size * 0.46, cy + size * 0.46],
        fill=255,
    )
    vignette = vignette.filter(ImageFilter.GaussianBlur(size * 0.03))
    ink = Image.new("RGBA", (size, size), INK + (255,))
    image = Image.composite(image, ink, vignette)

    final = image.resize((512, 512), Image.LANCZOS).convert("RGB")
    for target in TARGETS:
        target.parent.mkdir(parents=True, exist_ok=True)
        final.save(target, "PNG", optimize=True)
        print("wrote", target, target.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
