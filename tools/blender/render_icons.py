"""Render the three "next move" icons as glossy clay objects on transparent backgrounds.

  play    a teal pawn            (your next move)
  bench   a stack of three books (the thinkers)
  profile a three-step podium    (your record)

Run:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/render_icons.py -- "$PWD" [--samples N]
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ROOT = argv[0] if argv else os.getcwd()
SAMPLES = int(argv[argv.index('--samples') + 1]) if '--samples' in argv else 128
OUT = os.path.join(ROOT, 'public', 'img', 'next')
os.makedirs(OUT, exist_ok=True)


def lin(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


def clay(name, color, rough=0.32):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = lin(color)
    p.inputs['Roughness'].default_value = rough
    if 'Coat Weight' in p.inputs:
        p.inputs['Coat Weight'].default_value = 0.6
        p.inputs['Coat Roughness'].default_value = 0.12
    if 'Subsurface Weight' in p.inputs:
        p.inputs['Subsurface Weight'].default_value = 0.08
    return m


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def finish(name, bm, m, smooth=True, bevel=0.0):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = link(bpy.data.objects.new(name, me))
    ob.data.materials.append(m)
    if bevel:
        mod = ob.modifiers.new('b', 'BEVEL')
        mod.width = bevel
        mod.segments = 6
        mod.harden_normals = False
    return ob


def rbox(name, c, s, m, bevel=0.06):
    bm = bmesh.new()
    v = bmesh.ops.create_cube(bm, size=1.0)['verts']
    bmesh.ops.scale(bm, vec=s, verts=v)
    ob = finish(name, bm, m, smooth=False, bevel=bevel)
    ob.location = c
    return ob


def lathe(name, profile, m, loc, segs=72):
    bm = bmesh.new()
    rings = [[bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for a in [i * 2 * math.pi / segs for i in range(segs)]] for r, z in profile]
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i]))
    bm.faces.new(list(reversed(rings[0])))
    ob = finish(name, bm, m)
    ob.location = loc
    return ob


def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.render.resolution_x = sc.render.resolution_y = 720
    sc.render.film_transparent = True
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = 'GPU'
    except Exception as e:
        print('CPU render:', e)
    # Standard keeps the colours clear and saturated (AgX mutes them toward pastel).
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.exposure = -0.95
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.quality = 86
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = lin('#f4efe6')
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    sc.world = w
    # Soft studio: big key from upper left, fill from right, rim from behind.
    for name, loc, size, energy, col in [('key', (-2.4, -2.2, 3.4), 2.6, 520, '#fff4e6'),
                                         ('fill', (2.8, -1.6, 1.6), 3.0, 160, '#e6f3ff'),
                                         ('rim', (0.6, 2.8, 2.6), 1.6, 380, '#ffffff')]:
        ld = bpy.data.lights.new(name, 'AREA')
        ld.energy = energy
        ld.size = size
        ld.color = lin(col)[:3]
        ob = link(bpy.data.objects.new(name, ld))
        ob.location = loc
        ob.rotation_euler = (Vector((0, 0, 0.5)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    # Shadow catcher: a soft contact shadow, otherwise transparent.
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=40)
    ground = finish('ground', bm, clay('g', '#ffffff'), smooth=False)
    ground.is_shadow_catcher = True
    cd = bpy.data.cameras.new('cam')
    cd.lens = 82
    cam = link(bpy.data.objects.new('cam', cd))
    cam.location = (2.6, -4.2, 2.5)
    cam.rotation_euler = (Vector((0, 0, 0.55)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam


def render(name):
    bpy.context.scene.render.filepath = os.path.join(OUT, f'{name}.webp')
    bpy.ops.render.render(write_still=True)
    print('icon', name)


# Play: a teal pawn on a little coral disc.
setup()
pawn = [(0.36, 0.0), (0.36, 0.07), (0.30, 0.11), (0.28, 0.17), (0.20, 0.23), (0.15, 0.33), (0.125, 0.62), (0.115, 0.78),
        (0.2, 0.82), (0.2, 0.87), (0.1, 0.91), (0.085, 0.95), (0.15, 1.01), (0.18, 1.09), (0.18, 1.15), (0.15, 1.23), (0.09, 1.28), (0.0, 1.30)]
lathe('pawn', pawn, clay('teal', '#10b6a4', 0.28), (0, 0, 0.06))
lathe('disc', [(0.62, 0.0), (0.62, 0.05), (0.58, 0.07), (0.0, 0.07)], clay('coral', '#ff6e4e', 0.35), (0, 0, 0))
render('play')

# Bench: three books, slightly fanned, coral / butter / teal.
setup()
for i, (col, w, d, rot) in enumerate([('#ff6e4e', 1.25, 0.86, 4), ('#ffc23a', 1.15, 0.8, -7), ('#10b6a4', 1.05, 0.74, 10)]):
    h = 0.2
    rbox(f'book{i}', (0, 0, h / 2 + i * (h + 0.005)), (w, d, h), clay(f'c{i}', col, 0.34), bevel=0.035).rotation_euler = (0, 0, math.radians(rot))
    pages = rbox(f'pages{i}', (0.04, -0.012, h / 2 + i * (h + 0.005)), (w - 0.06, d - 0.02, h - 0.05), clay(f'p{i}', '#fbf6ea', 0.6), bevel=0.01)
    pages.rotation_euler = (0, 0, math.radians(rot))
lathe('apple', [(0.0, 0.0), (0.12, 0.02), (0.17, 0.09), (0.16, 0.17), (0.1, 0.22), (0.0, 0.2)], clay('red', '#ea3f3a', 0.25), (0.2, 0.05, 0.615))
render('bench')

# Profile: a three-step podium with a small sphere on top.
setup()
for x, h, col in [(-0.55, 0.42, '#ffc23a'), (0.0, 0.7, '#10b6a4'), (0.55, 0.28, '#ff6e4e')]:
    rbox(f'step{x}', (x, 0, h / 2), (0.52, 0.6, h), clay(f's{x}', col, 0.32), bevel=0.05)
lathe('ball', [(0.0, 0.0), (0.12, 0.02), (0.17, 0.08), (0.18, 0.15), (0.16, 0.24), (0.1, 0.29), (0.0, 0.31)], clay('ivory', '#fbf3e2', 0.25), (0, 0, 0.7))
render('profile')
