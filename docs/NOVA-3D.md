# Nova 3D model

Notes on the rigged Nova model for the website: banner (part 01), goodbye at the bottom of the page (part 08) and the 404 page. The first section can be forwarded to the 3D designer as is.

Files received 2026-10-01: `Astronalt_09_Rig_Website.glb` (Blender 4.2 glTF exporter, exported without modifiers) and later the source `Astronalt_09_Rig_Website.blend`, both in `assets/3d/nova/` (gitignored). The site is built from the `.blend`; the designer list below is now mostly handled by our script.

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
10. **Subdivision not applied**: the suit, visor and gloves came out at their low-poly cage (the body is 686 vertices) while the zipper, flags and cords were modelled on the smooth surface. On the web the suit is faceted and the details sink into the flat faces in some places and float off them in others. Please tick "Apply Modifiers" in the glTF exporter (or apply the Subdivision Surface modifier) for the body, arms, backpack, visor and hands.
11. **Detail weights**: the cords around the legs (`Astronault_Body_Detail.003` and `.004`) are weighted to arm and thumb bones, the left sleeve seam (`Astronault_Body_Arm_Dedail.003`) to `neutral_bone`, and the backpack detail (`Astronault_Bag_Detail.002`) to the hands and legs. Please transfer the weights from the surface each one sits on (Data Transfer modifier, Vertex Data > Vertex Groups, nearest face interpolated), and do the same for the zipper and flags instead of bone-parenting them, so they bend with the suit.
12. **Export settings**: glTF Binary (.glb), +Y up, apply transforms, include only the armature and its meshes, no cameras or lights. Our optimizer handles compression, so a plain export is perfect.

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

`src/components/three/nova-look.ts` sets the render style, matched to the studio render on the old about page (`public/images/legacy/nova.png`): a generated environment (no HDR download) with a dark sky, a warm horizon band and a sun glint for the visor, blue and magenta rim panels, plus three real lights (neutral key, blue rim lower left, magenta rim right). The suit reflects a second generated studio of its own (`createSuitScene`): a wide blue and a cyan soft box low on the left for the blue sheen, a magenta rim on the right, a white key above and a white front fill, with no warm horizon. Materials are overridden by name: `Astronault_Cloth` becomes lacquered white (a physical material with a sharp clearcoat over a softer base), `Astronault_Glass` a dark mirror (a metal reflects tinted by its own color, so it is dark grey rather than black), the hands become dark gloves, `Material.001` and `Material.003` (zipper, hoses, seams, antenna wire) black, `Material.004` the glowing antenna tip. If the designer renames materials, update the names there.

## How the site uses it

- One Nova on a page-wide layer, in states driven by scroll:
  - Banner (`specs/home/01-banner.md`): floats in from the top or a side, wanders when idle, gently follows the pointer with his whole body (spine lean, `Spine.02` and `Spine.03` look-at, banking, trailing arms and legs), does idle tricks, moves aside over links, floats out of the screen when the user scrolls down.
  - Goodbye (`specs/home/08-footer.md`): at the bottom of the page he rises from the bottom middle, upper half only, looks at the user and the mouse, and waves goodbye.
- Secondary motion: the antenna bones lag behind and spring back, and the arms and legs drift and trail in zero-g.
- Without clips, all of this is procedural on the bones. Clips from the designer (`Idle_Float`, `Wave`, the tricks) replace their procedural versions one by one.
- **Decision (2026-10-01, updated the same day): the model is built from the designer's `.blend`** (`assets/3d/nova/Astronalt_09_Rig_Website.blend`, gitignored) by `scripts/nova/fix.py`, run headless in Blender. The first delivery was a `.glb` exported without its modifiers; until the `.blend` arrived, the site patched it at load time. All of those patches are gone. What the script does:
  - Keeps only the website rig: `Astronault_Rig.001` and the collections `1.001` and `2.001`. The `.blend` is a full production scene (174 objects: cameras, text, props, an older rig); none of that is exported.
  - Applies every modifier at the rest pose except the armature: Subdivision Surface (the smoothing), Mirror (the right hand), Solidify and Shrinkwrap (the flags), Mesh Deform (the backpack knob), Bevel (zipper teeth, capped at 2 segments to keep the file light).
  - Puts every piece in the rig's space and skins it. Vertex-parented flags and the loose zipper get their world placement baked first.
  - Weights (Data Transfer, nearest face interpolated): zipper, chest and side flags, leg cords and the visor copy the body's; sleeve flags and shoulder pipes copy the arms'. The backpack, its trim, knob and flag share one set of weights, the average of his back under them, spine bones only, so the pack moves as a rigid case. Vertex groups left over from an older rig (`Bone.001` and so on) are dropped and every vertex normalized.
  - Bones: `Anten_01` hangs from `Spine.03`, `Foot.L` and `Foot.R` from the lower legs; IK constraints removed; only deforming bones exported.
  - **One suit** (2026-10-01): the arms were separate tubes pushed into the body and pivoting deep inside it, so the sleeve slid through the suit at the shoulder whatever the weights (a per-frame pipe solver in code and anchoring the sleeve root were both tried first). Sleeve flags copy their weights from the finished suit, so they stay on the sleeve where the shoulder weights were evened out. The script now lifts the arms 0.6 rad into a new rest pose (at rest they hang close along his sides, so fusing them there would glue them to his flanks), fuses arms and body with an exact boolean union, rounds the seam into a soft fillet (even triangles, surface relaxed within 1.5 cm, so sleeve and body meet without a crease or shading streaks), blends the weights from half and half on the seam to fully body or fully arm over 5 cm and then evens them out within 7 cm (no abrupt change, so raising the arm never folds the suit), and drops the delivered shoulder pipes. Nothing replaces them (user, 2026-10-01): rings at the seam and backpack straps over the shoulder were both tried and dropped, because a raised sleeve folds over or hides anything near the shoulder.
- Nothing is patched in code any more: `src/components/three/nova-rig.ts` only finds the bones and poses them. Because the rest pose has the arms raised, the stage subtracts `ARM_REST_LIFT` (0.6, exported from `nova-rig.ts`; keep it equal to `ARM_LIFT` in the script) from its arm angles.
- Motion choice (user, 2026-10-01): elbows stay nearly straight (a visible elbow bend reads oddly on his tube arms); the wave swings from the hand and shoulder. Knees keep their bend.
- Bone directions found in testing, in Nova's own space: raising an arm is +Z for the left and -Z for the right; leaning is Z on `Spine.01`; looking is Y on `Spine.02` and `Spine.03`. Arm raises are capped near horizontal.

## Swapping in a new version

1. Save the designer's new `.blend` over `assets/3d/nova/Astronalt_09_Rig_Website.blend` and run `npm run model:nova`.
2. If object, collection or bone names change, update the lists at the top of `scripts/nova/fix.py` and the bone map at the top of `nova-rig.ts`.
3. If the file gains clips (`Idle_Float`, `Wave`, the tricks), turn on `export_animations` in the script; they replace their procedural versions by name.
4. Check the banner, the goodbye and the 404 page, then commit the new `nova.glb`.

## Pipeline

1. Source: `assets/3d/nova/Astronalt_09_Rig_Website.blend` (gitignored). Needs Blender 4.2 or newer (5.2.2 installed with Homebrew; set `BLENDER` to use another binary).
2. Build: `npm run model:nova`. Blender runs `scripts/nova/fix.py` and writes `assets/3d/nova/nova-fixed.glb` (about 1.8 MB), then gltf-transform compresses it with Meshopt into `public/models/nova.glb` (about 390 KB, 250 KB gzipped). Join, palette, flatten and simplify are off because they merge the parts and materials the site finds by name.
3. Load with `GLTFLoader` and the Meshopt decoder.
4. Poster: render the rest pose to a transparent PNG at the banner's size for the loading and reduced-motion fallback.
