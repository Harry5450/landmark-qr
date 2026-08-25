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
