'use client'

import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, TiltShift2, ToneMapping, Vignette } from '@react-three/postprocessing'
import type { TiltShiftEffect } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { setUi } from '@/lib/experience-store'
import type { Profile } from '@/lib/responsive-config'
import { DAYLIGHT } from '@/lib/scene-config'
import { lens, ScrollCamera } from '../camera/ScrollCamera'
import { AttentionDistrict } from './AttentionDistrict'
import { AutomationWorkshop } from './AutomationWorkshop'
import { ContactZone } from './ContactZone'
import { CreatorVillage } from './CreatorVillage'
import { IslandArrival } from './IslandArrival'
import { StudioZone } from './StudioZone'
import { WorldEnvironment } from './WorldEnvironment'
import { WorldLighting } from './WorldLighting'

function Ready() {
  useEffect(() => {
    // a few frames: the first ones compile shaders, then the reader can see
    let n = 0
    let raf = 0
    const tick = () => {
      if (++n >= 3) setUi({ ready: true })
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return null
}

/** Light depth of field that follows the shot: a miniature from high up, almost none on the ground. */
function Effects({ profile }: { profile: Profile }) {
  const tilt = useRef<TiltShiftEffect>(null)
  useFrame(() => {
    if (tilt.current) tilt.current.blur = 0.015 + 0.13 * lens.blur
  })
  if (profile.effects === 'lite') return null
  return (
    <EffectComposer multisampling={4}>
      <TiltShift2 ref={tilt} blur={0.03} taper={0.7} start={[0.5, 0.15]} end={[0.5, 0.85]} samples={8} />
      <Bloom intensity={0.45} luminanceThreshold={0.92} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette offset={0.35} darkness={0.32} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}

/**
 * The world: one canvas, fixed behind the page. Nothing in it is clickable:
 * the scroll is the only way through.
 */
export default function PortfolioWorld({ profile }: { profile: Profile }) {
  return (
    <Canvas
      className="world-canvas"
      dpr={profile.dpr}
      shadows={profile.shadows ? { type: THREE.PCFShadowMap } : false}
      gl={{ antialias: profile.effects === 'lite', powerPreference: 'high-performance' }}
      camera={{ fov: 36, near: 0.3, far: 700, position: [10, 46, 84] }}
      onCreated={({ scene, gl }) => {
        scene.fog = new THREE.Fog(DAYLIGHT.morning.fog, 130, 330)
        gl.setClearColor(DAYLIGHT.morning.horizon)
      }}
    >
      <Suspense fallback={null}>
        <ScrollCamera profile={profile} />
        <WorldLighting profile={profile} />
        <WorldEnvironment profile={profile} />
        <IslandArrival />
        <StudioZone />
        <AttentionDistrict />
        <CreatorVillage />
        <AutomationWorkshop />
        <ContactZone fireflies={profile.mobile ? 14 : 28} />
        <Effects profile={profile} />
        <Ready />
      </Suspense>
    </Canvas>
  )
}
