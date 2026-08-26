import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createQrMatrix } from '../lib/qr'

type QRFloorProps = {
  value: string
  scanSafe?: boolean
}

export function QRFloor({ value, scanSafe = false }: QRFloorProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const matrix = useMemo(() => createQrMatrix(value), [value])

  const unit = Math.min(0.18, 7.2 / (matrix.size + 8))
  const baseSize = (matrix.size + 8) * unit

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const dummy = new THREE.Object3D()
    const center = (matrix.size - 1) / 2

    matrix.darkCells.forEach(([col, row], index) => {
      dummy.position.set((col - center) * unit, 0.09, (row - center) * unit)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
  }, [matrix, unit])

  return (
    <group>
      <mesh position={[0, -0.055, 0]} receiveShadow={!scanSafe}>
        <boxGeometry args={[baseSize, 0.11, baseSize]} />
        {scanSafe ? (
          <meshBasicMaterial color="#ffffff" />
        ) : (
          <meshStandardMaterial color="#f8fafc" roughness={0.94} />
        )}
      </mesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, matrix.darkCells.length]}
        castShadow={!scanSafe}
        receiveShadow={!scanSafe}
        frustumCulled={false}
      >
        <boxGeometry args={[unit * 0.9, 0.14, unit * 0.9]} />
        {scanSafe ? (
          <meshBasicMaterial color="#0b1020" />
        ) : (
          <meshStandardMaterial color="#111827" roughness={0.72} metalness={0.04} />
        )}
      </instancedMesh>
    </group>
  )
}
