import type { LandmarkId } from '../data/landmarks'

type LandmarkModelProps = {
  id: LandmarkId
}

function Taipei101() {
  const tiers = Array.from({ length: 8 }, (_, index) => ({
    y: 0.75 + index * 0.38,
    size: 1.52 - index * 0.075,
  }))

  return (
    <group position={[0, 0.17, 0]} scale={0.78}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.42, 1.85]} />
        <meshStandardMaterial color="#597079" roughness={0.58} />
      </mesh>

      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[1.48, 0.24, 1.48]} />
        <meshStandardMaterial color="#1a8d85" roughness={0.42} metalness={0.08} />
      </mesh>

      {tiers.map((tier, index) => (
        <group key={index}>
          <mesh position={[0, tier.y, 0]} castShadow>
            <boxGeometry args={[tier.size, 0.31, tier.size]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? '#16a59b' : '#138e87'}
              roughness={0.38}
              metalness={0.08}
            />
          </mesh>
          <mesh position={[0, tier.y + 0.17, 0]} castShadow>
            <boxGeometry args={[tier.size + 0.08, 0.055, tier.size + 0.08]} />
            <meshStandardMaterial color="#d8e1df" roughness={0.5} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 3.86, 0]} castShadow>
        <boxGeometry args={[0.72, 0.36, 0.72]} />
        <meshStandardMaterial color="#668487" roughness={0.46} />
      </mesh>
      <mesh position={[0, 4.27, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.075, 0.9, 10]} />
        <meshStandardMaterial color="#a9b4b6" metalness={0.36} roughness={0.35} />
      </mesh>
      <mesh position={[0, 4.74, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.22, 10]} />
        <meshStandardMaterial color="#f5b63b" metalness={0.16} roughness={0.32} />
      </mesh>
    </group>
  )
}

function EiffelTower() {
  const legPositions: Array<[number, number]> = [
    [-0.58, -0.58],
    [0.58, -0.58],
    [-0.58, 0.58],
    [0.58, 0.58],
  ]

  return (
    <group position={[0, 0.16, 0]} scale={0.9}>
      {legPositions.map(([x, z]) => (
        <mesh
          key={`${x}-${z}`}
          position={[x * 0.72, 0.84, z * 0.72]}
          rotation={[z * -0.23, 0, x * 0.23]}
          castShadow
        >
          <cylinderGeometry args={[0.055, 0.15, 1.7, 4]} />
          <meshStandardMaterial color="#9b7552" roughness={0.64} metalness={0.12} />
        </mesh>
      ))}

      <mesh position={[0, 1.24, 0]} castShadow>
        <boxGeometry args={[1.32, 0.12, 1.32]} />
        <meshStandardMaterial color="#b38a62" roughness={0.56} metalness={0.1} />
      </mesh>
      <mesh position={[0, 2.04, 0]} castShadow>
        <boxGeometry args={[0.7, 0.09, 0.7]} />
        <meshStandardMaterial color="#b38a62" roughness={0.56} metalness={0.1} />
      </mesh>
      <mesh position={[0, 2.03, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.34, 1.45, 4]} />
        <meshStandardMaterial color="#9b7552" roughness={0.6} metalness={0.13} />
      </mesh>
      <mesh position={[0, 2.93, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.11, 0.52, 6]} />
        <meshStandardMaterial color="#8b6849" roughness={0.55} metalness={0.18} />
      </mesh>
      <mesh position={[0, 3.3, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.04, 0.36, 8]} />
        <meshStandardMaterial color="#7c624e" roughness={0.48} metalness={0.24} />
      </mesh>
    </group>
  )
}

function SydneyOperaHouse() {
  const sails = [
    { x: -0.72, z: 0.05, y: 0.72, scale: 1.0, rot: -0.55 },
    { x: -0.25, z: -0.08, y: 0.88, scale: 1.2, rot: -0.42 },
    { x: 0.2, z: 0.02, y: 0.78, scale: 1.08, rot: 0.38 },
    { x: 0.66, z: 0.12, y: 0.65, scale: 0.9, rot: 0.52 },
    { x: -0.45, z: 0.5, y: 0.58, scale: 0.82, rot: -0.6 },
    { x: 0.05, z: 0.5, y: 0.63, scale: 0.9, rot: 0.4 },
    { x: 0.52, z: 0.52, y: 0.52, scale: 0.72, rot: 0.55 },
  ]

  return (
    <group position={[0, 0.16, 0]} scale={0.9}>
      <mesh position={[0, 0.21, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.35, 0.36, 1.65]} />
        <meshStandardMaterial color="#bba58d" roughness={0.76} />
      </mesh>
      <mesh position={[0, 0.43, 0]} castShadow>
        <boxGeometry args={[2.15, 0.14, 1.45]} />
        <meshStandardMaterial color="#766f65" roughness={0.5} />
      </mesh>

      {sails.map((sail, index) => (
        <mesh
          key={index}
          position={[sail.x, sail.y, sail.z]}
          rotation={[0, sail.rot * 0.18, sail.rot]}
          scale={[sail.scale * 0.62, sail.scale, sail.scale * 0.34]}
          castShadow
        >
          <coneGeometry args={[0.55, 1.15, 4]} />
          <meshStandardMaterial color="#f2f0e8" roughness={0.48} />
        </mesh>
      ))}
    </group>
  )
}

export function LandmarkModel({ id }: LandmarkModelProps) {
  if (id === 'taipei-101') return <Taipei101 />
  if (id === 'eiffel-tower') return <EiffelTower />
  if (id === 'sydney-opera-house') return <SydneyOperaHouse />
  return null
}
