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

/**
 * Temporary fixes for the first rig delivery (see docs/NOVA-3D.md). Each one
 * only runs when it detects the problem, so a corrected file passes through
 * untouched.
 * - The antenna chain hangs off the rig root: re-parent it to the top of the spine.
 * - The foot bones hang off the root instead of the legs: re-attach each
 *   foot to the end of its leg so the feet follow.
 * - The suit was exported without its subdivision, so it is faceted and the
 *   details modelled on the smooth surface sink into it or float off it:
 *   smooth the suit surfaces.
 * - Zipper, flags, suit details and the backpack are either not skinned at
 *   all or skinned to the wrong bones (the backpack to the legs and the
 *   antenna): copy the weights of the suit surface they sit on, and rest
 *   them on the smoothed surface.
 * - The hands mesh only contains the left hand (a mirror that was never
 *   applied): build the right hand as a mirrored copy on the right bones.
 */
export function patchRig(model: THREE.Object3D, bones: NovaBones) {
  model.updateMatrixWorld(true);

  if (!(bones.anten1.parent as THREE.Bone | null)?.isBone) bones.spine3.attach(bones.anten1);
  if (bones.footL.parent !== bones.legL2) bones.legL2.attach(bones.footL);
  if (bones.footR.parent !== bones.legR2) bones.legR2.attach(bones.footR);

  // Weights are read from the suit as delivered, before smoothing: the same
  // weights on a sixteenth of the vertices, so lookups stay fast.
  const suit = readSuit(model);
  model.traverse((node) => {
    const mesh = node as THREE.SkinnedMesh;
    if (mesh.isSkinnedMesh && !mesh.userData.smoothed && SMOOTHED.test(`${mesh.name} ${(mesh.material as THREE.Material).name}`)) {
      smoothSurface(mesh, 2);
    }
  });
  skinDetailsToSuit(model, suit);
  mirrorMissingHand(model);
}

const byName = (model: THREE.Object3D, name: string) =>
  model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name)) as THREE.SkinnedMesh | undefined;

// The suit surfaces that carry the real weights, and the pieces that sit on
// them. The backpack counts as a piece: it should move with his back.
const SUIT_SURFACES = ["Astronault_Body.003", "Astronault_Arms.001"];
const SUIT_DETAIL = /Zipper|Flag|Detail|Dedail|Astronault_Bag\d/;
/** The visor glass and its ring: they take the suit opening's weights, so the head turns as one. */
const VISOR = /Astronault_(Glass|Metal)/;
// Everything that was modelled smooth: the suit, the gloves and the visor.
// The thin metal ring around the visor is left alone: smoothing a ring that
// thin shrinks it into the suit. Open edges stay put when smoothing, so the
// glass and the suit opening still meet it.
const SMOOTHED = /Astronault_(Body|Arms|Bag|Hands)\d|Astronault_Glass/;
/**
 * Shoulder seams: the pipe around each arm where the sleeve meets the body.
 * The arm is a rigid tube pushed into the body, pivoting deep inside it, so
 * the place where it comes out of the suit moves along the tube as the arm
 * swings. Each seam turns with its arm (so it stays wrapped around the tube)
 * and slides along it every frame to stay where the tube leaves the body:
 * see slideSeams.
 */
const SHOULDER_SEAM = /Arm_Dedail/;

type Seam = {
  slider: THREE.Bone;
  arm: THREE.Bone;
  elbow: THREE.Bone;
  /** Sideways distance from the shoulder pivot to the seam at rest, model units */
  gap: number;
  /** Distance along the arm from the pivot to the seam at rest, model units */
  along: number;
  /** Arm-local units per model unit */
  toLocal: number;
  /** Unit vector along the arm, in the arm bone's space */
  axis: THREE.Vector3;
};
/** Pieces rested on the smoothed suit so they never sink into it. */
const RESTED = /Zipper|Flag/;
/** Gap left between a piece and the suit under it, in model units (he is 0.78 tall). */
const REST_GAP = 0.0012;

/** A mesh's name with its parent's and grandparent's, for name tests on multi-material pieces. */
const lineage = (object: THREE.Object3D) => [object.name, object.parent?.name, object.parent?.parent?.name].join(" ");

/** Uniform grid over a point cloud, for nearest-neighbour queries. */
class PointGrid {
  private cells = new Map<number, number[]>();
  constructor(
    readonly points: Float32Array,
    private size: number,
  ) {
    for (let i = 0; i < points.length / 3; i++) {
      const key = this.key(this.cell(points[i * 3]), this.cell(points[i * 3 + 1]), this.cell(points[i * 3 + 2]));
      const list = this.cells.get(key);
      if (list) list.push(i);
      else this.cells.set(key, [i]);
    }
  }
  private cell = (value: number) => Math.floor(value / this.size);
  private key = (x: number, y: number, z: number) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);

  /** Squared distance and index of the k closest points, nearest first. */
  nearest(x: number, y: number, z: number, k: number) {
    const found: Array<{ index: number; distance: number }> = [];
    const [cx, cy, cz] = [this.cell(x), this.cell(y), this.cell(z)];
    for (let ring = 0; ring < 64; ring++) {
      // Only the shell of cells at this ring: the inner ones were searched already.
      for (let dx = -ring; dx <= ring; dx++)
        for (let dy = -ring; dy <= ring; dy++) {
          const face = Math.abs(dx) === ring || Math.abs(dy) === ring;
          for (let dz = -ring; dz <= ring; dz += face || ring === 0 ? 1 : 2 * ring) {
            for (const index of this.cells.get(this.key(cx + dx, cy + dy, cz + dz)) ?? []) {
              const px = this.points[index * 3] - x;
              const py = this.points[index * 3 + 1] - y;
              const pz = this.points[index * 3 + 2] - z;
              const distance = px * px + py * py + pz * pz;
              if (found.length === k && distance >= found[k - 1].distance) continue;
              let at = found.length;
              while (at > 0 && found[at - 1].distance > distance) at--;
              found.splice(at, 0, { index, distance });
              if (found.length > k) found.pop();
            }
          }
        }
      // Everything in the next ring is at least `ring * size` away.
      if (found.length === k && found[k - 1].distance <= (ring * this.size) ** 2) break;
    }
    return found;
  }

  /** Indices of every point within `radius`. */
  within(x: number, y: number, z: number, radius: number) {
    const result: number[] = [];
    const reach = Math.ceil(radius / this.size);
    const [cx, cy, cz] = [this.cell(x), this.cell(y), this.cell(z)];
    for (let dx = -reach; dx <= reach; dx++)
      for (let dy = -reach; dy <= reach; dy++)
        for (let dz = -reach; dz <= reach; dz++) {
          for (const index of this.cells.get(this.key(cx + dx, cy + dy, cz + dz)) ?? []) {
            const px = this.points[index * 3] - x;
            const py = this.points[index * 3 + 1] - y;
            const pz = this.points[index * 3 + 2] - z;
            if (px * px + py * py + pz * pz <= radius * radius) result.push(index);
          }
        }
    return result;
  }
}

type Surface = {
  mesh: THREE.SkinnedMesh;
  /** Rest positions in world space, xyz per vertex, as delivered (before smoothing) */
  points: Float32Array;
  grid: PointGrid;
  /** Bones used by each vertex, up to four */
  joints: THREE.Bone[][];
  weights: number[][];
  /** Total weight per bone over the whole mesh */
  totals: Map<THREE.Bone, number>;
};

/** World-space rest position of every vertex, skinned or not. */
function restPoints(mesh: THREE.Mesh) {
  const count = mesh.geometry.getAttribute("position").count;
  const points = new Float32Array(count * 3);
  const point = new THREE.Vector3();
  for (let i = 0; i < count; i++) mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld).toArray(points, i * 3);
  return points;
}

/** Smooth vertex normals from world-space points and the mesh's triangles. */
function restNormals(mesh: THREE.Mesh, points: Float32Array) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
  if (mesh.geometry.index) geometry.setIndex(mesh.geometry.index);
  geometry.computeVertexNormals();
  return geometry.getAttribute("normal").array as Float32Array;
}

function readWeights(mesh: THREE.SkinnedMesh) {
  const index = mesh.geometry.getAttribute("skinIndex");
  const weight = mesh.geometry.getAttribute("skinWeight");
  const joints: THREE.Bone[][] = [];
  const weights: number[][] = [];
  const totals = new Map<THREE.Bone, number>();
  for (let i = 0; i < index.count; i++) {
    joints.push([]);
    weights.push([]);
    for (let slot = 0; slot < 4; slot++) {
      const w = weight.getComponent(i, slot);
      if (w <= 0) continue;
      const bone = mesh.skeleton.bones[index.getComponent(i, slot)];
      joints[i].push(bone);
      weights[i].push(w);
      totals.set(bone, (totals.get(bone) ?? 0) + w);
    }
  }
  return { joints, weights, totals };
}

function readSurface(mesh: THREE.SkinnedMesh): Surface {
  const points = restPoints(mesh);
  // Coarse cells: the delivered suit is sparse, and the backpack sits up to
  // 10 cm off it, so fewer rings to search.
  return { mesh, points, grid: new PointGrid(points, 0.05), ...readWeights(mesh) };
}

function readSuit(model: THREE.Object3D) {
  model.updateMatrixWorld(true);
  return SUIT_SURFACES.map((name) => byName(model, name))
    .filter((mesh): mesh is THREE.SkinnedMesh => Boolean(mesh?.isSkinnedMesh))
    .map(readSurface);
}

/** The smoothed shape of a surface, for resting pieces on it. */
type Shape = { points: Float32Array; normals: Float32Array; grid: PointGrid };
const shapes = new WeakMap<THREE.Mesh, Shape>();
function shapeOf(mesh: THREE.SkinnedMesh) {
  let shape = shapes.get(mesh);
  if (!shape) {
    const points = restPoints(mesh);
    shape = { points, normals: restNormals(mesh, points), grid: new PointGrid(points, 0.01) };
    shapes.set(mesh, shape);
  }
  return shape;
}

/**
 * Weights for a point on the suit: the weights of the closest surface
 * vertices, blended by inverse distance and trimmed to the four strongest
 * bones. Blending several vertices keeps long pieces like the zipper
 * bending smoothly instead of in steps.
 */
function weightsAt(surface: Surface, x: number, y: number, z: number) {
  const blend = new Map<THREE.Bone, number>();
  for (const { index, distance } of surface.grid.nearest(x, y, z, 4)) {
    const influence = 1 / (distance + 1e-8);
    surface.joints[index].forEach((bone, slot) => {
      blend.set(bone, (blend.get(bone) ?? 0) + surface.weights[index][slot] * influence);
    });
  }
  const strongest = [...blend].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const total = strongest.reduce((sum, [, w]) => sum + w, 0);
  return strongest.map(([bone, w]) => [bone, w / total] as const);
}

/**
 * The surface a piece belongs to. A skinned piece goes with the surface that
 * uses its main bone (a shoulder seam weighted to the upper arm follows the
 * arm, even though it sits as close to the body); otherwise, the surface
 * closest to its vertices on average.
 */
function surfaceFor(points: Float32Array, surfaces: Surface[], mainBone?: THREE.Bone) {
  const owners = mainBone ? surfaces.filter((surface) => surface.totals.has(mainBone)) : [];
  const candidates = owners.length ? owners : surfaces;
  let best = candidates[0];
  let bestDistance = Infinity;
  // A couple of hundred sample points are plenty to tell which surface is closer.
  const stride = Math.max(1, Math.floor(points.length / 3 / 200)) * 3;
  for (const surface of candidates) {
    if (candidates.length === 1) break;
    let sum = 0;
    for (let i = 0; i < points.length; i += stride) sum += surface.grid.nearest(points[i], points[i + 1], points[i + 2], 1)[0].distance;
    if (sum < bestDistance) {
      bestDistance = sum;
      best = surface;
    }
  }
  return best;
}

/**
 * Rests a piece on the surface: every vertex moves along the surface normal
 * so that the lowest point of its neighbourhood sits just above the suit.
 * Working per neighbourhood keeps the piece's own shape (zipper teeth keep
 * their height) while fixing the stretches where it sank in or floated off.
 */
function restOnSurface(points: Float32Array, surface: Shape) {
  const count = points.length / 3;
  const height = new Float32Array(count);
  const normal = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = [points[i * 3], points[i * 3 + 1], points[i * 3 + 2]];
    const { index } = surface.grid.nearest(x, y, z, 1)[0];
    const [nx, ny, nz] = [surface.normals[index * 3], surface.normals[index * 3 + 1], surface.normals[index * 3 + 2]];
    normal.set([nx, ny, nz], i * 3);
    height[i] = (x - surface.points[index * 3]) * nx + (y - surface.points[index * 3 + 1]) * ny + (z - surface.points[index * 3 + 2]) * nz;
  }
  const grid = new PointGrid(points, 0.016);
  const near = (i: number, radius: number) => grid.within(points[i * 3], points[i * 3 + 1], points[i * 3 + 2], radius);

  // How far each neighbourhood has to move so its lowest point sits on the suit.
  const lift = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let lowest = Infinity;
    for (const j of near(i, 0.012)) lowest = Math.min(lowest, height[j]);
    // Anything standing well off the suit is left where it is.
    lift[i] = lowest > 0.006 ? 0 : Math.min(REST_GAP - lowest, 0.012);
  }
  // Averaged again over a wider area, with the normals, so the piece moves as
  // a smooth whole and its cross-section never warps.
  const moved = new Float32Array(points);
  for (let i = 0; i < count; i++) {
    const around = near(i, 0.016);
    let shift = 0;
    const direction = [0, 0, 0];
    for (const j of around) {
      shift += lift[j];
      for (let axis = 0; axis < 3; axis++) direction[axis] += normal[j * 3 + axis];
    }
    const length = Math.hypot(...direction) || 1;
    for (let axis = 0; axis < 3; axis++) moved[i * 3 + axis] += (direction[axis] / length) * (shift / around.length);
  }
  return moved;
}

/**
 * The first delivery left the zipper, the flags and a backpack knob as rigid
 * pieces, and skinned other parts to bones they never touch: waist cords on
 * the arm bones, the left shoulder seam on neutral_bone, the backpack on the
 * legs and the antenna. Rigid pieces follow one bone while the suit under
 * them blends several, so they sink into the suit or float off it as he
 * moves; the backpack bent with the antenna and cut into his back.
 *
 * Each piece is rebuilt as a skinned mesh with the weights of the suit
 * under it (Blender's Data Transfer modifier) and, when the suit was
 * smoothed here, rested on the smoothed surface. Pieces with sound weights
 * on an unsmoothed suit are left alone.
 */
function skinDetailsToSuit(model: THREE.Object3D, surfaces: Surface[]) {
  if (!surfaces.length) return;
  model.updateMatrixWorld(true);
  const meshes = surfaces.map((surface) => surface.mesh);
  const bones = meshes[0].skeleton.bones;

  const details: THREE.Mesh[] = [];
  model.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || meshes.includes(mesh as THREE.SkinnedMesh)) return;
    if (SUIT_DETAIL.test(lineage(mesh)) || VISOR.test((mesh.material as THREE.Material).name)) details.push(mesh);
  });

  const holder = meshes[0].parent ?? model;
  const toHolder = holder.matrixWorld.clone().invert();
  const vector = new THREE.Vector3();

  // The backpack is a rigid case: one set of weights for all of it (the
  // average of his back under it), so twisting the spine turns it without
  // bending it.
  let backpackWeights: Array<readonly [THREE.Bone, number]> | null = null;
  const bag = details.find((mesh) => /Astronault_Bag\d/.test(mesh.name));
  if (bag) {
    const bagPoints = restPoints(bag);
    const sum = new Map<THREE.Bone, number>();
    for (let i = 0; i < bagPoints.length; i += 3) {
      for (const [bone, w] of weightsAt(surfaces[0], bagPoints[i], bagPoints[i + 1], bagPoints[i + 2])) sum.set(bone, (sum.get(bone) ?? 0) + w);
    }
    const strongest = [...sum].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const total = strongest.reduce((all, [, w]) => all + w, 0);
    backpackWeights = strongest.map(([bone, w]) => [bone, w / total] as const);
  }
  const seams: Seam[] = (model.userData.seams ??= []);

  for (const mesh of details) {
    let points = restPoints(mesh);
    const skinned = (mesh as THREE.SkinnedMesh).isSkinnedMesh ? readWeights(mesh as THREE.SkinnedMesh) : null;
    const mainBone = skinned ? [...skinned.totals].sort((a, b) => b[1] - a[1])[0]?.[0] : undefined;
    // The backpack and everything on it ride on his back: the arms pass close
    // enough to it to win a distance test, so it is not left to one.
    const onBackpack = /Bag/.test(lineage(mesh));
    const seam = SHOULDER_SEAM.test(lineage(mesh)) && mainBone ? mainBone : null;
    const visor = VISOR.test((mesh.material as THREE.Material).name);
    const surface = onBackpack || seam || visor ? surfaces[0] : surfaceFor(points, surfaces, mainBone);
    const foreign = seam || visor || !skinned ? true : [...skinned.totals.keys()].some((bone) => !surface.totals.has(bone));
    const smoothed = Boolean(surface.mesh.userData.smoothed);
    if (!foreign && !smoothed) continue;
    // Only the thin pieces lying flat on the suit are rested; the cords keep
    // the shape they were modelled with, and the backpack stands off his back.
    if (smoothed && RESTED.test(lineage(mesh)) && !onBackpack) points = restOnSurface(points, shapeOf(surface.mesh));

    const geometry = new THREE.BufferGeometry();
    const local = new Float32Array(points.length);
    for (let i = 0; i < points.length; i += 3) vector.fromArray(points, i).applyMatrix4(toHolder).toArray(local, i);
    geometry.setAttribute("position", new THREE.BufferAttribute(local, 3));
    if (mesh.geometry.index) geometry.setIndex(mesh.geometry.index.clone());
    geometry.computeVertexNormals();

    const count = points.length / 3;
    const indices = new Uint16Array(count * 4);
    const amounts = new Float32Array(count * 4);
    let skeletonBones = bones;
    let fixed: Array<readonly [THREE.Bone, number]> | null = onBackpack ? backpackWeights : null;
    if (seam) {
      const slider = createSeam(seam, points, seams);
      if (slider) {
        skeletonBones = [...bones, slider];
        fixed = [[slider, 1]];
      }
    }
    for (let i = 0; i < count; i++) {
      // Sound weights are kept; only foreign ones are replaced by the suit's.
      const blend =
        fixed ??
        (foreign
          ? weightsAt(surface, points[i * 3], points[i * 3 + 1], points[i * 3 + 2])
          : skinned!.joints[i].map((bone, slot) => [bone, skinned!.weights[i][slot]] as const));
      blend.forEach(([bone, w], slot) => {
        indices[i * 4 + slot] = Math.max(0, skeletonBones.indexOf(bone));
        amounts[i * 4 + slot] = w;
      });
    }
    geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(amounts, 4));

    const rebuilt = new THREE.SkinnedMesh(geometry, mesh.material);
    rebuilt.name = mesh.name;
    rebuilt.frustumCulled = false;
    holder.add(rebuilt);
    rebuilt.updateMatrixWorld(true);
    // A fresh skeleton computes its inverse bind matrices from the bones' current (rest) pose.
    rebuilt.bind(new THREE.Skeleton(skeletonBones));
    mesh.visible = false;
  }
}

/** Adds the sliding bone for one shoulder seam, at rest, under its upper arm bone. */
function createSeam(arm: THREE.Bone, points: Float32Array, seams: Seam[]) {
  const elbow = arm.children.find((node): node is THREE.Bone => (node as THREE.Bone).isBone);
  if (!elbow) return null;
  const shoulder = arm.getWorldPosition(new THREE.Vector3());
  const elbowAt = elbow.getWorldPosition(new THREE.Vector3());
  const direction = elbowAt.clone().sub(shoulder);
  const length = direction.length();
  direction.divideScalar(length);
  const centre = new THREE.Vector3();
  for (let i = 0; i < points.length; i += 3) centre.x += Math.abs(points[i]) / (points.length / 3);
  const gap = Math.abs(centre.x - Math.abs(shoulder.x));
  const slider = new THREE.Bone();
  slider.name = `${arm.name}_seam`;
  arm.add(slider);
  slider.updateMatrixWorld(true);
  seams.push({
    slider,
    arm,
    elbow,
    gap,
    along: gap / Math.max(Math.abs(direction.x), 0.25),
    toLocal: elbow.position.length() / length,
    axis: elbow.position.clone().normalize(),
  });
  return slider;
}

const _shoulder = new THREE.Vector3();
const _elbow = new THREE.Vector3();
const _space = new THREE.Quaternion();

/**
 * Keeps each shoulder seam where its arm comes out of the body: the more the
 * arm points sideways, the closer to the shoulder that is. Call after the
 * arms are posed, every frame. `space` is Nova's root group.
 */
export function slideSeams(model: THREE.Object3D, space: THREE.Object3D) {
  const seams = model.userData.seams as Seam[] | undefined;
  if (!seams?.length) return;
  space.getWorldQuaternion(_space).invert();
  for (const seam of seams) {
    seam.arm.updateWorldMatrix(true, true);
    seam.arm.getWorldPosition(_shoulder);
    seam.elbow.getWorldPosition(_elbow);
    const direction = _elbow.sub(_shoulder).applyQuaternion(_space).normalize();
    const along = seam.gap / Math.max(Math.abs(direction.x), 0.25);
    const offset = THREE.MathUtils.clamp(along - seam.along, -0.05, 0.05);
    seam.slider.position.copy(seam.axis).multiplyScalar(offset * seam.toLocal);
  }
}

/**
 * Loop subdivision of a skinned surface, in its own vertex space (the
 * stencils are affine, so the quantization folded into the bind matrices
 * still applies). Skin weights are blended with the same stencils and
 * trimmed back to the four strongest bones. Stands in for the Subdivision
 * Surface modifier the designer has on the suit in Blender; skipped once a
 * file arrives with it applied (the suit is then dense enough).
 */
function smoothSurface(mesh: THREE.SkinnedMesh, levels: number) {
  const source = mesh.geometry;
  const position = source.getAttribute("position");
  if (position.count > 2500) return;

  // Weld vertices split at normal seams so the surface is one piece.
  const ids = new Map<string, number>();
  let points: number[][] = [];
  let weights: Array<Map<number, number>> = [];
  const remap: number[] = [];
  const skinIndex = source.getAttribute("skinIndex");
  const skinWeight = source.getAttribute("skinWeight");
  for (let i = 0; i < position.count; i++) {
    const p = [position.getX(i), position.getY(i), position.getZ(i)];
    const key = p.map((v) => v.toFixed(5)).join(",");
    let id = ids.get(key);
    if (id === undefined) {
      id = points.length;
      ids.set(key, id);
      points.push(p);
      const w = new Map<number, number>();
      for (let slot = 0; slot < 4; slot++) {
        const amount = skinWeight.getComponent(i, slot);
        if (amount > 0) w.set(skinIndex.getComponent(i, slot), amount);
      }
      weights.push(w);
    }
    remap.push(id);
  }
  const index = source.getIndex();
  let faces: number[] = index
    ? Array.from({ length: index.count }, (_, i) => remap[index.getX(i)])
    : remap.slice();

  const mix = (terms: Array<[number, number]>) => {
    const p = [0, 0, 0];
    const w = new Map<number, number>();
    for (const [id, amount] of terms) {
      for (let axis = 0; axis < 3; axis++) p[axis] += points[id][axis] * amount;
      for (const [bone, value] of weights[id]) w.set(bone, (w.get(bone) ?? 0) + value * amount);
    }
    return { p, w };
  };

  for (let level = 0; level < levels; level++) {
    const edges = new Map<string, { a: number; b: number; opposite: number[]; id: number }>();
    const neighbors = points.map(() => new Set<number>());
    const boundary = points.map(() => [] as number[]);
    const edge = (a: number, b: number, opposite: number) => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      let entry = edges.get(key);
      if (!entry) edges.set(key, (entry = { a, b, opposite: [], id: -1 }));
      entry.opposite.push(opposite);
      neighbors[a].add(b);
      neighbors[b].add(a);
    };
    for (let f = 0; f < faces.length; f += 3) {
      const [a, b, c] = [faces[f], faces[f + 1], faces[f + 2]];
      edge(a, b, c);
      edge(b, c, a);
      edge(c, a, b);
    }
    for (const { a, b, opposite } of edges.values()) {
      if (opposite.length !== 2) {
        boundary[a].push(b);
        boundary[b].push(a);
      }
    }

    const nextPoints: number[][] = [];
    const nextWeights: Array<Map<number, number>> = [];
    const push = ({ p, w }: { p: number[]; w: Map<number, number> }) => {
      nextPoints.push(p);
      nextWeights.push(w);
      return nextPoints.length - 1;
    };
    // Original vertices move toward their neighbours. Open edges stay exactly
    // where they were (a straight crease), so they keep meeting the pieces
    // fitted to them: the visor glass, its metal ring and the suit opening.
    for (let v = 0; v < points.length; v++) {
      if (boundary[v].length) {
        push(mix([[v, 1]]));
        continue;
      }
      const n = neighbors[v].size;
      const beta = n === 3 ? 3 / 16 : 3 / (8 * n);
      push(mix([[v, 1 - n * beta], ...[...neighbors[v]].map((id) => [id, beta] as [number, number])]));
    }
    for (const entry of edges.values()) {
      const { a, b, opposite } = entry;
      entry.id = push(
        opposite.length === 2
          ? mix([[a, 0.375], [b, 0.375], [opposite[0], 0.125], [opposite[1], 0.125]])
          : mix([[a, 0.5], [b, 0.5]]),
      );
    }
    const mid = (a: number, b: number) => edges.get(a < b ? `${a}_${b}` : `${b}_${a}`)!.id;
    const nextFaces: number[] = [];
    for (let f = 0; f < faces.length; f += 3) {
      const [a, b, c] = [faces[f], faces[f + 1], faces[f + 2]];
      const [ab, bc, ca] = [mid(a, b), mid(b, c), mid(c, a)];
      nextFaces.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    points = nextPoints;
    weights = nextWeights;
    faces = nextFaces;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
  const indices = new Uint16Array(points.length * 4);
  const amounts = new Float32Array(points.length * 4);
  weights.forEach((w, v) => {
    const strongest = [...w].sort((x, y) => y[1] - x[1]).slice(0, 4);
    const total = strongest.reduce((sum, [, amount]) => sum + amount, 0) || 1;
    strongest.forEach(([bone, amount], slot) => {
      indices[v * 4 + slot] = bone;
      amounts[v * 4 + slot] = amount / total;
    });
  });
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(amounts, 4));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  mesh.geometry = geometry;
  mesh.userData.smoothed = true;
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
