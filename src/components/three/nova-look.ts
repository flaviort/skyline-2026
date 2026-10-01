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

/** Applies the studio materials to the model in place. */
export function dressNova(model: THREE.Object3D) {
  const gloves = new THREE.MeshStandardMaterial({ name: "Nova_Gloves", color: "#24272d", roughness: 0.45, metalness: 0.05 });

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
      material.color.set("#eef0f5");
      material.roughness = 0.3;
      material.metalness = 0;
      // The suit catches the rim lights but only a little of the warm horizon,
      // which belongs in the visor.
      material.envMapIntensity = 0.5;
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
