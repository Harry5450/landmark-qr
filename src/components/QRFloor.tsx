import { useLayoutEffect, useMemo, useRef } from 'react'
import QRCode from 'qrcode'
import * as THREE from 'three'

type QRFloorProps = {
  value: string
}

export function QRFloor({ value }: QRFloorProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const matrix = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'H' })
    const size = qr.modules.size
    const cells: Array<[number, number]> = []

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (qr.modules.get(row, col)) cells.push([col, row])
      }
    }

    return { cells, size }
  }, [value])

  const unit = Math.min(0.18, 7.2 / (matrix.size + 8))
  const baseSize = (matrix.size + 8) * unit

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const dummy = new THREE.Object3D()
    const center = (matrix.size - 1) / 2

    matrix.cells.forEach(([col, row], index) => {
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
      <mesh position={[0, -0.055, 0]} receiveShadow>
        <boxGeometry args={[baseSize, 0.11, baseSize]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.94} />
      </mesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, matrix.cells.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <boxGeometry args={[unit * 0.9, 0.14, unit * 0.9]} />
        <meshStandardMaterial color="#111827" roughness={0.72} metalness={0.04} />
      </instancedMesh>
    </group>
  )
}
