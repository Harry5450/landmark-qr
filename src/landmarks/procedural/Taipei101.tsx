export function Taipei101() {
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
