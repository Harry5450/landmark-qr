import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { landmarks, type LandmarkId } from '../data/landmarks'
import type { ExperiencePhase } from '../hooks/useExperiencePhase'
import {
  createVoxelLayout,
  VOXEL_SCAN_HEIGHT,
  type VoxelLayout,
} from '../lib/voxelLayout'
import {
  REVEAL_DURATION_SECONDS,
  RETURN_DURATION_SECONDS,
} from './SceneCameraController'

const MAX_DELTA_SECONDS = 1 / 20
const QR_COLOR = new THREE.Color('#111827')
const GROUND_CELL_COLOR = new THREE.Color('#2f4f49')

type QrVoxelFieldProps = {
  value: string
  landmarkId: LandmarkId
  phase: ExperiencePhase
  reducedMotion?: boolean
  onRevealRequest?: () => void
}

type VoxelTransition = {
  phase: 'revealing' | 'returning'
  elapsedSeconds: number
  durationSeconds: number
  fromProgress: number
  toProgress: number
}

function writeVoxelInstances(
  mesh: THREE.InstancedMesh,
  layout: VoxelLayout,
  progress: number,
  accentColor: THREE.Color,
) {
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()

  layout.cells.forEach((cell, index) => {
    const t = THREE.MathUtils.clamp(progress, 0, 1)
    const height = THREE.MathUtils.lerp(
      cell.exploreHeight,
      cell.scanHeight,
      t,
    )
    dummy.position.set(cell.x, height / 2, cell.z)
    dummy.scale.set(layout.moduleSize, height, layout.moduleSize)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(index, dummy.matrix)

    if (cell.isTower) {
      const shade = 0.82 + (cell.exploreHeight / layout.maxExploreHeight) * 0.18
      color.copy(accentColor).multiplyScalar(shade)
    } else {
      color.copy(GROUND_CELL_COLOR)
    }
    color.lerp(QR_COLOR, t)
    mesh.setColorAt(index, color)
  })

  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.computeBoundingSphere()
}

export function QrVoxelField({
  value,
  landmarkId,
  phase,
  reducedMotion = false,
  onRevealRequest,
}: QrVoxelFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const previousPhaseRef = useRef<ExperiencePhase | null>(null)
  const progressRef = useRef(phase === 'scan' ? 1 : 0)
  const transitionRef = useRef<VoxelTransition | null>(null)

  const layout = useMemo(
    () => createVoxelLayout({ value, landmarkId }),
    [landmarkId, value],
  )

  const accentColor = useMemo(
    () =>
      new THREE.Color(
        landmarks.find((item) => item.id === landmarkId)?.accent ?? '#374151',
      ),
    [landmarkId],
  )

  const applyProgress = (progress: number) => {
    const mesh = meshRef.current
    if (!mesh) return
    const clamped = THREE.MathUtils.clamp(progress, 0, 1)
    progressRef.current = clamped
    writeVoxelInstances(mesh, layout, clamped, accentColor)
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
  }, [layout, phase, reducedMotion])

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
    const eased =
      timeProgress < 0.5
        ? 4 * timeProgress * timeProgress * timeProgress
        : 1 - Math.pow(-2 * timeProgress + 2, 3) / 2
    const progress = THREE.MathUtils.lerp(
      transition.fromProgress,
      transition.toProgress,
      eased,
    )
    applyProgress(progress)

    if (timeProgress < 1) return
    applyProgress(transition.toProgress)
    transitionRef.current = null
  })

  const showGround = phase !== 'scan'

  return (
    <group name="qr-voxel-field">
      <mesh
        position={[0, -0.02, 0]}
        receiveShadow={false}
        visible={showGround}
      >
        <boxGeometry args={[layout.planeSize, 0.04, layout.planeSize]} />
        <meshBasicMaterial color="#f6f1e7" />
      </mesh>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, layout.cells.length]}
        castShadow
        receiveShadow={false}
        frustumCulled={false}
        onClick={(event) => {
          if (phase !== 'explore' || !onRevealRequest) return
          event.stopPropagation()
          onRevealRequest()
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.45} metalness={0.12} />
      </instancedMesh>
    </group>
  )
}

