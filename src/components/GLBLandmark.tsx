import { Html, useGLTF } from '@react-three/drei'
import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import type { LandmarkTransform } from '../data/landmarks'

type GLBLandmarkProps = {
  src: string
  transform: LandmarkTransform
  fallback?: ReactNode
  label?: string
}

type GLBErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type GLBErrorBoundaryState = {
  hasError: boolean
}

class GLBErrorBoundary extends Component<
  GLBErrorBoundaryProps,
  GLBErrorBoundaryState
> {
  state: GLBErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): GLBErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[GLBLandmark] asset could not be loaded', error)
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function cloneScene(source: THREE.Object3D) {
  const clone = SkeletonUtils.clone(source)

  clone.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return

    object.geometry = object.geometry.clone()
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone()
    object.castShadow = true
    object.receiveShadow = true
  })

  return clone
}

function disposeScene(scene: THREE.Object3D) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return

    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => material.dispose())
  })
}

function GLBAssetState({ label, error = false }: { label: string; error?: boolean }) {
  return (
    <group position={[0, 0.8, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 1.4, 0.9]} />
        <meshBasicMaterial color={error ? '#b85454' : '#54e3d4'} wireframe />
      </mesh>
      <Html center distanceFactor={7}>
        <div className={`glb-state ${error ? 'is-error' : ''}`} role="status">
          {label}
        </div>
      </Html>
    </group>
  )
}

function LoadedGLB({ src }: { src: string }) {
  // Both decoder paths stay available for future compressed production assets.
  const { scene } = useGLTF(src, true, true)
  const clonedScene = useMemo(() => cloneScene(scene), [scene])

  useEffect(() => {
    return () => {
      disposeScene(clonedScene)
      useGLTF.clear(src)
    }
  }, [clonedScene, src])

  return <primitive object={clonedScene} />
}

export function GLBLandmark({
  src,
  transform,
  fallback,
  label = 'Landmark',
}: GLBLandmarkProps) {
  const errorFallback = fallback ?? <GLBAssetState label={`${label} unavailable`} error />

  return (
    <group
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      <GLBErrorBoundary key={src} fallback={errorFallback}>
        <Suspense fallback={<GLBAssetState label={`Loading ${label}…`} />}>
          <LoadedGLB src={src} />
        </Suspense>
      </GLBErrorBoundary>
    </group>
  )
}
