'use client'

import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DESKTOP_PATH, PORTRAIT_PATH } from '@/lib/camera-paths'
import { experience } from '@/lib/experience-store'
import { CAMERA_DAMPING } from '@/lib/motion-config'
import type { Profile } from '@/lib/responsive-config'
import { makeSampler, type CameraSample } from './CameraPath'

/** Shared with the effects: how much depth of field the current shot wants. */
export const lens = { blur: 0 }

/**
 * The camera answers only the scroll: it follows the authored path, damped,
 * so a flick of the wheel or the finger becomes a travelling shot. Nothing
 * else moves it — no pointer, no keys, no drag.
 */
export function ScrollCamera({ profile }: { profile: Profile }) {
  const { camera } = useThree()
  const sample = useMemo(() => makeSampler(profile.portrait ? PORTRAIT_PATH : DESKTOP_PATH), [profile.portrait])
  const s = useMemo<CameraSample>(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 36, blur: 0 }), [])
  const rise = useMemo(() => new THREE.Vector3(0, 26, 30), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const rate = experience.reducedMotion ? 40 : CAMERA_DAMPING
    experience.smooth = THREE.MathUtils.damp(experience.smooth, experience.progress, rate, dt)
    sample(experience.smooth, s)

    // the opening: the camera settles from higher up as the island appears
    const k = experience.intro
    if (k < 1) s.pos.addScaledVector(rise, 1 - k)

    camera.position.copy(s.pos)
    camera.lookAt(s.target)
    const cam = camera as THREE.PerspectiveCamera
    if (Math.abs(cam.fov - s.fov) > 1e-3) {
      cam.fov = s.fov
      cam.updateProjectionMatrix()
    }
    lens.blur = s.blur
  })

  return null
}
