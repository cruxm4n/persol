'use client'

import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { projectAnchors } from '@/lib/anchors'
import { SIGNAL_INTRO, SIGNAL_PATH, makeSampler, type CameraSample } from '@/lib/camera-paths'
import { experience } from '@/lib/experience-store'
import { CAMERA_DAMPING } from '@/lib/motion-config'
import type { Profile } from '@/lib/responsive-config'

/** Shared with the effects: how strong the miniature (tilt-shift) look is now. */
export const lens = { miniature: 0 }

/**
 * The camera never answers the reader directly: it follows the act's
 * progress along an authored path, damped, so a flick of the wheel becomes a
 * travelling shot. The pointer only leans it a fraction of a degree.
 */
export function ExperienceCamera({ profile }: { profile: Profile }) {
  const { camera, size } = useThree()
  const sample = useMemo(() => makeSampler(SIGNAL_PATH), [])
  const s = useMemo<CameraSample>(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 30, miniature: 0 }), [])
  const intro = useMemo(() => new THREE.Vector3(...SIGNAL_INTRO.pos), [])
  const lean = useMemo(() => ({ x: 0, y: 0 }), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const rate = experience.reducedMotion ? 40 : CAMERA_DAMPING
    const a = experience.actsSmooth
    for (let i = 0; i < a.length; i++) a[i] = THREE.MathUtils.damp(a[i], experience.acts[i], rate, dt)

    sample(a[0], s)
    // the opening sequence starts closer and settles on the first key
    const k = experience.intro
    if (k < 1) s.pos.lerp(intro, 1 - k)

    // a fraction of a degree towards the pointer: the model feels held, not moved
    if (!experience.reducedMotion && !profile.mobile) {
      lean.x = THREE.MathUtils.damp(lean.x, experience.pointerX, 2, dt)
      lean.y = THREE.MathUtils.damp(lean.y, experience.pointerY, 2, dt)
      s.target.x += lean.x * 0.25
      s.target.y -= lean.y * 0.15
    }

    camera.position.copy(s.pos)
    camera.lookAt(s.target)
    const cam = camera as THREE.PerspectiveCamera
    const fov = Math.min(80, s.fov * profile.fovScale)
    if (Math.abs(cam.fov - fov) > 1e-3) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
    lens.miniature = s.miniature
    projectAnchors(camera, size.width, size.height)
  })

  return null
}
