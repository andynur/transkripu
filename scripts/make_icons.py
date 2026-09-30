"""Rasterize the Transkripu logo (static/favicon.svg geometry) to favicon.ico + PNG icons, stdlib only.

Run: python3 scripts/make_icons.py  (writes into static/)
"""
import struct, sys, zlib
from pathlib import Path

OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "static"
C0, C1 = (0x0C, 0x66, 0xE4), (0x00, 0x55, 0xCC)
# glyph in 24-unit box: translate(3,3) scale(.75) of "M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2", stroke 2.2
S, T = 0.75, 3
BARS = [(x * S + T, a * S + T, b * S + T) for x, a, b in
        [(4, 10, 14), (8, 7, 17), (12, 4, 20), (16, 8, 16), (20, 11, 13)]]
R = 2.2 * S / 2


def sdf_rrect(x, y, half, r):
    qx, qy = abs(x - half) - (half - r), abs(y - half) - (half - r)
    ox, oy = max(qx, 0), max(qy, 0)
    return (ox * ox + oy * oy) ** .5 + min(max(qx, qy), 0) - r


def sdf_bars(x, y):
    d = 1e9
    for bx, a, b in BARS:
        cy = min(max(y, a), b)
        d = min(d, ((x - bx) ** 2 + (y - cy) ** 2) ** .5 - R)
    return d


def render(n, radius=4.0):
    px = 24 / n  # units per pixel
    rows = []
    for j in range(n):
        row = bytearray([0])
        for i in range(n):
            x, y = (i + .5) * px, (j + .5) * px
            a_bg = min(max(.5 - sdf_rrect(x, y, 12, radius) / px, 0), 1)
            a_fg = min(max(.5 - sdf_bars(x, y) / px, 0), 1)
            t = min(max((x + y) / 48, 0), 1)
            bg = [c0 + (c1 - c0) * t for c0, c1 in zip(C0, C1)]
            col = [b + (255 - b) * a_fg for b in bg]
            row += bytes([round(c) for c in col] + [round(255 * a_bg)])
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", n, n, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def ico(sizes):
    pngs = [render(n) for n in sizes]
    head = struct.pack("<HHH", 0, 1, len(sizes))
    off, dirs = 6 + 16 * len(sizes), b""
    for n, p in zip(sizes, pngs):
        dirs += struct.pack("<BBBBHHII", n % 256, n % 256, 0, 0, 1, 32, len(p), off)
        off += len(p)
    return head + dirs + b"".join(pngs)


(OUT / "favicon.ico").write_bytes(ico([16, 32, 48]))
# apple-touch: full square, iOS applies its own mask
(OUT / "apple-touch-icon.png").write_bytes(render(180, radius=0.001))
(OUT / "icon-192.png").write_bytes(render(192))
(OUT / "icon-512.png").write_bytes(render(512))
