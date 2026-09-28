'use client'

import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, SoftShadows } from '@react-three/drei'
import { EffectComposer, Noise, TiltShift2, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import type { TiltShiftEffect } from '@react-three/postprocessing'
import * as THREE from 'three'
import { setUi } from '@/lib/experience-store'
import type { Profile } from '@/lib/responsive-config'
import { COLORS } from '@/lib/scene-config'
import { Act01Signal } from './Act01Signal'
import { ExperienceCamera, lens } from './ExperienceCamera'

function Ready() {
  useEffect(() => {
    // two frames: the first compiles shaders, the second is what the reader sees
    let a = 0
    let b = 0
    a = requestAnimationFrame(() => (b = requestAnimationFrame(() => setUi({ ready: true }))))
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [])
  return null
}

/** Tilt-shift follows the camera path: sharp on the poster, a miniature once revealed. */
function Effects({ profile }: { profile: Profile }) {
  const tilt = useRef<TiltShiftEffect>(null)
  useFrame(() => {
    if (tilt.current) tilt.current.blur = 0.02 + 0.2 * lens.miniature
  })
  return (
    <EffectComposer multisampling={profile.mobile ? 0 : 4}>
      <TiltShift2 ref={tilt} blur={0.02} taper={0.6} start={[0.5, 0.2]} end={[0.5, 0.8]} samples={profile.mobile ? 6 : 10} />
      <Noise opacity={0.045} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
      <Vignette offset={0.28} darkness={0.62} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}

export default function Stage({ profile }: { profile: Profile }) {
  return (
    <Canvas
      className="stage-canvas"
      dpr={profile.dpr}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 0.2, far: 400, position: [0, 9, 9] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(COLORS.night)
        scene.background = new THREE.Color(COLORS.night)
        scene.fog = new THREE.Fog(COLORS.night, 70, 170)
      }}
      aria-hidden="true"
    >
      {profile.softShadows && <SoftShadows size={22} samples={8} focus={0.7} />}
      <Suspense fallback={null}>
        <ExperienceCamera profile={profile} />
        <Act01Signal profile={profile} />
        {/* soft studio reflections on the metal, kept low so the room stays dark */}
        <Environment resolution={128} environmentIntensity={0.22}>
          <Lightformer intensity={2} position={[-8, 10, 6]} scale={[12, 4, 1]} />
          <Lightformer intensity={0.8} position={[10, 4, -6]} scale={[8, 8, 1]} />
        </Environment>
        <Effects profile={profile} />
        <Ready />
      </Suspense>
    </Canvas>
  )
}
