'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { wind } from '@/lib/materials'
import type { Profile } from '@/lib/responsive-config'
import { DAYLIGHT } from '@/lib/scene-config'
import { daylight } from '../camera/CameraTransitions'

/**
 * The time of day, shared by the sky, the sea, the fog and the lights.
 * It follows the walk: morning at the dock, golden light at the workshop,
 * sunset on the quay. Computed once per frame, before anything reads it.
 */
export const day = {
  t: 0,
  zenith: new THREE.Color(),
  horizon: new THREE.Color(),
  sun: new THREE.Color(),
  fog: new THREE.Color(),
  sunDir: new THREE.Vector3(),
}

const M = DAYLIGHT.morning
const S = DAYLIGHT.sunset
const colors = {
  zenith: [new THREE.Color(M.zenith), new THREE.Color(S.zenith)],
  horizon: [new THREE.Color(M.horizon), new THREE.Color(S.horizon)],
  sun: [new THREE.Color(M.sun), new THREE.Color(S.sun)],
  fog: [new THREE.Color(M.fog), new THREE.Color(S.fog)],
}
// morning: high in the south-east; sunset: low in the north, where the quay looks
const SUN_MORNING = new THREE.Vector3(0.55, 0.72, 0.42).normalize()
const SUN_SUNSET = new THREE.Vector3(0.08, 0.1, -1).normalize()

export function WorldLighting({ profile }: { profile: Profile }) {
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const { scene } = useThree()
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(0, 0, -2)
    return o
  }, [])

  // priority −1: runs before the sky, the sea and the places read `day`
  useFrame((_, delta) => {
    if (!experience.reducedMotion) wind.uTime.value += Math.min(delta, 0.05)
    const t = daylight(experience.smooth)
    day.t = t
    day.zenith.lerpColors(colors.zenith[0], colors.zenith[1], t)
    day.horizon.lerpColors(colors.horizon[0], colors.horizon[1], t)
    day.sun.lerpColors(colors.sun[0], colors.sun[1], t)
    day.fog.lerpColors(colors.fog[0], colors.fog[1], t)
    day.sunDir.copy(SUN_MORNING).lerp(SUN_SUNSET, t).normalize()

    if (scene.fog) (scene.fog as THREE.Fog).color.copy(day.fog)
    if (sun.current) {
      sun.current.position.copy(target.position).addScaledVector(day.sunDir, 70)
      sun.current.color.copy(day.sun)
      sun.current.intensity = M.sunIntensity + (S.sunIntensity - M.sunIntensity) * t
    }
    if (hemi.current) {
      hemi.current.intensity = M.hemi + (S.hemi - M.hemi) * t
      hemi.current.color.copy(day.zenith).lerp(day.horizon, 0.4)
    }
  }, -1)

  const size = profile.shadowMapSize
  return (
    <>
      <primitive object={target} />
      <hemisphereLight ref={hemi} args={['#cfe3e8', '#b9a98a', 1.1]} />
      <directionalLight
        ref={sun}
        target={target}
        castShadow={profile.shadows}
        shadow-mapSize={[size, size]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-camera-near={1}
        shadow-camera-far={160}
      />
    </>
  )
}
