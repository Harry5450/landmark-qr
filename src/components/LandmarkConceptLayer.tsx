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
  return (
    <button
      type="button"
      className={`landmark-concept-layer is-${phase}`}
      onClick={onTransform}
      disabled={phase !== 'explore'}
      aria-label={`Transform ${landmarkName} into a QR code`}
    >
      <img src={src} alt={`${landmarkName} miniature architectural concept`} />
    </button>
  )
}
