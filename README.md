# Landmark QR

Turn a URL into a 3D landmark QR experience.

## MVP

- URL → QR matrix
- 3D voxel QR base
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

The decorative 3D scene is the experience layer. Scan Mode removes decoration and renders a clean, high-contrast QR so visual styling never compromises QR readability.

## 3D Landmark Asset Pipeline

Landmark QR supports two interchangeable asset sources:

- `procedural`: the current lightweight prototype geometry.
- `glb`: a production asset loaded only after its landmark is selected.

Shared scene, camera, lighting, QR generation, and interaction code live in
`src/components/LandmarkScene.tsx`. Asset selection is data-driven through
`src/data/landmarks.ts`; a new landmark should normally be a registry entry, not a
new scene implementation.

Production GLB targets are 20K–80K triangles, 1K–2K textures, and preferably less
than 5–8 MB (ideal: less than 3 MB). The loader keeps Draco and Meshopt decoding
available for future compressed assets and disposes the selected clone when it is
removed.

## Adding a GLB Landmark

1. Put the approved binary asset in `public/models/`.
2. Add a registry entry with `source: { type: 'glb', src: '/models/name.glb' }`.
3. Set `fallback: true` only when a matching procedural implementation exists.
4. Set the asset transform and camera framing in the same registry entry.
5. Verify the build, missing-asset behavior, and Scan Mode before adding another
   production asset.

The Taipei 101 pipeline is the first production path. Its reserved path is
`/models/taipei-101.glb`; the repository intentionally does not include a fake
model. Until an approved asset is supplied, a missing or invalid GLB falls back to
the existing procedural Taipei 101 prototype.

## File Naming

Use lowercase kebab-case names that match the landmark id:

```text
public/models/taipei-101.glb
public/models/eiffel-tower.glb
```

Do not commit generated previews, credentials, or placeholder binaries as GLB
assets.

## Landmark Registry

Each `Landmark` entry describes its `source`, `transform`, and `camera`. Procedural
and GLB landmarks share the same `LandmarkScene` and QR floor. The registry is the
only place that should decide which asset source a landmark uses.

## Procedural Fallback

`GLBLandmark` catches missing files, 404s, parse failures, and loader errors. If the
registry enables `fallback`, the existing procedural model is rendered instead of
crashing the app. Otherwise a small in-scene unavailable state is shown. A WebGL
preview failure is also isolated so the canonical Scan Mode remains available.

## Scan Mode Requirements

Scan Mode is the reliability boundary: the landmark, lighting, contact shadows,
animation, and orbit interaction are removed or stopped, while the QR floor uses
high-contrast materials and the canonical white-background QR overlay remains
available. GLB rendering never owns QR encoding or scan validation logic.

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
