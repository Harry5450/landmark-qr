/** Shared screen/world contract for the WebGL-to-SVG handoff. */
export const QR_PLANE_SIZE = 7.2
export const QR_SURFACE_Y = 0.08
export function scanPixelSize(width: number, height: number) {
  return Math.max(1, Math.floor(Math.min(width - 40, height - 200, 380)))
}
