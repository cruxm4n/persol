'use client'

import { useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { LANDMARKS, rng } from '@/lib/island'
import { surfaceMaterial, toon } from '@/lib/materials'
import { GROUND, PALETTE } from '@/lib/scene-config'
import { CozyHouse } from '../objects/CozyHouse'
import { Smoke } from './StudioZone'
import { useGlow } from './useGlow'
import { day } from './WorldLighting'

const DECK_Y = 0.78
const QUAY = { z0: -30, length: 10, width: 3 }

/** A lantern post whose light comes on with the evening. */
function Lantern(props: ThreeElements['group']) {
  const glass = useGlow()
  const light = useRef<THREE.PointLight>(null)
  useFrame(() => {
    if (light.current) light.current.intensity = 14 * day.t
  })
  return (
    <group {...props}>
      <mesh position={[0, 1.2, 0]} material={toon(PALETTE.ink)} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2.4, 8]} />
      </mesh>
      <RoundedBox args={[0.36, 0.46, 0.36]} radius={0.06} position={[0, 2.55, 0]} material={glass} />
      <mesh position={[0, 2.9, 0]} material={toon(PALETTE.ink)}>
        <coneGeometry args={[0.32, 0.26, 4]} />
      </mesh>
      <pointLight ref={light} position={[0, 2.5, 0]} color="#ffcf94" distance={9} decay={1.5} intensity={0} />
    </group>
  )
}

/** Fireflies over the quay at dusk: a handful of warm points drifting. */
function Fireflies({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    const r = rng(17)
    return Array.from({ length: count }, () => ({ x: (r() - 0.5) * 10, y: 1.2 + r() * 2.2, z: -27 - r() * 9, p: r() * 6 }))
  }, [count])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd98a').multiplyScalar(1.6), toneMapped: false }), [])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3() }), [])
  useFrame(({ clock }) => {
    const t = experience.reducedMotion ? 0 : clock.elapsedTime
    const on = THREE.MathUtils.clamp((day.t - 0.55) / 0.35, 0, 1)
    seeds.forEach((f, i) => {
      tmp.p.set(f.x + Math.sin(t * 0.4 + f.p) * 0.6, f.y + Math.sin(t * 0.7 + f.p * 2) * 0.35, f.z + Math.cos(t * 0.3 + f.p) * 0.6)
      tmp.s.setScalar(on * (0.6 + 0.4 * Math.sin(t * 3 + f.p * 5)))
      tmp.m.compose(tmp.p, tmp.q, tmp.s)
      ref.current?.setMatrixAt(i, tmp.m)
    })
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, mat, count]} frustumCulled={false}>
      <sphereGeometry args={[0.035, 6, 6]} />
    </instancedMesh>
  )
}

/**
 * Zone 06 — Contact: the quay at the northern tip, at sunset. The contact
 * board at the end, a bench facing it and the sea, a lantern coming on,
 * the home with its windows lit.
 */
export function ContactZone({ fireflies }: { fireflies: number }) {
  const homeGlow = useGlow()
  const [hx, hz] = LANDMARKS.home
  return (
    <group>
      <group position={[0, 0, QUAY.z0 - QUAY.length / 2]}>
        <RoundedBox
          args={[QUAY.width, 0.2, QUAY.length]}
          radius={0.06}
          position={[0, DECK_Y, 0]}
          material={surfaceMaterial('planks', PALETTE.wood, [0.5, 0.5])}
          castShadow
          receiveShadow
        />
        {Array.from({ length: 5 }, (_, i) =>
          [-1.4, 1.4].map((x) => (
            <mesh key={`${i}${x}`} position={[x, 0.2, -QUAY.length / 2 + 0.5 + i * ((QUAY.length - 1) / 4)]} material={toon(PALETTE.woodDark)} castShadow>
              <cylinderGeometry args={[0.13, 0.15, 1.9, 8]} />
            </mesh>
          )),
        )}
        {/* the bench at the end, looking out at the sunset */}
        <group position={[0, DECK_Y + 0.1, 0.6]}>
          <RoundedBox args={[1.8, 0.1, 0.5]} radius={0.04} position={[0, 0.45, 0]} material={surfaceMaterial('planks', PALETTE.wood, [0.5, 0.5])} castShadow />
          <RoundedBox args={[1.8, 0.45, 0.08]} radius={0.03} position={[0, 0.8, 0.24]} rotation-x={0.12} material={toon(PALETTE.wood)} castShadow />
          {[-0.75, 0.75].map((x) => (
            <mesh key={x} position={[x, 0.22, 0]} material={toon(PALETTE.woodDark)}>
              <boxGeometry args={[0.1, 0.45, 0.45]} />
            </mesh>
          ))}
        </group>
        <Lantern position={[-1.3, DECK_Y + 0.1, 4.4]} />
      </group>
      <CozyHouse position={[hx, GROUND.grass, hz]} rotation-y={-Math.PI / 2 + 0.3} w={4.2} d={3.4} h={2.6} roof={PALETTE.roof} windowMaterial={homeGlow} chimney />
      <Smoke position={[hx + 0.84, GROUND.grass + 4.3, hz + 0.98]} />
      <Fireflies count={fireflies} />
    </group>
  )
}
