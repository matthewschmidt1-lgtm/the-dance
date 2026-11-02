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
W, H = 1600, 900          # coordinate space the game uses
RW, RH = 2400, 1350       # actual render size, so camera close-ups stay sharp
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
    # A clear coat on smooth, solid surfaces gives floors and counters a lacquered sheen.
    if rough <= 0.45 and alpha >= 1 and not emit and 'Coat Weight' in p.inputs:
        p.inputs['Coat Weight'].default_value = 0.35
        p.inputs['Coat Roughness'].default_value = 0.08
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


def _spot_point(p):
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
    sc.render.resolution_x, sc.render.resolution_y = RW, RH
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
    sc.render.image_settings.quality = 82


# Cinematic finish per set: where focus falls, how much haze, where the rim light sits.
CINEMA = {
    'checkout':   dict(focus=(0.05, 1.85, 1.4), fstop=2.4, haze=0.006, rim=((0.2, 7.0, 3.0), '#cfe8ff', 900), dim=0.3),
    'desks':      dict(focus=(1.7, 0.45, 1.4), fstop=2.4, haze=0.005, rim=((1.5, 6.6, 2.6), '#cfe8ff', 700), dim=0.45),
    'kitchen':    dict(focus=(1.0, 1.0, 1.4), fstop=2.4, haze=0.005, rim=((1.0, 6.6, 2.6), '#cfe8ff', 700), dim=0.45),
    'conference': dict(focus=(-0.4, 2.15, 1.0), fstop=2.4, haze=0.006, rim=((1.2, 4.6, 2.8), '#cfe8ff', 600), dim=0.35),
    'street':     dict(focus=(4.2, 3.0, 1.9), fstop=4.0, haze=0.007, rim=None, dim=0.7),
    'yard':       dict(focus=(1.0, 0.9, 1.4), fstop=4.0, haze=0.007, rim=None, dim=0.7),
    'bathroom':   dict(focus=(0.35, 1.5, 1.4), fstop=2.4, haze=0.02, rim=((0.6, 2.9, 2.3), '#cfe8ff', 300), dim=0.4),
    'lobby':      dict(focus=(0.0, 1.8, 1.4), fstop=2.4, haze=0.006, rim=((0.2, 5.4, 3.0), '#cfe8ff', 600), dim=0.45),
    'openhouse':  dict(focus=(-0.4, 2.2, 1.4), fstop=2.8, haze=0.005, rim=((1.0, 4.4, 2.4), '#fff1dc', 300), dim=0.55),
    'dealer':     dict(focus=(-1.15, 1.95, 1.4), fstop=2.8, haze=0.004, rim=((0.5, 5.5, 3.0), '#e8f2ff', 500), dim=0.6),
    'cabin':      dict(focus=(0.2, 2.4, 1.4), fstop=2.8, haze=0.006, rim=((1.7, 4.4, 1.6), '#dfe9f2', 160), dim=0.5),
    'restaurant': dict(focus=(0.2, 1.8, 1.4), fstop=2.4, haze=0.008, rim=((0.6, 4.0, 2.4), '#ffd9a0', 300), dim=0.4),
    'family':     dict(focus=(0.3, 2.4, 1.4), fstop=2.8, haze=0.004, rim=((0.4, 4.4, 2.4), '#fff4dd', 260), dim=0.55),
    'desk-dusk': dict(focus=(0.0, 1.3, 1.13), fstop=2.0, haze=0.004, rim=((1.6, 5.0, 2.6), '#c7a07a', 200), dim=0.55),
    'desk-morning': dict(focus=(0.0, 1.3, 1.13), fstop=2.0, haze=0.006, rim=((1.6, 5.0, 2.6), '#ffe6c2', 220), dim=0.85),
    'desk-noon': dict(focus=(0.0, 1.3, 1.13), fstop=2.0, haze=0.004, rim=((1.6, 5.0, 2.6), '#e9eef0', 140), dim=0.8),
    'desk-rain': dict(focus=(0.0, 1.3, 1.13), fstop=2.0, haze=0.008, rim=((1.6, 5.0, 2.6), '#a9bccb', 160), dim=0.6),
    'desk-night': dict(focus=(0.0, 1.3, 1.13), fstop=2.0, haze=0.004, rim=((1.6, 5.0, 2.6), '#9fc8d8', 220), dim=0.55),
    'trading':    dict(focus=(0.0, 1.3, 1.13), fstop=2.0, haze=0.004, rim=((1.6, 5.0, 2.6), '#9fc8d8', 260), dim=0.6),
}


def cinematic(env):
    c = CINEMA.get(env)
    if not c:
        return
    sc = bpy.context.scene
    cam = sc.camera
    cam.data.dof.use_dof = True
    cam.data.dof.focus_distance = (Vector(c['focus']) - cam.location).length
    cam.data.dof.aperture_fstop = c['fstop']
    if sc.world:
        bgn = sc.world.node_tree.nodes['Background']
        bgn.inputs['Strength'].default_value *= c['dim']
    # Indoors, ceiling lights become focused pools instead of flat fill.
    if c['rim']:
        f = Vector(c['focus'])
        for ob in COLL['lights'].objects:
            if ob.data.type == 'AREA':
                d = (Vector((ob.location.x, ob.location.y, f.z)) - f).length
                ob.data.spread = math.radians(80)
                ob.data.energy *= max(0.12, 1.6 - d / 4.5)
    if c['rim']:
        loc, col, energy = c['rim']
        area('rim', loc, 3.0, energy, col, sy=1.2)
        rim = bpy.data.objects['rim']
        rim.rotation_euler = (Vector(c['focus']) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        rim.visible_camera = False   # light the people, never appear in shot
    fog = bpy.data.materials.new('haze')
    fog.use_nodes = True
    nt = fog.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    v = nt.nodes.new('ShaderNodeVolumePrincipled')
    v.inputs['Density'].default_value = c['haze']
    v.inputs['Anisotropy'].default_value = 0.3
    nt.links.new(v.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
    # Indoors the haze stays in the room so windows still show the city.
    if c['rim']:
        box('haze', (1.5, 2.2, 0), (26, 10.6, 3.6), fog, 'bg')
    else:
        box('haze', (0, 10, 0), (60, 60, 12), fog, 'bg')


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
    world('#cdb9a0', 0.9)
    sun((74, 0, -38), 4.6, '#ffc58a', 1.5)
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
    world('#cdb9a0', 0.9)
    sun((74, 0, -40), 4.6, '#ffc58a', 1.5)
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


def env_bathroom():
    """A bathroom mid-remodel: tile stripped, subfloor open, a dark patch of rot by the toilet flange."""
    world('#d9d4cb', 0.4)
    box('floor-under', (0, 1.5, -0.03), (10, 10, 0.02), mat('#6d6153', 0.9))
    ply = mat('#b59a72', 0.8)
    boxes('subfloor', [(x * 0.62 - 1.24, 1.5, 0, 0.6, 3.0, 0.02) for x in range(5)], ply)
    # The rot: darker, softer patch of plywood around the flange.
    rr = random.Random(4)
    stain = [mat(c, 0.95) for c in ('#4a3626', '#3d2c20', '#55402c')]
    for i in range(14):
        a = rr.uniform(0, 2 * math.pi); d = rr.uniform(0, 0.55)
        ball(f'rot{i}', (0.55 + math.cos(a) * d, 2.25 + math.sin(a) * d * 0.7, 0.024), rr.uniform(0.16, 0.3), stain[i % 3], scale=(1, 0.8, 0.012), sub=2)
    cyl('flange', (0.55, 2.3, 0.024), 0.09, 0.03, mat('#cfd3d6', 0.3, 0.7))
    cyl('flange-hole', (0.55, 2.3, 0.03), 0.055, 0.03, mat('#1a1a1a', 0.9))
    # Walls: back wall half tiled, side wall stripped to the studs.
    box('back-wall', (0, 3.05, 0), (3.6, 0.1, 2.6), mat('#e6e1d8', 0.85))
    tile = mat('#f3f1ec', 0.2)
    rows = [(x * 0.155 - 1.55 + (0.0775 if r % 2 else 0), 2.99, 0.02 + r * 0.078, 0.15, 0.02, 0.073) for r in range(15) for x in range(20)]
    boxes('tiles', [t for t in rows if -1.6 < t[0] < 1.0], tile)
    box('sheathing', (1.85, 2.2, 0), (0.04, 1.7, 2.6), mat('#a88d66', 0.85))
    boxes('studs', [(1.75, y, 0, 0.09, 0.04, 2.6) for y in [1.5 + i * 0.4 for i in range(4)]], mat('#c9a57a', 0.8))
    box('sill-plate', (1.75, 2.2, 0), (0.09, 1.7, 0.05), mat('#b8935f', 0.8))
    box('drywall-r', (1.8, 0.6, 0), (0.08, 1.8, 2.6), mat('#dcd6cc', 0.9))
    box('drywall-l', (-1.8, 1.5, 0), (0.08, 3.2, 2.6), mat('#dcd6cc', 0.9))
    box('ceiling', (0, 1.5, 2.6), (4, 4, 0.05), mat('#e8e4dc', 0.9))
    # Window with daylight.
    box('window', (0.9, 3.0, 1.55), (0.6, 0.02, 0.55), mat('#b9c6cf', 0.4, emit='#c9d4dc', emit_strength=0.35))
    box('window-frame', (0.9, 3.01, 1.5), (0.72, 0.03, 0.67), mat('#efeae0', 0.5))
    wl = area('window-light', (0.9, 2.85, 1.8), 0.6, 120, '#eef4ff', rot=(math.radians(-90), 0, 0))  # faces into the room
    wl.visible_camera = False
    # Tub, pipes, construction gear.
    box('tub', (-1.1, 2.3, 0), (1.3, 0.75, 0.55), mat('#f4f3ef', 0.15), bevel=0.04)
    box('tub-in', (-1.1, 2.3, 0.15), (1.15, 0.6, 0.42), mat('#e6e5e0', 0.2))
    boxes('pipes', [(-0.2, 2.97, 0.45, 0.03, 0.08, 0.03), (-0.05, 2.97, 0.45, 0.03, 0.08, 0.03)], mat('#b87333', 0.3, 0.8))
    cyl('bucket', (1.25, 0.9, 0), 0.16, 0.36, mat('#e07b2a', 0.5))
    boxes('tile-boxes', [(1.2, 2.2, 0, 0.45, 0.32, 0.14), (1.18, 2.2, 0.14, 0.45, 0.32, 0.14)], mat('#9c8a6e', 0.8))
    for i, (x, z) in enumerate([(-1.3, 0.0), (-1.25, 0.08)]):
        box(f'board{i}', (x, 0.9, z), (0.8, 0.25, 0.02), ply, rot=(0, 0, math.radians(20 + i * 8)))
    cyl('lamp-pole', (-1.0, 0.7, 0), 0.015, 1.5, mat('#2b2f36', 0.4, 0.5))
    box('lamp', (-1.0, 0.7, 1.5), (0.22, 0.12, 0.18), mat('#2b2f36', 0.4, 0.4))
    box('lamp-face', (-0.92, 0.75, 1.52), (0.06, 0.1, 0.14), mat('#ffd34d', 0.4, emit='#fff1c2', emit_strength=3), rot=(0, 0, math.radians(40)))
    spot('work-light', (-1.0, 0.65, 1.55), (0.5, 2.2, 0.0), 900, '#fff1d6', 70, 0.5)
    # Doorframe in the foreground.
    trim = mat('#efeae0', 0.5)
    box('dust-sheet', (0.6, -0.6, 0), (0.9, 0.5, 0.01), mat('#d8d2c4', 0.95), 'fg')

    camera((0.05, -2.4, 1.55), (0.15, 3, 1.1), 26)
    return {
        'spots': {'luis': spot((0.0, 1.25, 0.02))},
        'cams': {'rot': point((0.5, 2.25, 0.05), 2.6), 'tub': point((-1.1, 2.3, 0.5), 2.0)},
    }


def spot_light(name, loc, target, energy, color, size_deg, blend=0.5):
    ld = bpy.data.lights.new(name, 'SPOT')
    ld.energy = energy
    ld.color = hexc(color)[:3]
    ld.spot_size = math.radians(size_deg)
    ld.spot_blend = blend
    ob = bpy.data.objects.new(name, ld)
    coll('lights').objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob


def spot(*args, **kw):
    # Two meanings: spot(point) projects a standing position; spot(name, loc, target, ...) adds a spotlight.
    if len(args) == 1 and not kw:
        return _spot_point(args[0])
    return spot_light(*args, **kw)


def env_lobby():
    """Northfield's lobby: warm wood slat wall, reception desk, big windows, a low table near you."""
    world('#d8dde0', 0.6)
    box('floor', (0, 3, -0.01), (16, 12, 0.01), mat('#a7a39c', 0.35))
    box('back-wall', (0, 5.2, 0), (12, 0.2, 3.6), mat('#e7e3dc', 0.9))
    boxes('slats', [(x * 0.14 - 2.4, 5.08, 0.0, 0.08, 0.06, 3.4) for x in range(35)], mat('#a87d55', 0.55))
    box('logo-panel', (0.0, 5.0, 1.7), (2.2, 0.04, 0.5), mat('#1f2a2c', 0.4))
    text('logo', 'NORTHFIELD', (0.0, 4.97, 1.95), 0.26, mat('#f4efe6', 0.4, emit='#f4efe6', emit_strength=0.8))
    box('window-wall', (-4.6, 2.5, 0), (0.1, 6, 3.6), mat('#ffffff', 0.4, emit='#eef3f6', emit_strength=2.5))
    boxes('mullions', [(-4.5, y, 0, 0.08, 0.08, 3.6) for y in range(0, 6)], mat('#3a3f45', 0.4, 0.5))
    area('window-light', (-4.2, 2.5, 2.0), 3.0, 600, '#eef4ff', rot=(0, math.radians(-90), 0), sy=2.5)
    box('reception', (-2.6, 3.6, 0), (2.0, 0.7, 1.05), mat('#2f3a3c', 0.5), bevel=0.02)
    box('reception-top', (-2.6, 3.6, 1.05), (2.1, 0.8, 0.04), mat('#d9d4ca', 0.3))
    for i, x in enumerate((2.4, 3.6)):
        cyl(f'pot{i}', (x, 4.4, 0), 0.28, 0.6, mat('#3f4a52', 0.6))
        ball(f'plant{i}', (x, 4.4, 1.35), 0.5, mat('#4f7d52', 0.85), scale=(1, 1, 1.8), sub=2)
    for i, x in enumerate((-1.2, 0.0, 1.2)):
        cyl(f'pendant{i}', (x, 2.5, 2.9), 0.22, 0.2, mat('#d9b98a', 0.4, 0.4), r2=0.08)
        cyl(f'cord{i}', (x, 2.5, 3.1), 0.006, 0.6, mat('#2b2f36', 0.4))
        ball(f'bulb{i}', (x, 2.5, 2.9), 0.06, mat('#fff', 0.5, emit='#fff1d6', emit_strength=8))
    box('sofa', (2.6, 2.0, 0), (1.9, 0.8, 0.42), mat('#5f6b5c', 0.8), bevel=0.06)
    box('sofa-back', (2.6, 2.35, 0.42), (1.9, 0.18, 0.4), mat('#5f6b5c', 0.8), bevel=0.06)
    # A low table near you, in the foreground.
    box('coffee-table', (-0.7, -0.6, 0.38), (1.2, 0.6, 0.05), mat('#8b6a4f', 0.35), 'fg', bevel=0.01)
    boxes('coffee-legs', [(-1.2, -0.8, 0, 0.04, 0.04, 0.38), (-0.2, -0.8, 0, 0.04, 0.04, 0.38), (-1.2, -0.4, 0, 0.04, 0.04, 0.38), (-0.2, -0.4, 0, 0.04, 0.04, 0.38)], mat('#3a3d42', 0.4, 0.6), 'fg')
    cyl('cup1', (-0.9, -0.6, 0.43), 0.045, 0.09, mat('#f0ebe2', 0.4), 'fg')
    box('folder', (-0.5, -0.6, 0.43), (0.3, 0.22, 0.012), mat('#1f6f6a', 0.5), 'fg', rot=(0, 0, math.radians(-10)))

    camera((0.0, -3.4, 1.55), (0.0, 3, 1.4), 28)
    return {
        'spots': {'sam': spot((-0.75, 1.55, 0)), 'alicia': spot((0.85, 1.85, 0))},
        'cams': {'logo': point((0.0, 4.97, 1.95), 2.4)},
    }


TEX = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')


def img_mat(fname, emit=0.0, rough=0.5):
    """A material showing a texture from tools/blender/tex, optionally glowing like a screen."""
    m = bpy.data.materials.new(fname)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(os.path.join(TEX, fname))
    nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    if emit:
        nt.links.new(t.outputs['Color'], p.inputs['Emission Color'])
        p.inputs['Emission Strength'].default_value = emit
        p.inputs['Base Color'].default_value = (0, 0, 0, 1)
        nt.links.remove(p.inputs['Base Color'].links[0])
        p.inputs['Base Color'].default_value = (0.0, 0.0, 0.0, 1)
        p.inputs['Roughness'].default_value = 0.08
    return m


def img_plane(name, fname, c, w, h, rot, layer='bg', emit=0.0, rough=0.5):
    bm = bmesh.new()
    verts = [bm.verts.new(v) for v in ((-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0))]
    f = bm.faces.new(verts)
    uv = bm.loops.layers.uv.new()
    for loop, co in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        loop[uv].uv = co
    ob = _finish(name, bm, img_mat(fname, emit, rough), layer)
    ob.location = c
    ob.rotation_euler = rot
    return ob


def env_trading():
    """A private trading floor after hours: one lit desk, three screens, the city behind glass."""
    world('#0b1114', 0.4)
    box('floor', (0, 4, -0.01), (18, 16, 0.01), mat('#2a2d30', 0.4))
    box('ceiling', (0, 4, 3.2), (18, 16, 0.05), mat('#16191c', 0.9))
    # The window wall, and a night city far behind it.
    box('glass', (0, 8.6, 0), (18, 0.04, 3.2), mat('#9fb7c4', 0.02, alpha=0.06))
    # Dusk sky behind the towers, so they read as silhouettes.
    box('sky', (0, 46, 0), (140, 0.2, 60), mat('#000', 0.5, emit='#1d2c3a', emit_strength=1.0))
    boxes('mullions', [(x, 8.58, 0, 0.07, 0.07, 3.2) for x in range(-8, 9, 2)], mat('#20262b', 0.4, 0.6))
    box('sill', (0, 8.5, 0), (18, 0.3, 0.42), mat('#1b1f23', 0.6))
    r = random.Random(11)
    lit = [mat('#000', 0.5, emit=c, emit_strength=e) for c in ('#ffd9a0', '#f3e6c8', '#bfe4ff') for e in (2.5, 5)]
    for i in range(30):
        x = -26 + i * 1.8 + r.uniform(-0.4, 0.4)
        h = r.uniform(8, 30)
        y = r.uniform(22, 40)
        w = r.uniform(2.0, 4.0)
        box(f'tower{i}', (x, y, -2), (w, w, h), mat('#0e1318', 0.8))
        # A grid of small windows, about a third of them lit.
        for k in range(int(h / 0.9)):
            for j in range(int(w / 0.45)):
                if r.random() < 0.32:
                    box(f'tw{i}-{k}-{j}', (x - w / 2 + 0.22 + j * 0.45, y - w / 2 - 0.02, -1.2 + k * 0.9), (0.2, 0.02, 0.26), r.choice(lit))
    # Rows of empty desks, screens dark, chairs pushed in.
    for row, y in enumerate((3.4, 5.4, 7.2)):
        for col, x in enumerate((-4.2, -1.6, 1.6, 4.2)):
            if row == 0 and col in (1, 2):
                continue
            desk(f'd{row}{col}', x, y, 2.0, 0.8, top='#3a3d40', leg='#22252a')
            for k in (-0.45, 0.45):
                box(f'dm{row}{col}{k}', (x + k, y + 0.25, 0.95), (0.6, 0.04, 0.36), mat('#0c0e10', 0.25))
                box(f'dms{row}{col}{k}', (x + k, y + 0.3, 0.75), (0.08, 0.08, 0.2), mat('#1d2024', 0.5))
            office_chair(f'c{row}{col}', x, y - 0.75, col='#1c1f23')
    # Dim linear lights over the floor; only one still on near the desk.
    for i, y in enumerate((2.0, 4.4, 6.8)):
        box(f'strip{i}', (0, y, 3.15), (6, 0.08, 0.02), mat('#000', 0.5, emit='#dbe8f0', emit_strength=0.4 if i else 1.4))
    area('overhead', (0.3, 1.6, 3.0), 1.2, 70, '#d9e6ee', sy=0.5)

    # The desk.
    box('desk-top', (0, 1.0, 0.74), (2.6, 0.95, 0.04), mat('#33241a', 0.52), 'fg')
    boxes('desk-legs', [(-1.22, 0.62, 0, 0.05, 0.05, 0.74), (1.22, 0.62, 0, 0.05, 0.05, 0.74), (-1.22, 1.4, 0, 0.05, 0.05, 0.74), (1.22, 1.4, 0, 0.05, 0.05, 0.74)], mat('#1a1c1f', 0.4, 0.6), 'fg')
    box('modesty', (0, 1.44, 0.2), (2.4, 0.03, 0.5), mat('#2a2622', 0.6), 'fg')
    # Three screens, the side ones turned in.
    # The left screen is baked. The center and right ones are dark glass; the game draws each
    # challenge's own charts onto them, using the corners exported below.
    screens = [('screen-left.png', (-0.78, 1.22, 1.13), 22), (None, (0.0, 1.3, 1.13), 0), (None, (0.78, 1.22, 1.13), -22)]
    quads = {}
    for i, (tex, c, yaw) in enumerate(screens):
        rot = (math.radians(90), 0, math.radians(yaw))
        box(f'bezel{i}', (c[0], c[1] + 0.025, c[2] - 0.22), (0.74, 0.03, 0.44), mat('#0c0d0f', 0.3), 'fg', rot=(0, 0, math.radians(yaw)))
        # Sit the glass just proud of the bezel, along the screen's facing direction.
        n = (math.sin(math.radians(yaw)), -math.cos(math.radians(yaw)))
        sc = (c[0] + n[0] * 0.03, c[1] + n[1] * 0.03, c[2])
        if tex:
            img_plane(f'screen{i}', tex, sc, 0.7, 0.394, rot, 'fg', emit=2.2)
        else:
            box(f'screen{i}', (sc[0], sc[1], sc[2] - 0.197), (0.7, 0.004, 0.394), mat('#000', 0.08, emit='#0a1416', emit_strength=1.2), 'fg', rot=(0, 0, math.radians(yaw)))
            cy, sy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
            corner = lambda u, v: (sc[0] + u * cy + n[0] * 0.004, sc[1] + u * sy + n[1] * 0.004, sc[2] + v)
            quads['center' if i == 1 else 'right'] = [corner(-0.35, 0.197), corner(0.35, 0.197), corner(0.35, -0.197), corner(-0.35, -0.197)]
        box(f'stand{i}', (c[0], c[1] + 0.07, 0.78), (0.06, 0.04, 0.2), mat('#1a1c1f', 0.4, 0.6), 'fg')
        box(f'foot{i}', (c[0], c[1] + 0.05, 0.78), (0.24, 0.16, 0.012), mat('#1a1c1f', 0.4, 0.6), 'fg')
    # The risk limit, stuck to the left screen's bezel.
    img_plane('sticky', 'sticky-risk.png', (-0.47, 1.19, 0.99), 0.075, 0.075, (math.radians(90), 0, math.radians(22)), 'fg', rough=0.85)
    # The handwritten thesis beside the keyboard, a pen across it.
    img_plane('thesis', 'note-thesis.png', (-0.62, 0.8, 0.782), 0.2, 0.26, (0, 0, math.radians(8)), 'fg', rough=0.9)
    cyl('pen', (-0.6, 0.76, 0.788), 0.004, 0.14, mat('#111', 0.3, 0.4), 'fg', rot=(0, math.radians(90), math.radians(30)))
    box('keyboard', (0.0, 0.82, 0.78), (0.44, 0.14, 0.018), mat('#1d2024', 0.45), 'fg', bevel=0.004)
    box('mouse', (0.34, 0.8, 0.78), (0.06, 0.1, 0.02), mat('#1d2024', 0.35), 'fg', bevel=0.008)
    cyl('mug', (0.62, 0.86, 0.78), 0.042, 0.1, mat('#e9e4da', 0.45), 'fg')
    cyl('coffee', (0.62, 0.86, 0.872), 0.036, 0.004, mat('#2a1a10', 0.15), 'fg')
    box('phone', (0.84, 0.76, 0.78), (0.075, 0.15, 0.008), mat('#0d0e10', 0.2), 'fg', rot=(0, 0, math.radians(-12)))
    box('notebooks', (-1.0, 0.95, 0.78), (0.3, 0.22, 0.05), mat('#26332e', 0.7), 'fg', rot=(0, 0, math.radians(-6)))
    # A brass desk lamp: the warm key light, and the cool glow of the screens.
    cyl('lamp-base', (1.05, 1.15, 0.78), 0.08, 0.02, mat('#a8844f', 0.3, 0.8), 'fg')
    cyl('lamp-arm', (1.05, 1.15, 0.8), 0.008, 0.42, mat('#a8844f', 0.3, 0.8), 'fg')
    cyl('lamp-shade', (1.05, 1.15, 1.17), 0.085, 0.1, mat('#1f3b33', 0.4, 0.3), 'fg', r2=0.04)
    ball('bulb', (1.05, 1.15, 1.19), 0.03, mat('#fff', 0.5, emit='#ffd9a8', emit_strength=12), 'fg')
    area('lamp', (1.02, 1.05, 1.13), 0.1, 40, '#ffcf96', rot=(math.radians(25), 0, 0))
    area('screen-glow', (0.0, 1.05, 1.15), 1.6, 70, '#9fd6e0', rot=(math.radians(-90), 0, 0), sy=0.4)

    camera((0.42, -1.3, 1.46), (0.05, 2.2, 1.14), 27)
    return {
        'spots': {'theo': spot((-2.6, 5.5, 0)), 'nadia': spot((1.85, 1.65, 0))},
        'cams': {
            'screens': point((0.0, 1.3, 1.13), 2.2),
            'note': point((-0.62, 0.8, 0.79), 3.2),
            'sticky': point((-0.47, 1.19, 0.99), 3.6),
            'window': point((0.0, 8.6, 1.6), 1.6),
        },
        'quads': {k: [point(c) for c in q] for k, q in quads.items()},
    }


def env_openhouse():
    """A house for sale on a Saturday: staged living room, sign-in table, and a stain on the ceiling."""
    world('#dfe6ea', 0.7)
    box('floor', (0, 3, -0.01), (14, 12, 0.01), mat('#a77f5a', 0.32))
    boxes('boards', [(x * 0.2 - 4, 3, 0, 0.004, 12, 0.002) for x in range(41)], mat('#8e6a49', 0.4))
    box('back-wall', (0, 5.0, 0), (9, 0.15, 2.8), mat('#ece6dc', 0.85))
    box('left-wall', (-4.2, 2.5, 0), (0.15, 5.2, 2.8), mat('#e6e0d5', 0.85))
    box('right-wall', (4.3, 2.5, 0), (0.15, 5.2, 2.8), mat('#e6e0d5', 0.85))
    box('ceiling', (0, 2.6, 2.8), (9, 5.2, 0.05), mat('#f2eee8', 0.9))
    # The tell on the ceiling: a faint brown water stain near the corner.
    for k, (dx, dy, r, col) in enumerate(((0, 0, 0.5, '#e4d6c0'), (0.14, 0.08, 0.34, '#d8c6a8'), (-0.06, 0.12, 0.18, '#ccb796'))):
        ball(f'stain{k}', (-2.6 + dx, 4.2 + dy, 2.799 - k * 0.0005), r, mat(col, 0.95), scale=(1.2, 0.8, 0.002), sub=2)
    # Big front window with light pouring in.
    box('window', (1.6, 4.92, 0.7), (2.6, 0.05, 1.7), mat('#ffffff', 0.3, emit='#f4f8fb', emit_strength=3.2))
    boxes('muntins', [(1.6, 4.9, 0.7, 0.05, 0.05, 1.7), (0.3, 4.9, 0.7, 0.05, 0.05, 1.7), (2.9, 4.9, 0.7, 0.05, 0.05, 1.7), (1.6, 4.9, 1.55, 2.6, 0.05, 0.05)], mat('#f7f5f0', 0.5))
    area('window-light', (1.6, 4.4, 1.6), 2.6, 520, '#fff6e6', rot=(math.radians(-90), 0, 0), sy=1.7)
    # Fireplace and mantel.
    box('fireplace', (-1.9, 4.85, 0), (1.5, 0.3, 1.2), mat('#d9d2c6', 0.7))
    box('firebox', (-1.9, 4.7, 0.15), (0.8, 0.05, 0.6), mat('#22201e', 0.9))
    box('mantel', (-1.9, 4.75, 1.2), (1.8, 0.4, 0.08), mat('#6b4e36', 0.4))
    cyl('vase', (-2.3, 4.75, 1.28), 0.07, 0.28, mat('#2f5d57', 0.3))
    ball('flowers', (-2.3, 4.75, 1.62), 0.16, mat('#e9b8a0', 0.8), scale=(1, 1, 0.8), sub=2)
    # Staging furniture.
    box('sofa', (1.8, 2.6, 0), (2.2, 0.85, 0.42), mat('#c9c1b3', 0.85), bevel=0.06)
    box('sofa-back', (1.8, 2.95, 0.42), (2.2, 0.18, 0.42), mat('#c9c1b3', 0.85), bevel=0.06)
    box('rug', (1.2, 2.0, 0.002), (3.0, 2.0, 0.006), mat('#d8cdbb', 0.95))
    box('coffee', (1.6, 1.8, 0.0), (1.0, 0.55, 0.4), mat('#5c4434', 0.35), bevel=0.02)
    # Sign-in table near you with flyers and the offer deadline.
    box('table', (-1.0, 0.6, 0.74), (1.2, 0.6, 0.04), mat('#efe9df', 0.4), 'fg')
    boxes('table-legs', [(-1.5, 0.35, 0, 0.04, 0.04, 0.74), (-0.5, 0.35, 0, 0.04, 0.04, 0.74), (-1.5, 0.85, 0, 0.04, 0.04, 0.74), (-0.5, 0.85, 0, 0.04, 0.04, 0.74)], mat('#2b2b2b', 0.4, 0.6), 'fg')
    for k in range(4):
        box(f'flyer{k}', (-1.3 + k * 0.05, 0.55 + k * 0.01, 0.78 + k * 0.002), (0.22, 0.28, 0.002), mat('#ffffff', 0.7), 'fg', rot=(0, 0, math.radians(-8 + k * 4)))
    box('sign', (-0.62, 0.62, 0.78), (0.32, 0.03, 0.22), mat('#1f6f6a', 0.5), 'fg')
    text('sign-text', 'OPEN HOUSE', (-0.62, 0.6, 0.9), 0.045, mat('#ffffff', 0.5, emit='#ffffff', emit_strength=0.4), 'fg')
    camera((0.0, -2.6, 1.55), (0.1, 3.4, 1.35), 26)
    return {
        'spots': {'rosa': spot((-0.4, 2.2, 0)), 'couple': spot((2.6, 3.6, 0))},
        'cams': {'stain': point((-2.6, 4.2, 2.77), 2.6), 'flyers': point((-1.1, 0.6, 0.79), 2.6)},
    }


def car(name, x, y, col, layer='bg', yaw=0.0):
    m = mat(col, 0.2, 0.55)
    rot = (0, 0, yaw)
    off = lambda dx, dy: (x + dx * math.cos(yaw) - dy * math.sin(yaw), y + dx * math.sin(yaw) + dy * math.cos(yaw))
    box(f'{name}-body', (x, y, 0.3), (1.82, 4.5, 0.5), m, layer, rot=rot, bevel=0.16)
    hx, hy = off(0, -1.55)
    box(f'{name}-hood', (hx, hy, 0.72), (1.74, 1.3, 0.1), m, layer, rot=rot, bevel=0.05)
    cx, cy = off(0, 0.25)
    box(f'{name}-cab', (cx, cy, 0.78), (1.56, 2.1, 0.5), mat('#151b21', 0.06, 0.3), layer, rot=rot, bevel=0.22)
    rx, ry = off(0, 0.25)
    box(f'{name}-roof', (rx, ry, 1.22), (1.5, 1.7, 0.08), m, layer, rot=rot, bevel=0.04)
    for side in (-0.62, 0.62):
        lx, ly = off(side, -2.24)
        box(f'{name}-head{side}', (lx, ly, 0.6), (0.36, 0.04, 0.1), mat('#000', 0.3, emit='#f4f6f8', emit_strength=2.5), layer, rot=rot)
        tx, ty = off(side, 2.24)
        box(f'{name}-tail{side}', (tx, ty, 0.62), (0.36, 0.04, 0.09), mat('#000', 0.3, emit='#e0352b', emit_strength=2.0), layer, rot=rot)
    for k, (dx, dy) in enumerate(((-0.92, -1.35), (0.92, -1.35), (-0.92, 1.35), (0.92, 1.35))):
        rx = x + dx * math.cos(yaw) - dy * math.sin(yaw)
        ry = y + dx * math.sin(yaw) + dy * math.cos(yaw)
        cyl(f'{name}-w{k}', (rx - 0.12 * math.cos(yaw), ry - 0.12 * math.sin(yaw), 0.33), 0.33, 0.24, mat('#141414', 0.6), layer, rot=(0, math.radians(90), yaw))


def env_dealer():
    """A dealership on a weekday: a polished showroom car, a sales desk, and the lot through the glass."""
    world('#e3ebf0', 0.8)
    box('floor', (0, 4, -0.01), (18, 14, 0.01), mat('#c9ccd0', 0.2))
    box('back-glass', (0, 7.2, 0), (18, 0.05, 3.6), mat('#a9c4d6', 0.05, alpha=0.12))
    box('sky', (0, 30, 0), (80, 0.2, 30), mat('#000', 0.5, emit='#dfeaf2', emit_strength=1.4))
    box('lot', (0, 14, -0.02), (40, 14, 0.01), mat('#5d6166', 0.7))
    boxes('glass-mullions', [(x, 7.15, 0, 0.08, 0.08, 3.6) for x in range(-8, 9, 2)], mat('#3a4048', 0.4, 0.6))
    box('ceiling', (0, 4, 3.6), (18, 14, 0.05), mat('#f4f5f6', 0.9))
    for i in range(3):
        box(f'light{i}', (-3 + i * 3, 3.5, 3.55), (1.6, 0.4, 0.02), mat('#000', 0.5, emit='#ffffff', emit_strength=3))
    area('showroom', (0, 3.2, 3.4), 6, 520, '#fbfbf8', sy=3)
    sun((50, 0, 30), 2.2, '#fff4e2')
    # Cars on the lot beyond the glass, and one in the showroom.
    for k, (x, col) in enumerate(((-6, '#8a1f24'), (-2.8, '#d9dcdf'), (3.4, '#20252b'), (6.4, '#3d5a7a'))):
        car(f'lot{k}', x, 10.5, col, yaw=math.radians(90))
    car('show', 2.6, 4.6, '#b33a2c', yaw=math.radians(-62))
    # The window sticker on the showroom car's rear side glass.
    box('sticker', (2.25, 3.95, 0.86), (0.22, 0.004, 0.28), mat('#ffffff', 0.6, emit='#ffffff', emit_strength=0.3), rot=(0, 0, math.radians(-62)))
    # Sales desk with a worksheet and a monitor, near you.
    box('desk-top', (-1.2, 1.2, 0.74), (1.8, 0.85, 0.05), mat('#2a2f36', 0.3), 'fg')
    box('desk-front', (-1.2, 0.8, 0), (1.8, 0.05, 0.74), mat('#3a4048', 0.4), 'fg')
    box('worksheet', (-1.35, 1.05, 0.792), (0.24, 0.32, 0.002), mat('#ffffff', 0.7), 'fg', rot=(0, 0, math.radians(6)))
    boxes('grid', [(-1.35, 1.05, 0.795, 0.004, 0.3, 0.001), (-1.35, 1.05, 0.795, 0.22, 0.004, 0.001)], mat('#1f2a35', 0.6), 'fg')
    box('monitor', (-0.7, 1.45, 0.8), (0.5, 0.03, 0.32), mat('#0d0f12', 0.2), 'fg', rot=(0, 0, math.radians(-12)))
    box('monitor-glow', (-0.7, 1.43, 0.84), (0.46, 0.005, 0.26), mat('#000', 0.3, emit='#cfe3f0', emit_strength=1.2), 'fg', rot=(0, 0, math.radians(-12)))
    cyl('pen-cup', (-1.85, 1.35, 0.79), 0.04, 0.1, mat('#b33a2c', 0.4), 'fg')
    camera((-0.3, -2.6, 1.55), (0.2, 4.0, 1.2), 27)
    return {
        'spots': {'vince': spot((-1.15, 1.95, 0))},
        'cams': {'worksheet': point((-1.35, 1.05, 0.8), 3.2), 'sticker': point((2.25, 3.95, 1.0), 3.0)},
    }


def env_cabin():
    """A lakeside rental at dusk: log walls, a stone fireplace, the lake through big windows, the long table."""
    world('#c9d6de', 0.6)
    box('floor', (0, 3, -0.01), (14, 12, 0.01), mat('#8a6440', 0.4))
    boxes('logs', [(0, 5.2, z * 0.24, 10, 0.22, 0.22) for z in range(12)], mat('#9c7348', 0.7))
    boxes('logs-l', [(-4.4, 2.6, z * 0.24, 0.22, 5.4, 0.22) for z in range(12)], mat('#93693f', 0.7))
    boxes('logs-r', [(4.4, 2.6, z * 0.24, 0.22, 5.4, 0.22) for z in range(12)], mat('#93693f', 0.7))
    box('ceiling', (0, 1.2, 2.9), (9.2, 8.4, 0.06), mat('#7a5634', 0.8))
    boxes('beams', [(x, 1.2, 2.7, 0.18, 8.4, 0.2) for x in (-2.6, 0, 2.6)], mat('#5e4128', 0.7))
    # The lake at dusk through the windows.
    box('window', (1.7, 5.08, 0.6), (3.6, 0.04, 1.8), mat('#000', 0.3, emit='#9fb9c8', emit_strength=2.2))
    boxes('mullions', [(x, 5.05, 0.6, 0.06, 0.06, 1.8) for x in (-0.1, 0.8, 1.7, 2.6, 3.5)] + [(1.7, 5.05, 1.5, 3.6, 0.06, 0.06)], mat('#3e2c1d', 0.6))
    area('window-light', (1.7, 4.6, 1.4), 3.4, 380, '#dfe9f2', rot=(math.radians(-90), 0, 0), sy=1.6)
    # Stone fireplace with a fire.
    box('chimney', (-2.4, 4.9, 0), (1.6, 0.5, 2.9), mat('#8b8780', 0.9), bevel=0.04)
    box('hearth', (-2.4, 4.45, 0), (1.9, 0.5, 0.45), mat('#7c776f', 0.9), bevel=0.02)
    box('firebox', (-2.4, 4.66, 0.45), (0.9, 0.05, 0.6), mat('#1d1a18', 0.9))
    ball('fire', (-2.4, 4.56, 0.62), 0.18, mat('#000', 0.5, emit='#ff9a3c', emit_strength=14), scale=(1.3, 0.6, 1.1), sub=2)
    area('fire-glow', (-2.4, 4.1, 0.75), 0.6, 60, '#ffb070', rot=(math.radians(-90), 0, 0))
    box('mantel', (-2.4, 4.6, 1.3), (1.8, 0.3, 0.08), mat('#5e4128', 0.5))
    # Couch and rug.
    box('rug', (-1.4, 2.6, 0.003), (3.0, 2.2, 0.006), mat('#a8443a', 0.95))
    box('couch', (-2.4, 2.9, 0), (2.0, 0.85, 0.42), mat('#6b7a5e', 0.85), bevel=0.06)
    box('couch-back', (-2.4, 3.25, 0.42), (2.0, 0.18, 0.4), mat('#6b7a5e', 0.85), bevel=0.06)
    # The long table, near you, with the laptop and the room list.
    box('table', (0.6, 0.7, 0.74), (2.4, 0.9, 0.06), mat('#6b4a2c', 0.4), 'fg')
    boxes('table-legs', [(-0.5, 0.35, 0, 0.08, 0.08, 0.74), (1.7, 0.35, 0, 0.08, 0.08, 0.74), (-0.5, 1.05, 0, 0.08, 0.08, 0.74), (1.7, 1.05, 0, 0.08, 0.08, 0.74)], mat('#4a3320', 0.5), 'fg')
    box('laptop', (0.2, 0.7, 0.8), (0.34, 0.24, 0.015), mat('#2a2d31', 0.3), 'fg', bevel=0.004)
    box('laptop-screen', (0.2, 0.83, 0.8), (0.34, 0.012, 0.22), mat('#000', 0.3, emit='#d9e7ee', emit_strength=1.4), 'fg', rot=(math.radians(-14), 0, 0))
    box('room-list', (0.9, 0.62, 0.802), (0.22, 0.3, 0.002), mat('#f2ece0', 0.8), 'fg', rot=(0, 0, math.radians(-6)))
    for k, x in enumerate((1.3, 1.45)):
        cyl(f'mug{k}', (x, 0.85, 0.8), 0.04, 0.09, mat('#c45a3a', 0.5), 'fg')
    camera((0.3, -2.6, 1.55), (0.1, 3.6, 1.25), 26)
    return {
        'spots': {'jess': spot((-0.9, 2.2, 0)), 'omar': spot((1.3, 2.5, 0)), 'lena': spot((2.6, 3.4, 0))},
        'cams': {'list': point((0.9, 0.62, 0.81), 3.0), 'lake': point((1.7, 5.08, 1.5), 1.6)},
    }


def env_restaurant():
    """A warm bistro on the last night of the trip: pendant lights, a long table, the bill arriving."""
    world('#2a2320', 0.5)
    box('floor', (0, 3, -0.01), (14, 12, 0.01), mat('#5b3d2a', 0.35))
    box('back-wall', (0, 5.0, 0), (10, 0.15, 3.2), mat('#7d3f2f', 0.85))
    boxes('wainscot', [(0, 4.9, 0, 10, 0.06, 1.0)], mat('#3f2a1e', 0.6))
    box('left-wall', (-4.6, 2.5, 0), (0.15, 5.2, 3.2), mat('#6e3a2c', 0.85))
    box('right-wall', (4.6, 2.5, 0), (0.15, 5.2, 3.2), mat('#6e3a2c', 0.85))
    # Bar along the back with bottles.
    box('bar', (2.2, 4.4, 0), (3.6, 0.6, 1.05), mat('#3a261a', 0.5), bevel=0.02)
    box('bar-top', (2.2, 4.4, 1.05), (3.7, 0.7, 0.05), mat('#c9b48e', 0.3))
    r = random.Random(5)
    for k in range(14):
        cyl(f'bottle{k}', (0.6 + k * 0.24, 4.85, 1.35), 0.04, 0.3, mat(r.choice(['#2f5d3a', '#6a2c22', '#c8a24a', '#e9e2d0']), 0.2))
    box('shelf', (2.2, 4.88, 1.32), (3.6, 0.18, 0.03), mat('#3a261a', 0.5))
    area('wall-wash', (0, 3.6, 2.6), 4.0, 160, '#ffcf9a', rot=(math.radians(-60), 0, 0), sy=1.0)
    # Pendant lights over the long table.
    for k, x in enumerate((-1.2, 0.2, 1.6)):
        cyl(f'cord{k}', (x, 1.6, 2.4), 0.006, 0.8, mat('#1a1a1a', 0.4))
        cyl(f'shade{k}', (x, 1.6, 2.2), 0.2, 0.2, mat('#b88a3e', 0.35, 0.6), r2=0.07)
        ball(f'bulb{k}', (x, 1.6, 2.2), 0.06, mat('#fff', 0.5, emit='#ffd9a0', emit_strength=10))
        area(f'pool{k}', (x, 1.6, 2.1), 0.5, 120, '#ffcf8a', rot=(0, 0, 0))
    # The long table, near you, with plates, glasses and the bill.
    box('table', (0.2, 0.8, 0.74), (3.0, 1.0, 0.05), mat('#4a2f1f', 0.35), 'fg')
    boxes('table-legs', [(x, y, 0, 0.07, 0.07, 0.74) for x in (-1.2, 1.6) for y in (0.4, 1.2)], mat('#2e1d14', 0.5), 'fg')
    box('cloth', (0.2, 0.8, 0.79), (3.1, 1.05, 0.006), mat('#efe9df', 0.8), 'fg')
    for k, x in enumerate((-1.0, -0.2, 0.6, 1.4)):
        cyl(f'plate{k}', (x, 0.55, 0.797), 0.13, 0.012, mat('#fbfaf6', 0.3), 'fg')
        cyl(f'glass{k}', (x + 0.18, 0.7, 0.797), 0.035, 0.16, mat('#d8e6ea', 0.05, alpha=0.35), 'fg')
    cyl('champagne', (0.2, 1.0, 0.797), 0.045, 0.32, mat('#2f4a2c', 0.2), 'fg')
    box('lobster-plate', (1.4, 0.95, 0.8), (0.3, 0.2, 0.02), mat('#d9573a', 0.5), 'fg')
    box('bill', (0.2, 0.45, 0.8), (0.12, 0.26, 0.006), mat('#2a1d16', 0.6), 'fg', rot=(0, 0, math.radians(8)))
    camera((0.2, -2.4, 1.5), (0.1, 3.4, 1.2), 27)
    return {
        'spots': {'jess': spot((-0.9, 1.75, 0)), 'omar': spot((1.35, 1.8, 0)), 'lena': spot((0.25, 2.2, 0))},
        'cams': {'bill': point((0.2, 0.45, 0.81), 3.0), 'lobster': point((1.4, 0.95, 0.82), 3.0)},
    }


def env_family():
    """Mom's kitchen: worn cabinets, a calendar on the fridge, the table where the family decides things."""
    world('#e4ddd0', 0.7)
    box('floor', (0, 3, -0.01), (14, 12, 0.01), mat('#b9a27e', 0.6))
    boxes('tiles', [(x * 0.4 - 4, 3, 0, 0.006, 12, 0.003) for x in range(21)], mat('#a38c69', 0.7))
    box('back-wall', (0, 5.0, 0), (10, 0.15, 2.8), mat('#e9dfc4', 0.9))
    box('left-wall', (-4.3, 2.5, 0), (0.15, 5.2, 2.8), mat('#e4d9bd', 0.9))
    box('right-wall', (4.3, 2.5, 0), (0.15, 5.2, 2.8), mat('#e4d9bd', 0.9))
    box('ceiling', (0, 2.6, 2.8), (9, 5.2, 0.05), mat('#f2ece0', 0.9))
    # Cabinets, counter, window over the sink.
    box('base-cab', (-1.6, 4.6, 0), (4.0, 0.6, 0.9), mat('#7c8f74', 0.6), bevel=0.01)
    box('counter', (-1.6, 4.6, 0.9), (4.1, 0.66, 0.04), mat('#d8cfbf', 0.35))
    box('upper-cab', (-2.6, 4.75, 1.45), (2.0, 0.34, 0.8), mat('#7c8f74', 0.6), bevel=0.01)
    box('window', (-0.4, 4.92, 1.2), (1.2, 0.04, 0.9), mat('#000', 0.3, emit='#f3f1e6', emit_strength=2.4))
    area('window-light', (-0.4, 4.5, 1.6), 1.2, 260, '#fff4dd', rot=(math.radians(-90), 0, 0), sy=0.9)
    cyl('kettle', (-1.4, 4.6, 0.94), 0.1, 0.18, mat('#b8483a', 0.35))
    # Fridge with the family calendar.
    box('fridge', (2.6, 4.55, 0), (0.85, 0.75, 1.8), mat('#efeee8', 0.3), bevel=0.04)
    box('calendar', (2.6, 4.165, 1.05), (0.42, 0.004, 0.5), mat('#ffffff', 0.7), rot=(0, 0, 0))
    boxes('cal-grid', [(2.6, 4.16, 1.05 + k * 0.08, 0.4, 0.002, 0.004) for k in range(6)], mat('#9a3a2e', 0.6))
    for k, (dx, dz, col) in enumerate(((-0.3, 1.55, '#f2c94c'), (0.28, 1.4, '#7fb3d5'), (-0.25, 0.85, '#e8a0a0'))):
        box(f'photo{k}', (2.6 + dx, 4.163, dz), (0.12, 0.003, 0.15), mat(col, 0.6))
    # The kitchen table, near you, with mugs and papers.
    box('table', (0.4, 1.0, 0.74), (1.8, 1.0, 0.05), mat('#a07a4e', 0.45), 'fg')
    boxes('table-legs', [(-0.4, 0.6, 0, 0.06, 0.06, 0.74), (1.2, 0.6, 0, 0.06, 0.06, 0.74), (-0.4, 1.4, 0, 0.06, 0.06, 0.74), (1.2, 1.4, 0, 0.06, 0.06, 0.74)], mat('#7b5a38', 0.5), 'fg')
    box('papers', (0.1, 0.85, 0.79), (0.24, 0.3, 0.006), mat('#fbf8f0', 0.8), 'fg', rot=(0, 0, math.radians(-10)))
    cyl('mug-a', (0.7, 0.95, 0.79), 0.045, 0.1, mat('#3f6e8a', 0.45), 'fg')
    cyl('mug-b', (0.95, 1.15, 0.79), 0.045, 0.1, mat('#e9e2d0', 0.45), 'fg')
    ball('fruit', (0.4, 1.3, 0.83), 0.09, mat('#d27a2c', 0.6), scale=(1, 1, 0.8), sub=2, layer='fg')
    camera((0.2, -2.3, 1.55), (0.1, 3.6, 1.25), 26)
    return {
        'spots': {'carol': spot((-0.9, 2.3, 0)), 'nate': spot((0.95, 2.6, 0))},
        'cams': {'calendar': point((2.6, 4.165, 1.25), 3.0), 'papers': point((0.1, 0.85, 0.8), 3.0)},
    }


# The trader's own office, five ways: a private room with the ocean outside the window. Same room,
# same people; the hour, the weather and the sea change with the season, and the desk fills up with
# the year. Paper and small displays are left blank and exported as quads, so the game can write the
# player's own rules, journal, messages, the time and the date onto them.
DESK = {
    'dusk':    dict(sky='#2f3d5c', sky_e=1.5, glow='#e3864f', glow_e=2.6, sea='#1b2738', sea_r=0.06, sun=None, disc=None, room=0.25, wall='#b9a78f', lamp=1.0, coffee='cold', rain=False, clouds=None, mess=1),
    'morning': dict(sky='#a9cdea', sky_e=3.4, glow='#f8e2bb', glow_e=3.4, sea='#1c5b82', sea_r=0.3, sun=(6.0, '#ffd9a6'), disc=((-140, 400, 34), 7, '#fff1cf', 30), room=1.1, wall='#e8dcc6', lamp=0.0, coffee='hot', rain=False, clouds='#ffffff', mess=0),
    'noon':    dict(sky='#c3dbea', sky_e=3.0, glow='#e9eef0', glow_e=3.0, sea='#2a6a8a', sea_r=0.3, sun=(2.0, '#f4f1ea'), disc=None, room=0.9, wall='#e2d8c6', lamp=0.0, coffee='lunch', rain=False, clouds='#f4f6f7', mess=1),
    'rain':    dict(sky='#56616b', sky_e=1.4, glow='#76828c', glow_e=1.5, sea='#36444b', sea_r=0.35, sun=None, disc=None, room=0.55, wall='#c4b8a6', lamp=0.8, coffee='hot', rain=True, clouds='#4b545c', mess=2),
    'night':   dict(sky='#0a1322', sky_e=0.7, glow='#16253c', glow_e=0.9, sea='#07101b', sea_r=0.04, sun=None, disc=((110, 400, 30), 5, '#e9eef6', 6), room=0.0, wall='#5d5346', lamp=1.4, coffee='two', rain=False, clouds=None, mess=3),
}


def env_desk(v):
    o = DESK[v]
    world('#0b1114' if o['lamp'] else ('#efe2cc' if v == 'morning' else '#cdd6dc'), 0.35 if o['lamp'] else (1.1 if v == 'morning' else 0.9))
    # The room: warm plaster, wood floor, one wall of glass.
    box('floor', (0, 1.0, -0.01), (6.2, 5.4, 0.01), mat('#6b4a32', 0.4))
    box('rug', (0, 1.0, 0.002), (3.4, 2.4, 0.004), mat('#5a3a32', 0.95))
    box('ceiling', (0, 1.0, 2.95), (6.2, 5.4, 0.05), mat('#efe9df' if o['room'] else '#1d1b19', 0.9))
    wall = mat(o['wall'], 0.85)
    box('wall-left', (-3.05, 1.0, 0), (0.1, 5.4, 2.95), wall)
    box('wall-right', (3.05, 1.0, 0), (0.1, 5.4, 2.95), wall)
    box('sill-wall', (0, 3.68, 0), (6.2, 0.12, 0.55), wall)
    box('header', (0, 3.68, 2.75), (6.2, 0.12, 0.2), wall)
    box('sill', (0, 3.6, 0.55), (6.0, 0.22, 0.04), mat('#4a3426', 0.5))
    box('glass', (0, 3.7, 0.55), (6.0, 0.03, 2.2), mat('#a9c3d0', 0.02, alpha=0.05))
    boxes('mullions', [(x, 3.7, 0.55, 0.06, 0.06, 2.2) for x in (-3, -1.5, 0, 1.5, 3)] + [(0, 3.7, 1.95, 6.0, 0.05, 0.05)], mat('#2a221c', 0.45, 0.2))
    # Outside: open sea to the horizon, and a sky that changes with the hour and the weather.
    box('sky', (0, 430, -10), (1400, 2, 520), mat('#000', 0.5, emit=o['sky'], emit_strength=o['sky_e']))
    box('glow', (0, 425, -8), (1400, 2, 16), mat('#000', 0.5, emit=o['glow'], emit_strength=o['glow_e']))
    box('sea', (0, 210, -7), (1400, 420, 0.1), mat(o['sea'], max(0.22, o['sea_r']), spec=0.6))
    if o['disc']:
        (dx, dy, dz), r, col, e = o['disc']
        ball('disc', (dx, dy, dz), r, mat('#000', 0.5, emit=col, emit_strength=e), sub=3)
    if o['clouds']:
        rc = random.Random(9)
        for k in range(9):
            ball(f'cloud{k}', (rc.uniform(-320, 320), rc.uniform(300, 400), rc.uniform(25, 70)), rc.uniform(18, 34), mat('#000', 0.9, emit=o['clouds'], emit_strength=o['sky_e'] * (0.55 if v == 'rain' else 0.9)), scale=(2.6, 1, 0.5), sub=2)
    if o['rain']:
        rr = random.Random(3)
        boxes('rain', [(rr.uniform(-2.9, 2.9), 3.68, rr.uniform(0.6, 2.7), 0.01, 0.004, rr.uniform(0.15, 0.6)) for _ in range(380)], mat('#e6eef3', 0.05, alpha=0.4))
        boxes('drops', [(rr.uniform(-2.9, 2.9), 3.67, rr.uniform(0.6, 2.7), 0.02, 0.004, 0.02) for _ in range(180)], mat('#f2f6f8', 0.05, alpha=0.45))
    if o['sun']:
        sun((math.radians(64), 0, math.radians(172)), o['sun'][0], o['sun'][1], angle=1.5)
        area('window-fill', (0, 3.2, 1.7), 5.4, 700 * o['sun'][0] / 6, o['sun'][1], rot=(math.radians(-90), 0, 0), sy=2.0)
    elif o['glow_e'] > 1.2:
        area('window-fill', (0, 3.2, 1.7), 5.4, 160, o['glow'], rot=(math.radians(-90), 0, 0), sy=2.0)
    if o['room']:
        area('ceil', (0, 1.4, 2.85), 2.4, 220 * o['room'], '#fff1dc', sy=1.6)
    # The rest of the room: books, a door, art, a plant.
    bookshelf('books', -2.15, 1.5, 1.4)
    box('door', (-2.98, 3.0, 0), (0.05, 0.9, 2.1), mat('#3b2a20', 0.5))
    box('art', (2.98, 1.6, 1.25), (0.03, 1.1, 0.75), mat('#2f4a54', 0.7))
    box('art-frame', (2.995, 1.6, 1.22), (0.02, 1.18, 0.81), mat('#2a211b', 0.5))
    cyl('pot', (2.45, 3.05, 0), 0.2, 0.4, mat('#6b4f3a', 0.7))
    ball('plant', (2.45, 3.05, 0.85), 0.46, mat('#3d5a3b', 0.85), scale=(1, 1, 1.3), sub=2)

    # Your desk: warm walnut, leather, paper.
    box('desk-top', (0, 1.0, 0.74), (2.6, 0.95, 0.04), mat('#5b3b25', 0.42), 'fg')
    boxes('desk-legs', [(-1.22, 0.62, 0, 0.05, 0.05, 0.74), (1.22, 0.62, 0, 0.05, 0.05, 0.74), (-1.22, 1.4, 0, 0.05, 0.05, 0.74), (1.22, 1.4, 0, 0.05, 0.05, 0.74)], mat('#2a211b', 0.4, 0.3), 'fg')
    box('modesty', (0, 1.44, 0.2), (2.4, 0.03, 0.5), mat('#3a2c22', 0.6), 'fg')
    box('blotter', (0.05, 0.86, 0.762), (0.9, 0.36, 0.004), mat('#2c2420', 0.7), 'fg')
    screens = [('screen-left.png', (-0.78, 1.22, 1.13), 22), (None, (0.0, 1.3, 1.13), 0), (None, (0.78, 1.22, 1.13), -22)]
    quads = {}

    def upright(c, w, h, yaw=0.0, tilt=0.0):
        """Corners of an upright rectangle facing the camera (-y), yawed and tilted back."""
        cy, sy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
        ct, st = math.cos(math.radians(tilt)), math.sin(math.radians(tilt))
        def at(u, v):
            return (c[0] + u * cy - v * st * sy, c[1] + u * sy + v * st * cy, c[2] + v * ct)
        return [at(-w / 2, h / 2), at(w / 2, h / 2), at(w / 2, -h / 2), at(-w / 2, -h / 2)]

    for i, (tex, c, yaw) in enumerate(screens):
        rot = (math.radians(90), 0, math.radians(yaw))
        box(f'bezel{i}', (c[0], c[1] + 0.025, c[2] - 0.22), (0.74, 0.03, 0.44), mat('#151413', 0.3), 'fg', rot=(0, 0, math.radians(yaw)))
        n = (math.sin(math.radians(yaw)), -math.cos(math.radians(yaw)))
        sc = (c[0] + n[0] * 0.03, c[1] + n[1] * 0.03, c[2])
        if tex:
            img_plane(f'screen{i}', tex, sc, 0.7, 0.394, rot, 'fg', emit=1.6)
        else:
            box(f'screen{i}', (sc[0], sc[1], sc[2] - 0.197), (0.7, 0.004, 0.394), mat('#000', 0.08, emit='#0a1416', emit_strength=1.2), 'fg', rot=(0, 0, math.radians(yaw)))
            cy, sy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
            corner = lambda u, v: (sc[0] + u * cy + n[0] * 0.004, sc[1] + u * sy + n[1] * 0.004, sc[2] + v)
            quads['center' if i == 1 else 'right'] = [corner(-0.35, 0.197), corner(0.35, 0.197), corner(0.35, -0.197), corner(-0.35, -0.197)]
        box(f'stand{i}', (c[0], c[1] + 0.07, 0.78), (0.06, 0.04, 0.2), mat('#1a1c1f', 0.4, 0.6), 'fg')
        box(f'foot{i}', (c[0], c[1] + 0.05, 0.78), (0.24, 0.16, 0.012), mat('#1a1c1f', 0.4, 0.6), 'fg')
    paper = mat('#f2ebdc', 0.9)
    # Your rules, on a card pinned to the left screen's bezel.
    rc = (-0.62, 1.155, 0.965)
    box('rules-card', (rc[0], rc[1] + 0.002, rc[2] - 0.055), (0.17, 0.003, 0.11), paper, 'fg', rot=(0, 0, math.radians(22)))
    ball('pin', (rc[0] - 0.06, rc[1] - 0.02, rc[2] + 0.045), 0.006, mat('#a33a2a', 0.4), 'fg')
    quads['rules'] = upright((rc[0] - 0.001, rc[1] - 0.003, rc[2]), 0.16, 0.1, yaw=22)
    # The journal stands open on a book stand beside the keyboard, facing you: your own history.
    jb, jw, jh, jt = (-0.56, 0.86, 0.79), 0.32, 0.2, 45
    box('stand-foot', (jb[0], jb[1] - 0.02, 0.78), (0.3, 0.12, 0.01), mat('#3b2a20', 0.6), 'fg')
    box('journal-cover', (jb[0], jb[1] + 0.006, jb[2]), (jw + 0.02, 0.008, jh + 0.01), mat('#3b2a20', 0.6), 'fg', rot=(math.radians(-jt), 0, 0))
    box('journal-pages', (jb[0], jb[1], jb[2] + 0.004), (jw, 0.004, jh), paper, 'fg', rot=(math.radians(-jt), 0, 0))
    jc = (jb[0], jb[1] + jh / 2 * math.sin(math.radians(jt)) - 0.004, jb[2] + 0.004 + jh / 2 * math.cos(math.radians(jt)))
    quads['journal'] = upright(jc, jw - 0.02, jh - 0.02, tilt=jt)
    cyl('pen', (jb[0] + 0.2, jb[1] - 0.12, 0.79), 0.004, 0.14, mat('#111', 0.3, 0.4), 'fg', rot=(0, math.radians(90), math.radians(30)))
    box('keyboard', (0.0, 0.82, 0.78), (0.44, 0.14, 0.018), mat('#2a2622', 0.45), 'fg', bevel=0.004)
    box('mouse', (0.34, 0.8, 0.78), (0.06, 0.1, 0.02), mat('#2a2622', 0.35), 'fg', bevel=0.008)
    # Coffee: fresh, cold, swapped for lunch, or two cups deep.
    mugs = {'hot': [(0.62, 0.86)], 'cold': [(0.62, 0.86)], 'lunch': [(0.7, 1.05)], 'two': [(0.62, 0.86), (0.5, 1.1)]}[o['coffee']]
    for k, (x, y) in enumerate(mugs):
        cyl(f'mug{k}', (x, y, 0.78), 0.042, 0.1, mat('#e9e4da', 0.45), 'fg')
        cyl(f'coffee{k}', (x, y, 0.872), 0.036, 0.004, mat('#2a1a10' if o['coffee'] != 'cold' else '#3a2a1e', 0.15 if o['coffee'] != 'cold' else 0.6), 'fg')
    if o['coffee'] == 'hot':
        for k in range(3):
            cyl(f'steam{k}', (0.62 + 0.012 * (k - 1), 0.86, 0.9 + k * 0.02), 0.008 + 0.004 * k, 0.07, mat('#ffffff', 0.5, alpha=0.08), 'fg')
    if o['coffee'] == 'lunch':
        box('lunch', (0.56, 0.86, 0.78), (0.18, 0.12, 0.05), mat('#a9b8a6', 0.6), 'fg', bevel=0.01)
    # Phone, face up: the game lights it with whoever is writing to you.
    pb, pt = (0.84, 0.9, 0.792), 18
    box('dock', (pb[0], pb[1] + 0.01, 0.78), (0.09, 0.07, 0.014), mat('#2a2622', 0.4), 'fg', bevel=0.004)
    box('phone', pb, (0.075, 0.008, 0.15), mat('#0d0e10', 0.2), 'fg', rot=(math.radians(-pt), 0, 0))
    quads['phone'] = upright((pb[0], pb[1] + 0.075 * math.sin(math.radians(pt)) - 0.005, pb[2] + 0.075 * math.cos(math.radians(pt))), 0.066, 0.136, tilt=pt)
    # A small desk clock and a flip calendar, both blank for the game to fill.
    box('clock-body', (0.3, 1.22, 0.78), (0.14, 0.05, 0.07), mat('#2a2622', 0.4), 'fg', bevel=0.006)
    quads['clock'] = upright((0.3, 1.194, 0.815), 0.12, 0.05)
    box('calendar-back', (-0.28, 1.24, 0.78), (0.16, 0.012, 0.12), mat('#3b2a20', 0.6), 'fg', rot=(math.radians(-14), 0, 0))
    box('calendar-page', (-0.28, 1.231, 0.785), (0.15, 0.003, 0.11), paper, 'fg', rot=(math.radians(-14), 0, 0))
    quads['calendar'] = upright((-0.28, 1.222, 0.842), 0.14, 0.1, tilt=14)
    # A photograph, reading glasses, books: a life outside the account.
    box('photo-frame', (1.0, 1.0, 0.78), (0.11, 0.012, 0.14), mat('#2a211b', 0.5), 'fg', rot=(math.radians(-10), 0, math.radians(-20)))
    box('photo', (1.0, 0.993, 0.79), (0.09, 0.003, 0.12), mat('#c79c72', 0.7), 'fg', rot=(math.radians(-10), 0, math.radians(-20)))
    for k, dx in enumerate((-0.02, 0.025)):
        cyl(f'lens{k}', (0.18 + dx, 0.62, 0.782), 0.018, 0.003, mat('#cfd8dc', 0.05, alpha=0.4), 'fg')
    box('glasses-bridge', (0.182, 0.62, 0.784), (0.012, 0.002, 0.002), mat('#2a211b', 0.4), 'fg')
    for k, (col, h) in enumerate((('#7a2f2a', 0.03), ('#264a43', 0.026), ('#c8b48a', 0.034))):
        box(f'book{k}', (1.02, 1.28, 0.78 + sum(x[1] for x in (('', 0.03), ('', 0.026), ('', 0.034))[:k])), (0.24, 0.17, h), mat(col, 0.7), 'fg', rot=(0, 0, math.radians(4 - 6 * k)))
    # The week piles up: more paper by Friday night.
    rp = random.Random(7)
    for k in range(o['mess'] * 3):
        box(f'sheet{k}', (rp.uniform(-1.1, -0.85), rp.uniform(0.7, 1.25), 0.78 + k * 0.002), (0.21, 0.28, 0.002), paper, 'fg', rot=(0, 0, math.radians(rp.uniform(-25, 25))))
    # The lamp: off in daylight, the only light left at night.
    cyl('lamp-base', (1.05, 1.15, 0.78), 0.08, 0.02, mat('#a8844f', 0.3, 0.8), 'fg')
    cyl('lamp-arm', (1.05, 1.15, 0.8), 0.008, 0.42, mat('#a8844f', 0.3, 0.8), 'fg')
    cyl('lamp-shade', (1.05, 1.15, 1.17), 0.085, 0.1, mat('#1f3b33', 0.4, 0.3), 'fg', r2=0.04)
    if o['lamp']:
        ball('bulb', (1.05, 1.15, 1.19), 0.03, mat('#fff', 0.5, emit='#ffd9a8', emit_strength=12), 'fg')
        area('lamp', (1.02, 1.05, 1.13), 0.1, 40 * o['lamp'], '#ffcf96', rot=(math.radians(25), 0, 0))
    area('screen-glow', (0.0, 1.05, 1.15), 1.6, 50, '#9fd6e0', rot=(math.radians(-90), 0, 0), sy=0.4)

    camera((0.42, -1.3, 1.46), (0.05, 2.2, 1.14), 27)
    return {
        'spots': {'theo': spot((-2.3, 2.9, 0)), 'nadia': spot((1.85, 1.65, 0))},
        'cams': {
            'screens': point((0.0, 1.3, 1.13), 2.2),
            'note': point((jc[0], jc[1], jc[2]), 2.8),
            'journal': point((jc[0], jc[1], jc[2]), 2.8),
            'sticky': point((rc[0], rc[1], rc[2]), 3.4),
            'rules': point((rc[0], rc[1], rc[2]), 3.4),
            'phone': point((pb[0], pb[1], 0.86), 3.4),
            'clock': point((0.3, 1.2, 0.82), 3.4),
            'window': point((0.0, 3.7, 1.75), 1.5),
        },
        'quads': {k: [point(c) for c in q] for k, q in quads.items()},
    }


ENVS = {'checkout': env_checkout, 'desks': env_desks, 'kitchen': env_kitchen, 'conference': env_conference, 'street': env_street, 'yard': env_yard, 'bathroom': env_bathroom, 'lobby': env_lobby, 'trading': env_trading, 'openhouse': env_openhouse, 'dealer': env_dealer, 'cabin': env_cabin, 'restaurant': env_restaurant, 'family': env_family, 'desk-dusk': lambda: env_desk('dusk'), 'desk-morning': lambda: env_desk('morning'), 'desk-noon': lambda: env_desk('noon'), 'desk-rain': lambda: env_desk('rain'), 'desk-night': lambda: env_desk('night')}

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
    cinematic(name)
    info['layers'] = render(name)
    data[name] = info
    with open(DATA, 'w') as f:
        f.write('// Generated by tools/blender/render_envs.py. Do not edit by hand.\n')
        f.write('window.PP = window.PP || {};\nPP.envData = ' + json.dumps(data, indent=1) + ';\n')
    print('done', name)
