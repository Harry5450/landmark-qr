import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { landmarks, type LandmarkId } from '../data/landmarks'
import type { ExperiencePhase } from '../hooks/useExperiencePhase'
import {
  createMorphLayout,
  delayedMorphProgress,
  type MorphLayout,
} from '../lib/morphLayout'
import {
  REVEAL_DURATION_SECONDS,
  RETURN_DURATION_SECONDS,
} from './SceneCameraController'

const MAX_DELTA_SECONDS = 1 / 20
const QR_COLOR = new THREE.Color('#0b1020')

type QRMorphFieldProps = {
  value: string
  landmarkId: LandmarkId
  phase: ExperiencePhase
  reducedMotion?: boolean
}

type MorphTransition = {
  phase: 'revealing' | 'returning'
  elapsedSeconds: number
  durationSeconds: number
  fromProgress: number
  toProgress: number
}

function writeInstances(
  mesh: THREE.InstancedMesh,
  layout: MorphLayout,
  progress: number,
) {
  const dummy = new THREE.Object3D()

  layout.points.forEach((point, index) => {
    const localProgress = delayedMorphProgress(progress, point.delay)
    const flattenProgress = THREE.MathUtils.smoothstep(localProgress, 0, 0.5)
    const alignProgress = THREE.MathUtils.smoothstep(localProgress, 0.42, 1)
    const flattenedX = THREE.MathUtils.lerp(
      point.start[0],
      point.flat[0],
      flattenProgress,
    )
    const flattenedY = THREE.MathUtils.lerp(
      point.start[1],
      point.flat[1],
      flattenProgress,
    )
    const flattenedZ = THREE.MathUtils.lerp(
      point.start[2],
      point.flat[2],
      flattenProgress,
    )
    dummy.position.set(
      THREE.MathUtils.lerp(flattenedX, point.target[0], alignProgress),
      THREE.MathUtils.lerp(flattenedY, point.target[1], alignProgress),
      THREE.MathUtils.lerp(flattenedZ, point.target[2], alignProgress),
    )
    dummy.rotation.set(0, 0, 0)
    const flattenedScaleX = THREE.MathUtils.lerp(
      point.startScale[0],
      point.flatScale[0],
      flattenProgress,
    )
    const flattenedScaleY = THREE.MathUtils.lerp(
      point.startScale[1],
      point.flatScale[1],
      flattenProgress,
    )
    const flattenedScaleZ = THREE.MathUtils.lerp(
      point.startScale[2],
      point.flatScale[2],
      flattenProgress,
    )
    dummy.scale.set(
      THREE.MathUtils.lerp(flattenedScaleX, point.targetScale[0], alignProgress),
      THREE.MathUtils.lerp(flattenedScaleY, point.targetScale[1], alignProgress),
      THREE.MathUtils.lerp(flattenedScaleZ, point.targetScale[2], alignProgress),
    )
    dummy.updateMatrix()
    mesh.setMatrixAt(index, dummy.matrix)
  })

  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
}

export function QRMorphField({
  value,
  landmarkId,
  phase,
  reducedMotion = false,
}: QRMorphFieldProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const planeMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const previousPhaseRef = useRef<ExperiencePhase | null>(null)
  const progressRef = useRef(phase === 'scan' ? 1 : 0)
  const transitionRef = useRef<MorphTransition | null>(null)
  const layout = useMemo(
    () => createMorphLayout({ value, landmarkId }),
    [landmarkId, value],
  )
  const landmarkColor = useMemo(
    () =>
      new THREE.Color(
        landmarks.find((landmark) => landmark.id === landmarkId)?.accent ?? '#374151',
      ),
    [landmarkId],
  )

  const applyProgress = (progress: number) => {
    const mesh = meshRef.current
    if (!mesh) return

    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1)
    const morphProgress = THREE.MathUtils.smoothstep(clampedProgress, 0.18, 1)
    progressRef.current = clampedProgress
    writeInstances(mesh, layout, morphProgress)
    if (groupRef.current) {
      const fieldScale = THREE.MathUtils.lerp(
        0.76,
        1,
        THREE.MathUtils.smoothstep(clampedProgress, 0.42, 0.98),
      )
      groupRef.current.scale.setScalar(fieldScale)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        0.18,
        0,
        THREE.MathUtils.smoothstep(clampedProgress, 0.04, 0.58),
      )
    }
    if (materialRef.current) {
      materialRef.current.color
        .copy(landmarkColor)
        .lerp(
          QR_COLOR,
          THREE.MathUtils.smoothstep(clampedProgress, 0.52, 0.92),
        )
      materialRef.current.opacity = THREE.MathUtils.smoothstep(
        clampedProgress,
        0.01,
        0.11,
      )
    }
    if (planeMaterialRef.current) {
      planeMaterialRef.current.opacity = THREE.MathUtils.smoothstep(
        clampedProgress,
        0.84,
        0.98,
      )
    }
  }

  useLayoutEffect(() => {
    const previousPhase = previousPhaseRef.current

    if (phase === 'revealing' && previousPhase !== 'revealing') {
      transitionRef.current = {
        phase,
        elapsedSeconds: 0,
        durationSeconds: reducedMotion ? 0 : REVEAL_DURATION_SECONDS,
        fromProgress: progressRef.current,
        toProgress: 1,
      }
    } else if (phase === 'returning' && previousPhase !== 'returning') {
      transitionRef.current = {
        phase,
        elapsedSeconds: 0,
        durationSeconds: reducedMotion ? 0 : RETURN_DURATION_SECONDS,
        fromProgress: progressRef.current,
        toProgress: 0,
      }
    } else if (phase === 'scan') {
      transitionRef.current = null
      applyProgress(1)
    } else if (phase === 'explore') {
      transitionRef.current = null
      applyProgress(0)
    } else if (previousPhase === null) {
      applyProgress(0)
    }

    previousPhaseRef.current = phase
  }, [landmarkColor, layout, phase, reducedMotion])

  useFrame((_, rawDeltaSeconds) => {
    const transition = transitionRef.current
    if (!transition || transition.phase !== phase) return

    transition.elapsedSeconds += THREE.MathUtils.clamp(
      rawDeltaSeconds,
      0,
      MAX_DELTA_SECONDS,
    )
    const timeProgress =
      transition.durationSeconds === 0
        ? 1
        : THREE.MathUtils.clamp(
            transition.elapsedSeconds / transition.durationSeconds,
            0,
            1,
          )
    const easedProgress =
      timeProgress < 0.5
        ? 4 * timeProgress * timeProgress * timeProgress
        : 1 - Math.pow(-2 * timeProgress + 2, 3) / 2
    const progress = THREE.MathUtils.lerp(
      transition.fromProgress,
      transition.toProgress,
      easedProgress,
    )
    applyProgress(progress)

    if (timeProgress < 1) return

    applyProgress(transition.toProgress)
    transitionRef.current = null
  })

  const showQrPlane = phase !== 'explore'

  return (
    <group
      ref={groupRef}
      name="qr-morph-field"
      rotation={[0, 0.18, 0]}
      scale={0.76}
    >
      <mesh
        position={[0, 0, 0]}
        receiveShadow={false}
        visible={showQrPlane}
      >
        <boxGeometry args={[layout.planeSize, 0.06, layout.planeSize]} />
        <meshBasicMaterial
          ref={planeMaterialRef}
          color="#ffffff"
          transparent
          opacity={phase === 'scan' ? 1 : 0}
          depthWrite={false}
        />
      </mesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, layout.points.length]}
        castShadow={phase === 'explore'}
        receiveShadow={false}
        frustumCulled={false}
      >
        <boxGeometry
          args={[
            layout.moduleSize * 0.9,
            layout.moduleSize * 0.9,
            layout.moduleSize * 0.9,
          ]}
        />
        <meshBasicMaterial
          ref={materialRef}
          color={landmarkColor}
          transparent
          opacity={phase === 'scan' ? 1 : 0}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  )
}
