# Nova 3D model

Notes on the rigged Nova model for the website: banner (part 01), goodbye at the bottom of the page (part 08) and the 404 page. The first section can be forwarded to the 3D designer as is.

File received 2026-10-01: `Astronalt_09_Rig_Website.glb` (Blender 4.2 glTF exporter), kept in `assets/3d/nova/` (gitignored source).

## For the 3D designer

Thanks for the model, it looks great on the web and it is light. We loaded it in three.js and bent a few bones to test the rig. Some parts don't follow the skeleton yet. A quick pass in Blender before the next export would fix everything:

1. **Zipper** (`Astronault_Zipper.001`, `NurbsCurve_Zipper_Out.001`, `NurbsCurve_Zipper_In.002`) are not parented to anything. When the body leans, the zipper stays in place. Please weight them to the body bones (same weights as `Astronault_Body.003` along the front), or at least parent them to `Spine.01`.
2. **Flags**:
   - `Astronault_Flag.006` is not parented to anything.
   - `Astronault_Flag.004`, `.005` and `.007` are parented to meshes (Body, Arms, Bag) instead of bones, so they follow the object but not the bending.

   Please parent each one to the bone it sits on (Bone parent, Ctrl+P > Bone). That's `Spine.02` for the chest flag, `Arm_01.L` or `Arm_01.R` for the sleeve flags, and `Spine.02` for the backpack flag.
3. **Backpack detail** `Astronault_Bag_Detail.003` hangs from the rig root. Please parent it to `Spine.02`.
4. **Antenna bones**: `Anten_01` is a root bone, a sibling of `Main`. When the spine bends, the antenna and the part of the backpack weighted to it stay behind. Please parent `Anten_01` to `Spine.03` (keep offset).
5. **Backpack weights**: `Astronault_Bag.001` has weights from `Leg.L` and `Leg.R`. Moving the legs would warp the backpack. Please remove the leg weights so it follows only the spine and antenna bones.
6. **Feet**: `Foot.L` and `Foot.R` are children of `Main` instead of the leg chain, so bending a leg stretches it away from its foot. Please parent each foot bone to `Leg.L.001` / `Leg.R.001`.
7. **Right hand missing**: `Astronault_Hands.001` only contains the left hand (all of its vertices sit on the left side, weighted to the left hand bones). A mirror modifier was probably not applied before export. Please apply it so both hands are in the file, the right one weighted to `Hand.R`, `Hand_Fingers.R` and `Hand_Thumb.R`.
8. **Questions**:
   - What is the shape key `Key 1` on the body for?
   - What is `neutral_bone` used for? Can it be removed?
9. **Animation clips (optional, but they would make Nova feel alive)**. Right now there are none, so we would animate everything in code. If you can, please add these as separate actions, exported as glTF animations:
   - `Idle_Float`: a loopable zero-gravity float, 4 to 6 seconds, arms and legs drifting gently.
   - `Wave`: a goodbye wave with the right arm, about 1.5 seconds, starting and ending in the idle pose. Used at the bottom of the page, where only his upper half shows, so the wave should read from the chest up.
   - Tricks, each starting and ending in the idle pose, 1.2 to 2 seconds: `Backflip`, `Frontflip`, `Barrel_Roll`, `Spin`, `Stretch`.
   - `Look_Around` (nice to have): a curious look left and right, loopable.

   Keep the root (`Main`) mostly in place in the clips; the site moves Nova around the screen itself.
10. **Export settings**: glTF Binary (.glb), +Y up, apply transforms, include only the armature and its meshes, no cameras or lights. Our optimizer handles compression, so a plain export is perfect.

## What we found (technical)

| Item | Value |
|---|---|
| Size | 623 KB raw; 149 KB after Meshopt compression (about 93 KB gzipped). Renders identically. |
| Geometry | about 12,000 vertices, 20 meshes |
| Textures | none: all materials are flat colors (cloth, glass visor with clearcoat, metal, flag colors) |
| Height | 0.78 units, origin at the feet (`Main`) |
| Skeleton | 25 bones: Main, Spine 01 to 03, Pelvis, arms with hand, fingers and thumb, legs with lower legs, feet, 3 antenna bones, neutral_bone |
| Animations | none |
| Shape keys | one, `Key 1`, on the body, weight 0 |

The character's head is the top of the body (the visor sits on `Spine.02` and `Spine.03`), so "looking at the pointer" means turning the upper spine, not a separate head bone.

three.js strips dots from bone names: `Spine.01` is `Spine01` in code, `Leg.L.001` is `LegL001`.

## Look

`src/components/three/nova-look.ts` sets the render style, matched to the studio render on the old about page: a generated environment (no HDR download) with a dark sky, a warm horizon band and a sun glint for the visor, blue and magenta rim panels, plus three real lights (neutral key, blue rim lower left, magenta rim right). Materials are overridden by name: `Astronault_Cloth` glossy white with low environment reflection, `Astronault_Glass` a dark mirror (a metal reflects tinted by its own color, so it is dark grey rather than black), the hands become dark gloves, `Material.001` and `Material.003` (zipper, hoses, seams, antenna wire) black, `Material.004` the glowing antenna tip. If the designer renames materials, update the names there.

## How the site uses it

- One Nova on a page-wide layer, in states driven by scroll:
  - Banner (`specs/home/01-banner.md`): floats in from the top or a side, wanders when idle, gently follows the pointer with his whole body (spine lean, `Spine.02` and `Spine.03` look-at, banking, trailing arms and legs), does idle tricks, moves aside over links, floats out of the screen when the user scrolls down.
  - Goodbye (`specs/home/08-footer.md`): at the bottom of the page he rises from the bottom middle, upper half only, looks at the user and the mouse, and waves goodbye.
- Secondary motion: the antenna bones lag behind and spring back, and the arms and legs drift and trail in zero-g.
- Without clips, all of this is procedural on the bones. Clips from the designer (`Idle_Float`, `Wave`, the tricks) replace their procedural versions one by one.
- **Decision (2026-10-01): build with the current file now** and swap in the designer's fixed version when it arrives. Until then:
  - Items 1 to 4 are patched in code at load time (`src/components/three/nova-rig.ts`): the antenna chain is re-parented to `Spine.03`, and every loose rigid piece is attached to the bone segment it sits closest to (so sleeve flags follow the upper arms). The patch only runs when it detects the problem, so it does nothing once the fixed file is in.
- Bone directions found in testing, in Nova's own space: raising an arm is +Z for the left and -Z for the right; leaning is Z on `Spine.01`; looking is Y on `Spine.02` and `Spine.03`. The suit hoses from sleeve to waist stretch when an arm goes past horizontal, so arm raises are capped there.
  - Item 5 (backpack leg weights) is also patched now: the backpack's leg influence is moved to `Spine.01` at load, so the legs move freely.
  - Item 6 (feet): each foot bone is re-attached to the end of its leg.
  - Item 7 (right hand): a mirrored copy of the left hand is built at load and bound to the right hand bones. Because the optimized file quantizes vertices (the dequantization lives in the skin's inverse bind matrices), the copy reads the true rest shape through skinning and binds to a fresh skeleton.

## Swapping in a new version

1. Drop the new `.glb` into `assets/3d/nova/` and run the optimize command from the pipeline below, writing over `public/models/nova.glb`.
2. Bone names must stay the same (`Main`, `Spine.01` to `.03`, `Arm_01.L`, and so on). If the designer renames bones, the bone map at the top of the `Nova` component is the only place to update.
3. If the file now has clips (`Idle_Float`, `Wave`, the tricks), they replace their procedural versions automatically by name; anything missing keeps the procedural version.
4. Check the banner, the goodbye and the 404 page, then commit the new `nova.glb`.

## Pipeline

1. Source: `assets/3d/nova/*.glb` (gitignored).
2. Optimize: `npm run model:nova` (Meshopt compression; join, palette, flatten and simplify are turned off because they merge the loose parts and materials the rig code needs to find by name).
3. Load with `GLTFLoader` and the Meshopt decoder (React Three Fiber `useGLTF` handles both).
4. Poster: render the rest pose to a transparent PNG at the banner's size for the loading and reduced-motion fallback.
