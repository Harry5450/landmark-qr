# Landmark QR

Turn a URL into a 3D landmark QR experience.

## MVP

- URL → QR matrix
- Landmark-first reveal: the initial frame reads as architecture, not a QR code
- Same-scene 1.5-second camera and voxel transition into the QR matrix
- Inline canonical QR result with return, copy, share, and download actions
- Landmark themes: Taipei 101, Eiffel Tower, Sydney Opera House
- Orbit / touch preview
- High-contrast Scan Mode for reliable scanning
- Architecture prepared for the full 10-landmark series

## Stack

- Vite + React + TypeScript
- Three.js + React Three Fiber + Drei
- `qrcode` for QR matrix generation
- `qrcode.react` for scan-safe SVG output

## Run

```bash
npm install
npm run dev
```

## Product rule

The decorative landmark and particle morph are the experience layer. The final
frame places an exact, flat QR over the same scene frame; Scan Mode removes
decoration and preserves error-correction level H plus a four-module quiet zone,
so visual styling never compromises QR readability.

## Current Taipei 101 Prototype

The Taipei 101 opening frame currently uses the approved concept render as a
true-alpha PNG cutout in `public/assets/references/`. This is a deliberate 2.5D
bridge: it gives the opening frame the requested architectural fidelity while the
production GLB is still unavailable. The cutout runs a continuous turntable
motion and also responds to horizontal drag. Clicking the building fades it into
a deterministic, tiered Taipei 101 instanced-module silhouette, then moves those
same modules into the QR plane. The final H-level QR excavates only a bounded
center area for a Taipei 101 mark; its finder patterns and four-module quiet zone
remain untouched and are covered by automated decode read-back.

Keep both files during asset review:

- `taipei-101-concept-source.png`: preserved source render.
- `taipei-101-concept-transparent.png`: background-removed RGBA production cutout.

The cutout must not be renamed to `.glb` or treated as a substitute for the final
3D model. When an approved GLB arrives, replace only the landmark asset boundary;
the shared morph, camera, QR, share, and Scan Mode layers stay unchanged.

## 3D Landmark Asset Pipeline

Landmark QR supports two interchangeable asset sources:

- `procedural`: the current lightweight prototype geometry.
- `glb`: a production asset loaded only after its landmark is selected.

Shared scene, camera, lighting, QR morph, generation, and interaction code live in
`src/components/LandmarkScene.tsx`. Asset selection is data-driven through
`src/data/landmarks.ts`; a new landmark should normally be a registry entry, not a
new scene implementation.

Production GLB targets are 20K–80K triangles, 1K–2K textures, and preferably less
than 5–8 MB (ideal: less than 3 MB). The loader keeps Draco and Meshopt decoding
available for future compressed assets and disposes the selected clone when it is
removed.

## Adding a GLB Landmark

1. Put the approved binary asset in `public/models/`.
2. Add a registry entry with `source: { type: 'glb', src: modelAssetPath('name.glb') }`
   so the URL respects Vite's deployment base path.
3. Set `fallback: true` only when a matching procedural implementation exists.
4. Set the asset transform and camera framing in the same registry entry.
5. Verify the build, missing-asset behavior, and Scan Mode before adding another
   production asset.

The Taipei 101 pipeline is the first production path. Its repository path is
`public/models/taipei-101.glb`; the runtime URL is resolved through Vite's
`BASE_URL` so it works under the GitHub Pages `/landmark-qr/` prefix. The
repository intentionally does not include a fake model. Until an approved asset
is supplied, a missing or invalid GLB falls back to the existing procedural
Taipei 101 prototype.

## File Naming

Use lowercase kebab-case names that match the landmark id:

```text
public/models/taipei-101.glb
public/models/eiffel-tower.glb
```

Do not commit generated previews, credentials, or placeholder binaries as GLB
assets.

## Landmark Registry

Each `Landmark` entry describes its `source`, optional concept image, `transform`,
and `camera`. Procedural and GLB landmarks share the same `LandmarkScene`, morph
field, and canonical QR layer. The registry is the only place that should decide
which asset source a landmark uses.

## Procedural Fallback

`GLBLandmark` catches missing files, 404s, parse failures, and loader errors. If the
registry enables `fallback`, the existing procedural model is rendered instead of
crashing the app. Otherwise a small in-scene unavailable state is shown. A WebGL
preview failure is also isolated so the canonical Scan Mode remains available.

## Scan Mode Requirements

Scan Mode is the reliability boundary: the landmark, lighting, contact shadows,
animation, and orbit interaction are removed or stopped. A canonical
white-background SVG QR is rendered inline over the same scene frame with no
decorated finder patterns. GLB rendering never owns QR encoding or scan
validation logic.

## Local Development

```bash
npm install
npm run dev
npm run build
```

No GLB is preloaded on the homepage. Only the selected GLB is requested by the
browser, so missing `public/models/` assets are safe during local development.

## First 10 landmarks

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

The first MVP implements three procedural landmark placeholders. They are intentionally replaceable with optimized GLB models later without changing the QR engine.

## Roadmap

1. Prototype the full interaction with procedural placeholder landmarks.
2. Replace placeholders with optimized GLB assets based on the approved visual concept series.
3. Add automatic scan validation and mobile performance budgets.
4. Expand from 3 implemented landmarks to all 10 landmark themes.
