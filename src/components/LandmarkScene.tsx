import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Component, Suspense, useEffect, type ReactNode } from 'react'
import {
  landmarks,
  type Landmark,
  type LandmarkCamera,
  type LandmarkId,
  type LandmarkVector3,
} from '../data/landmarks'
import { GLBLandmark } from './GLBLandmark'
import { LandmarkModel } from './ProceduralLandmarks'
import { QRFloor } from './QRFloor'

type LandmarkSceneProps = {
  value: string
  landmarkId: LandmarkId
  scanMode?: boolean
}

type SceneErrorBoundaryState = {
  hasError: boolean
}

function SceneUnavailable() {
  return (
    <div className="scene-status is-error" role="status">
      3D preview unavailable. Scan Mode remains available.
    </div>
  )
}

class SceneErrorBoundary extends Component<
  { children: ReactNode },
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[LandmarkScene] 3D preview unavailable', error)
  }

  render() {
    if (this.state.hasError) return <SceneUnavailable />

    return this.props.children
  }
}

function cameraPosition(camera: LandmarkCamera, scanMode: boolean): LandmarkVector3 {
  const distance = scanMode ? Math.max(camera.distance, 8) : camera.distance
  return [distance * 0.72, distance * 0.68, distance * 0.72]
}

function SceneCamera({ camera, scanMode }: { camera: LandmarkCamera; scanMode: boolean }) {
  const { camera: threeCamera } = useThree()

  useEffect(() => {
    const distance = scanMode ? Math.max(camera.distance, 8) : camera.distance
    const targetY = scanMode ? 1.3 : camera.targetY

    threeCamera.position.set(distance * 0.72, distance * 0.68, distance * 0.72)
    threeCamera.lookAt(0, targetY, 0)
    threeCamera.updateProjectionMatrix()
  }, [camera.distance, camera.targetY, scanMode, threeCamera])

  return null
}

function LandmarkAsset({ landmark }: { landmark: Landmark }) {
  if (landmark.source.type === 'glb') {
    return (
      <GLBLandmark
        src={landmark.source.src}
        transform={landmark.transform}
        label={landmark.name}
        fallback={landmark.source.fallback ? <LandmarkModel id={landmark.id} /> : undefined}
      />
    )
  }

  return (
    <group
      position={landmark.transform.position}
      rotation={landmark.transform.rotation}
      scale={landmark.transform.scale}
    >
      <LandmarkModel id={landmark.id} />
    </group>
  )
}

function DecorativeScene({ value, landmark }: { value: string; landmark: Landmark }) {
  return (
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
      <LandmarkAsset landmark={landmark} />

      <ContactShadows
        position={[0, -0.13, 0]}
        opacity={0.32}
        scale={9}
        blur={2.7}
        far={6}
      />

      <OrbitControls
        key={landmark.id}
        makeDefault
        enablePan={false}
        minDistance={Math.max(4.5, landmark.camera.distance * 0.62)}
        maxDistance={landmark.camera.distance * 1.4}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, landmark.camera.targetY, 0]}
        autoRotate
        autoRotateSpeed={0.42}
        dampingFactor={0.08}
        enableDamping
      />
    </Suspense>
  )
}

export function LandmarkScene({ value, landmarkId, scanMode = false }: LandmarkSceneProps) {
  const landmark = landmarks.find((item) => item.id === landmarkId) ?? landmarks[0]

  return (
    <SceneErrorBoundary>
      <Canvas
        shadows={!scanMode}
        dpr={[1, 1.75]}
        camera={{
          position: cameraPosition(landmark.camera, scanMode),
          fov: 38,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        fallback={<SceneUnavailable />}
      >
        <SceneCamera camera={landmark.camera} scanMode={scanMode} />

        {scanMode ? (
          <QRFloor value={value} scanSafe />
        ) : (
          <DecorativeScene value={value} landmark={landmark} />
        )}
      </Canvas>
    </SceneErrorBoundary>
  )
}
