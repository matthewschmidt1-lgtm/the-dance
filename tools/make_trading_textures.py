"""Draw the trading desk's screens and handwritten notes as textures for render_envs.py.

Run:  python3 tools/make_trading_textures.py
Writes PNGs into tools/blender/tex/. The ticker, prices and headlines are invented.
"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'blender', 'tex')
os.makedirs(OUT, exist_ok=True)
SUP = '/System/Library/Fonts/Supplemental/'
MONO = '/System/Library/Fonts/Menlo.ttc'
SANS = '/System/Library/Fonts/SFNS.ttf'
HAND = SUP + 'Bradley Hand Bold.ttf'
NOTE = '/System/Library/Fonts/Noteworthy.ttc'

BG = (10, 16, 18)
GRID = (28, 40, 43)
INK = (196, 208, 204)
DIM = (110, 126, 124)
TEAL = (64, 178, 166)
RED = (214, 92, 78)
AMBER = (214, 168, 86)


def font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()


def series(n, seed, shape):
    r = random.Random(seed)
    out, p = [], 0.0
    for i in range(n):
        p += shape(i / (n - 1)) + r.gauss(0, 0.55)
        out.append(p)
    return out


def candles(d, box, closes, seed, up=TEAL, down=RED):
    x0, y0, x1, y1 = box
    r = random.Random(seed)
    lo, hi = min(closes) - 1.5, max(closes) + 1.5
    Y = lambda v: y1 - (v - lo) / (hi - lo) * (y1 - y0)
    w = (x1 - x0) / len(closes)
    prev = closes[0]
    for i, c in enumerate(closes):
        o = prev
        h, l = max(o, c) + abs(r.gauss(0, 0.7)), min(o, c) - abs(r.gauss(0, 0.7))
        cx = x0 + w * (i + 0.5)
        col = up if c >= o else down
        d.line([(cx, Y(h)), (cx, Y(l))], fill=col, width=2)
        d.rectangle([cx - w * 0.32, min(Y(o), Y(c)), cx + w * 0.32, max(Y(o), Y(c)) + 1], fill=col)
        prev = c
    return Y


def grid(d, box, nx=8, ny=5):
    x0, y0, x1, y1 = box
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        d.line([(x, y0), (x, y1)], fill=GRID, width=1)
    for j in range(ny + 1):
        y = y0 + (y1 - y0) * j / ny
        d.line([(x0, y), (x1, y)], fill=GRID, width=1)


def glow(img, radius=3):
    # A little bloom so the screens read as light, not print.
    blur = img.filter(ImageFilter.GaussianBlur(radius))
    return Image.blend(img, blur, 0.35)


def center_screen():
    W, H = 1600, 900
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    f_big, f_mid, f_small = font(SANS, 54), font(MONO, 30), font(MONO, 22)
    d.text((48, 34), 'HLX', font=font(SANS, 64), fill=INK)
    d.text((200, 52), 'Halcyon Logistics', font=font(SANS, 34), fill=DIM)
    d.text((48, 118), '41.62', font=f_big, fill=RED)
    d.text((230, 132), '-3.8%  today', font=f_mid, fill=RED)
    box = (48, 210, 1300, 820)
    grid(d, box)
    # Rose steadily, rolled over, and has been sliding for weeks.
    raw = series(64, 4, lambda t: 0.35 if t < 0.42 else (0.0 if t < 0.52 else -1.0))
    k = (41.62 - 52) / (raw[-1] - raw[0])
    closes = [52 + (c - raw[0]) * k for c in raw]
    Y = candles(d, box, closes, 9)
    # Entry line and the written stop.
    for price, col, label in ((52.0, DIM, 'ENTRY 52.00'), (47.8, AMBER, 'YOUR LINE 47.80')):
        y = Y(price)
        for x in range(box[0], box[2], 22):
            d.line([(x, y), (x + 12, y)], fill=col, width=2)
        d.text((box[0] + 14, y - 32), label, font=f_small, fill=col)
    # Position panel.
    px = 1320
    d.rounded_rectangle([px, 210, W - 40, 520], 12, outline=(60, 34, 30), width=2, fill=(26, 14, 14))
    d.text((px + 24, 230), 'LONG 880 HLX', font=f_small, fill=DIM)
    d.text((px + 24, 266), '-9,140', font=font(SANS, 58), fill=RED)
    d.text((px + 24, 340), 'Open loss  -20.0%', font=font(MONO, 20), fill=RED)
    d.text((px + 24, 392), 'Held 23 days', font=f_small, fill=DIM)
    d.text((px + 24, 430), 'Bought at 52.00', font=f_small, fill=DIM)
    d.text((px + 24, 468), 'Risk limit -8%', font=f_small, fill=AMBER)
    return glow(img)


def left_screen():
    W, H = 1600, 900
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    r = random.Random(3)
    d.text((48, 34), 'WATCHLIST', font=font(MONO, 30), fill=DIM)
    names = ['ARDN', 'BRVX', 'CELT', 'DORA', 'EMBR', 'FOXR', 'GRNT', 'HLX', 'IONA', 'JUNO', 'KELP', 'LUMA']
    for i, n in enumerate(names):
        y = 100 + i * 60
        ch = r.uniform(-4, 3) if n != 'HLX' else -3.8
        col = TEAL if ch >= 0 else RED
        d.text((48, y), n, font=font(MONO, 34), fill=INK)
        d.text((260, y), f'{r.uniform(12, 240):7.2f}', font=font(MONO, 34), fill=INK)
        d.text((520, y), f'{ch:+.1f}%', font=font(MONO, 34), fill=col)
        spark = series(24, i + 20, lambda t, c=ch: c / 12)
        lo, hi = min(spark), max(spark) + 0.01
        pts = [(700 + k * 14, y + 34 - (v - lo) / (hi - lo) * 30) for k, v in enumerate(spark)]
        d.line(pts, fill=col, width=3)
    # A muted heat map of the market, mostly red.
    for gx in range(6):
        for gy in range(8):
            v = r.uniform(-1, 0.45)
            col = tuple(int(BG[k] + (RED if v < 0 else TEAL)[k] * abs(v) * 0.55) for k in range(3))
            d.rectangle([1080 + gx * 82, 100 + gy * 92, 1080 + gx * 82 + 76, 100 + gy * 92 + 86], fill=col)
    return glow(img)


def right_screen():
    W, H = 1600, 900
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((48, 34), 'NEWS', font=font(MONO, 30), fill=DIM)
    items = [
        ('20:41', 'Halcyon largest customer said to review contract', AMBER),
        ('20:12', 'Freight volumes fall for a fourth month', INK),
        ('19:30', 'Analyst trims Halcyon target, keeps rating', INK),
        ('18:05', 'Rates: long yields at a 14-month high', INK),
        ('16:01', 'Close: transports lead decline', INK),
        ('14:22', 'Halcyon CFO to present at conference Tuesday', DIM),
    ]
    for i, (t, h, col) in enumerate(items):
        y = 110 + i * 92
        d.text((48, y), t, font=font(MONO, 30), fill=DIM)
        d.text((190, y - 2), h, font=font(SANS, 36), fill=col)
        d.line([(48, y + 70), (W - 48, y + 70)], fill=GRID, width=1)
    # Order book: sellers stacked at every level above.
    d.text((48, 680), 'BOOK  HLX', font=font(MONO, 26), fill=DIM)
    for i in range(5):
        y = 720 + i * 32
        d.rectangle([260, y, 260 + 60 * (5 - i) + 40, y + 22], fill=(70, 30, 28))
        d.text((48, y - 4), f'{41.70 + i * 0.05:.2f}', font=font(MONO, 24), fill=RED)
        d.rectangle([900, y, 900 + 30 * (i + 1), y + 22], fill=(22, 60, 56))
        d.text((700, y - 4), f'{41.60 - i * 0.05:.2f}', font=font(MONO, 24), fill=TEAL)
    return glow(img)


def paper(size, color, lines, fnt, ink=(38, 44, 70), tilt=0.0, ruled=False, seed=1):
    W, H = size
    img = Image.new('RGB', (W, H), color)
    d = ImageDraw.Draw(img)
    r = random.Random(seed)
    for _ in range(W * H // 40):   # paper grain
        x, y = r.randrange(W), r.randrange(H)
        v = r.randint(-10, 6)
        d.point((x, y), fill=tuple(max(0, min(255, c + v)) for c in color))
    if ruled:
        for y in range(126, H, 78):
            d.line([(30, y), (W - 30, y)], fill=(170, 190, 210), width=2)
        d.line([(110, 0), (110, H)], fill=(220, 150, 150), width=2)
    y = 60
    for text, size_px, col in lines:
        f = font(fnt, size_px)
        d.text((130 if ruled else 50, y), text, font=f, fill=col or ink)
        y += int(size_px * 1.35)
    img = img.rotate(tilt, resample=Image.BICUBIC, fillcolor=color)
    return img


def main():
    center_screen().save(os.path.join(OUT, 'screen-center.png'))
    left_screen().save(os.path.join(OUT, 'screen-left.png'))
    right_screen().save(os.path.join(OUT, 'screen-right.png'))
    paper((900, 1160), (238, 233, 220), [
        ('HLX  long @ 52', 64, None),
        ('Original thesis:', 58, None),
        ('Strong fundamentals.', 58, None),
        ('Temporary market', 58, None),
        ('weakness.', 58, None),
        ('', 30, None),
        ('Out if wrong.', 58, (150, 40, 34)),
    ], HAND, ruled=True, seed=2).save(os.path.join(OUT, 'note-thesis.png'))
    paper((600, 600), (240, 214, 120), [
        ('MAX LOSS', 70, None),
        ('PER TRADE', 58, None),
        ('-8%', 120, (150, 40, 34)),
        ('Know your exit', 50, None),
    ], NOTE, ink=(40, 36, 30), seed=3).save(os.path.join(OUT, 'sticky-risk.png'))
    print('textures ->', OUT)


if __name__ == '__main__':
    main()
