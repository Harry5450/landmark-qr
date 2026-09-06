import { useTexture } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

type ConceptLandmarkProps = {
  src: string
  accent: string
}

/**
 * Presentation-only fallback for landmarks that do not have authored geometry
 * yet.  It deliberately lives inside the same Canvas subject as procedural
 * and GLB assets, so the shared reveal/camera/QR handoff remains identical.
 */
export function ConceptLandmark({ src, accent }: ConceptLandmarkProps) {
  const texture = useTexture(src)
  const dimensions = texture.image as { width?: number; height?: number }
  const aspect =
    dimensions.width && dimensions.height
      ? dimensions.width / dimensions.height
      : 1
  const height = 5.2
  const width = height * aspect
  const frameColor = useMemo(() => new THREE.Color(accent), [accent])

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    texture.needsUpdate = true
  }, [texture])

  return (
    <group position={[0, 0.16, 0]} rotation={[0, Math.PI / 4, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          color="#ffffff"
          transparent
          alphaTest={0.08}
          depthWrite
          emissive={frameColor}
          emissiveIntensity={0.04}
          roughness={0.78}
          metalness={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
