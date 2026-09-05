import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createQrMatrix, QR_QUIET_ZONE_MODULES } from '../lib/qr'
import { QR_PLANE_SIZE, QR_SURFACE_Y } from '../lib/scanLayout'
import type { ExperiencePhase } from '../hooks/useExperiencePhase'
import { REVEAL_DURATION_SECONDS, useReducedMotionPreference } from './SceneCameraController'

export function QrPlaza({ value, phase, reducedMotion, onRevealRequest }: {
  value: string; phase: ExperiencePhase; reducedMotion?: boolean; onRevealRequest?: () => void
}) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const systemReducedMotion = useReducedMotionPreference()
  const base = useRef<THREE.MeshBasicMaterial>(null)
  const progress = useRef(phase === 'scan' ? 1 : 0)
  const matrix = useMemo(() => createQrMatrix(value), [value])
  const moduleSize = QR_PLANE_SIZE / (matrix.size + QR_QUIET_ZONE_MODULES * 2)
  const scratch = useMemo(() => ({ object: new THREE.Object3D(), color: new THREE.Color(), dark: new THREE.Color('#0b1020'), white: new THREE.Color('#ffffff'), stone: new THREE.Color('#dedfd4') }), [])
  const apply = (p: number) => {
    if (!mesh.current) return
    const t = THREE.MathUtils.smoothstep(p, 0, 1)
    const center = (matrix.size - 1) / 2
    matrix.darkCells.forEach(([x, z], i) => {
      const raised = 0.018 + ((x * 17 + z * 11) % 5) * 0.009
      const height = THREE.MathUtils.lerp(raised, 0.012, t)
      scratch.object.position.set((x - center) * moduleSize, QR_SURFACE_Y - height / 2, (z - center) * moduleSize)
      scratch.object.scale.set(moduleSize * THREE.MathUtils.lerp(0.92, 1, t), height, moduleSize * THREE.MathUtils.lerp(0.92, 1, t))
      scratch.object.updateMatrix()
      mesh.current!.setMatrixAt(i, scratch.object.matrix)
      scratch.color.set((x + z) % 3 === 0 ? '#98b1a6' : '#b2bfb2').lerp(scratch.dark, t)
      mesh.current!.setColorAt(i, scratch.color)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    base.current?.color.copy(scratch.stone).lerp(scratch.white, t)
  }
  useLayoutEffect(() => {
    progress.current = phase === 'scan' || phase === 'returning' ? 1 : 0
    apply(progress.current)
  }, [matrix])
  useFrame((_, delta) => {
    const target = phase === 'revealing' || phase === 'scan' ? 1 : 0
    const next = (reducedMotion ?? systemReducedMotion.current) || phase === 'scan' || phase === 'explore' ? target
      : THREE.MathUtils.clamp(progress.current + Math.sign(target - progress.current) * delta / REVEAL_DURATION_SECONDS, 0, 1)
    if (next !== progress.current) { progress.current = next; apply(next) }
  })
  return <group name="qr-plaza" visible={phase !== 'scan'} onClick={event => {
    if (phase === 'explore') { event.stopPropagation(); onRevealRequest?.() }
  }}>
    <mesh position={[0, -0.05, 0]}>
      <boxGeometry args={[QR_PLANE_SIZE, 0.24, QR_PLANE_SIZE]} />
      <meshStandardMaterial color="#9da79f" roughness={0.9} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, QR_SURFACE_Y - 0.014, 0]}>
      <planeGeometry args={[QR_PLANE_SIZE, QR_PLANE_SIZE]} />
      <meshBasicMaterial ref={base} color="#dedfd4" />
    </mesh>
    <instancedMesh ref={mesh} args={[undefined, undefined, matrix.darkCells.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} /><meshBasicMaterial />
    </instancedMesh>
  </group>
}
