/** Shared perimeter accents; removed with the landmark on scan. */
export function PlazaGarden() {
  return <group>
    {[-2.7, -1.8, 1.8, 2.7].flatMap((x, i) => [-2.85, 2.85].map(z => <group key={`${x}:${z}`} position={[x, 0.08, z]}>
      <mesh position={[0, 0.08, 0]} castShadow><boxGeometry args={[0.56, 0.16, 0.5]} /><meshStandardMaterial color="#929c89" /></mesh>
      <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.04, 0.055, 0.42, 6]} /><meshStandardMaterial color="#77654c" /></mesh>
      <mesh position={[0, 0.64, 0]} scale={[1, 1.2, 1]} castShadow><icosahedronGeometry args={[0.32, 1]} /><meshStandardMaterial color={i % 2 ? '#779266' : '#8caa74'} roughness={1} flatShading /></mesh>
    </group>))}
    {[-2.8, 2.8].map(x => <group key={x} position={[x, 0.13, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow><boxGeometry args={[0.34, 0.16, 1]} /><meshStandardMaterial color="#777f73" /></mesh>
      <mesh position={[0, 0.19, 0]} castShadow><boxGeometry args={[0.4, 0.055, 1.06]} /><meshStandardMaterial color="#b6a187" /></mesh>
    </group>)}
  </group>
}
