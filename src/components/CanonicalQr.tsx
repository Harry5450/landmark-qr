import { forwardRef, useMemo } from 'react'
import type { LandmarkQrMark } from '../data/landmarks'
import { getLandmarkQrImageSettings } from '../lib/landmarkQrMark'
import { createQrMatrix, QR_QUIET_ZONE_MODULES } from '../lib/qr'

type CanonicalQrProps = {
  value: string
  mark?: LandmarkQrMark
}

/** Uses the same encoded modules as the 3D floor and adds a scan-tested landmark mark. */
export const CanonicalQr = forwardRef<SVGSVGElement, CanonicalQrProps>(
  function CanonicalQr({ value, mark }, ref) {
    const matrix = useMemo(() => createQrMatrix(value), [value])
    const imageSettings = getLandmarkQrImageSettings(mark)
    const margin = QR_QUIET_ZONE_MODULES
    const extent = matrix.size + margin * 2
    const markWidth = imageSettings
      ? Math.min(10, Math.max(5.8, (extent * imageSettings.width) / 292))
      : 0
    const markHeight = imageSettings
      ? Math.min(13.4, Math.max(7.8, (extent * imageSettings.height) / 292))
      : 0
    const markX = (extent - markWidth) / 2
    const markY = (extent - markHeight) / 2
    const path = matrix.darkCells
      .filter(([x, y]) => {
        if (!imageSettings?.excavate) return true
        const moduleX = x + margin + 0.5
        const moduleY = y + margin + 0.5
        return !(
          moduleX >= markX &&
          moduleX <= markX + markWidth &&
          moduleY >= markY &&
          moduleY <= markY + markHeight
        )
      })
      .map(([x, y]) => `M${x + margin},${y + margin}h1v1h-1z`)
      .join('')
    return (
      <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${extent} ${extent}`}
        width={380} height={380} role="img" aria-label={`QR code for ${value}`}
        shapeRendering="crispEdges" data-value={value}>
        <title>{`QR code for ${value}`}</title>
        <path fill="#ffffff" d={`M0 0h${extent}v${extent}H0z`} />
        <path fill="#0b1020" d={path} />
        {imageSettings ? (
          <image
            data-landmark-mark={mark}
            href={imageSettings.src}
            x={markX}
            y={markY}
            width={markWidth}
            height={markHeight}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : null}
      </svg>
    )
  },
)
