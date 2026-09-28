'use client'

import { useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { glow, screen as screenMaterial, toon } from '@/lib/materials'
import { PALETTE } from '@/lib/scene-config'

/**
 * A small machine of the workshop: a rounded cabinet, a screen, a lamp.
 * It arrives from above and settles into place as `assemble(progress)`
 * goes 0 → 1; once in place its lamp comes on.
 */
export function DataModule({
  color = PALETTE.roofTeal,
  size = [1.6, 1.5, 1.3] as [number, number, number],
  assemble,
  screen: screenTexture,
  ...group
}: {
  color?: string
  size?: [number, number, number]
  assemble: (p: number) => number
  /** what the module's screen shows */
  screen?: THREE.Texture
} & ThreeElements['group']) {
  const body = useRef<THREE.Group>(null)
  const dial = useRef<THREE.Mesh>(null)
  const display = useMemo(() => (screenTexture ? screenMaterial(screenTexture) : null), [screenTexture])
  const lamp = useMemo(() => glow(PALETTE.woodDark), [])
  const off = useMemo(() => new THREE.Color(PALETTE.woodDark), [])
  const on = useMemo(() => new THREE.Color(PALETTE.lamp).multiplyScalar(1.6), [])
  const [w, h, d] = size

  useFrame((_, dt) => {
    const k = assemble(experience.smooth)
    if (body.current) {
      // falls in with a small overshoot, a quarter turn settling
      const e = 1 - Math.pow(1 - k, 3)
      body.current.position.y = (1 - e) * 5
      body.current.rotation.y = (1 - e) * 1.2
      body.current.scale.setScalar(0.6 + 0.4 * e)
    }
    const ready = THREE.MathUtils.clamp((k - 0.85) / 0.15, 0, 1)
    lamp.emissive.lerpColors(off, on, ready)
    if (dial.current && !experience.reducedMotion) dial.current.rotation.z -= dt * 2.4 * ready
  })

  return (
    <group {...group}>
      <group ref={body}>
        <RoundedBox args={[w, h, d]} radius={0.18} smoothness={3} position={[0, h / 2, 0]} material={toon(color)} castShadow receiveShadow />
        <RoundedBox args={[w * 0.86, h * 0.5, 0.08]} radius={0.04} position={[0, h * 0.58, d / 2 + 0.02]} material={toon(PALETTE.woodDark)} />
        {display ? (
          <mesh position={[0, h * 0.58, d / 2 + 0.065]} material={display}>
            <planeGeometry args={[w * 0.8, w * 0.4]} />
          </mesh>
        ) : (
          <mesh ref={dial} position={[-w * 0.18, h * 0.58, d / 2 + 0.08]} material={toon(PALETTE.ink)}>
            <boxGeometry args={[0.36, 0.05, 0.02]} />
          </mesh>
        )}
        <mesh position={[w * 0.36, h * 0.18, d / 2 + 0.03]} material={lamp}>
          <sphereGeometry args={[0.09, 12, 10]} />
        </mesh>
        <RoundedBox args={[w * 0.9, 0.14, d * 0.9]} radius={0.05} position={[0, h + 0.05, 0]} material={toon(PALETTE.wall)} />
      </group>
    </group>
  )
}
