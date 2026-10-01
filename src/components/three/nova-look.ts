import * as THREE from "three";

// Nova's look, matched to the studio render used on the old about page:
// a glossy white suit lit by a cool blue rim from below left and a magenta
// rim from the right, a near-black visor reflecting a warm horizon with a
// bright glint, dark gloves, black details and a glowing red antenna tip.
// Everything is generated here; no HDR files are downloaded.

/** Rim and key light colors, also used for the real lights in the scene. */
export const LIGHTS = {
  key: { color: "#f3f5fb", intensity: 1.0, position: [2, 4, 5] as const },
  blue: { color: "#3f8cff", intensity: 3.1, position: [-5, -2.5, 1.5] as const },
  magenta: { color: "#ff4fc3", intensity: 1.1, position: [5, 1.5, -3] as const },
};

const glow = (color: string, strength: number) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide, toneMapped: false });

function panel(width: number, height: number, material: THREE.Material, position: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(...position);
  mesh.lookAt(0, 0, 0);
  return mesh;
}

/**
 * Scene rendered into the environment map. The visor faces the camera, so it
 * mirrors what is behind the viewer: the horizon band and the sun sit on +z.
 */
export function createStudioScene() {
  const scene = new THREE.Scene();

  // Sky dome: deep navy above, a warm horizon band, near black below.
  const dome = new THREE.SphereGeometry(20, 64, 32);
  const colors: number[] = [];
  const position = dome.getAttribute("position");
  const top = new THREE.Color("#04060c");
  const horizon = new THREE.Color("#ff9a3c").multiplyScalar(2.4);
  const bottom = new THREE.Color("#020203");
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i) / 20;
    const band = Math.exp(-Math.pow((y + 0.08) / 0.13, 2));
    color.copy(y > 0 ? top : bottom).lerp(horizon, band);
    colors.push(color.r, color.g, color.b);
  }
  dome.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  scene.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false })));

  // A small bright sun on the horizon, behind the viewer: the visor glint.
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), glow("#ffd9a0", 30));
  sun.position.set(0.6, 0.1, 15);
  scene.add(sun);

  // Soft boxes: key light above the camera, colored rims on the sides.
  scene.add(panel(8, 4, glow("#ffffff", 2.2), [3, 9, 9]));
  scene.add(panel(5, 9, glow(LIGHTS.blue.color, 2.6), [-12, -3, 3]));
  scene.add(panel(3, 9, glow(LIGHTS.magenta.color, 1.8), [10, 2, -9]));
  // A faint fill so the shadow side of the suit never goes flat grey.
  scene.add(panel(14, 6, glow("#8fa6c8", 0.35), [0, -10, 6]));

  return scene;
}

/**
 * What the suit reflects. The reference render's suit is lacquer white with a
 * broad cyan-blue sheen down its left side and lower half, a lavender-magenta
 * edge on the right and a white key above. Each soft box here is one of those
 * reflections; the dark backdrop keeps them crisp.
 */
export function createSuitScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#06080d");

  // Blue: a wide box low on the left wrapping toward the front, and a brighter
  // cyan strip inside it for the sharp streak along the legs and sleeve.
  scene.add(panel(10, 9, glow("#2a7bff", 1.9), [-9, -8, 3]));
  scene.add(panel(2.5, 10, glow("#5cc8ff", 3.2), [-8, -4, 7]));
  // Magenta rim, behind on the right.
  scene.add(panel(4, 10, glow(LIGHTS.magenta.color, 1.9), [10, 2, -6]));
  // White key above and a soft front fill, so the side facing the camera stays white.
  scene.add(panel(9, 3, glow("#ffffff", 3.4), [2, 10, 6]));
  scene.add(panel(12, 8, glow("#eef1f7", 1.3), [5, 4, 14]));

  return scene;
}

/** Applies the studio materials to the model in place. */
export function dressNova(model: THREE.Object3D, suitEnvironment?: THREE.Texture) {
  const gloves = new THREE.MeshStandardMaterial({ name: "Nova_Gloves", color: "#24272d", roughness: 0.45, metalness: 0.05 });
  // Lacquered white: a glossy clearcoat over a softer base, so the soft boxes
  // read as sharp streaks on top of smooth shading.
  const suit = new THREE.MeshPhysicalMaterial({
    name: "Nova_Suit",
    color: "#f2f4f8",
    roughness: 0.38,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.07,
    envMap: suitEnvironment ?? null,
    envMapIntensity: 1,
  });

  model.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;

    // Gloves: both hands, including the mirrored right hand built by the rig patch.
    if (/Hands/.test(mesh.name)) {
      mesh.material = gloves;
      return;
    }

    const material = mesh.material as THREE.MeshStandardMaterial;
    if (!material || Array.isArray(material)) return;
    if (material.name === "Astronault_Cloth") {
      mesh.material = suit;
    } else if (material.name === "Astronault_Glass") {
      // A dark mirror: a metal reflects tinted by its own color, so pure black
      // would reflect nothing. Dark grey keeps it black while the horizon and
      // the sun glint show through.
      material.color.set("#3a3a3c");
      material.metalness = 1;
      material.roughness = 0.04;
      material.envMapIntensity = 1.4;
    } else if (material.name === "Material.001" || material.name === "Material.003") {
      // Zipper teeth, hoses, seams, antenna wire: black.
      material.color.set("#121318");
      material.roughness = 0.55;
      material.metalness = 0.1;
    } else if (material.name === "Material.004") {
      // Antenna tip light.
      material.color.set("#ff2a2a");
      material.emissive.set("#ff2a2a");
      material.emissiveIntensity = 3;
      material.toneMapped = false;
    }
  });
}

/** Seconds between antenna pulses */
const BEACON_PERIOD = 2.4;
/** How long one wave takes to expand and fade */
const BEACON_WAVE = 1.2;

/** A radial gradient on a canvas, as a sprite texture. */
function radialTexture(stops: Array<[number, string]>) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The antenna tip blinks every couple of seconds and sends out a wave: a
 * soft halo that flashes, and two rings that expand and fade, like a radio
 * beacon. Sprites always face the camera, so they read the same from any
 * angle he turns to.
 */
export function createBeacon(model: THREE.Object3D) {
  let tip: THREE.Mesh | undefined;
  model.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh && (mesh.material as THREE.Material).name === "Material.004") tip = mesh;
  });
  if (!tip) return { update: () => {} };
  const light = tip.material as THREE.MeshStandardMaterial;

  // The optimized file folds its vertex quantization into the tip's own
  // scale, so the sprites hang from the antenna bone at the tip's centre.
  const anchor = new THREE.Object3D();
  const bone = tip.parent ?? tip;
  model.updateMatrixWorld(true);
  const centre = new THREE.Box3().setFromObject(tip).getCenter(new THREE.Vector3());
  anchor.position.copy(bone.worldToLocal(centre));
  bone.add(anchor);

  const sprite = (texture: THREE.Texture) => {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: "#ff3a2a",
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
    });
    const object = new THREE.Sprite(material);
    object.frustumCulled = false;
    anchor.add(object);
    return object;
  };
  const halo = sprite(radialTexture([[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,0.55)"], [1, "rgba(255,255,255,0)"]]));
  const ringTexture = radialTexture([[0.55, "rgba(255,255,255,0)"], [0.8, "rgba(255,255,255,1)"], [0.9, "rgba(255,255,255,0.35)"], [1, "rgba(255,255,255,0)"]]);
  const rings = [sprite(ringTexture), sprite(ringTexture.clone())];

  return {
    update(time: number) {
      const since = time % BEACON_PERIOD;
      // A quick flash that fades over a quarter second, on a steady glow.
      const flash = Math.exp(-since * 9);
      light.emissiveIntensity = 1.6 + flash * 6;
      halo.scale.setScalar(0.05 + flash * 0.05);
      halo.material.opacity = 0.35 + flash * 0.65;
      rings.forEach((ring, i) => {
        const progress = (since - i * 0.22) / BEACON_WAVE;
        const visible = progress >= 0 && progress < 1;
        ring.visible = visible;
        if (!visible) return;
        const eased = 1 - Math.pow(1 - progress, 3);
        ring.scale.setScalar(0.03 + eased * 0.16);
        ring.material.opacity = Math.pow(1 - progress, 1.6) * (i ? 0.5 : 0.9);
      });
    },
  };
}
