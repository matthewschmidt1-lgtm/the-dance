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


ENVS = {'trading': env_trading, 'desk-dusk': lambda: env_desk('dusk'), 'desk-morning': lambda: env_desk('morning'), 'desk-noon': lambda: env_desk('noon'), 'desk-rain': lambda: env_desk('rain'), 'desk-night': lambda: env_desk('night')}

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
