'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  distanceToCamera,
  distanceToPath,
  distanceToPlaces,
  islandDistance,
  scatter,
} from '@/lib/island'
import { toon, windy } from '@/lib/materials'
import type { Profile } from '@/lib/responsive-config'
import { GROUND, PALETTE } from '@/lib/scene-config'

type Item = { position: [number, number, number]; scale: [number, number, number]; rotation?: number; color?: string }

/** One instanced mesh from a list of placements (optionally one colour each). */
export function Instances({
  items,
  geometry,
  material,
  castShadow = true,
}: {
  items: Item[]
  geometry: THREE.BufferGeometry
  material: THREE.Material
  castShadow?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, it.rotation ?? 0)
      m.compose(new THREE.Vector3(...it.position), q, new THREE.Vector3(...it.scale))
      mesh.setMatrixAt(i, m)
      if (it.color) mesh.setColorAt(i, c.set(it.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow frustumCulled={false} />
}

const LEAVES = [PALETTE.leaf, PALETTE.leafLight, PALETTE.leafDeep, '#9dbb7c']
const FLOWERS = ['#fbf4e6', '#f0c98f', '#f2b7a0', '#c9b8dc', '#fbf4e6']

/**
 * The island's vegetation: round trees, a few tall cypresses, bushes along
 * the path, flowers and grass tufts. All instanced, all swaying a little,
 * and never where the path, a place or the camera needs the room.
 */
export function Forest({ profile }: { profile: Profile }) {
  const G = GROUND.grass
  const k = profile.density

  const geo = useMemo(
    () => ({
      trunk: new THREE.CylinderGeometry(0.14, 0.24, 1.6, 7).translate(0, 0.8, 0),
      crown: new THREE.IcosahedronGeometry(1.2, 1),
      cypress: new THREE.CapsuleGeometry(0.5, 1.9, 4, 8).translate(0, 1.9, 0),
      bush: new THREE.IcosahedronGeometry(0.62, 1),
      flower: new THREE.IcosahedronGeometry(0.11, 0),
      tuft: new THREE.ConeGeometry(0.07, 0.5, 4).translate(0, 0.25, 0),
      rock: new THREE.DodecahedronGeometry(0.6, 0),
    }),
    [],
  )

  const layout = useMemo(() => {
    const clear = (x: number, z: number, path: number, cam: number) =>
      distanceToPath(x, z) > path && distanceToPlaces(x, z) > 0 && distanceToCamera(x, z) > cam

    const trees = scatter(Math.round(52 * k), 11, (x, z) => islandDistance(x, z) < 0.88 && clear(x, z, 2.6, 4.2))
    const cypresses = scatter(Math.round(16 * k), 23, (x, z) => islandDistance(x, z) < 0.86 && clear(x, z, 2.4, 4))
    const bushes = scatter(Math.round(70 * k), 37, (x, z) => {
      const d = distanceToPath(x, z)
      return d > 1.3 && d < 4.5 && distanceToPlaces(x, z) > -1.5 && distanceToCamera(x, z) > 2
    })
    const flowers = scatter(Math.round(320 * k), 41, (x, z) => {
      const d = distanceToPath(x, z)
      return d > 1.05 && d < 3.6 && distanceToPlaces(x, z) > -2
    })
    const tufts = scatter(Math.round(420 * k), 53, (x, z) => islandDistance(x, z) < 0.95 && distanceToPath(x, z) > 1.1)

    const trunk: Item[] = []
    const crowns: Item[] = []
    trees.forEach(({ x, z, r }) => {
      const s = 0.8 + r() * 0.65
      trunk.push({ position: [x, G, z], scale: [s, s, s], rotation: r() * 6 })
      const leaf = LEAVES[Math.floor(r() * LEAVES.length)]
      crowns.push({ position: [x, G + 2.2 * s, z], scale: [s, s * 0.92, s], rotation: r() * 6, color: leaf })
      crowns.push({
        position: [x + (r() - 0.5) * 1.1 * s, G + 3.1 * s, z + (r() - 0.5) * 1.1 * s],
        scale: [s * 0.68, s * 0.64, s * 0.68],
        rotation: r() * 6,
        color: LEAVES[Math.floor(r() * LEAVES.length)],
      })
    })
    const cyp: Item[] = cypresses.map(({ x, z, r }) => {
      const s = 0.8 + r() * 0.5
      return { position: [x, G, z], scale: [s, s * (1 + r() * 0.4), s], color: r() > 0.5 ? PALETTE.leafDeep : '#7f9f68' }
    })
    const bush: Item[] = bushes.map(({ x, z, r }) => {
      const s = 0.7 + r() * 0.7
      return { position: [x, G + 0.25 * s, z], scale: [s * 1.2, s * 0.8, s], rotation: r() * 6, color: LEAVES[Math.floor(r() * LEAVES.length)] }
    })
    const flower: Item[] = flowers.map(({ x, z, r }) => ({
      position: [x, G + 0.14, z],
      scale: [1, 1, 1],
      color: FLOWERS[Math.floor(r() * FLOWERS.length)],
    }))
    const tuft: Item[] = tufts.map(({ x, z, r }) => {
      const s = 0.7 + r() * 0.8
      return { position: [x, G, z], scale: [s, s, s], rotation: r() * 6, color: r() > 0.5 ? PALETTE.grassDeep : PALETTE.leafLight }
    })
    // rocks on the sand, all round the shore
    const rocks: Item[] = []
    const rr = scatter(Math.round(34 * Math.max(k, 0.6)), 71, (x, z) => {
      const d = islandDistance(x, z)
      return d > 0.9 && d < 0.94
    })
    rr.forEach(({ x, z, r }) => {
      // pushed out onto the beach
      const f = 1.1 + r() * 0.06
      const s = 0.5 + r() * 1
      rocks.push({ position: [x * f, GROUND.sand, z * f], scale: [s * 1.3, s * 0.8, s], rotation: r() * 6 })
    })
    return { trunk, crowns, cyp, bush, flower, tuft, rocks }
  }, [k, G])

  return (
    <group>
      <Instances items={layout.trunk} geometry={geo.trunk} material={toon(PALETTE.trunk)} />
      <Instances items={layout.crowns} geometry={geo.crown} material={windy('#ffffff')} />
      <Instances items={layout.cyp} geometry={geo.cypress} material={windy('#ffffff', 0.6)} />
      <Instances items={layout.bush} geometry={geo.bush} material={windy('#ffffff', 0.5)} />
      <Instances items={layout.flower} geometry={geo.flower} material={toon('#ffffff', { key: 'flower' })} castShadow={false} />
      <Instances items={layout.tuft} geometry={geo.tuft} material={windy('#ffffff', 2.2)} castShadow={false} />
      <Instances items={layout.rocks} geometry={geo.rock} material={toon(PALETTE.stone)} />
    </group>
  )
}
