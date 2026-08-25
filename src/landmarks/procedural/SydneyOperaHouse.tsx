export function SydneyOperaHouse() {
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
