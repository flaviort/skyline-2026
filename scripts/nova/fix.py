"""Builds the website Nova from the designer's .blend.

Run through `npm run model:nova` (Blender in the background, then the
optimizer). It opens the .blend without saving it, keeps only the website
rig (`Astronault_Rig.001` and the collections `1.001` and `2.001`), fixes
what glTF cannot carry or what the rig gets wrong, and exports a .glb:

- Applies the Subdivision Surface, Mirror, Solidify, Shrinkwrap and Mesh
  Deform modifiers at the rest pose, so the smoothing, the right hand and the
  flags come out as modelled.
- Puts every piece in the rig's space and skins it: flags, zipper and details
  copy the weights of the surface they sit on (Data Transfer, nearest face).
- The backpack and everything on it get one set of weights, the average of
  his back under it, so it moves as a rigid case.
- The visor glass and ring copy the weights of the suit around them, so the
  head turns as one piece.
- Bones: the antenna hangs from the top of the spine, the feet from the
  lower legs; IK constraints are removed (glTF does not carry them).

Usage: blender -b <file.blend> --python scripts/nova/fix.py -- <out.glb>
"""

import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

OUT = sys.argv[sys.argv.index("--") + 1]
RIG = "Astronault_Rig.001"
COLLECTIONS = ["1.001", "2.001"]

BODY = "Astronault_Body.003"
ARMS = "Astronault_Arms.001"
BAG = "Astronault_Bag.001"

# Pieces that copy weights from a surface, by name.
FROM_BODY = [
    "Astronault_Zipper.001",
    "NurbsCurve_Zipper_Out.001",
    "NurbsCurve_Zipper_In.002",
    "Astronault_Flag.004",
    "Astronault_Body_Detail.003",
    "Astronault_Body_Detail.004",
    "Cylinder.001",
]
# Flag.005 is the left sleeve flag, Flag.006 the right one.
FROM_ARMS = ["Astronault_Flag.005", "Astronault_Flag.006", "Astronault_Body_Arm_Dedail.002", "Astronault_Body_Arm_Dedail.003"]
ON_BAG = [BAG, "Astronault_Bag_Detail.002", "Astronault_Bag_Detail.003", "Astronault_Flag.007"]

# Rigid pieces that stay parented to a bone (not skinned).
BONE_PARENTED = ["Astronault_Bag_Anten_Light.001"]


def log(*parts):
    print("[nova]", *parts)


rig = bpy.data.objects[RIG]
rig.data.pose_position = "REST"
bpy.context.view_layer.update()

keep = {o for name in COLLECTIONS for o in bpy.data.collections[name].all_objects if o.type == "MESH"}
log("pieces:", len(keep))

# 1. Freeze world placement before anything changes: vertex-parented flags
#    follow vertices that are about to be renumbered.
world = {o: o.matrix_world.copy() for o in keep}

# 2. Evaluate every piece with all modifiers except the armature, in one
#    pass, so shrinkwraps and mesh deforms still see the original targets.
# Bevels are tuned for stills; two segments still round the zipper teeth
# and keep the file light.
BEVEL_SEGMENTS = 2
for o in keep:
    for m in o.modifiers:
        if m.type == "ARMATURE":
            m.show_viewport = False
        elif m.type == "BEVEL":
            m.segments = min(m.segments, BEVEL_SEGMENTS)
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()
baked = {o: bpy.data.meshes.new_from_object(o.evaluated_get(depsgraph), preserve_all_data_layers=True, depsgraph=depsgraph) for o in keep}

for o, mesh in baked.items():
    o.modifiers.clear()
    if o.data.shape_keys:
        o.shape_key_clear()
    o.data = mesh
    if o.name in BONE_PARENTED:
        o.matrix_world = world[o]
        continue
    # Into world space, then under the rig with no offset of its own.
    o.parent = None
    mesh.transform(world[o])
    o.parent = rig
    o.parent_type = "OBJECT"
    o.matrix_parent_inverse = rig.matrix_world.inverted()
    o.matrix_basis.identity()
bpy.context.view_layer.update()
log("modifiers applied")


# Bones that actually deform: the body still carries vertex groups from an
# older rig (Bone.001, Bone.003...), which must not leak into any weights.
DEFORM = {b.name for b in rig.data.bones if b.use_deform}


def clean_weights(o):
    """Drops vertex groups that are not deforming bones of this rig, then normalizes every vertex."""
    for group in list(o.vertex_groups):
        if group.name not in DEFORM:
            o.vertex_groups.remove(group)
    names = {g.index: g.name for g in o.vertex_groups}
    for v in o.data.vertices:
        total = sum(g.weight for g in v.groups if g.group in names)
        if total > 0:
            for g in v.groups:
                g.weight /= total


for o in keep:
    clean_weights(o)


def add_armature(o):
    m = o.modifiers.new("Armature", "ARMATURE")
    m.object = rig


def transfer_weights(target, source):
    """Replaces the target's weights with the source surface's, nearest face interpolated."""
    target.vertex_groups.clear()
    for group in source.vertex_groups:
        target.vertex_groups.new(name=group.name)
    # (source groups are already cleaned, so only real bones come across)
    m = target.modifiers.new("Weights", "DATA_TRANSFER")
    m.object = source
    m.use_vert_data = True
    m.data_types_verts = {"VGROUP_WEIGHTS"}
    m.vert_mapping = "POLYINTERP_NEAREST"
    m.layers_vgroup_select_src = "ALL"
    m.layers_vgroup_select_dst = "NAME"
    with bpy.context.temp_override(object=target, active_object=target, selected_objects=[target]):
        bpy.ops.object.modifier_apply(modifier=m.name)
    clean_weights(target)


def rigid_weights(pieces, source, allowed):
    """One set of weights for several pieces: the average of the source under them, limited to `allowed` bones."""
    totals = {}
    for o in pieces:
        transfer_weights(o, source)
        names = {g.index: g.name for g in o.vertex_groups}
        for v in o.data.vertices:
            for g in v.groups:
                if allowed(names[g.group]):
                    totals[names[g.group]] = totals.get(names[g.group], 0) + g.weight
    strongest = sorted(totals.items(), key=lambda item: -item[1])[:4]
    total = sum(w for _, w in strongest)
    weights = {name: w / total for name, w in strongest}
    log("backpack weights:", {k: round(v, 3) for k, v in weights.items()})
    for o in pieces:
        o.vertex_groups.clear()
        every = [v.index for v in o.data.vertices]
        for name, w in weights.items():
            o.vertex_groups.new(name=name).add(every, w, "REPLACE")


body = bpy.data.objects[BODY]
arms = bpy.data.objects[ARMS]

for name in FROM_BODY:
    transfer_weights(bpy.data.objects[name], body)
for name in FROM_ARMS:
    transfer_weights(bpy.data.objects[name], arms)
# The bottom of the pack reaches his hips, where the body follows the legs:
# only the spine counts, or the pack would twitch with every kick.
rigid_weights([bpy.data.objects[name] for name in ON_BAG], body, lambda name: name.startswith("Spine"))
log("weights transferred")
for o in sorted(keep, key=lambda o: o.name):
    unweighted = sum(1 for v in o.data.vertices if not v.groups) if o.name not in BONE_PARENTED else 0
    log(f"{o.name}: {len(o.data.vertices)} verts, groups {sorted(g.name for g in o.vertex_groups)[:8]}, unweighted {unweighted}")

for o in keep:
    if o.name not in BONE_PARENTED:
        add_armature(o)

# 3. Bones.
bpy.context.view_layer.objects.active = rig
for o in bpy.context.view_layer.objects:
    o.select_set(o == rig)
bpy.ops.object.mode_set(mode="EDIT")
bones = rig.data.edit_bones
for child, parent in [("Anten_01", "Spine.03"), ("Foot.L", "Leg.L.001"), ("Foot.R", "Leg.R.001")]:
    bones[child].use_connect = False
    bones[child].parent = bones[parent]
bpy.ops.object.mode_set(mode="OBJECT")
for pose_bone in rig.pose.bones:
    for constraint in list(pose_bone.constraints):
        pose_bone.constraints.remove(constraint)
rig.data.pose_position = "POSE"
for pose_bone in rig.pose.bones:
    pose_bone.matrix_basis.identity()
log("bones fixed")

# 4. One suit. As delivered, the arms are separate tubes pushed into the
#    body and pivoting deep inside it, so the sleeve slides through the suit
#    at the shoulder whatever the weights. Here they become one surface:
#    - the arms are lifted to a new rest pose first (they hang close along
#      his sides, so fusing them there would glue them to his flanks);
#    - arms and body are fused with an exact boolean union;
#    - around the seam the weights blend from body to arm, so the shoulder
#      bends like fabric;
#    - the delivered shoulder pipes are dropped (they were shaped for the old
#      overlap, and rings or straps at the shoulder were tried and dropped).
ARM_LIFT = 0.6  # radians the arms are raised in the new rest pose (the site offsets its arm angles by this)
SEAM_BLEND = 0.05  # distance from the seam over which weights go from half and half to fully body or arm
FILLET_RADIUS = 0.015  # the suit is rounded off this close to the seam, so sleeve and body meet without a crease
FILLET_PASSES = 8
WEIGHT_SMOOTH_RADIUS = 0.07  # weights are evened out this close to the seam, so raising the arm never folds the suit
WEIGHT_SMOOTH_PASSES = 6
SLEEVE_FLAG_SHIFT = 0.015  # sleeve flags move this far down the arm, out of the fold at the top of the shoulder
PIPES = ["Astronault_Body_Arm_Dedail.002", "Astronault_Body_Arm_Dedail.003"]


def select_only(*objects, active=None):
    for o in bpy.context.view_layer.objects:
        o.select_set(o in objects)
    bpy.context.view_layer.objects.active = active or objects[0]


def bake_pose(objects):
    """Applies the current pose to the objects' meshes, keeping their weights."""
    for o in objects:
        for m in list(o.modifiers):
            if m.type == "ARMATURE":
                with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
                    bpy.ops.object.modifier_apply(modifier=m.name)
        add_armature(o)


def lift_arms():
    for side in ("L", "R"):
        bone = rig.pose.bones[f"Arm_01.{side}"]
        head = rig.matrix_world @ bone.head
        tail_before = (rig.matrix_world @ bone.tail).z
        for sign in (1, -1):
            turn = Matrix.Translation(head) @ Matrix.Rotation(sign * ARM_LIFT, 4, Vector((0, 1, 0))) @ Matrix.Translation(-head)
            bone.matrix = rig.matrix_world.inverted() @ turn @ rig.matrix_world @ bone.matrix
            bpy.context.view_layer.update()
            if (rig.matrix_world @ bone.tail).z > tail_before:
                break
            bone.matrix_basis.identity()
            bpy.context.view_layer.update()
    skinned = [o for o in keep if any(m.type == "ARMATURE" for m in o.modifiers)]
    bake_pose(skinned)
    select_only(rig)
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    log("arms lifted into the new rest pose by", ARM_LIFT, "rad")


def weights_of(o):
    names = {g.index: g.name for g in o.vertex_groups}
    return [{names[g.group]: g.weight for g in v.groups} for v in o.data.vertices]


def surface_weights(o, table, point):
    """Weights of a mesh at its surface point closest to `point`."""
    found, location, normal, face = o.closest_point_on_mesh(point)
    blend, total = {}, 0.0
    for index in o.data.polygons[face].vertices:
        influence = 1.0 / ((o.data.vertices[index].co - location).length + 1e-5)
        total += influence
        for name, w in table[index].items():
            blend[name] = blend.get(name, 0.0) + w * influence
    return {k: v / total for k, v in blend.items()}


def smoothstep(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def fuse_suit():
    for name in PIPES:
        pipe = bpy.data.objects[name]
        keep.discard(pipe)
        bpy.data.objects.remove(pipe)

    # Copies to read the original weights from once the meshes are fused.
    body_src = body.copy()
    body_src.data = body.data.copy()
    arms_src = arms.copy()
    arms_src.data = arms.data.copy()
    for o in (body_src, arms_src):
        bpy.context.scene.collection.objects.link(o)
        o.modifiers.clear()
    body_table, arms_table = weights_of(body_src), weights_of(arms_src)

    # Mark which faces came from the arms (a temporary material), so the seam
    # can be found after.
    cloth = body.data.materials[0]
    marker = bpy.data.materials.new("Seam_Marker")
    arms.data.materials.clear()
    arms.data.materials.append(marker)
    for polygon in arms.data.polygons:
        polygon.material_index = 0
    union = body.modifiers.new("Fuse", "BOOLEAN")
    union.operation = "UNION"
    union.solver = "EXACT"
    union.object = arms
    union.material_mode = "TRANSFER"
    union.use_hole_tolerant = True
    body.modifiers.move(len(body.modifiers) - 1, 0)
    with bpy.context.temp_override(object=body, active_object=body, selected_objects=[body]):
        bpy.ops.object.modifier_apply(modifier=union.name)
    keep.discard(arms)
    bpy.data.objects.remove(arms)

    # The seam: edges between a body face and an arm face.
    mesh = bmesh.new()
    mesh.from_mesh(body.data)
    mesh.verts.ensure_lookup_table()
    arm_slot = next(i for i, m in enumerate(body.data.materials) if m == marker)
    seam_edges = [e for e in mesh.edges if len(e.link_faces) == 2 and (e.link_faces[0].material_index == arm_slot) != (e.link_faces[1].material_index == arm_slot)]
    seam_verts = {v for e in seam_edges for v in e.verts}
    on_arm = [any(f.material_index == arm_slot for f in v.link_faces) for v in mesh.verts]
    seam_points = [v.co.copy() for v in seam_verts]
    log("suit fused:", len(mesh.verts), "verts,", len(seam_edges), "seam edges")

    seam_set = set(seam_edges)
    distance = [min((v.co - p).length for p in seam_points) if seam_points else 1.0 for v in mesh.verts]

    # Round off the seam: the union leaves a hard crease and long thin
    # triangles there, which shade as streaks. Re-triangulate evenly, then
    # relax the surface near the seam into a soft fillet.
    region = [v for v in mesh.verts if distance[v.index] < FILLET_RADIUS]
    faces = list({f for v in region for f in v.link_faces})
    faces = bmesh.ops.triangulate(mesh, faces=faces)["faces"]
    inner = list({e for f in faces for e in f.edges if e not in seam_set and not e.is_boundary})
    bmesh.ops.beautify_fill(mesh, faces=faces, edges=inner)
    for _ in range(FILLET_PASSES):
        bmesh.ops.smooth_vert(mesh, verts=region, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    for edge in mesh.edges:
        edge.smooth = True
    for face in mesh.faces:
        face.smooth = True
    mesh.verts.index_update()
    mesh.to_mesh(body.data)

    # Weights: half and half on the seam, fading to fully body or fully arm.
    for group in list(body.vertex_groups):
        body.vertex_groups.remove(group)
    groups = {}
    weights = []
    for v in mesh.verts:
        fade = smoothstep(distance[v.index] / SEAM_BLEND)
        arm_share = 0.5 + 0.5 * fade if on_arm[v.index] else 0.5 - 0.5 * fade
        mixed = {}
        if arm_share < 1:
            for name, w in surface_weights(body_src, body_table, v.co).items():
                mixed[name] = mixed.get(name, 0.0) + w * (1 - arm_share)
        if arm_share > 0:
            for name, w in surface_weights(arms_src, arms_table, v.co).items():
                mixed[name] = mixed.get(name, 0.0) + w * arm_share
        weights.append(mixed)

    # Even the weights out around the shoulder: an abrupt change anywhere
    # would fold the suit into a ridge when the arm goes up.
    near = [v for v in mesh.verts if distance[v.index] < WEIGHT_SMOOTH_RADIUS]
    for _ in range(WEIGHT_SMOOTH_PASSES):
        updated = {}
        for v in near:
            others = [e.other_vert(v).index for e in v.link_edges]
            blend = {name: w * 0.5 for name, w in weights[v.index].items()}
            for o in others:
                for name, w in weights[o].items():
                    blend[name] = blend.get(name, 0.0) + w * 0.5 / len(others)
            updated[v.index] = blend
        for index, blend in updated.items():
            weights[index] = blend

    for v in mesh.verts:
        strongest = sorted(weights[v.index].items(), key=lambda item: -item[1])[:4]
        total = sum(w for _, w in strongest) or 1.0
        for name, w in strongest:
            if name not in groups:
                groups[name] = body.vertex_groups.new(name=name)
            groups[name].add([v.index], w / total, "REPLACE")

    for polygon in body.data.polygons:
        polygon.material_index = 0
    while len(body.data.materials) > 1:
        body.data.materials.pop(index=len(body.data.materials) - 1)
    body.data.materials[0] = cloth
    bpy.data.materials.remove(marker)

    mesh.free()
    for o in (body_src, arms_src):
        bpy.data.objects.remove(o)


lift_arms()
fuse_suit()
# The sleeve flags sit where the shoulder weights were evened out: they copy
# the finished suit so they stay on the sleeve.
for name in ("Astronault_Flag.005", "Astronault_Flag.006"):
    flag = bpy.data.objects[name]
    for v in flag.data.vertices:
        side = "L" if v.co.x > 0 else "R"
        bone = rig.data.bones[f"Arm_01.{side}"]
        down_arm = (rig.matrix_world @ bone.tail_local - rig.matrix_world @ bone.head_local).normalized()
        v.co += down_arm * SLEEVE_FLAG_SHIFT
    transfer_weights(flag, body)

# 5. Export only Nova.
for o in bpy.context.view_layer.objects:
    o.select_set(o == rig or o in keep)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=True,
    export_apply=False,
    export_yup=True,
    export_def_bones=True,
    export_animations=False,
    export_morph=False,
    export_cameras=False,
    export_lights=False,
)
log("exported", OUT)
