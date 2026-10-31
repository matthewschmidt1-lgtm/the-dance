"""Generate a seamless handmade-paper texture for the hero headline.

Warm rag-paper base, soft mottling like pulp density, scattered plant fibers,
and fine grain. Every layer wraps around the edges, so it tiles without seams.
Run: python3 tools/make_paper.py
"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter

S = 512
rng = random.Random(11)
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'img', 'paper.webp')


def wrap_noise(cells, blur):
    """Low-frequency noise that tiles: a small random grid, tiled 3x3, smoothed, centre crop."""
    small = Image.new('L', (cells, cells))
    small.putdata([rng.randint(0, 255) for _ in range(cells * cells)])
    big = Image.new('L', (cells * 3, cells * 3))
    for i in range(3):
        for j in range(3):
            big.paste(small, (i * cells, j * cells))
    big = big.resize((S * 3, S * 3), Image.BICUBIC).filter(ImageFilter.GaussianBlur(blur))
    return big.crop((S, S, S * 2, S * 2))


base = (241, 233, 216)
img = Image.new('RGB', (S, S), base)
px = img.load()
mottle = wrap_noise(10, 18).load()
cloud = wrap_noise(24, 6).load()
for y in range(S):
    for x in range(S):
        m = (mottle[x, y] - 128) / 128 * 9 + (cloud[x, y] - 128) / 128 * 4 + rng.gauss(0, 2.2)
        r, g, b = base
        px[x, y] = (int(r + m), int(g + m * 0.95), int(b + m * 0.8))

# Plant fibers: short, faintly curved strands, drawn on a 3x3 canvas so they wrap.
fib = Image.new('RGBA', (S * 3, S * 3), (0, 0, 0, 0))
d = ImageDraw.Draw(fib)
for _ in range(260):
    x, y = rng.uniform(0, S), rng.uniform(0, S)
    a = rng.uniform(0, math.pi)
    length = rng.uniform(10, 46)
    bend = rng.uniform(-0.012, 0.012)
    dark = rng.random() < 0.6
    col = (150, 132, 104, rng.randint(26, 60)) if dark else (255, 252, 244, rng.randint(40, 80))
    pts = []
    for k in range(10):
        t = k / 9 * length
        pts.append((x + math.cos(a + bend * t) * t, y + math.sin(a + bend * t) * t))
    for ox in (0, S, 2 * S):
        for oy in (0, S, 2 * S):
            d.line([(px_ + ox, py_ + oy) for px_, py_ in pts], fill=col, width=1)
fib = fib.crop((S, S, S * 2, S * 2)).filter(ImageFilter.GaussianBlur(0.4))
img = Image.alpha_composite(img.convert('RGBA'), fib)

# A few flecks of seed and bark, the way handmade paper keeps bits of the plant.
fl = Image.new('RGBA', (S, S), (0, 0, 0, 0))
fd = ImageDraw.Draw(fl)
for _ in range(40):
    x, y, r = rng.uniform(0, S), rng.uniform(0, S), rng.uniform(0.6, 1.6)
    fd.ellipse((x - r, y - r, x + r, y + r), fill=(120, 98, 70, rng.randint(50, 110)))
img = Image.alpha_composite(img, fl)

img.convert('RGB').save(out, 'WEBP', quality=88)
print('wrote', os.path.abspath(out), os.path.getsize(out), 'bytes')
