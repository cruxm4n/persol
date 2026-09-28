'use client'

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { PALETTE } from '@/lib/scene-config'
import { day } from './WorldLighting'

const DIM = new THREE.Color(PALETTE.lamp).multiplyScalar(0.42)
const LIT = new THREE.Color('#ffe2b0').multiplyScalar(1.5)

/**
 * A window or lamp glass that lights up when its place wakes (`on(progress)`)
 * and, whatever happens, as the evening comes.
 */
export function useGlow(on: (p: number) => number = () => 0) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: DIM.clone(), toneMapped: false }), [])
  useFrame(() => {
    const k = Math.max(on(experience.smooth), day.t * 0.9)
    mat.color.lerpColors(DIM, LIT, k)
  })
  return mat
}
