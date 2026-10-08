"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { createSuitScene } from "./nova-look";

// The S mark from public/brand/logo-mark.svg: the letter and its full stop.
const MARK =
  "M214.4,536.5c118.4,0,227.3-71.7,238.1-158.9c16.8-130.2-111.3-147-178.2-160.1c-26.3-3.6-102.9-3.6-98.1-44.2c4.8-33.4,44.3-59.8,87.3-59.8c64.6,0,81.4,26.3,80.2,38.2h122c8.3-65.7-50.3-136.2-189.1-136.2c-114.8,0-216.5,71.7-228.5,158.9c-12,93.2,82.6,118.3,138.8,130.2c32.3,7.1,145.9,10.7,137.6,74.1c-3.6,31-50.2,58.6-96.9,58.6c-87.3,0-83.8-65.7-83.8-66.9h-128C7.5,437.4,63.6,536.5,214.4,536.5z M466.4,536.5h114.7l15.5-112.9H482L466.4,536.5z";

export type LogoFinish = "orange" | "chrome" | "paper";

const FINISH: Record<LogoFinish, THREE.MeshPhysicalMaterialParameters> = {
  // Lacquered orange, like a toy rocket fin.
  orange: { color: "#ff4f00", roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 },
  // Polished metal: all reflection.
  chrome: { color: "#e8ecf3", roughness: 0.12, metalness: 1 },
  // Nova's suit white.
  paper: { color: "#f2f4f8", roughness: 0.38, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.07 },
};

function buildGeometry() {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${MARK}"/></svg>`);
  const shapes = data.paths.flatMap((path) => SVGLoader.createShapes(path));
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 90,
    bevelEnabled: true,
    bevelThickness: 14,
    bevelSize: 9,
    bevelSegments: 6,
    curveSegments: 24,
  });
  // SVG y points down; flip it and put the mark's center on the origin.
  geometry.scale(1, -1, 1);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

export type SpinState = {
  /** Extra spin in radians per second, fed by scroll speed; decays on its own */
  boost: number;
  /** Pointer position over the canvas, -1 to 1 */
  pointer: { x: number; y: number };
  /** Drag in progress: rotation follows the pointer instead of the motor */
  drag: { active: boolean; velocity: number; delta: number };
};

function Mark({ finish, spinRef, speed }: { finish: LogoFinish; spinRef: RefObject<SpinState>; speed: number }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => buildGeometry(), []);
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({ ...FINISH[finish], envMapIntensity: 1.1 }), [finish]);
  const gl = useThree((state) => state.gl);
  // White wears Nova's own lacquer studio; orange and chrome a neutral room,
  // so the orange stays orange and the chrome has something bright to mirror.
  const environment = useMemo(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const texture = generator.fromScene(finish === "paper" ? createSuitScene() : new RoomEnvironment(), 0.03).texture;
    generator.dispose();
    return texture;
  }, [gl, finish]);
  const fitted = useRef("");

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      environment.dispose();
    },
    [geometry, material, environment],
  );

  useFrame((state, delta) => {
    // Fit the mark to the canvas whatever its aspect.
    const key = `${state.size.width}x${state.size.height}`;
    if (fitted.current !== key) {
      fitted.current = key;
      const camera = state.camera as THREE.PerspectiveCamera;
      const span = 760 / Math.min(1, state.size.width / state.size.height);
      camera.position.set(0, 0, span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
      camera.near = 10;
      camera.far = 10000;
      camera.updateProjectionMatrix();
    }

    const node = group.current;
    const motion = spinRef.current;
    if (!node || !motion) return;
    const dt = Math.min(delta, 1 / 20);
    if (motion.drag.active) {
      node.rotation.y += motion.drag.delta;
      motion.drag.delta = 0;
    } else {
      // Motor plus scroll boost plus whatever a throw left behind.
      node.rotation.y += (speed + motion.boost + motion.drag.velocity) * dt;
      motion.drag.velocity *= Math.pow(0.08, dt);
    }
    motion.boost *= Math.pow(0.12, dt);
    // Lean toward the pointer, softly.
    node.rotation.x += (motion.pointer.y * 0.35 - node.rotation.x) * Math.min(1, dt * 4);
    node.rotation.z += (-motion.pointer.x * 0.12 - node.rotation.z) * Math.min(1, dt * 4);
  });

  return (
    <>
      <primitive object={environment} attach="environment" />
      <group ref={group}>
        <mesh geometry={geometry} material={material} />
      </group>
    </>
  );
}

type SceneProps = { finish: LogoFinish; spinRef: RefObject<SpinState>; active: boolean; speed: number };

export default function SpinningLogoScene({ finish, spinRef, active, speed }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.2} />
      <directionalLight position={[300, 600, 900]} intensity={1.4} />
      <Mark finish={finish} spinRef={spinRef} speed={speed} />
    </Canvas>
  );
}
