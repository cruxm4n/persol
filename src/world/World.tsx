import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr, Preload } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { setUi } from '../store'
import * as THREE from 'three'
import { CameraRig } from './CameraRig'
import { Terrain } from './Terrain'
import { LandingBeacon, LaunchPad } from './Pads'
import { AudienceNetwork } from './AudienceNetwork'
import { BrandDistrict } from './BrandDistrict'
import { MissionScreens } from './MissionScreens'
import { InstrumentTower } from './InstrumentTower'
import { ResultsRunway } from './ResultsRunway'
import { Trajectory } from './Trajectory'
import { COLORS, FOG_DENSITY } from './palette'
import { dotTexture } from './util'

function Ready() {
  useEffect(() => {
    const id = setTimeout(() => setUi({ ready: true }), 250)
    return () => clearTimeout(id)
  }, [])
  return null
}

/** Airborne particles wrapped around the camera: they sell speed and depth. */
function Dust({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const BOX = 70
  const seed = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < a.length; i++) a[i] = Math.random() * BOX
    return a
  }, [count])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    return g
  }, [count])

  useFrame(({ camera, clock }) => {
    const attr = geo.attributes.position as THREE.BufferAttribute
    const t = clock.elapsedTime
    const c = camera.position
    const wrap = (v: number, centre: number) => centre - BOX / 2 + ((((v - centre + BOX / 2) % BOX) + BOX) % BOX)
    for (let i = 0; i < count; i++) {
      const x = seed[i * 3] + Math.sin(t * 0.1 + i) * 0.6
      const y = seed[i * 3 + 1] - t * 0.25
      const z = seed[i * 3 + 2]
      attr.setXYZ(i, wrap(x, c.x), wrap(y, c.y), wrap(z, c.z))
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={dotTexture()} color={COLORS.contour} size={0.12} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
    </points>
  )
}

export function World({ lite }: { lite: boolean }) {
  return (
    <Canvas
      className="world"
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: !lite, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 48, near: 0.1, far: 420, position: [0, 3.2, 17] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(COLORS.night)
        scene.fog = new THREE.FogExp2(COLORS.night, FOG_DENSITY)
      }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <CameraRig />
        <Terrain detail={lite ? 0.6 : 1} />
        <Dust count={lite ? 400 : 900} />
        <LaunchPad />
        <AudienceNetwork />
        <BrandDistrict />
        <MissionScreens />
        <InstrumentTower />
        <ResultsRunway />
        <Trajectory />
        <LandingBeacon />
        <Preload all />
        <Ready />
      </Suspense>
      <AdaptiveDpr pixelated={false} />
      {!lite && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={0.85} radius={0.7} />
          <Noise opacity={0.045} premultiply />
          <Vignette offset={0.28} darkness={0.78} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
