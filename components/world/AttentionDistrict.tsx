'use client'

import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { assetPath } from '@/lib/asset-manifest'
import { stats } from '@/lib/portfolio-data'
import { figurePoster } from '@/lib/signage'
import { span } from '@/lib/motion-config'
import { print, toon } from '@/lib/materials'
import { GROUND, PALETTE, ZONES } from '@/lib/scene-config'
import { PosterWall, useImageTexture } from '../objects/PosterWall'

const zone = ZONES.find((z) => z.id === 'attention')!
const [start] = zone.range

type Poster = { x: number; z: number; w: number; h: number; label: string; image?: string; figure?: [string, string, 'sage' | 'terracotta'] }

/** The street's posters: two of them carry the campaign figures. */
const POSTERS: Poster[] = [
  { x: -3.5, z: 0.7, w: 2.2, h: 2.9, label: 'Budget', figure: [stats.budget.value, stats.budget.label, 'terracotta'] },
  { x: 0, z: 0, w: 2.7, h: 3.6, label: 'Campagnes', figure: [stats.campaigns.value, stats.campaigns.label, 'sage'] },
  { x: 3.5, z: 0.7, w: 2.2, h: 2.9, label: 'Affiche', image: assetPath('poster-a') },
]

/** Canvas stripes for the market awning. */
function stripes() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const ctx = c.getContext('2d')!
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? PALETTE.wall : PALETTE.roofSage
    ctx.fillRect(i * 32, 0, 32, 64)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** An advertising column, wrapped with a poster. */
function Column(props: ThreeElements['group']) {
  const tex = useImageTexture(assetPath('poster-c'), 'Colonne')
  const wrap = useMemo(() => {
    tex.wrapS = THREE.RepeatWrapping
    tex.repeat.set(3, 1)
    tex.needsUpdate = true
    return print(tex)
  }, [tex])
  return (
    <group {...props}>
      <mesh position={[0, 0.2, 0]} material={toon(PALETTE.woodDark)} castShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.4, 20]} />
      </mesh>
      <mesh position={[0, 1.9, 0]} material={wrap} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 3, 24, 1, true]} />
      </mesh>
      <mesh position={[0, 3.5, 0]} material={toon(PALETTE.roofSage)} castShadow>
        <sphereGeometry args={[0.95, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 3.45, 0]} material={toon(PALETTE.woodDark)}>
        <cylinderGeometry args={[0.97, 0.97, 0.14, 20]} />
      </mesh>
    </group>
  )
}

/** A market stall with a striped awning. */
function Stall(props: ThreeElements['group']) {
  const awning = useMemo(() => print(stripes()), [])
  return (
    <group {...props}>
      <RoundedBox args={[2.6, 1, 1.1]} radius={0.08} position={[0, 0.5, 0]} material={toon(PALETTE.wallWarm)} castShadow receiveShadow />
      <RoundedBox args={[2.8, 0.12, 1.3]} radius={0.04} position={[0, 1.04, 0]} material={toon(PALETTE.wood)} />
      {[-1.25, 1.25].map((x) =>
        [-0.45, 0.45].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.5, z]} material={toon(PALETTE.woodDark)} castShadow>
            <boxGeometry args={[0.09, 3, 0.09]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 2.85, 0.35]} rotation-x={-0.35} material={awning} castShadow>
        <boxGeometry args={[3, 0.06, 1.7]} />
      </mesh>
      {/* crates of print on the counter */}
      {[-0.8, 0, 0.75].map((x, i) => (
        <RoundedBox key={x} args={[0.6, 0.3 + i * 0.08, 0.5]} radius={0.04} position={[x, 1.25 + i * 0.04, 0]} material={toon([PALETTE.roof, PALETTE.lagoon, PALETTE.roofSand][i])} castShadow />
      ))}
    </group>
  )
}

/** Paper bunting between the posters: triangles on a sagging string. */
function Bunting({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const flags = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const n = 11
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n
      const p = a.clone().lerp(b, t)
      p.y -= Math.sin(t * Math.PI) * 0.5
      return { p, color: [PALETTE.roof, PALETTE.wall, PALETTE.lagoon, PALETTE.roofSand][i % 4] }
    })
  }, [from, to])
  const tri = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.2, 0, 0, 0.2, 0, 0, 0, -0.42, 0], 3))
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <group>
      {flags.map((f, i) => (
        <mesh key={i} geometry={tri} position={f.p} material={toon(f.color, { side: THREE.DoubleSide })} />
      ))}
    </group>
  )
}

/**
 * Zone 03 — the poster street. Its posters stand turned away and swing round
 * one after the other as the camera walks in: the middle one prints the
 * campaigns, the left one the budget managed. A column, a stall, bunting.
 */
export function AttentionDistrict() {
  const figures = useMemo(() => POSTERS.map((p) => (p.figure ? figurePoster(...p.figure) : undefined)), [])
  return (
    <group position={[zone.at[0], GROUND.grass, zone.at[2]]} rotation-y={-0.86}>
      {POSTERS.map((p, i) => (
        <PosterWall
          key={p.label}
          position={[p.x, 0, p.z]}
          w={p.w}
          h={p.h}
          image={p.image}
          map={p.figure ? figures[i] : undefined}
          label={p.label}
          turn={(pr) => span(pr, start + 0.004 + i * 0.007, start + 0.022 + i * 0.007)}
        />
      ))}
      <Bunting from={[-3.5, 5.3, 0.7]} to={[3.5, 5.3, 0.7]} />
      <Column position={[6.6, 0, 1.4]} />
      <Stall position={[-7, 0, 1.6]} rotation-y={0.25} />
    </group>
  )
}
