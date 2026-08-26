import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import type { ExperiencePhase } from '../hooks/useExperiencePhase'
import {
  MAX_TRANSITION_DELTA_SECONDS,
  REVEAL_DURATION_SECONDS,
  RETURN_DURATION_SECONDS,
  sampleRevealTimeline,
  useReducedMotionPreference,
} from './SceneCameraController'

type LandmarkRevealProps = {
  children: ReactNode
  phase: ExperiencePhase
  subjectRef: RefObject<THREE.Group | null>
  reducedMotion?: boolean
  recedeDistance?: number
  onRevealRequest?: () => void
}

type LandmarkTransition = {
  phase: 'revealing' | 'returning'
  elapsedSeconds: number
  durationSeconds: number
  fromPosition: THREE.Vector3
  toPosition: THREE.Vector3
  fromScale: THREE.Vector3
  toScale: THREE.Vector3
}

export function LandmarkReveal({
  children,
  phase,
  subjectRef,
  reducedMotion,
  recedeDistance = 2.6,
  onRevealRequest,
}: LandmarkRevealProps) {
  const systemReducedMotion = useReducedMotionPreference()
  const previousPhaseRef = useRef<ExperiencePhase | null>(null)
  const activeTransitionRef = useRef<LandmarkTransition | null>(null)
  const homePositionRef = useRef(new THREE.Vector3())
  const homeScaleRef = useRef(new THREE.Vector3(1, 1, 1))

  const recessedPosition = () =>
    homePositionRef.current.clone().add(new THREE.Vector3(0, -recedeDistance, 0))
  const recessedScale = () => homeScaleRef.current.clone().multiplyScalar(0.72)

  useLayoutEffect(() => {
    const subject = subjectRef.current
    if (!subject) return

    const previousPhase = previousPhaseRef.current
    const prefersReducedMotion = reducedMotion ?? systemReducedMotion.current

    if (previousPhase === null && phase === 'explore') {
      homePositionRef.current.copy(subject.position)
      homeScaleRef.current.copy(subject.scale)
    }

    if (phase === 'revealing' && previousPhase !== 'revealing') {
      subject.visible = true
      const transition: LandmarkTransition = {
        phase,
        elapsedSeconds: 0,
        durationSeconds: prefersReducedMotion ? 0 : REVEAL_DURATION_SECONDS,
        fromPosition: subject.position.clone(),
        toPosition: recessedPosition(),
        fromScale: subject.scale.clone(),
        toScale: recessedScale(),
      }
      activeTransitionRef.current = transition
      if (prefersReducedMotion) {
        subject.position.copy(transition.toPosition)
        subject.scale.copy(transition.toScale)
        subject.visible = false
        activeTransitionRef.current = null
      }
    } else if (phase === 'returning' && previousPhase !== 'returning') {
      subject.visible = true
      const transition: LandmarkTransition = {
        phase,
        elapsedSeconds: 0,
        durationSeconds: prefersReducedMotion ? 0 : RETURN_DURATION_SECONDS,
        fromPosition: subject.position.clone(),
        toPosition: homePositionRef.current.clone(),
        fromScale: subject.scale.clone(),
        toScale: homeScaleRef.current.clone(),
      }
      activeTransitionRef.current = transition
      if (prefersReducedMotion) {
        subject.position.copy(transition.toPosition)
        subject.scale.copy(transition.toScale)
        activeTransitionRef.current = null
      }
    } else if (phase === 'scan') {
      activeTransitionRef.current = null
      subject.position.copy(recessedPosition())
      subject.scale.copy(recessedScale())
      subject.visible = false
    } else if (phase === 'explore') {
      activeTransitionRef.current = null
      subject.position.copy(homePositionRef.current)
      subject.scale.copy(homeScaleRef.current)
      subject.visible = true
    }

    previousPhaseRef.current = phase
  }, [phase, recedeDistance, reducedMotion, subjectRef, systemReducedMotion])

  useFrame((_, rawDeltaSeconds) => {
    const subject = subjectRef.current
    const transition = activeTransitionRef.current
    if (!subject || !transition || transition.phase !== phase) return

    const deltaSeconds = THREE.MathUtils.clamp(
      rawDeltaSeconds,
      0,
      MAX_TRANSITION_DELTA_SECONDS,
    )
    transition.elapsedSeconds += deltaSeconds
    const progress =
      transition.durationSeconds === 0
        ? 1
        : THREE.MathUtils.clamp(
            transition.elapsedSeconds / transition.durationSeconds,
            0,
            1,
          )
    const revealEquivalentProgress =
      transition.phase === 'revealing' ? progress : 1 - progress
    const timeline = sampleRevealTimeline(revealEquivalentProgress)
    const landmarkProgress =
      transition.phase === 'revealing'
        ? timeline.landmarkProgress
        : 1 - timeline.landmarkProgress

    subject.position.lerpVectors(
      transition.fromPosition,
      transition.toPosition,
      landmarkProgress,
    )
    subject.scale.lerpVectors(
      transition.fromScale,
      transition.toScale,
      landmarkProgress,
    )

    if (progress < 1) return

    subject.position.copy(transition.toPosition)
    subject.scale.copy(transition.toScale)
    if (transition.phase === 'revealing') subject.visible = false
    activeTransitionRef.current = null
  })

  return (
    <group
      ref={subjectRef}
      onClick={(event) => {
        if (phase !== 'explore' || !onRevealRequest) return
        event.stopPropagation()
        onRevealRequest()
      }}
    >
      {children}
    </group>
  )
}
