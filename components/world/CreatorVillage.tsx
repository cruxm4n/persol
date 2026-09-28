'use client'

import { useMemo, useRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { span } from '@/lib/motion-config'
import { toon, windy } from '@/lib/materials'
import { stats } from '@/lib/portfolio-data'
import { clothBanner } from '@/lib/signage'
import { GROUND, PALETTE, ZONES } from '@/lib/scene-config'
import { CozyHouse } from '../objects/CozyHouse'
import { CreatorNetwork } from '../objects/CreatorNetwork'
import { wake } from '../camera/CameraTransitions'
import { useGlow } from './useGlow'

const zone = ZONES.find((z) => z.id === 'community')!

/** Houses round the plaza; the east side stays open onto the path. */
const RING = 6.2
const HOUSES = [
  { a: 62, roof: PALETTE.roof },
  { a: 112, roof: PALETTE.roofSage },
  { a: 160, roof: PALETTE.roofSand },
  { a: 208, roof: PALETTE.roofTeal },
  { a: 256, roof: PALETTE.roof },
  { a: 304, roof: PALETTE.roofSage },
].map((h) => {
  const t = (h.a * Math.PI) / 180
  const x = Math.cos(t) * RING
  const z = Math.sin(t) * RING
  // front (+z) turned towards the plaza
  return { ...h, x, z, ry: Math.atan2(-x, -z) }
})
const HOUSE = { w: 2.6, d: 2.3, h: 2 }
const HUB: [number, number, number] = [0, 5.4, 0]
const PEAKS = HOUSES.map((h) => [h.x, HOUSE.h + HOUSE.h * 0.62 + 0.05, h.z] as [number, number, number])

/** A cloth banner on two poles at the entrance of the square, stirring in the wind. */
function Banner(props: ThreeElements['group']) {
  const cloth = useRef<THREE.Mesh>(null)
  const face = useMemo(
    () => new THREE.MeshToonMaterial({ map: clothBanner(stats.clients.value, stats.clients.label), side: THREE.DoubleSide }),
    [],
  )
  useFrame(({ clock }) => {
    if (cloth.current && !experience.reducedMotion) cloth.current.rotation.x = Math.sin(clock.elapsedTime * 1.4) * 0.06
  })
  const W = 3.6
  return (
    <group {...props}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 + 0.1), 2, 0]} material={toon(PALETTE.woodDark)} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 4, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 3.85, 0]} rotation-z={Math.PI / 2} material={toon(PALETTE.woodDark)}>
        <cylinderGeometry args={[0.04, 0.04, W + 0.3, 6]} />
      </mesh>
      <group position={[0, 3.85, 0]}>
        <mesh ref={cloth} position={[0, -0.62, 0]} material={face} castShadow>
          <planeGeometry args={[W, W / 3]} />
        </mesh>
      </group>
    </group>
  )
}

/** Small round figures on the plaza: the communities, gently bobbing. */
function Figures() {
  const refs = useRef<(THREE.Group | null)[]>([])
  const people = useMemo(
    () =>
      [
        [2.4, 1.2, PALETTE.roof],
        [-1.6, 2.5, PALETTE.roofTeal],
        [-2.8, -1.1, PALETTE.roofSand],
        [0.6, -2.9, PALETTE.roofSage],
        [2.9, -1.6, PALETTE.wallWarm],
      ] as [number, number, string][],
    [],
  )
  useFrame(({ clock }) => {
    const t = experience.reducedMotion ? 0 : clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (!g) return
      g.position.y = Math.abs(Math.sin(t * 2.2 + i * 1.3)) * 0.12
      g.rotation.y = Math.atan2(-people[i][0], -people[i][1]) + Math.sin(t * 0.6 + i) * 0.3
    })
  })
  return (
    <>
      {people.map(([x, z, c], i) => (
        <group key={i} position={[x, 0, z]}>
          <group ref={(el) => void (refs.current[i] = el)}>
            <mesh position={[0, 0.55, 0]} material={toon(c)} castShadow>
              <capsuleGeometry args={[0.28, 0.5, 4, 10]} />
            </mesh>
            <mesh position={[0, 1.22, 0]} material={toon(PALETTE.wallWarm)} castShadow>
              <sphereGeometry args={[0.24, 14, 12]} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  )
}

/** The big tree in the middle of the plaza, the lights hanging from its top. */
function PlazaTree() {
  return (
    <group>
      <mesh position={[0, 1.4, 0]} material={toon(PALETTE.trunk)} castShadow>
        <cylinderGeometry args={[0.28, 0.45, 2.8, 9]} />
      </mesh>
      {[
        [0, 3.6, 0, 1.9],
        [1.1, 3.1, 0.5, 1.2],
        [-1, 3.3, -0.4, 1.3],
        [0.2, 4.6, -0.2, 1.2],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={[s, s * 0.9, s]} material={windy(i % 2 ? PALETTE.leafLight : PALETTE.leaf, 0.4)} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Zone 04 — the village: a square, every house a community. String lights
 * run from the tree in the middle to each roof, drawn out one by one as the
 * camera arrives; a banner at the entrance carries the clients.
 */
export function CreatorVillage() {
  const glow = useGlow((p) => wake(p, 'community'))
  const [r0] = zone.range
  const trace = useMemo(() => (p: number) => span(p, r0 + 0.01, zone.hold[0] + 0.06), [r0])
  return (
    <group position={[zone.at[0], GROUND.grass, zone.at[2]]}>
      <mesh position={[0, 0.04, 0]} material={toon(PALETTE.stone)} receiveShadow>
        <cylinderGeometry args={[4, 4.1, 0.1, 40]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation-x={-Math.PI / 2} material={toon('#dcd3c3')} receiveShadow>
        <ringGeometry args={[1.2, 1.5, 32]} />
      </mesh>
      <PlazaTree />
      {HOUSES.map((h, i) => (
        <CozyHouse key={i} position={[h.x, 0, h.z]} rotation-y={h.ry} w={HOUSE.w} d={HOUSE.d} h={HOUSE.h} roof={h.roof} windowMaterial={glow} />
      ))}
      <CreatorNetwork hub={HUB} ends={PEAKS} progress={trace} />
      <Figures />
      <Banner position={[5.2, 0, 1.2]} rotation-y={0.86} />
    </group>
  )
}
