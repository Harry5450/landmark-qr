# Landmark QR

Turn a URL into a 3D landmark QR experience.

## MVP

- URL → QR matrix
- Landmark-first reveal: the initial frame reads as architecture, not a QR code
- Same-scene 1.6-second camera, landmark, and plaza transition into the QR matrix
- Inline canonical QR result with return, copy, share, and download actions
- Landmark themes: ten complete transparent concept previews, including Taipei
  101, Eiffel Tower, Sydney Opera House, Statue of Liberty, Elizabeth Tower,
  Colosseum, Great Pyramid of Giza, Taj Mahal, Christ the Redeemer, and Burj
  Khalifa
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

Taipei 101 is the reference implementation for the shared reveal path. Its
authored procedural model and perimeter garden are wrapped by `LandmarkReveal`;
`QrPlaza` owns the destination matrix and flattens the plaza tiles while
`SceneCameraController` hands the same frame to a top-down scan pose. The final
H-level QR excavates only a bounded center area for a Taipei 101 mark; its finder
patterns and four-module quiet zone remain untouched and are covered by automated
decode read-back.

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

Taipei 101 currently uses the authored procedural model. No approved GLB is
bundled, so the active registry avoids requesting a nonexistent binary. The
existing GLB loader remains available for an approved asset at
`public/models/taipei-101.glb`; configure its runtime URL with Vite's `BASE_URL`
to preserve GitHub Pages subpath support.

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
and `camera`. Procedural, concept-fallback, and GLB landmarks share the same
`LandmarkScene`, plaza reveal, and canonical QR layer. The registry is the only
place that should decide which asset source a landmark uses.

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

All ten registry entries now have a reviewed transparent concept preview. Taipei
101, Eiffel Tower, and Sydney Opera House use authored procedural geometry; the
other seven use their concept cutout inside the same Canvas subject while the
production geometry pipeline is prepared. Concept previews are presentation
assets only and are not substitutes for approved GLB files.

## Roadmap

1. Keep the full interaction and ten concept previews stable.
2. Replace concept previews with optimized GLB assets based on the approved visual concept series, one landmark at a time.
3. Add automatic scan validation and mobile performance budgets.
4. Keep the ten-theme registry aligned as each concept preview graduates to a production landmark asset.

## Architecture collection preview

All ten ready themes now use the shared `plazaQr` scene path. The landmark subject
and perimeter garden collapse while the plaza tiles flatten into a QR.
`QrPlaza` and `CanonicalQr` both use `createQrMatrix`; the Taipei 101 scan output
adds a small, excavated landmark mark in the center and keeps finder patterns untouched.
`scanLayout` defines the world extent and display size used by the camera and SVG,
so the planar endpoint hands off at the same screen position. The WebGL canvas is
hidden only in the final scan state; return restores it for the reverse animation.
Concept-only themes remain presentation fallbacks until an approved procedural or
GLB asset replaces them; their reveal, camera, QR, and Scan Mode behavior is the
same as Taipei 101.

The default view no longer auto-rotates. Drag/touch orbit remains available.
Upcoming themes are collapsed, the hero is shorter, and mobile uses a fixed scene
height with a responsive camera. QR download exports the same visible SVG.

Validation: `npm test` and `npm run build`. Additional decoding tests rasterize the
active canonical SVG at display sizes and check exact destinations, including
Unicode and longer URLs. Browser checks do not replace physical phone camera or
mobile GPU performance testing. Source changes are not automatically published.
