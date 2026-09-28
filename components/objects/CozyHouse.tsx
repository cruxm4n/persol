'use client'

import { useMemo, type ReactNode } from 'react'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from '@/lib/scene-config'
import { glow, surfaceMaterial, toon } from '@/lib/materials'

/** A gable roof: a triangular prism along x, with a little overhang. */
function roofGeometry(w: number, d: number, h: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-d / 2, 0)
  shape.lineTo(0, h)
  shape.lineTo(d / 2, 0)
  shape.lineTo(-d / 2, 0)
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: w,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 2,
  })
  // extruded along z: turn it so the ridge runs along x, centred
  g.translate(0, 0, -w / 2)
  g.rotateY(Math.PI / 2)
  return g
}

/**
 * A small rounded house: walls, a gable roof, a door, two windows that can
 * glow. Its front faces +z. Windows use `windowMaterial` when given, so a
 * place can light them up frame by frame as the camera arrives.
 */
export function CozyHouse({
  w = 4,
  d = 3.4,
  h = 2.6,
  roof = PALETTE.roof,
  wall = PALETTE.wall,
  windowMaterial,
  chimney = false,
  children,
  ...group
}: {
  w?: number
  d?: number
  h?: number
  roof?: string
  wall?: string
  windowMaterial?: THREE.Material
  chimney?: boolean
  children?: ReactNode
} & ThreeElements['group']) {
  const roofGeo = useMemo(() => roofGeometry(w + 0.5, d + 0.7, h * 0.62), [w, d, h])
  const roofMat = surfaceMaterial('roof', roof)
  const unlit = useMemo(() => glow(PALETTE.lamp, 0.55), [])
  const windowMat = windowMaterial ?? unlit
  return (
    <group {...group}>
      <RoundedBox args={[w, h, d]} radius={0.22} smoothness={3} position={[0, h / 2, 0]} castShadow receiveShadow material={toon(wall)} />
      <mesh geometry={roofGeo} position={[0, h - 0.02, 0]} material={roofMat} castShadow receiveShadow />
      {/* door and windows on the front */}
      <RoundedBox args={[0.9, 1.6, 0.14]} radius={0.06} position={[-w * 0.18, 0.8, d / 2 + 0.02]} material={toon(PALETTE.woodDark)} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s < 0 ? -w * 0.18 : w * 0.24, s < 0 ? h * 0.8 : h * 0.55, d / 2 + 0.03]} material={windowMat}>
          <planeGeometry args={s < 0 ? [0.5, 0.35] : [0.9, 0.8]} />
        </mesh>
      ))}
      {/* window frames */}
      <RoundedBox args={[1.08, 0.98, 0.1]} radius={0.04} position={[w * 0.24, h * 0.55, d / 2 - 0.01]} material={toon(PALETTE.wood)} />
      {chimney && (
        <RoundedBox args={[0.55, 1.4, 0.55]} radius={0.08} position={[w * 0.28, h + 0.7, -d * 0.15]} material={toon(PALETTE.stone)} castShadow />
      )}
      {children}
    </group>
  )
}
