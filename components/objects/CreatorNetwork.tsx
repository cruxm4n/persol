'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { PALETTE } from '@/lib/scene-config'
import { day } from '../world/WorldLighting'

const SEGMENTS = 40
const BULBS_PER_WIRE = 7

/**
 * String lights from the village's central pole to every house: the brand
 * in the middle, the communities around it. Each wire draws itself out as
 * the walk goes on (`progress`), its bulbs lighting one after the other.
 */
export function CreatorNetwork({
  hub,
  ends,
  progress,
}: {
  hub: [number, number, number]
  ends: [number, number, number][]
  progress: (p: number) => number
}) {
  const wires = useMemo(
    () =>
      ends.map((end) => {
        const a = new THREE.Vector3(...hub)
        const b = new THREE.Vector3(...end)
        const sag = a.distanceTo(b) * 0.12
        const pts = Array.from({ length: 16 }, (_, i) => {
          const t = i / 15
          const p = a.clone().lerp(b, t)
          p.y -= Math.sin(t * Math.PI) * sag
          return p
        })
        const curve = new THREE.CatmullRomCurve3(pts)
        return { curve, geometry: new THREE.TubeGeometry(curve, SEGMENTS, 0.035, 5, false) }
      }),
    [hub, ends],
  )
  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({ color: PALETTE.ink, transparent: true, opacity: 0.55 }), [])
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: PALETTE.lamp, toneMapped: false }), [])
  const bulbs = useRef<THREE.InstancedMesh>(null)
  const bulbGeo = useMemo(() => new THREE.SphereGeometry(0.11, 10, 8), [])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), s: new THREE.Vector3(), q: new THREE.Quaternion() }), [])
  const lampDim = useMemo(() => new THREE.Color(PALETTE.lamp).multiplyScalar(0.8), [])
  const lampBright = useMemo(() => new THREE.Color('#fff0c8').multiplyScalar(1.8), [])

  useFrame(() => {
    const k = progress(experience.smooth)
    const count = wires[0]?.geometry.index?.count ?? 0
    wires.forEach((w, i) => {
      // each wire starts a little after the previous one
      const local = THREE.MathUtils.clamp(k * 1.6 - i * (0.6 / wires.length), 0, 1)
      w.geometry.setDrawRange(0, Math.floor((local * count) / 6) * 6)
      for (let j = 0; j < BULBS_PER_WIRE; j++) {
        const t = (j + 0.5) / BULBS_PER_WIRE
        const on = THREE.MathUtils.clamp((local - t) * 8, 0, 1)
        w.curve.getPoint(t, tmp.p)
        tmp.p.y -= 0.12
        tmp.s.setScalar(on)
        tmp.m.compose(tmp.p, tmp.q, tmp.s)
        bulbs.current?.setMatrixAt(i * BULBS_PER_WIRE + j, tmp.m)
      }
    })
    if (bulbs.current) bulbs.current.instanceMatrix.needsUpdate = true
    // brighter as the light goes down
    bulbMat.color.lerpColors(lampDim, lampBright, day.t)
  })

  return (
    <group>
      {wires.map((w, i) => (
        <mesh key={i} geometry={w.geometry} material={wireMat} />
      ))}
      <instancedMesh ref={bulbs} args={[bulbGeo, bulbMat, wires.length * BULBS_PER_WIRE]} frustumCulled={false} />
    </group>
  )
}
