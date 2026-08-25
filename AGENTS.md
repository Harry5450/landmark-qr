# Landmark QR — Agent Rules

## Product invariant

Landmark QR has two layers:

1. **Experience Mode** — decorative 3D scene built around a real QR matrix.
2. **Scan Mode** — canonical, high-contrast QR output with decorations removed.

Never trade scan reliability for visual styling.

## Architecture

- Keep QR generation independent from landmark assets.
- Keep landmark selection data-driven through `src/data/landmarks.ts`.
- `LandmarkScene` owns shared camera, light, orbit controls and QR floor.
- `LandmarkModel` is the replaceable theme/asset boundary.
- Do not fork QR logic per landmark.
- Do not hard-code individual landmark behavior into `App.tsx`.

## GLB architecture guardrails

These rules are non-negotiable for the GLB-ready milestone:

1. Never couple landmark rendering with QR encoding.
2. Scan Mode always takes priority over visual fidelity.
3. Never preload every GLB landmark.
4. New landmarks should be config-driven.
5. Missing GLB assets must never crash the application.
6. Mobile performance is a release blocker.
7. Do not duplicate scene logic for individual landmarks.
8. Do not generate fake GLB assets to make tests pass.
9. Taipei 101 is the first production asset pipeline.
10. Do not start batch production of the remaining landmarks until Taipei 101
    passes the complete pipeline.

## Asset strategy

The current three landmark models are procedural placeholders only. Replace them gradually with optimized `.glb` assets.

Target per landmark:

- 20k–80k triangles
- 1K texture target; 2K only when visual evidence justifies it
- GLB/glTF
- Meshopt or Draco compression
- one landmark loaded at a time
- dispose inactive assets
- avoid baked text/signage

## First 10 themes

1. Taipei 101
2. Eiffel Tower
3. Statue of Liberty
4. Elizabeth Tower / Big Ben
5. Colosseum
6. Great Pyramid of Giza
7. Sydney Opera House
8. Taj Mahal
9. Christ the Redeemer
10. Burj Khalifa

## Visual system

Use one coherent collectible-diorama language:

- 3/4 isometric presentation
- clean miniature base
- semi-detailed low-poly geometry
- soft global illumination feel
- controlled vivid colors
- crisp silhouette recognition
- no people
- no floating labels inside the 3D scene
- small environmental accents are allowed but must not overpower the landmark

## QR safety

- Use error correction level H by default.
- Preserve a four-module quiet zone in Scan Mode.
- Finder patterns must never be decorated in canonical scan output.
- Scan Mode must remain black/dark-on-white and visually flat.
- Future automated scan validation should test rendered QR output before share/export.

## Mobile performance

- Mobile is a primary target.
- Never preload all 10 GLBs.
- Lazy-load only the selected landmark.
- Cap device pixel ratio where necessary.
- Avoid unnecessary post-processing.
- Prefer instancing for repeated QR modules and repeated scene elements.

## Development sequence

1. Keep current procedural MVP working.
2. Add automated build/QR tests.
3. Introduce the `GLBLandmark` loader behind the existing `LandmarkModel` boundary.
4. Replace Taipei 101 first.
5. Validate mobile FPS, memory and scan behavior.
6. Replace Eiffel Tower and Sydney Opera House.
7. Expand remaining seven landmarks only after the shared pipeline is stable.
