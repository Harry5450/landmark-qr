import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { LandmarkCamera } from '../data/landmarks'
import type { ExperiencePhase } from '../hooks/useExperiencePhase'

/** Shared by the camera, landmark mesh, and QR-particle morph. */
export const REVEAL_DURATION_SECONDS = 1.5
export const RETURN_DURATION_SECONDS = REVEAL_DURATION_SECONDS

/** The landmark finishes receding before the camera reaches the scan pose. */
export const LANDMARK_RECESS_PORTION = 0.45
export const MAX_TRANSITION_DELTA_SECONDS = 1 / 20

const QR_FLOOR_HALF_EXTENT = 3.6
const TOP_DOWN_MARGIN = 1.1
const TOP_DOWN_UP = new THREE.Vector3(0, 0, -1)
const WORLD_UP = new THREE.Vector3(0, 1, 0)

type CameraPose = {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

type ActiveTransition = {
  phase: 'revealing' | 'returning'
  elapsedSeconds: number
  durationSeconds: number
  from: CameraPose
  to: CameraPose
  completionDispatched: boolean
}

type SceneCameraControllerProps = {
  cameraConfig: LandmarkCamera
  phase: ExperiencePhase
  subjectRef?: RefObject<THREE.Group | null>
  reducedMotion?: boolean
  onRevealComplete?: () => void
  onReturnComplete?: () => void
}

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2
}

function smoothstep(progress: number) {
  return progress * progress * (3 - 2 * progress)
}

export type RevealTimelineSample = {
  /** Clamped, linear progress through the complete transition. */
  progress: number
  /** Authored progress for the single camera lerp/slerp. */
  cameraProgress: number
  /** Progress for the landmark's early recede portion. */
  landmarkProgress: number
  terminal: boolean
}

/**
 * Samples the canonical building-to-QR timeline.
 *
 * Consumers that animate the QR particles should use this helper too so the
 * camera, source mesh, and particle field cannot drift onto separate timings.
 * For the exact reverse journey, sample with `1 - returnProgress`.
 */
export function sampleRevealTimeline(progress: number): RevealTimelineSample {
  const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1)
  const landmarkLinearProgress = THREE.MathUtils.clamp(
    clampedProgress / LANDMARK_RECESS_PORTION,
    0,
    1,
  )

  return {
    progress: clampedProgress,
    cameraProgress: easeInOutCubic(clampedProgress),
    landmarkProgress: smoothstep(landmarkLinearProgress),
    terminal: clampedProgress >= 1,
  }
}

function poseLookingAt(
  position: THREE.Vector3,
  target: THREE.Vector3,
  up: THREE.Vector3,
): CameraPose {
  const matrix = new THREE.Matrix4().lookAt(position, target, up)
  return {
    position,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(matrix),
  }
}

function designPose(camera: LandmarkCamera): CameraPose {
  const { distance, targetY } = camera
  return poseLookingAt(
    new THREE.Vector3(distance * 0.72, distance * 0.68, distance * 0.72),
    new THREE.Vector3(0, targetY, 0),
    WORLD_UP,
  )
}

export function useReducedMotionPreference() {
  const preferenceRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      preferenceRef.current = query.matches
    }

    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  return preferenceRef
}

export function SceneCameraController({
  cameraConfig,
  phase,
  subjectRef,
  reducedMotion,
  onRevealComplete,
  onReturnComplete,
}: SceneCameraControllerProps) {
  const { camera, size } = useThree()
  const systemReducedMotion = useReducedMotionPreference()
  const previousPhaseRef = useRef<ExperiencePhase | null>(null)
  const activeTransitionRef = useRef<ActiveTransition | null>(null)
  const revealStartPoseRef = useRef<CameraPose | null>(null)
  const subjectHalfExtentRef = useRef(QR_FLOOR_HALF_EXTENT)
  const callbacksRef = useRef({ onRevealComplete, onReturnComplete })
  callbacksRef.current = { onRevealComplete, onReturnComplete }

  const snapshotCamera = (): CameraPose => ({
    position: camera.position.clone(),
    quaternion: camera.quaternion.clone(),
  })

  const measureSubjectFootprint = () => {
    const subject = subjectRef?.current
    if (!subject) return

    const bounds = new THREE.Box3().setFromObject(subject, true)
    if (bounds.isEmpty()) return

    const size = bounds.getSize(new THREE.Vector3())
    const halfExtent = Math.max(size.x, size.z) * 0.5
    if (Number.isFinite(halfExtent)) {
      subjectHalfExtentRef.current = Math.max(QR_FLOOR_HALF_EXTENT, halfExtent)
    }
  }

  const topDownPose = (): CameraPose => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.1)
    const fov = THREE.MathUtils.degToRad(perspectiveCamera.fov || 38)
    const halfExtent = subjectHalfExtentRef.current * TOP_DOWN_MARGIN
    const verticalHalfExtent = halfExtent / Math.min(aspect, 1)
    const height = Math.max(
      cameraConfig.distance,
      verticalHalfExtent / Math.tan(fov * 0.5),
    )

    return poseLookingAt(
      new THREE.Vector3(0, height, 0),
      new THREE.Vector3(0, 0, 0),
      TOP_DOWN_UP,
    )
  }

  const copyPose = (pose: CameraPose) => {
    camera.position.copy(pose.position)
    camera.quaternion.copy(pose.quaternion)
    camera.updateMatrixWorld()
  }

  const completeTransition = (transition: ActiveTransition) => {
    copyPose(transition.to)
    transition.completionDispatched = true
    activeTransitionRef.current = null
    if (transition.phase === 'revealing') callbacksRef.current.onRevealComplete?.()
    else callbacksRef.current.onReturnComplete?.()
  }

  useLayoutEffect(() => {
    const previousPhase = previousPhaseRef.current
    const prefersReducedMotion = reducedMotion ?? systemReducedMotion.current

    if (previousPhase === null) {
      if (phase === 'scan') copyPose(topDownPose())
      else copyPose(designPose(cameraConfig))
    }

    if (phase === 'revealing' && previousPhase !== 'revealing') {
      measureSubjectFootprint()
      const from = snapshotCamera()
      revealStartPoseRef.current = {
        position: from.position.clone(),
        quaternion: from.quaternion.clone(),
      }
      activeTransitionRef.current = {
        phase,
        elapsedSeconds: 0,
        durationSeconds: prefersReducedMotion ? 0 : REVEAL_DURATION_SECONDS,
        from,
        to: topDownPose(),
        completionDispatched: false,
      }
      if (prefersReducedMotion) completeTransition(activeTransitionRef.current)
    } else if (phase === 'returning' && previousPhase !== 'returning') {
      activeTransitionRef.current = {
        phase,
        elapsedSeconds: 0,
        durationSeconds: prefersReducedMotion ? 0 : RETURN_DURATION_SECONDS,
        from: snapshotCamera(),
        to: revealStartPoseRef.current ?? designPose(cameraConfig),
        completionDispatched: false,
      }
      if (prefersReducedMotion) completeTransition(activeTransitionRef.current)
    } else if (phase === 'scan') {
      activeTransitionRef.current = null
      copyPose(topDownPose())
    } else if (phase === 'explore') {
      activeTransitionRef.current = null
      if (previousPhase === 'explore') copyPose(designPose(cameraConfig))
    }

    previousPhaseRef.current = phase
  }, [camera, cameraConfig, phase, reducedMotion, size.height, size.width, subjectRef])

  useFrame((_, rawDeltaSeconds) => {
    if (phase === 'scan') {
      copyPose(topDownPose())
      return
    }

    const transition = activeTransitionRef.current
    if (!transition || transition.phase !== phase) return

    const deltaSeconds = THREE.MathUtils.clamp(
      rawDeltaSeconds,
      0,
      MAX_TRANSITION_DELTA_SECONDS,
    )
    transition.elapsedSeconds += deltaSeconds

    if (transition.phase === 'revealing') transition.to = topDownPose()

    const progress =
      transition.durationSeconds === 0
        ? 1
        : THREE.MathUtils.clamp(
            transition.elapsedSeconds / transition.durationSeconds,
            0,
            1,
          )
    const timeline = sampleRevealTimeline(progress)

    camera.position.lerpVectors(
      transition.from.position,
      transition.to.position,
      timeline.cameraProgress,
    )
    camera.quaternion.slerpQuaternions(
      transition.from.quaternion,
      transition.to.quaternion,
      timeline.cameraProgress,
    )
    camera.updateMatrixWorld()

    if (progress < 1 || transition.completionDispatched) return

    completeTransition(transition)
  })

  return null
}
