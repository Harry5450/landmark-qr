import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

/** Authored architectural geometry, independent of the destination QR. */
export function Taipei101() {
  const mullions = useRef<THREE.InstancedMesh>(null)
  const tiers = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ bottom: 0.92 + i * 0.57, width: 1.32 - i * 0.055 })), [])
  useLayoutEffect(() => {
    if (!mullions.current) return
    const dummy = new THREE.Object3D()
    let index = 0
    for (const tier of tiers) for (let face = 0; face < 4; face++) {
      const angle = face * Math.PI / 2
      for (let strip = -3; strip <= 3; strip++) {
        const offset = strip * tier.width / 8
        dummy.position.set(offset * Math.cos(angle) + tier.width * 0.455 * Math.sin(angle), tier.bottom + 0.265, -offset * Math.sin(angle) + tier.width * 0.455 * Math.cos(angle))
        dummy.rotation.set(0, angle, 0)
        dummy.scale.set(0.018, 0.49, 0.08)
        dummy.updateMatrix()
        mullions.current.setMatrixAt(index++, dummy.matrix)
      }
    }
    mullions.current.instanceMatrix.needsUpdate = true
  }, [tiers])
  return <group position={[0, 0.09, 0]}>
    <mesh position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[2.3, 0.4, 2]} /><meshStandardMaterial color="#526962" roughness={0.65} /></mesh>
    <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[2.42, 0.07, 2.12]} /><meshStandardMaterial color="#c8d6c8" /></mesh>
    <mesh position={[0, 0.66, 0]} castShadow><boxGeometry args={[1.38, 0.48, 1.38]} /><meshStandardMaterial color="#416d68" metalness={0.3} roughness={0.36} /></mesh>
    {tiers.map((tier, i) => <group key={i}>
      <mesh position={[0, tier.bottom + 0.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[tier.width / Math.SQRT2, tier.width * 0.82 / Math.SQRT2, 0.5, 4]} />
        <meshStandardMaterial color={i % 2 ? '#548f87' : '#629e94'} roughness={0.32} metalness={0.36} flatShading />
      </mesh>
      {[0.07, 0.25, 0.43, 0.51].map((y, j) => <mesh key={j} position={[0, tier.bottom + y, 0]} castShadow={j === 3}>
        <boxGeometry args={[tier.width * (0.82 + y * 0.36) + 0.035, j === 3 ? 0.055 : 0.019, tier.width * (0.82 + y * 0.36) + 0.035]} />
        <meshStandardMaterial color={j === 3 ? '#c1d1b8' : '#9bb9a7'} roughness={0.55} metalness={0.18} />
      </mesh>)}
      {[-1, 1].flatMap(x => [-1, 1].map(z => <mesh key={`${x}:${z}`} position={[x * tier.width * 0.5, tier.bottom + 0.5, z * tier.width * 0.5]}>
        <boxGeometry args={[0.11, 0.12, 0.11]} /><meshStandardMaterial color="#b7c9ae" />
      </mesh>))}
    </group>)}
    <instancedMesh ref={mullions} args={[undefined, undefined, 224]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#aec4b5" metalness={0.2} roughness={0.5} />
    </instancedMesh>
    <mesh position={[0, 5.64, 0]} castShadow><boxGeometry args={[0.55, 0.44, 0.55]} /><meshStandardMaterial color="#54877d" /></mesh>
    <mesh position={[0, 5.91, 0]}><boxGeometry args={[0.36, 0.12, 0.36]} /><meshStandardMaterial color="#c1d1b8" /></mesh>
    <mesh position={[0, 6.27, 0]} castShadow><cylinderGeometry args={[0.022, 0.085, 0.64, 8]} /><meshStandardMaterial color="#c4c8ad" metalness={0.4} roughness={0.4} /></mesh>
    <mesh position={[0, 6.63, 0]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#ecc784" /></mesh>
  </group>
}
