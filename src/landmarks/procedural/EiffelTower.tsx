export function EiffelTower() {
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
