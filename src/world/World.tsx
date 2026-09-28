import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import * as THREE from 'three'
import { setUi } from '../store'
import { CameraRig } from './CameraRig'
import { CareerLine } from './Line'
import { Ground } from './Ground'
import { AttentionScene } from './stops/AttentionScene'
import { CommunityScene } from './stops/CommunityScene'
import { SystemsScene } from './stops/SystemsScene'
import { COLORS } from './palette'

function Ready() {
  useEffect(() => {
    setUi({ ready: true })
  }, [])
  return null
}

export function World({ lite }: { lite: boolean }) {
  return (
    <Canvas
      className="world"
      dpr={lite ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, alpha: false }}
      flat
      camera={{ fov: 42, near: 0.1, far: 600, position: [-34, 34, 40] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(COLORS.paper)
        scene.fog = new THREE.Fog(COLORS.paper, 50, 250)
      }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <CameraRig />
        <Ground />
        <CareerLine />
        <AttentionScene />
        <CommunityScene />
        <SystemsScene />
        <Ready />
      </Suspense>
    </Canvas>
  )
}
