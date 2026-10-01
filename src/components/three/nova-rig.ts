import * as THREE from "three";

// Bone names as exported from Blender. three.js strips dots from node names
// (Spine.01 becomes Spine01), so every lookup goes through sanitizeNodeName.
// If the 3D designer renames bones, this map is the only place to update.
const BONE_NAMES = {
  main: "Main",
  pelvis: "Pelvis",
  spine1: "Spine.01",
  spine2: "Spine.02",
  spine3: "Spine.03",
  armL1: "Arm_01.L",
  armL2: "Arm_02.L",
  handL: "Hand.L",
  armR1: "Arm_01.R",
  armR2: "Arm_02.R",
  handR: "Hand.R",
  legL: "Leg.L",
  legL2: "Leg.L.001",
  legR: "Leg.R",
  legR2: "Leg.R.001",
  footL: "Foot.L",
  footR: "Foot.R",
  anten1: "Anten_01",
  anten2: "Anten_02",
  anten3: "Anten_03",
} as const;

export type BoneKey = keyof typeof BONE_NAMES;
export type NovaBones = Record<BoneKey, THREE.Bone>;

export function findBones(model: THREE.Object3D): NovaBones {
  const bones = {} as NovaBones;
  for (const [key, name] of Object.entries(BONE_NAMES) as Array<[BoneKey, string]>) {
    const bone = model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));
    if (!(bone instanceof THREE.Bone)) throw new Error(`Nova rig: bone "${name}" not found`);
    bones[key] = bone;
  }
  return bones;
}

const hasBoneAncestor = (object: THREE.Object3D) => {
  for (let node = object.parent; node; node = node.parent) if ((node as THREE.Bone).isBone) return true;
  return false;
};

/**
 * Temporary fixes for the first rig delivery (see docs/NOVA-3D.md). Each one
 * only runs when it detects the problem, so a corrected file passes through
 * untouched.
 * - The antenna chain hangs off the rig root: re-parent it to the top of the spine.
 * - Zipper, flags and a backpack detail are not attached to any bone: attach
 *   each rigid piece to the nearest body bone so it follows the motion.
 * - The backpack is weighted to the leg bones: hand that influence to the
 *   spine so moving the legs does not warp it.
 * - The foot bones hang off the root instead of the legs: re-attach each
 *   foot to the end of its leg so the feet follow.
 * - The hands mesh only contains the left hand (a mirror that was never
 *   applied): build the right hand as a mirrored copy on the right bones.
 */
export function patchRig(model: THREE.Object3D, bones: NovaBones) {
  model.updateMatrixWorld(true);

  if (!(bones.anten1.parent as THREE.Bone | null)?.isBone) bones.spine3.attach(bones.anten1);
  if (bones.footL.parent !== bones.legL2) bones.legL2.attach(bones.footL);
  if (bones.footR.parent !== bones.legR2) bones.legR2.attach(bones.footR);

  const loose: THREE.Mesh[] = [];
  model.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh && !(mesh as THREE.SkinnedMesh).isSkinnedMesh && !hasBoneAncestor(mesh)) loose.push(mesh);
  });

  // Distance to each bone's segment (joint to its first child joint), so a
  // sleeve flag goes to the upper arm rather than the closer spine joint.
  const candidates = [bones.spine1, bones.spine2, bones.spine3, bones.armL1, bones.armR1, bones.armL2, bones.armR2];
  const segments = candidates.map((bone) => {
    const child = bone.children.find((node) => (node as THREE.Bone).isBone);
    const start = bone.getWorldPosition(new THREE.Vector3());
    const end = child ? child.getWorldPosition(new THREE.Vector3()) : start.clone();
    return { bone, line: new THREE.Line3(start, end) };
  });
  const center = new THREE.Vector3();
  const closest = new THREE.Vector3();
  for (const mesh of loose) {
    new THREE.Box3().setFromObject(mesh).getCenter(center);
    let nearest = segments[0];
    let best = Infinity;
    for (const segment of segments) {
      const distance = segment.line.closestPointToPoint(center, true, closest).distanceToSquared(center);
      if (distance < best) {
        best = distance;
        nearest = segment;
      }
    }
    nearest.bone.attach(mesh);
  }

  reweightBackpack(model, bones);
  mirrorMissingHand(model);
}

/**
 * Copies a one-sided hands mesh to the other side, mirrored across the
 * body's centre. The optimized file quantizes vertices and folds the
 * dequantization into the skin's inverse bind matrices, so the true rest
 * shape is read through skinning, mirrored, and bound to a fresh skeleton
 * built from the same bones at rest.
 */
function mirrorMissingHand(model: THREE.Object3D) {
  const hands = model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName("Astronault_Hands.001")) as
    | THREE.SkinnedMesh
    | undefined;
  if (!hands?.isSkinnedMesh || hands.userData.mirrored) return;

  model.updateMatrixWorld(true);
  const count = hands.geometry.getAttribute("position").count;
  const toLocal = hands.matrixWorld.clone().invert();
  const point = new THREE.Vector3();
  const rest = new Float32Array(count * 3);
  let positive = 0;
  for (let i = 0; i < count; i++) {
    hands.getVertexPosition(i, point).applyMatrix4(hands.matrixWorld);
    if (point.x > 0) positive++;
    point.toArray(rest, i * 3);
  }
  // Only patch when every vertex sits on one side of the body.
  if (positive !== 0 && positive !== count) return;

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    point.fromArray(rest, i * 3);
    point.x = -point.x;
    point.applyMatrix4(toLocal).toArray(positions, i * 3);
  }

  const bones = hands.skeleton.bones;
  const counterpart = bones.map((bone, index) => {
    const match = /^(.*)([LR])$/.exec(bone.name);
    if (!match) return index;
    const other = bones.findIndex((b) => b.name === match[1] + (match[2] === "L" ? "R" : "L"));
    return other >= 0 ? other : index;
  });

  const source = hands.geometry;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const skinIndex = source.getAttribute("skinIndex");
  const indices = new Uint16Array(skinIndex.count * 4);
  for (let i = 0; i < skinIndex.count; i++) {
    for (let slot = 0; slot < 4; slot++) indices[i * 4 + slot] = counterpart[skinIndex.getComponent(i, slot)];
  }
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", source.getAttribute("skinWeight").clone());

  // Mirroring flips the triangle winding; swap two corners so faces point outward.
  const index = source.getIndex();
  if (index) {
    const triangles = Array.from({ length: index.count }, (_, i) => index.getX(i));
    for (let i = 0; i < triangles.length; i += 3) [triangles[i + 1], triangles[i + 2]] = [triangles[i + 2], triangles[i + 1]];
    geometry.setIndex(triangles);
  }
  geometry.computeVertexNormals();

  const right = new THREE.SkinnedMesh(geometry, hands.material);
  right.name = `${hands.name}_mirrored`;
  right.frustumCulled = false;
  hands.parent?.add(right);
  right.updateMatrixWorld(true);
  // A fresh skeleton computes its inverse bind matrices from the bones' current (rest) pose.
  right.bind(new THREE.Skeleton(bones));
  hands.userData.mirrored = true;
}

function reweightBackpack(model: THREE.Object3D, bones: NovaBones) {
  const bag = model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName("Astronault_Bag.001")) as
    | THREE.SkinnedMesh
    | undefined;
  if (!bag?.isSkinnedMesh) return;
  const skeletonBones = bag.skeleton.bones;
  const legs = new Set([skeletonBones.indexOf(bones.legL), skeletonBones.indexOf(bones.legR)]);
  const spine = skeletonBones.indexOf(bones.spine1);
  if (spine < 0) return;
  const indices = bag.geometry.getAttribute("skinIndex");
  for (let vertex = 0; vertex < indices.count; vertex++) {
    for (let slot = 0; slot < 4; slot++) {
      if (legs.has(indices.getComponent(vertex, slot))) indices.setComponent(vertex, slot, spine);
    }
  }
  indices.needsUpdate = true;
}

/** Rest pose of every driven bone, captured once after patching. */
export function captureRest(bones: NovaBones) {
  const rest = new Map<THREE.Bone, THREE.Quaternion>();
  for (const bone of Object.values(bones)) rest.set(bone, bone.quaternion.clone());
  return rest;
}

const _parent = new THREE.Quaternion();
const _toParent = new THREE.Quaternion();
const _delta = new THREE.Quaternion();
const _axis = new THREE.Vector3();

export const AXIS = {
  /** Nova's left-right axis: pitch (nod, bend forward) */
  x: new THREE.Vector3(1, 0, 0),
  /** Vertical axis: yaw (turn) */
  y: new THREE.Vector3(0, 1, 0),
  /** Front-back axis: roll (lean sideways) */
  z: new THREE.Vector3(0, 0, 1),
};

/**
 * Resets a bone to its rest pose, then rotates it around axes expressed in
 * Nova's own space (the `space` object, his root group), whatever the bone's
 * local axes are. Bones must be posed parent first.
 */
export function poseBone(
  bone: THREE.Bone,
  rest: Map<THREE.Bone, THREE.Quaternion>,
  space: THREE.Object3D,
  rotations: Array<[THREE.Vector3, number]>,
) {
  const restQuaternion = rest.get(bone);
  if (!restQuaternion || !bone.parent) return;
  bone.quaternion.copy(restQuaternion);
  bone.parent.updateWorldMatrix(true, false);
  bone.parent.getWorldQuaternion(_parent);
  space.getWorldQuaternion(_toParent);
  _toParent.premultiply(_parent.invert());
  for (const [axis, angle] of rotations) {
    if (!angle) continue;
    _axis.copy(axis).applyQuaternion(_toParent).normalize();
    _delta.setFromAxisAngle(_axis, angle);
    bone.quaternion.premultiply(_delta);
  }
}
