import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { ExperiencePhase } from '../hooks/useExperiencePhase'

type LandmarkConceptLayerProps = {
  src: string
  landmarkName: string
  phase: ExperiencePhase
  onTransform: () => void
}

export function LandmarkConceptLayer({
  src,
  landmarkName,
  phase,
  onTransform,
}: LandmarkConceptLayerProps) {
  const [dragYaw, setDragYaw] = useState(0)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startYaw: number
    moved: boolean
  } | null>(null)
  const ignoreClickRef = useRef(false)

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    ignoreClickRef.current = drag.moved
    dragRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  return (
    <button
      type="button"
      className={`landmark-concept-layer is-${phase}`}
      onClick={() => {
        if (ignoreClickRef.current) {
          ignoreClickRef.current = false
          return
        }
        onTransform()
      }}
      onPointerDown={(event) => {
        if (phase !== 'explore') return
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startYaw: dragYaw,
          moved: false,
        }
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current
        if (!drag || drag.pointerId !== event.pointerId) return

        const distance = event.clientX - drag.startX
        if (Math.abs(distance) > 5) drag.moved = true
        setDragYaw(Math.max(-18, Math.min(18, drag.startYaw + distance * 0.14)))
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      disabled={phase !== 'explore'}
      aria-label={`Transform ${landmarkName} into a QR code`}
    >
      <span
        className="landmark-concept-layer__turntable"
        style={{ '--concept-drag-yaw': `${dragYaw}deg` } as CSSProperties}
      >
        <img src={src} alt={`${landmarkName} miniature architectural concept`} />
      </span>
    </button>
  )
}
