import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import type { LandmarkId } from '../data/landmarks'
import { LandmarkModel } from './ProceduralLandmarks'
import { QRFloor } from './QRFloor'

type LandmarkSceneProps = {
  value: string
  landmarkId: LandmarkId
}

export function LandmarkScene({ value, landmarkId }: LandmarkSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [6.4, 6.2, 6.4], fov: 38, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={1.25} />
        <hemisphereLight args={['#ffffff', '#7583a2', 1.25]} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={2.7}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-4, 3, -2]} intensity={0.65} color="#91b8ff" />

        <QRFloor value={value} />
        <LandmarkModel id={landmarkId} />

        <ContactShadows
          position={[0, -0.13, 0]}
          opacity={0.32}
          scale={9}
          blur={2.7}
          far={6}
        />

        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={5}
          maxDistance={11}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.48}
          target={[0, 1.25, 0]}
          autoRotate
          autoRotateSpeed={0.42}
          dampingFactor={0.08}
          enableDamping
        />
      </Suspense>
    </Canvas>
  )
}
