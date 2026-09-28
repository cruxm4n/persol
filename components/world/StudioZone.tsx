'use client'

import { useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { surfaceMaterial, toon } from '@/lib/materials'
import { stats } from '@/lib/portfolio-data'
import { shopSign } from '@/lib/signage'
import { GROUND, PALETTE, ZONES } from '@/lib/scene-config'
import { assetPath } from '@/lib/asset-manifest'
import { wake } from '../camera/CameraTransitions'
import { CozyHouse } from '../objects/CozyHouse'
import { useImageTexture } from '../objects/PosterWall'
import { useGlow } from './useGlow'

const at = ZONES.find((z) => z.id === 'studio')!.at

/** Smoke from the chimney: a few puffs rising, growing, fading, on a loop. */
export function Smoke({ position }: { position: [number, number, number] }) {
  const puffs = useRef<(THREE.Mesh | null)[]>([])
  const mats = useMemo(() => [0, 1, 2, 3].map(() => new THREE.MeshToonMaterial({ color: PALETTE.cloud, transparent: true })), [])
  useFrame(({ clock }) => {
    const t = experience.reducedMotion ? 0.3 : clock.elapsedTime
    puffs.current.forEach((m, i) => {
      if (!m) return
      const k = (t * 0.22 + i / 4) % 1
      m.position.set(Math.sin(k * 3 + i) * 0.25 + k * 0.6, k * 2.6, 0)
      m.scale.setScalar(0.25 + k * 0.55)
      mats[i].opacity = Math.sin(k * Math.PI) * 0.85
    })
  })
  return (
    <group position={position}>
      {mats.map((m, i) => (
        <mesh key={i} ref={(el) => void (puffs.current[i] = el)} material={m}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  )
}

/** A painter's easel holding a canvas. */
function Easel({ image, ...props }: { image?: string } & ThreeElements['group']) {
  const tex = useImageTexture(image, 'Studio')
  const face = useMemo(() => new THREE.MeshToonMaterial({ map: tex }), [tex])
  return (
    <group {...props}>
      {[
        [-0.45, 0.12],
        [0.45, 0.12],
      ].map(([x, r], i) => (
        <mesh key={i} position={[x, 1.1, 0]} rotation-z={x < 0 ? r : -r} material={toon(PALETTE.wood)} castShadow>
          <boxGeometry args={[0.08, 2.3, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, 1.05, -0.45]} rotation-x={-0.35} material={toon(PALETTE.wood)} castShadow>
        <boxGeometry args={[0.08, 2.2, 0.08]} />
      </mesh>
      <mesh position={[0, 0.95, 0.06]} material={toon(PALETTE.woodDark)}>
        <boxGeometry args={[1.3, 0.08, 0.2]} />
      </mesh>
      <RoundedBox args={[1.24, 1.6, 0.07]} radius={0.02} position={[0, 1.8, 0.09]} rotation-x={-0.08} material={toon(PALETTE.wall)} castShadow />
      <mesh position={[0, 1.8, 0.13]} rotation-x={-0.08} material={face}>
        <planeGeometry args={[1.14, 1.5]} />
      </mesh>
    </group>
  )
}

/** A camera on its tripod: the studio also shoots. */
function Tripod(props: ThreeElements['group']) {
  return (
    <group {...props}>
      {[0, 2.1, 4.2].map((a) => (
        <mesh key={a} position={[Math.sin(a) * 0.32, 0.72, Math.cos(a) * 0.32]} rotation={[Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4]} material={toon(PALETTE.ink)} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.55, 6]} />
        </mesh>
      ))}
      <RoundedBox args={[0.55, 0.38, 0.32]} radius={0.06} position={[0, 1.6, 0]} material={toon(PALETTE.ink)} castShadow />
      <mesh position={[0, 1.6, 0.26]} rotation-x={Math.PI / 2} material={toon('#46434d')}>
        <cylinderGeometry args={[0.12, 0.14, 0.24, 14]} />
      </mesh>
    </group>
  )
}

/** The studio's sign on two posts: since when it has been open. */
function ShopSign(props: ThreeElements['group']) {
  const face = useMemo(() => new THREE.MeshToonMaterial({ map: shopSign(stats.since.value, stats.since.label) }), [])
  const W = 2.8
  const H = W * 0.35
  return (
    <group {...props}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 0.1), 0.95, -0.05]} material={toon(PALETTE.woodDark)} castShadow>
          <boxGeometry args={[0.14, 1.9, 0.14]} />
        </mesh>
      ))}
      <RoundedBox args={[W + 0.16, H + 0.16, 0.12]} radius={0.05} position={[0, 1.55, 0.04]} material={toon(PALETTE.woodDark)} castShadow />
      <mesh position={[0, 1.55, 0.105]} material={face}>
        <planeGeometry args={[W, H]} />
      </mesh>
    </group>
  )
}

/** A mailbox by the door. */
function Mailbox(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh position={[0, 0.55, 0]} material={toon(PALETTE.woodDark)} castShadow>
        <boxGeometry args={[0.12, 1.1, 0.12]} />
      </mesh>
      <group position={[0, 1.25, 0]}>
        <RoundedBox args={[0.5, 0.45, 0.75]} radius={0.16} smoothness={4} material={toon(PALETTE.roofTeal)} castShadow />
        <mesh position={[0.28, 0.12, -0.1]} rotation-z={-0.9} material={toon(PALETTE.roofSand)}>
          <boxGeometry args={[0.04, 0.34, 0.1]} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Zone 02 — the studio: where Louis works. A house with its lights coming
 * on as the camera arrives, an easel, a camera, a bench, a mailbox, and its
 * sign: open since 2018.
 */
export function StudioZone() {
  const glow = useGlow((p) => wake(p, 'studio'))
  return (
    <group position={[at[0], GROUND.grass, at[2]]} rotation-y={0.75}>
      <CozyHouse w={5} d={4} h={2.8} windowMaterial={glow} chimney />
      <Smoke position={[1.4, 4.4, -0.6]} />
      <Easel image={assetPath('poster-b')} position={[-4.2, 0, 1.6]} rotation-y={0.5} />
      <Tripod position={[-2.6, 0, 3.2]} rotation-y={0.3} />
      {/* bench on the terrace */}
      <group position={[0.9, 0, 3.1]}>
        <RoundedBox args={[1.9, 0.12, 0.5]} radius={0.04} position={[0, 0.5, 0]} material={surfaceMaterial('planks', PALETTE.wood, [0.5, 0.5])} castShadow />
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 0.25, 0]} material={toon(PALETTE.woodDark)}>
            <boxGeometry args={[0.1, 0.5, 0.42]} />
          </mesh>
        ))}
      </group>
      <Mailbox position={[2.9, 0, 2.4]} />
      <ShopSign position={[1.2, 0, 4.2]} rotation-y={-0.12} />
    </group>
  )
}
