import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Component, useEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import {
  landmarks,
  type Landmark,
  type LandmarkId,
  type LandmarkVector3,
} from '../data/landmarks'
import type { ExperiencePhase } from '../hooks/useExperiencePhase'
import { GLBLandmark } from './GLBLandmark'
import { LandmarkReveal } from './LandmarkReveal'
import { LandmarkModel } from './ProceduralLandmarks'
import { QRMorphField } from './QRMorphField'
import {
  REVEAL_DURATION_SECONDS,
  RETURN_DURATION_SECONDS,
  SceneCameraController,
} from './SceneCameraController'

type LandmarkSceneProps = {
  value: string
  landmarkId: LandmarkId
  phase?: ExperiencePhase
  reducedMotion?: boolean
  onRevealRequest?: () => void
  onRevealComplete?: () => void
  onReturnComplete?: () => void
  onSceneUnavailable?: () => void
  /** @deprecated Use phase="scan" with the experience state machine. */
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
  { children: ReactNode; onError?: () => void },
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[LandmarkScene] 3D preview unavailable', error)
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) {
      return <SceneUnavailable />
    }

    return this.props.children
  }
}

function cameraPosition(landmark: Landmark): LandmarkVector3 {
  const distance = landmark.camera.distance
  return [distance * 0.72, distance * 0.68, distance * 0.72]
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

type DecorativeSceneProps = {
  value: string
  landmark: Landmark
  phase: ExperiencePhase
  reducedMotion?: boolean
  onRevealRequest?: () => void
  onRevealComplete?: () => void
  onReturnComplete?: () => void
}

function DecorativeScene({
  value,
  landmark,
  phase,
  reducedMotion,
  onRevealRequest,
  onRevealComplete,
  onReturnComplete,
}: DecorativeSceneProps) {
  const subjectRef = useRef<THREE.Group>(null)

  return (
    <>
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

      {!landmark.conceptImage && (
        <LandmarkReveal
          phase={phase}
          subjectRef={subjectRef}
          reducedMotion={reducedMotion}
          onRevealRequest={onRevealRequest}
        >
          <LandmarkAsset landmark={landmark} />
        </LandmarkReveal>
      )}

      <QRMorphField
        value={value}
        landmarkId={landmark.id}
        phase={phase}
        reducedMotion={reducedMotion}
      />

      {phase !== 'scan' && !landmark.conceptImage && (
        <ContactShadows
          position={[0, -0.13, 0]}
          opacity={0.32}
          scale={9}
          blur={2.7}
          far={6}
        />
      )}

      <SceneCameraController
        cameraConfig={landmark.camera}
        phase={phase}
        subjectRef={subjectRef}
        reducedMotion={reducedMotion}
        onRevealComplete={onRevealComplete}
        onReturnComplete={onReturnComplete}
      />

      {phase === 'explore' && (
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
      )}
    </>
  )
}

export function LandmarkScene({
  value,
  landmarkId,
  phase = 'explore',
  reducedMotion,
  onRevealRequest,
  onRevealComplete,
  onReturnComplete,
  onSceneUnavailable,
  scanMode = false,
}: LandmarkSceneProps) {
  const landmark = landmarks.find((item) => item.id === landmarkId) ?? landmarks[0]
  const activePhase = scanMode ? 'scan' : phase

  useEffect(() => {
    if (activePhase !== 'revealing' && activePhase !== 'returning') return

    const durationSeconds =
      activePhase === 'revealing'
        ? REVEAL_DURATION_SECONDS
        : RETURN_DURATION_SECONDS
    const complete =
      activePhase === 'revealing' ? onRevealComplete : onReturnComplete
    const timeoutId = window.setTimeout(
      () => complete?.(),
      durationSeconds * 1000 + 80,
    )

    return () => window.clearTimeout(timeoutId)
  }, [activePhase, onRevealComplete, onReturnComplete])

  return (
    <SceneErrorBoundary key={landmark.id} onError={onSceneUnavailable}>
      <Canvas
        shadows={activePhase !== 'scan'}
        dpr={[1, 1.75]}
        camera={{
          position: cameraPosition(landmark),
          fov: 38,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        fallback={<SceneUnavailable />}
      >
        <DecorativeScene
          value={value}
          landmark={landmark}
          phase={activePhase}
          reducedMotion={reducedMotion}
          onRevealRequest={onRevealRequest}
          onRevealComplete={onRevealComplete}
          onReturnComplete={onReturnComplete}
        />
      </Canvas>
    </SceneErrorBoundary>
  )
}
