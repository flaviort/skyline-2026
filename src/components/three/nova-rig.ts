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
  fingersR: "Hand_Fingers.R",
  thumbR: "Hand_Thumb.R",
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

/**
 * The model's rest pose has the arms raised by this much (radians, around
 * the body's front axis): scripts/nova/fix.py lifts them before fusing arms
 * and body into one suit. Arm angles in the stage are measured from the
 * delivered pose (arms down along the sides), so they subtract this.
 */
export const ARM_REST_LIFT = 0.6;

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

/** Rest pose of every driven bone, captured once after loading. */
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
