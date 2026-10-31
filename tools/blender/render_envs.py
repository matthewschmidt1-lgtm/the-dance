"""Build and render The Dance's environments in Blender.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/render_envs.py -- <repo_root> [env ...] [--samples N]

For each environment this renders up to three 1600x900 WebP layers into public/img/env/:
  <env>-bg.webp   everything behind the characters
  <env>-mid.webp  transparent layer between "far" and "back" characters (glass, fences)
  <env>-fg.webp   transparent layer in front of "back" characters (counters, tables, trucks)
Hidden layers still cast shadows and bounce light, so the passes composite cleanly.

It also writes public/js/env-data.js: where characters stand (projected through the real
camera, with a scale for a 1.72 m adult) and named camera targets.
"""
import bpy, bmesh, json, math, os, random, sys
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ROOT = argv[0] if argv else os.getcwd()
SAMPLES = 96
if '--samples' in argv:
    SAMPLES = int(argv[argv.index('--samples') + 1])
ONLY = [a for a in argv[1:] if not a.startswith('--') and not a.isdigit()]
OUT = os.path.join(ROOT, 'public', 'img', 'env')
DATA = os.path.join(ROOT, 'public', 'js', 'env-data.js')
W, H = 1600, 900
FIG_UNITS = 560      # height of a figure in the SVG character system
PERSON_M = 1.72      # metres that figure represents
os.makedirs(OUT, exist_ok=True)


# ─────────────────────────────── helpers

def hexc(h, a=1.0):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, a)


_mats = {}
def mat(color, rough=0.6, metal=0.0, emit=None, emit_strength=0.0, alpha=1.0, spec=0.4):
    key = (color, rough, metal, emit, emit_strength, alpha)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(f'm{len(_mats)}')
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = hexc(color)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if 'Specular IOR Level' in p.inputs:
        p.inputs['Specular IOR Level'].default_value = spec
    if emit:
        p.inputs['Emission Color'].default_value = hexc(emit)
        p.inputs['Emission Strength'].default_value = emit_strength
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            pass
    _mats[key] = m
    return m


COLL = {}
def coll(name):
    if name not in COLL:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
        COLL[name] = c
    return COLL[name]


def _finish(name, bm, m, layer, smooth=False, bevel=0.0):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    coll(layer).objects.link(ob)
    if isinstance(m, list):
        for mm in m:
            ob.data.materials.append(mm)
    else:
        ob.data.materials.append(m)
    if bevel:
        mod = ob.modifiers.new('bev', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        mod.limit_method = 'ANGLE'
    return ob


def boxes(name, items, m, layer='bg', bevel=0.0):
    """items: (cx, cy, cz, sx, sy, sz[, rz]) with cz = bottom of the box."""
    bm = bmesh.new()
    for it in items:
        cx, cy, cz, sx, sy, sz = it[:6]
        rz = it[6] if len(it) > 6 else 0
        v = bmesh.ops.create_cube(bm, size=1.0)['verts']
        bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=v)
        if rz:
            bmesh.ops.rotate(bm, verts=v, cent=(0, 0, 0), matrix=Matrix.Rotation(rz, 3, 'Z'))
        bmesh.ops.translate(bm, vec=(cx, cy, cz + sz / 2), verts=v)
    return _finish(name, bm, m, layer, bevel=bevel)


def box(name, c, s, m, layer='bg', rot=None, bevel=0.0):
    ob = boxes(name, [(0, 0, 0, *s)], m, layer, bevel)
    ob.location = c
    if rot:
        ob.rotation_euler = rot
    return ob


def cyl(name, c, r, h, m, layer='bg', seg=32, r2=None, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    bmesh.ops.translate(bm, vec=(0, 0, h / 2), verts=bm.verts)
    ob = _finish(name, bm, m, layer, smooth=True)
    ob.location = c
    if rot:
        ob.rotation_euler = rot
    return ob


def ball(name, c, r, m, layer='bg', scale=(1, 1, 1), sub=3):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    ob = _finish(name, bm, m, layer, smooth=True)
    ob.location = c
    ob.scale = scale
    return ob


def prism(name, x0, x1, y0, y1, z0, ridge, m, layer='bg', axis='x'):
    """Gable roof: ridge runs along `axis`."""
    bm = bmesh.new()
    if axis == 'x':
        ym = (y0 + y1) / 2
        pts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, ym, ridge), (x1, ym, ridge)]
        faces = [(0, 1, 5, 4), (3, 2, 5, 4), (0, 3, 4), (1, 2, 5), (0, 1, 2, 3)]
    else:
        xm = (x0 + x1) / 2
        pts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (xm, y0, ridge), (xm, y1, ridge)]
        faces = [(0, 3, 5, 4), (1, 2, 5, 4), (0, 1, 4), (3, 2, 5), (0, 1, 2, 3)]
    vs = [bm.verts.new(p) for p in pts]
    for f in faces:
        bm.faces.new([vs[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(name, bm, m, layer)


def text(name, body, c, size, m, layer='bg', align='CENTER', rot=(math.radians(90), 0, 0), extrude=0.002):
    cu = bpy.data.curves.new(name, 'FONT')
    cu.body = body
    cu.size = size
    cu.align_x = align
    cu.align_y = 'CENTER'
    cu.extrude = extrude
    ob = bpy.data.objects.new(name, cu)
    coll(layer).objects.link(ob)
    ob.data.materials.append(m)
    ob.location = c
    ob.rotation_euler = rot
    return ob


def area(name, c, size, energy, color='#fff6e8', rot=(0, 0, 0), shape='RECTANGLE', sy=None):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy
    ld.color = hexc(color)[:3]
    ld.shape = shape
    ld.size = size
    if sy:
        ld.size_y = sy
    ob = bpy.data.objects.new(name, ld)
    coll('lights').objects.link(ob)
    ob.location = c
    ob.rotation_euler = rot
    return ob


def sun(rot, energy, color='#fff1dc', angle=2.0):
    ld = bpy.data.lights.new('sun', 'SUN')
    ld.energy = energy
    ld.color = hexc(color)[:3]
    ld.angle = math.radians(angle)
    ob = bpy.data.objects.new('sun', ld)
    coll('lights').objects.link(ob)
    ob.rotation_euler = [math.radians(a) for a in rot]
    return ob


def world(color, strength=1.0):
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    bgn = w.node_tree.nodes.get('Background')
    bgn.inputs['Color'].default_value = hexc(color)
    bgn.inputs['Strength'].default_value = strength
    bpy.context.scene.world = w


def camera(loc, target, lens):
    cd = bpy.data.cameras.new('cam')
    cd.lens = lens
    cd.sensor_width = 36
    ob = bpy.data.objects.new('cam', cd)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = ob
    bpy.context.view_layer.update()
    return ob


def project(p):
    sc = bpy.context.scene
    v = world_to_camera_view(sc, sc.camera, Vector(p))
    return v.x * W, (1 - v.y) * H


def spot(p):
    x, y = project(p)
    _, top = project((p[0], p[1], p[2] + PERSON_M))
    return {'x': round(x, 1), 'y': round(y, 1), 's': round((y - top) / FIG_UNITS, 3)}


def point(p, s=1.0):
    x, y = project(p)
    return {'x': round(x, 1), 'y': round(y, 1), 's': s}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    COLL.clear()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.render.resolution_percentage = 100
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = 'GPU'
    except Exception as e:
        print('GPU unavailable, using CPU:', e)
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
    sc.view_settings.exposure = -0.25
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.quality = 84


def render(env):
    sc = bpy.context.scene
    layers = [l for l in ('bg', 'mid', 'fg') if l in COLL and len(COLL[l].objects)]
    for layer in layers:
        for name, c in COLL.items():
            if name == 'lights':
                continue
            for ob in c.objects:
                ob.visible_camera = (name == layer)
        sc.render.film_transparent = layer != 'bg'
        sc.render.image_settings.color_mode = 'RGB' if layer == 'bg' else 'RGBA'
        sc.render.filepath = os.path.join(OUT, f'{env}-{layer}.webp')
        bpy.ops.render.render(write_still=True)
        print('rendered', sc.render.filepath)
    return layers


rand = random.Random(7)
PAL = ['#b5523b', '#d9a441', '#4f7a5a', '#3f6c8c', '#c9c2a8', '#8a4b6b', '#e8dcc4', '#5d5f8a', '#a35f3a', '#7c8f4e', '#d36f4f', '#e8c56a', '#f1ece0', '#2f5d7c']


def products(name, x0, x1, y, z, depth, layer='bg', facing='-y', rng=rand):
    """A row of packaged goods on a shelf, grouped by colour into a few meshes."""
    by = {}
    x = x0
    while x < x1:
        w = rng.uniform(0.07, 0.17)
        h = rng.uniform(0.14, 0.32)
        d = rng.uniform(0.18, depth)
        col = PAL[rng.randrange(len(PAL))]
        if facing == '-y':
            by.setdefault(col, []).append((x + w / 2, y - d / 2, z, w - 0.012, d, h))
        else:  # along y, facing +x or -x
            by.setdefault(col, []).append((y + (d / 2 if facing == '+x' else -d / 2), x + w / 2, z, d, w - 0.012, h))
        x += w
    for col, items in by.items():
        boxes(f'{name}-{col}', items, mat(col, 0.55), layer)


def shelf_run(name, x0, x1, y, layer='bg', boards=(0.12, 0.52, 0.92, 1.32, 1.72), height=2.05, depth=0.48):
    body = mat('#cfc8b8', 0.7)
    edge = mat('#9f9789', 0.5)
    boxes(f'{name}-back', [((x0 + x1) / 2, y + 0.03, 0, x1 - x0, 0.06, height)], body, layer)
    boxes(f'{name}-boards', [((x0 + x1) / 2, y - depth / 2, z - 0.03, x1 - x0, depth, 0.03) for z in boards], body, layer)
    boxes(f'{name}-lips', [((x0 + x1) / 2, y - depth + 0.01, z - 0.05, x1 - x0, 0.02, 0.07) for z in boards], edge, layer)
    ups = [(x, y - depth / 2, 0, 0.04, depth, height) for x in [x0 + i * 1.2 for i in range(int((x1 - x0) / 1.2) + 1)]]
    boxes(f'{name}-ups', ups, edge, layer)
    for i, z in enumerate(boards):
        products(f'{name}-p{i}', x0 + 0.03, x1 - 0.03, y, z, depth - 0.04, layer)


def shelf_run_y(name, y0, y1, x, facing, layer='bg', boards=(0.12, 0.52, 0.92, 1.32, 1.72), height=2.05, depth=0.48):
    body = mat('#cfc8b8', 0.7)
    sgn = 1 if facing == '+x' else -1
    boxes(f'{name}-back', [(x - sgn * 0.03, (y0 + y1) / 2, 0, 0.06, y1 - y0, height)], body, layer)
    boxes(f'{name}-boards', [(x + sgn * depth / 2, (y0 + y1) / 2, z - 0.03, depth, y1 - y0, 0.03) for z in boards], body, layer)
    for i, z in enumerate(boards):
        products(f'{name}-p{i}', y0 + 0.03, y1 - 0.03, x, z, depth - 0.04, layer, facing=facing)


def office_chair(name, x, y, layer='bg', facing=0.0, col='#2c3036'):
    m = mat(col, 0.55)
    metal = mat('#8c9096', 0.3, 0.8)
    o1 = box(f'{name}-seat', (x, y, 0.44), (0.5, 0.48, 0.08), m, layer, bevel=0.03)
    o2 = box(f'{name}-back', (x, y - 0.24 * math.cos(facing), 0.52), (0.48, 0.07, 0.58), m, layer, bevel=0.03)
    cyl(f'{name}-post', (x, y, 0.1), 0.025, 0.34, metal, layer)
    for i in range(5):
        a = facing + i * 2 * math.pi / 5
        box(f'{name}-leg{i}', (x + math.sin(a) * 0.15, y + math.cos(a) * 0.15, 0.06), (0.04, 0.3, 0.03), metal, layer, rot=(0, 0, -a))
    o2.rotation_euler = (0, 0, facing)


def desk(name, cx, cy, w, d, layer='bg', top='#cfc6b6', leg='#8c9096'):
    box(f'{name}-top', (cx, cy, 0.72), (w, d, 0.035), mat(top, 0.45), layer, bevel=0.006)
    lm = mat(leg, 0.35, 0.7)
    boxes(f'{name}-legs', [(cx + sx * (w / 2 - 0.06), cy + sy * (d / 2 - 0.06), 0, 0.04, 0.04, 0.72) for sx in (-1, 1) for sy in (-1, 1)], lm, layer)


def bookshelf(name, x, y, w, layer='bg'):
    shelf_run(name, x - w / 2, x + w / 2, y, layer, boards=(0.05, 0.45, 0.85, 1.25, 1.65), height=1.95, depth=0.32)


# ─────────────────────────────── environments

def env_checkout():
    world('#e9e4d8', 0.35)
    floor = mat('#d6d1c6', 0.32, spec=0.5)
    box('floor', (0, 6, -0.01), (40, 30, 0.01), floor)
    box('wall', (0, 13.6, 0), (40, 0.2, 4), mat('#e6e0d2', 0.9))
    box('ceiling', (0, 6, 3.4), (40, 30, 0.05), mat('#d9d2c2', 0.9))
    panel = mat('#ffffff', 0.5, emit='#fff8ea', emit_strength=6)
    boxes('panels', [(x, y, 3.37, 1.6, 0.3, 0.03) for x in (-6, -2, 2, 6) for y in (0, 3.5, 7, 10)], panel)
    for x in (-6, -2, 2, 6):
        for y in (1.5, 7):
            area(f'pl{x}{y}', (x, y, 3.3), 1.6, 260, '#fff4e2', sy=0.4)
    # Back wall of shelves, with an aisle opening on the left.
    shelf_run('s-left', -10, -5.75, 6.5)
    shelf_run('s-right', -4.15, 10, 6.5)
    # The aisle itself, receding into the store.
    shelf_run_y('aisle-l', 6.5, 13.4, -5.75, '+x')
    shelf_run_y('aisle-r', 6.5, 13.4, -4.15, '-x')
    green = mat('#2f6a52', 0.5)
    box('aisle-sign', (-4.95, 6.3, 2.55), (1.1, 0.06, 0.32), green)
    text('aisle-t', 'AISLE 9', (-4.95, 6.26, 2.71), 0.16, mat('#f2efe6', 0.5, emit='#f2efe6', emit_strength=0.6))
    cyl('aisle-wire-l', (-5.4, 6.3, 2.87), 0.006, 0.55, mat('#555', 0.5))
    cyl('aisle-wire-r', (-4.5, 6.3, 2.87), 0.006, 0.55, mat('#555', 0.5))
    # Lane sign
    cyl('lane-pole', (1.6, 1.6, 2.35), 0.025, 1.1, mat('#8c8a85', 0.4, 0.6))
    box('lane-sign', (1.6, 1.6, 2.1), (0.6, 0.12, 0.42), green, bevel=0.01)
    text('lane-t', '4', (1.6, 1.53, 2.31), 0.3, mat('#ffffff', 0.4, emit='#ffffff', emit_strength=0.8))
    box('promo', (-1.6, 3.2, 2.45), (2.2, 0.03, 0.42), mat('#c8483a', 0.6))
    text('promo-t', 'WEEKLY SPECIALS', (-1.6, 3.18, 2.45 + 0.21), 0.15, mat('#fff4e2', 0.5))
    boxes('promo-wires', [(-2.55, 3.2, 2.87, 0.01, 0.01, 0.55), (-0.65, 3.2, 2.87, 0.01, 0.01, 0.55)], mat('#555555', 0.5))

    # Foreground: the checkout counter and what's on it.
    fgreen = mat('#56685e', 0.55)
    box('counter', (1.0, 1.15, 0), (9.0, 0.72, 0.9), fgreen, 'fg', bevel=0.012)
    box('counter-stripe', (1.0, 0.785, 0.62), (9.0, 0.01, 0.08), green, 'fg')
    box('counter-top', (1.0, 1.15, 0.9), (9.04, 0.76, 0.035), mat('#c4c9cf', 0.25, 0.85), 'fg', bevel=0.006)
    box('belt', (-1.4, 1.1, 0.935), (3.4, 0.5, 0.025), mat('#232427', 0.7), 'fg')
    box('divider', (0.2, 1.1, 0.96), (0.04, 0.4, 0.05), mat('#888c92', 0.3, 0.6), 'fg')
    glass = mat('#3d6b38', 0.08, spec=0.9)
    cyl('bottle', (-0.9, 1.08, 0.96), 0.045, 0.22, glass, 'fg')
    cyl('bottle-neck', (-0.9, 1.08, 1.18), 0.018, 0.08, glass, 'fg')
    cyl('bottle-cap', (-0.9, 1.08, 1.26), 0.02, 0.025, mat('#b8902e', 0.3, 0.8), 'fg')
    cyl('bottle-label', (-0.9, 1.08, 1.02), 0.0465, 0.08, mat('#efe6c8', 0.6), 'fg')
    box('cereal', (-2.4, 1.12, 0.96), (0.2, 0.07, 0.3), mat('#c8483a', 0.6), 'fg')
    box('cereal-lbl', (-2.4, 1.084, 1.12), (0.15, 0.002, 0.08), mat('#f2e3b5', 0.6), 'fg')
    box('milk', (-0.25, 1.1, 0.96), (0.09, 0.09, 0.22), mat('#f3f3f0', 0.5), 'fg')
    box('milk-band', (-0.25, 1.054, 1.04), (0.092, 0.002, 0.05), mat('#4a7ec2', 0.5), 'fg')
    for i in range(4):
        ball(f'banana{i}', (-1.85 + i * 0.03, 1.1, 0.99), 0.03, mat('#e8c24a', 0.5), 'fg', scale=(3.2, 1, 1))
    dark = mat('#24262b', 0.4)
    cyl('term-pole', (0.45, 0.95, 0.93), 0.012, 0.22, mat('#4b4d52', 0.4, 0.5), 'fg')
    box('terminal', (0.45, 0.95, 1.12), (0.12, 0.08, 0.16), dark, 'fg', rot=(math.radians(-15), 0, 0), bevel=0.01)
    cyl('reg-pole', (2.05, 1.0, 0.93), 0.02, 0.38, mat('#4b4d52', 0.4, 0.5), 'fg')
    box('reg', (2.05, 1.0, 1.28), (0.5, 0.05, 0.3), dark, 'fg', bevel=0.01)
    box('reg-screen', (2.05, 0.972, 1.30), (0.44, 0.004, 0.24), mat('#0f1a14', 0.3, emit='#0f2a1e', emit_strength=0.8), 'fg')
    boxes('bagging', [(3.9, 1.15, 0.935, 2.6, 0.7, 0.02)], mat('#9aa0a6', 0.35, 0.6), 'fg')
    box('kick', (1.0, 0.79, 0), (9.0, 0.02, 0.12), mat('#3f4d45', 0.6), 'fg')
    boxes('seams', [(x, 0.785, 0.12, 0.012, 0.01, 0.5) for x in (-2.2, 0.4, 3.0)], mat('#4a5a51', 0.6), 'fg')
    # Impulse rack on the customer side.
    rack = mat('#3a3d42', 0.4, 0.5)
    box('rack', (-2.7, 0.62, 0), (1.1, 0.3, 1.25), rack, 'fg', bevel=0.01)
    r2 = random.Random(11)
    for i, z in enumerate((0.25, 0.6, 0.95)):
        boxes(f'rack-sh{i}', [(-2.7, 0.5, z - 0.02, 1.06, 0.3, 0.02)], mat('#9aa0a6', 0.35, 0.6), 'fg')
        by = {}
        x = -3.2
        while x < -2.2:
            w = r2.uniform(0.05, 0.1)
            by.setdefault(PAL[r2.randrange(len(PAL))], []).append((x + w / 2, 0.47, z, w - 0.01, 0.12, r2.uniform(0.1, 0.18)))
            x += w
        for c, it in by.items():
            boxes(f'rack-p{i}{c}', it, mat(c, 0.45), 'fg')

    camera((0.85, -2.9, 1.6), (0.85, 4, 1.34), 28)
    return {
        'spots': {
            'maya': spot((0.05, 1.85, 0)), 'dev': spot((-1.6, 5.4, 0)), 'dev_near': spot((-0.95, 1.95, 0)),
            'sigh': spot((2.15, -0.3, 0)), 'shopper1': spot((4.4, -0.2, 0)), 'shopper2': spot((5.4, 0.35, 0)),
        },
        'cams': {'register': point((2.05, 0.97, 1.42), 2.8), 'belt': point((-1.2, 1.1, 1.05), 2.2)},
        'points': {'reg': point((2.05, 0.97, 1.42)), 'reg_w': round(project((2.27, 0.97, 1.42))[0] - project((1.83, 0.97, 1.42))[0], 1)},
    }


def office_shell(kitchen=False):
    world('#cfe0ea', 0.9)
    box('floor', (0, 4, -0.01), (30, 20, 0.01), mat('#b5b0a6', 0.95))
    r0 = random.Random(5)
    tiles = {}
    for ix in range(-8, 14):
        for iy in range(-3, 8):
            tiles.setdefault(r0.choice(['#b1aca2', '#b9b4aa', '#adA89e'.lower()]), []).append((ix + 0.5, iy + 0.5, 0, 0.995, 0.995, 0.004))
    for c, it in tiles.items():
        boxes(f'tile{c}', it, mat(c, 0.95))
    wallm = mat('#e3e6e8', 0.9)
    # Back wall with a long window band.
    box('wall-low', (3, 7.1, 0), (24, 0.2, 0.85), wallm)
    box('wall-top', (3, 7.1, 2.75), (24, 0.2, 0.95), wallm)
    box('wall-left', (-6.5, 7.1, 0.85), (5, 0.2, 1.9), wallm)
    if kitchen:
        box('wall-right', (9.5, 7.1, 0.85), (9, 0.2, 1.9), wallm)
    cyl('clock', (2.2, 6.98, 3.05), 0.22, 0.04, mat('#f4f2ee', 0.5), rot=(math.radians(90), 0, 0))
    cyl('clock-rim', (2.2, 7.0, 3.05), 0.24, 0.03, mat('#2b2f36', 0.4), rot=(math.radians(90), 0, 0))
    boxes('clock-hands', [(2.2, 6.955, 3.0, 0.012, 0.004, 0.15), (2.24, 6.955, 3.05, 0.1, 0.004, 0.012)], mat('#1d2228', 0.5))
    for i, x in enumerate((-1, 3, 7)):
        cyl(f'pend{i}', (x, 4.6, 2.6), 0.28, 0.18, mat('#2b2f36', 0.4), r2=0.06)
        cyl(f'pend-cord{i}', (x, 4.6, 2.78), 0.006, 0.95, mat('#2b2f36', 0.4))
        ball(f'pend-bulb{i}', (x, 4.6, 2.6), 0.07, mat('#fff', 0.5, emit='#fff1d6', emit_strength=8))
        area(f'pend-l{i}', (x, 4.6, 2.55), 0.4, 60, '#fff1d6', rot=(0, 0, 0))
    frame = mat('#59636b', 0.4, 0.4)
    boxes('mullions', [(x, 7.1, 0.85, 0.08, 0.22, 1.9) for x in range(-4, 13, 2)], frame)
    box('sill', (4, 7.0, 0.82), (16, 0.35, 0.04), frame)
    box('ceiling', (3, 4, 3.7), (30, 20, 0.05), mat('#d2d6d9', 0.9))
    boxes('ceil-panels', [(x, y, 3.67, 1.2, 0.6, 0.02) for x in (-3, 1, 5, 9) for y in (1, 4)], mat('#fff', 0.5, emit='#fdfcf6', emit_strength=5))
    for x in (-3, 1, 5, 9):
        area(f'cl{x}', (x, 2.5, 3.6), 1.2, 220, '#fbf7ee', sy=0.6)
    # City outside.
    city = mat('#9fb2c0', 0.8)
    r = random.Random(3)
    for i, x in enumerate(range(-30, 50, 9)):
        c = r.choice(['#a9b8c4', '#c3ccd4', '#8d9ca8', '#b7c3cc'])
        boxes(f'city{i}', [(x + r.uniform(-2, 2), r.uniform(45, 80), 0, r.uniform(6, 12), r.uniform(6, 10), r.uniform(14, 55))], mat(c, 0.8))
    box('ground-out', (0, 30, -0.4), (120, 50, 0.1), mat('#8a9aa5', 0.9))
    sun((55, 0, 155), 2.2)
    # Ellen's glass office on the left.
    box('office-floor', (-5.3, 4.6, 0), (4.6, 4.8, 0.005), mat('#c3bdb2', 0.9))
    desk('office-desk', -5.4, 5.8, 1.8, 0.8, top='#7b6a5a', leg='#5c5048')
    office_chair('office-chair', -5.4, 6.5, facing=math.pi)
    box('office-rug', (-5.2, 4.6, 0.005), (3.2, 2.2, 0.006), mat('#8a6f5a', 0.95))
    box('office-art', (-5.4, 6.98, 1.6), (1.2, 0.03, 0.8), mat('#c9b18c', 0.6))
    box('office-art-in', (-5.4, 6.96, 1.6), (1.0, 0.01, 0.6), mat('#5d7f8f', 0.6))
    box('office-mon', (-5.4, 5.9, 0.76), (0.6, 0.04, 0.38), mat('#2b3036', 0.4), bevel=0.01)
    box('office-shelf', (-7.4, 4.5, 0), (0.4, 1.6, 1.8), mat('#9c8a76', 0.7))
    cyl('office-pot', (-3.4, 6.6, 0), 0.22, 0.45, mat('#c7a27a', 0.7))
    ball('office-plant', (-3.4, 6.6, 0.9), 0.4, mat('#4f7d52', 0.8), scale=(1, 1, 1.4))
    glassm = mat('#cfe8f2', 0.05, alpha=0.18, spec=1.0)
    gframe = mat('#6b757d', 0.35, 0.5)
    box('glass-front-a', (-6.0, 2.2, 0), (3.0, 0.02, 2.7), glassm, 'mid')
    box('glass-front-b', (-3.3, 2.2, 0), (1.0, 0.02, 2.7), glassm, 'mid')
    box('glass-side', (-2.8, 4.65, 0), (0.02, 4.9, 2.7), glassm, 'mid')
    boxes('glass-frames', [(-7.5, 2.2, 0, 0.06, 0.06, 2.7), (-4.5, 2.2, 0, 0.06, 0.06, 2.7), (-3.8, 2.2, 0, 0.06, 0.06, 2.7), (-2.8, 2.2, 0, 0.06, 0.06, 2.7),
                           (-5.2, 2.2, 2.68, 4.8, 0.08, 0.06), (-2.8, 4.65, 2.68, 0.08, 4.9, 0.06)], gframe, 'mid')
    text('door-name', 'E. MORROW', (-6.0, 2.18, 1.9), 0.11, mat('#4a5259', 0.5), 'mid')
    # Workstations in the middle of the room.
    span = (0.5, 4.2) if kitchen else (0.5, 8.5)
    part = mat('#7d8b95', 0.85)
    x0, x1 = span
    desk('desk-row', (x0 + x1) / 2, 4.6, x1 - x0, 1.6)
    box('partition', ((x0 + x1) / 2, 4.6, 0.755), (x1 - x0, 0.05, 0.42), part)
    box('rug', ((x0 + x1) / 2, 4.2, 0.006), (x1 - x0 + 1.2, 3.4, 0.006), mat('#7f8c94', 0.95))
    mons = [x for x in [1.2, 2.8, 4.4, 6.0, 7.6] if x < x1]
    boxes('monitors', [(x, 4.3, 0.83, 0.6, 0.03, 0.36) for x in mons] + [(x, 4.9, 0.83, 0.6, 0.03, 0.36) for x in mons], mat('#1f2328', 0.4))
    boxes('mon-stands', [(x, 4.3, 0.74, 0.06, 0.06, 0.1) for x in mons] + [(x, 4.9, 0.74, 0.06, 0.06, 0.1) for x in mons], mat('#2a2e34', 0.4))
    boxes('papers', [(x + 0.4, 4.05, 0.74, 0.22, 0.3, 0.01, 0.2) for x in mons], mat('#f4f2ee', 0.8))
    for i, x in enumerate(mons):
        office_chair(f'chair{i}', x, 3.45)
        cyl(f'deskmug{i}', (x - 0.42, 4.1, 0.74), 0.04, 0.09, mat(PAL[i * 3 % len(PAL)], 0.4))
    cyl('desk-plant-pot', (x1 - 0.25, 4.25, 0.74), 0.08, 0.14, mat('#c26b4a', 0.7))
    ball('desk-plant', (x1 - 0.25, 4.25, 0.98), 0.14, mat('#5f9161', 0.85), scale=(1, 1, 1.4))
    if not kitchen:
        bookshelf('books', 10.2, 6.95, 2.4)
    cyl('tall-pot', (9.6 if not kitchen else 4.9, 2.0 if not kitchen else 6.6, 0), 0.26, 0.5, mat('#3f4a52', 0.6))
    ball('tall-plant', (9.6 if not kitchen else 4.9, 2.0 if not kitchen else 6.6, 1.25), 0.45, mat('#4f7d52', 0.85), scale=(1, 1, 1.9), sub=2)
    if kitchen:
        km = mat('#c9c3b8', 0.6)
        box('k-counter', (7.0, 6.4, 0), (4.0, 0.7, 0.92), km, bevel=0.01)
        box('k-top', (7.0, 6.4, 0.92), (4.05, 0.74, 0.04), mat('#e9e5dd', 0.3))
        box('k-backsplash', (7.0, 6.98, 0.96), (4.0, 0.02, 0.6), mat('#dfe4e6', 0.3))
        boxes('k-shelf', [(7.0, 6.85, 1.85, 4.0, 0.25, 0.04)], mat('#9c8a76', 0.6))
        for i, x in enumerate((5.6, 5.8, 6.0, 7.6, 7.8)):
            cyl(f'k-shelf-mug{i}', (x, 6.85, 1.89), 0.045, 0.1, mat(PAL[(i * 5) % len(PAL)], 0.4))
        box('k-machine', (6.2, 6.45, 0.96), (0.45, 0.4, 0.55), mat('#2c2f35', 0.35, 0.3), bevel=0.02)
        box('k-machine-panel', (6.2, 6.24, 1.32), (0.32, 0.01, 0.1), mat('#4b6e8f', 0.3, emit='#4b6e8f', emit_strength=0.6))
        cyl('k-pot', (6.2, 6.3, 0.97), 0.08, 0.16, mat('#5a3a26', 0.1, spec=0.9))
        cyl('k-mug1', (7.0, 6.3, 0.96), 0.045, 0.1, mat('#e9e4da', 0.4))
        cyl('k-mug2', (7.2, 6.35, 0.96), 0.045, 0.1, mat('#c96a4a', 0.4))
        box('k-sign', (8.1, 6.99, 1.15), (1.1, 0.01, 0.55), mat('#f4f4f0', 0.7))
        ink = mat('#5a6470', 0.6)
        text('k-s1', 'PLEASE RINSE', (8.1, 6.98, 1.33), 0.11, ink)
        text('k-s2', 'YOUR MUG', (8.1, 6.98, 1.19), 0.11, ink)
        text('k-s3', '— Management (3rd notice)', (8.1, 6.98, 1.03), 0.05, ink)
        # A café table near the camera.
        cyl('cafe-top', (-1.9, -1.2, 0.72), 0.45, 0.03, mat('#8f7560', 0.4), 'fg')
        cyl('cafe-leg', (-1.9, -1.2, 0), 0.04, 0.72, mat('#3a3d42', 0.4, 0.6), 'fg')
        cyl('cafe-cup', (-1.75, -1.25, 0.75), 0.04, 0.09, mat('#f0ebe2', 0.4), 'fg')
    else:
        # Your desk in the foreground, monitor facing you.
        wood = mat('#8b6a4f', 0.45)
        box('my-desk', (-1.2, -1.25, 0.72), (3.8, 0.9, 0.04), wood, 'fg', bevel=0.008)
        box('my-desk-panel', (-1.2, -0.82, 0), (3.8, 0.03, 0.72), mat('#6f5440', 0.6), 'fg')
        box('my-mon', (-0.7, -0.95, 0.88), (0.84, 0.04, 0.5), mat('#1d2228', 0.35), 'fg', bevel=0.01)
        box('my-mon-stand', (-0.7, -0.92, 0.76), (0.08, 0.06, 0.13), mat('#2a2e34', 0.4), 'fg')
        scr = mat('#f4f6f8', 0.5, emit='#f4f6f8', emit_strength=1.6)
        box('my-screen', (-0.7, -0.975, 0.905), (0.78, 0.004, 0.44), scr, 'fg')
        t1 = mat('#1d2228', 0.5)
        text('h1', 'HENLEY SUMMARY', (-0.95, -0.98, 1.24), 0.055, t1, 'fg', align='LEFT')
        text('h2', 'Due Fri 12:00', (-0.95, -0.98, 1.17), 0.04, mat('#c0392b', 0.5, emit='#c0392b', emit_strength=0.4), 'fg', align='LEFT')
        boxes('h-lines', [(-0.75, -0.979, z, 0.5, 0.002, 0.018) for z in (1.08, 1.04, 1.0)], mat('#d5dbe1', 0.5), 'fg')
        box('keyboard', (-0.7, -1.35, 0.76), (0.45, 0.15, 0.02), mat('#2c3036', 0.5), 'fg')
        cyl('my-mug', (0.3, -1.3, 0.76), 0.045, 0.1, mat('#3f6c8c', 0.4), 'fg')
        cyl('my-pot', (-2.5, -1.2, 0.76), 0.1, 0.16, mat('#c26b4a', 0.7), 'fg')
        ball('my-plant', (-2.5, -1.2, 1.05), 0.16, mat('#4f7d52', 0.8), 'fg', scale=(1, 1, 1.5))

    camera((0.6, -4.6, 1.58), (0.6, 4, 1.3), 28)
    data = {
        'spots': {
            'dana_start': spot((5.6, 0.7, 0)), 'dana': spot((1.7, 0.45, 0)),
            'ellen_office': spot((-5.3, 4.9, 0)), 'ellen_out': spot((1.05, 1.9, 0)),
            'priya': spot((-0.4, 0.9, 0)), 'marcus': spot((2.5, 0.8, 0)), 'tom': spot((5.0, 5.6, 0)),
        },
        'cams': {'monitor': point((-0.7, -0.97, 1.05), 2.4) if not kitchen else point((8.1, 6.98, 1.2), 3.0)},
    }
    if kitchen:
        data['cams'] = {'sign': point((8.1, 6.98, 1.2), 3.0)}
    return data


def env_desks():
    return office_shell(False)


def env_kitchen():
    return office_shell(True)


def env_conference():
    world('#e6e2dc', 0.5)
    box('floor', (0, 2, -0.01), (20, 14, 0.01), mat('#8d8478', 0.85))
    wallm = mat('#e6e2dc', 0.9)
    box('wall', (0, 5.1, 0), (20, 0.2, 3.2), wallm)
    box('wainscot', (0, 5.0, 0), (20, 0.04, 0.9), mat('#d6cfc4', 0.8))
    box('wall-left', (-4.6, 2, 0), (0.2, 7, 3.2), wallm)
    box('ceiling', (0, 2, 3.2), (20, 14, 0.05), mat('#ece9e4', 0.9))
    area('key', (-2.5, 0.5, 3.1), 2.5, 520, '#fff3e2')
    area('fill', (2.5, 1.5, 3.1), 2.0, 260, '#eef3ff')
    # Window with blinds on the left wall.
    box('win', (-4.48, 1.6, 0.9), (0.02, 2.2, 1.7), mat('#eef3f5', 0.5, emit='#f6fafc', emit_strength=2.2))
    boxes('blinds', [(-4.45, 1.6, 0.95 + i * 0.09, 0.03, 2.2, 0.02) for i in range(18)], mat('#d5dcdf', 0.6))
    area('win-light', (-4.3, 1.6, 1.8), 1.8, 300, '#f4f8ff', rot=(0, math.radians(-90), 0))
    # Presentation screen with Jordan's (your) slide.
    box('screen-bezel', (1.2, 5.0, 1.0), (3.3, 0.05, 1.9), mat('#16191d', 0.35), bevel=0.01)
    slide = mat('#ffffff', 0.5, emit='#ffffff', emit_strength=1.2)
    box('slide', (1.2, 4.97, 1.06), (3.16, 0.004, 1.78), slide)
    ink = mat('#16191d', 0.5)
    text('s-title', 'Regional Cost Analysis', (-0.2, 4.96, 2.56), 0.16, ink, align='LEFT')
    text('s-sub', 'Q3 freight cost by region', (-0.2, 4.96, 2.38), 0.075, mat('#6b7280', 0.5), align='LEFT')
    blue, red = mat('#3f6c8c', 0.5), mat('#d1603d', 0.5)
    hs = [0.55, 0.8, 0.42, 0.95, 0.6]
    for i, hgt in enumerate(hs):
        boxes(f'bar{i}', [(-0.05 + i * 0.42, 4.965, 1.3, 0.26, 0.004, hgt)], red if i == 3 else blue)
    box('axis', (0.8, 4.965, 1.28), (2.2, 0.004, 0.012), mat('#c9cdd3', 0.5))
    text('s-note', 'Q2 freight spike', (1.95, 4.96, 2.25), 0.07, mat('#d1603d', 0.5), align='LEFT')
    text('s-foot', 'Prepared by J. Pike · v38', (2.68, 4.96, 1.18), 0.055, mat('#6b7280', 0.5), align='RIGHT')
    cyl('pot', (3.9, 4.6, 0), 0.25, 0.55, mat('#9c7b5f', 0.7))
    ball('plant', (3.9, 4.6, 1.15), 0.42, mat('#4f7d52', 0.8), scale=(1, 1, 1.6))
    # Chair backs behind the seated people.
    chair = mat('#2b2f36', 0.55)
    for x in (-2.6, -0.4):
        box(f'chair{x}', (x, 2.55, 0.45), (0.56, 0.1, 0.75), chair, bevel=0.04)
        box(f'seat{x}', (x, 2.3, 0.45), (0.56, 0.5, 0.08), chair, bevel=0.02)
        cyl(f'ped{x}', (x, 2.3, 0.08), 0.03, 0.37, mat('#8c9096', 0.3, 0.8))
        cyl(f'base{x}', (x, 2.3, 0), 0.28, 0.06, mat('#3a3d42', 0.4, 0.6))
    box('credenza', (1.2, 4.75, 0), (3.0, 0.45, 0.72), mat('#7a5c46', 0.45), bevel=0.01)
    boxes('cred-doors', [(0.45 + i * 0.75, 4.52, 0.08, 0.7, 0.01, 0.58) for i in range(3)], mat('#6b4e3c', 0.45))
    box('art', (-2.6, 5.0, 1.45), (1.3, 0.04, 0.9), mat('#2b2f36', 0.4))
    box('art-in', (-2.6, 4.975, 1.5), (1.15, 0.01, 0.75), mat('#d9a441', 0.6))
    box('art-in2', (-2.85, 4.97, 1.4), (0.5, 0.01, 0.45), mat('#3f6c8c', 0.6))
    cyl('cclock', (-0.6, 5.0, 2.55), 0.18, 0.04, mat('#f4f2ee', 0.5), rot=(math.radians(90), 0, 0))
    cyl('cclock-rim', (-0.6, 5.02, 2.55), 0.2, 0.03, mat('#2b2f36', 0.4), rot=(math.radians(90), 0, 0))
    box('ceil-light', (0.4, 1.8, 3.15), (2.4, 0.5, 0.04), mat('#fff', 0.5, emit='#fff8ec', emit_strength=4))
    # Table in the foreground.
    wood = mat('#6b4e3c', 0.35)
    box('table', (-1.1, 1.0, 0.72), (5.4, 1.6, 0.05), wood, 'fg', bevel=0.012)
    box('table-base', (-1.1, 1.0, 0), (3.0, 0.4, 0.72), mat('#4a372b', 0.5), 'fg')
    box('laptop', (-2.0, 0.8, 0.77), (0.36, 0.25, 0.015), mat('#aeb3ba', 0.3, 0.7), 'fg')
    box('laptop-lid', (-2.0, 0.95, 0.77), (0.36, 0.015, 0.24), mat('#c9ccd1', 0.3, 0.7), 'fg', rot=(math.radians(-12), 0, 0))
    box('paper', (-0.9, 0.55, 0.77), (0.22, 0.3, 0.002), mat('#f4f2ee', 0.8), 'fg', rot=(0, 0, math.radians(8)))
    cyl('glass1', (0.2, 0.7, 0.77), 0.035, 0.11, mat('#cfe6ef', 0.05, alpha=0.5, spec=1.0), 'fg')
    box('my-notebook', (-0.3, 0.3, 0.77), (0.24, 0.32, 0.012), mat('#2f4a6a', 0.6), 'fg')

    camera((-0.3, -3.9, 1.42), (0.4, 4, 1.45), 30)
    return {
        'spots': {
            'jordan': spot((2.95, 3.4, 0)),
            'ellen': spot((-0.4, 2.15, -0.42)), 'dana': spot((-2.6, 2.15, -0.42)),
        },
        'cams': {'screen': point((1.2, 4.97, 1.9), 1.55), 'footer': point((2.4, 4.96, 1.2), 3.6)},
    }


def house(name, x0, x1, y0, y1, h, wall_col, roof_col, door_x, door_col, windows, axis='x'):
    box(f'{name}-body', ((x0 + x1) / 2, (y0 + y1) / 2, 0), (x1 - x0, y1 - y0, h), mat(wall_col, 0.85))
    boxes(f'{name}-siding', [((x0 + x1) / 2, y0 - 0.005, z, x1 - x0, 0.01, 0.025) for z in [0.3 + i * 0.22 for i in range(int(h / 0.22))]], mat(wall_col, 0.9) if False else mat('#000000', 1.0, alpha=0.06))
    prism(f'{name}-roof', x0 - 0.35, x1 + 0.35, y0 - 0.4, y1 + 0.4, h, h + 2.0, mat(roof_col, 0.75), axis=axis)
    trim = mat('#f2efe9', 0.6)
    glass = mat('#7f9aac', 0.15, spec=0.8)
    for (wx, wz, ww, wh) in windows:
        box(f'{name}-wf{wx}', (wx, y0 - 0.04, wz - 0.06), (ww + 0.16, 0.06, wh + 0.12), trim)
        box(f'{name}-wg{wx}', (wx, y0 - 0.07, wz), (ww, 0.02, wh), glass)
        box(f'{name}-wm{wx}', (wx, y0 - 0.085, wz), (0.04, 0.02, wh), trim)
    box(f'{name}-door', (door_x, y0 - 0.04, 0.0), (1.0, 0.06, 2.1), mat(door_col, 0.6))
    box(f'{name}-door-trim', (door_x, y0 - 0.02, 0.0), (1.2, 0.04, 2.2), trim)


def tree(name, x, y, s=1.0):
    cyl(f'{name}-trunk', (x, y, 0), 0.16 * s, 2.4 * s, mat('#6b5444', 0.9))
    leaf = [mat('#6f9a62', 0.85), mat('#628d57', 0.85), mat('#7aa66b', 0.85)]
    for i, (dx, dy, dz, r) in enumerate([(0, 0, 3.0, 1.3), (-0.8, 0.2, 2.6, 0.95), (0.8, -0.1, 2.7, 1.0), (0.1, 0.4, 3.6, 0.9)]):
        ball(f'{name}-c{i}', (x + dx * s, y + dy * s, dz * s), r * s, leaf[i % 3], sub=2)


def env_street():
    world('#bcd6e6', 1.0)
    sun((50, 0, -28), 3.6, '#fff0d8', 2.5)
    box('grass', (0, 11, -0.02), (60, 20, 0.02), mat('#8aa86e', 0.95))
    box('sidewalk', (0, 0.3, 0), (60, 1.6, 0.04), mat('#d9d5cd', 0.85))
    boxes('joints', [(x, 0.3, 0.04, 0.02, 1.6, 0.002) for x in range(-30, 30, 2)], mat('#bdb8ae', 0.9))
    box('curb', (0, -0.6, 0), (60, 0.25, 0.14), mat('#bdb8ae', 0.8))
    box('road', (0, -6, -0.03), (60, 10.6, 0.03), mat('#5f6266', 0.75))
    box('gutter', (0, -0.82, -0.005), (60, 0.25, 0.006), mat('#4e5154', 0.8))
    boxes('lines', [(x, -5, 0.0, 2.2, 0.12, 0.003) for x in range(-30, 30, 5)], mat('#e7e2d3', 0.6))
    house('mine', -9.5, -1.6, 4.0, 10.0, 3.3, '#cdb999', '#5b4a44', -2.9, '#3f4f5f', [(-7.6, 1.0, 1.3, 1.25), (-5.2, 1.0, 1.3, 1.25)])
    box('mine-steps', (-2.9, 3.7, 0), (1.5, 0.6, 0.2), mat('#b9ad98', 0.8))
    box('mine-path', (-2.9, 2.0, 0.005), (1.2, 2.8, 0.02), mat('#cfc8bb', 0.85))
    house('gary', 1.6, 10.5, 4.2, 10.0, 3.1, '#a8b7ad', '#4a4d55', 4.6, '#7a3e2e', [(7.9, 1.0, 1.4, 1.3), (2.6, 1.0, 1.0, 1.3)])
    # Gary's porch.
    trim = mat('#f2efe9', 0.6)
    box('porch', (4.8, 3.25, 0), (4.6, 1.9, 0.45), mat('#d8d0c2', 0.75), bevel=0.01)
    boxes('porch-steps', [(4.6, 2.05, 0, 1.3, 0.35, 0.3), (4.6, 1.75, 0, 1.3, 0.35, 0.15)], mat('#c8bfb0', 0.8))
    boxes('posts', [(2.65, 2.4, 0.45, 0.14, 0.14, 2.3), (6.95, 2.4, 0.45, 0.14, 0.14, 2.3)], trim)
    box('porch-roof', (4.8, 3.2, 2.75), (4.9, 2.1, 0.14), trim)
    boxes('rail', [(6.0, 2.4, 0.45, 1.8, 0.06, 0.06), (6.0, 2.4, 1.3, 1.8, 0.08, 0.06)] + [(5.25 + i * 0.16, 2.4, 0.45, 0.04, 0.04, 0.85) for i in range(11)], trim)
    cyl('pot1', (3.0, 2.6, 0.45), 0.18, 0.32, mat('#b5653f', 0.8))
    ball('plant1', (3.0, 2.6, 0.95), 0.28, mat('#5f9161', 0.85), sub=2)
    box('mat', (4.6, 3.6, 0.452), (0.9, 0.55, 0.01), mat('#6b4e3c', 0.95))
    tree('t1', -0.2, 6.5, 1.0)
    for i, x in enumerate(range(-24, 26, 6)):
        ball(f'far{i}', (x + random.Random(i).uniform(-1, 1), 22, 3), 3.2, mat('#a9c09a', 0.9), sub=2)
    # The pickup, parked out front of your house.
    red = mat('#8a2f2a', 0.35, spec=0.7)
    glass = mat('#9fb7c4', 0.05, spec=1.0)
    blk = mat('#1d1e20', 0.7)
    chrome = mat('#9aa0a6', 0.25, 0.9)
    box('bed', (-4.2, -1.6, 0.55), (2.6, 1.9, 0.65), red, 'fg', bevel=0.03)
    box('bed-rim', (-4.2, -1.6, 1.18), (2.6, 1.9, 0.06), mat('#a3403a', 0.4), 'fg', bevel=0.02)
    box('cab', (-1.75, -1.6, 0.55), (2.3, 1.9, 0.75), red, 'fg', bevel=0.04)
    box('cab-top', (-1.95, -1.6, 1.3), (1.6, 1.78, 0.6), red, 'fg', bevel=0.08)
    side = mat('#3e5561', 0.06, spec=1.0)
    box('win-front', (-1.55, -2.5, 1.38), (0.62, 0.02, 0.44), side, 'fg', bevel=0.02)
    box('win-rear', (-2.32, -2.5, 1.38), (0.6, 0.02, 0.44), side, 'fg', bevel=0.02)
    box('mirror', (-0.95, -2.6, 1.3), (0.06, 0.16, 0.14), blk, 'fg', bevel=0.01)
    box('door-line', (-2.0, -2.51, 0.6), (0.02, 0.02, 0.7), mat('#5f1d1a', 0.5), 'fg')
    box('bumper', (-0.55, -1.6, 0.4), (0.18, 2.0, 0.22), chrome, 'fg', bevel=0.03)
    box('light', (-0.62, -2.35, 0.85), (0.1, 0.3, 0.15), mat('#f3e3a1', 0.3, emit='#f3e3a1', emit_strength=0.4), 'fg')
    for (wx, wy) in [(-4.6, -2.55), (-1.35, -2.55)]:
        cyl(f'wheel{wx}', (wx, wy, 0.42), 0.42, 0.3, blk, 'fg', rot=(math.radians(90), 0, 0))
        cyl(f'hub{wx}', (wx, wy - 0.31, 0.42), 0.19, 0.025, chrome, 'fg', rot=(math.radians(90), 0, 0))
        cyl(f'arch{wx}', (wx, wy + 0.05, 0.42), 0.5, 0.02, mat('#5f1d1a', 0.6), 'fg', rot=(math.radians(90), 0, 0))

    camera((0.9, -6.6, 1.6), (1.5, 4, 1.75), 30)
    return {
        'spots': {'gary': spot((4.2, 3.0, 0.45)), 'ruth': spot((0.9, 1.0, 0.04))},
        'cams': {'truck': point((-1.2, -1.6, 1.0), 1.7), 'porch': point((4.4, 3.0, 1.6), 2.0)},
    }


def env_yard():
    world('#bcd6e6', 1.0)
    sun((48, 0, -30), 3.4, '#fff0d8', 2.5)
    box('grass', (0, 6, -0.02), (60, 30, 0.02), mat('#93ae72', 0.95))
    boxes('stripes', [(0, y, 0, 60, 0.5, 0.002) for y in range(-4, 3)], mat('#8aa56a', 0.95))
    box('gary-wall', (7.5, 8.0, 0), (6, 0.3, 5), mat('#a8b7ad', 0.85))
    box('gary-win', (6.6, 7.84, 1.4), (1.3, 0.02, 1.3), mat('#7f9aac', 0.15))
    box('my-wall', (-8.0, 7.5, 0), (5, 0.3, 5), mat('#cdb999', 0.85))
    box('my-win', (-7.0, 7.34, 1.6), (1.2, 0.02, 1.1), mat('#7f9aac', 0.15))
    box('my-win-f', (-7.0, 7.36, 1.54), (1.36, 0.02, 1.24), mat('#f4efe4', 0.6))
    boxes('gary-siding', [(7.5, 7.84, z, 6, 0.01, 0.02) for z in [0.3 + i * 0.25 for i in range(18)]], mat('#98a79d', 0.9))
    for i, x in enumerate([-12, -6, 0, 5, 11]):
        ball(f'bt{i}', (x, 18, 3.5), 3.4, mat('#86a978', 0.9), sub=2)
    r = random.Random(21)
    wood = [mat(c, 0.85) for c in ('#a07c5a', '#957253', '#a9865f', '#8f6c4f')]
    # The leaning fence: individual pickets with a little drift each.
    for i, x in enumerate([x * 0.155 for x in range(-70, 71)]):
        if abs(x - 1.95) < 0.05:
            continue   # a missing picket
        lean = math.sin(i * 0.45) * 0.04 + (0.07 if i % 9 == 0 else 0)
        box(f'pk{i}', (x, 3.0, 0), (0.135, 0.025, 1.8), wood[r.randrange(4)], 'mid', rot=(lean, 0, r.uniform(-0.02, 0.02)))
    boxes('rails', [(0, 3.05, 0.35, 22, 0.06, 0.09), (0, 3.05, 1.35, 22, 0.06, 0.09)], mat('#7f6145', 0.85), 'mid')
    boxes('posts', [(x, 3.08, 0, 0.1, 0.1, 1.85) for x in range(-10, 11, 2)], mat('#7f6145', 0.85), 'mid')
    # Your garden bed in the foreground.
    box('bed', (-3.4, -1.2, 0), (2.6, 0.9, 0.12), mat('#6b4f3a', 0.95), 'fg')
    for i in range(9):
        x = -4.5 + i * 0.27
        ball(f'g{i}', (x, -1.2 + r.uniform(-0.2, 0.2), 0.3), 0.18, mat('#5f9161', 0.85), 'fg', sub=2)
        ball(f'f{i}', (x + 0.05, -1.25, 0.48), 0.05, mat('#e0b34a', 0.6), 'fg', sub=1)

    camera((0, -6.2, 1.55), (0, 4, 1.3), 30)
    return {
        'spots': {'gary': spot((1.0, 0.9, 0)), 'ruth': spot((-2.3, 1.7, 0))},
        'cams': {'fence': point((0, 3.0, 1.1), 1.5), 'dog': point((1.95, 3.3, 1.85), 2.8), 'garden': point((-3.4, -1.2, 0.4), 2.0)},
        'points': {'dog': spot((1.95, 3.35, 1.05)), 'paws': point((1.95, 3.0, 1.82))},
    }


ENVS = {'checkout': env_checkout, 'desks': env_desks, 'kitchen': env_kitchen, 'conference': env_conference, 'street': env_street, 'yard': env_yard}

data = {}
if os.path.exists(DATA):
    try:
        raw = open(DATA).read()
        data = json.loads(raw[raw.index('PP.envData = ') + 13:raw.rindex('}') + 1])
    except Exception:
        data = {}

for name, fn in ENVS.items():
    if ONLY and name not in ONLY:
        continue
    reset()
    info = fn()
    info['layers'] = render(name)
    data[name] = info
    with open(DATA, 'w') as f:
        f.write('// Generated by tools/blender/render_envs.py. Do not edit by hand.\n')
        f.write('window.PP = window.PP || {};\nPP.envData = ' + json.dumps(data, indent=1) + ';\n')
    print('done', name)
