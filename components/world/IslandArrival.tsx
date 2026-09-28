'use client'

import { useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { LANDMARKS } from '@/lib/island'
import { surfaceMaterial, toon } from '@/lib/materials'
import { GROUND, PALETTE } from '@/lib/scene-config'
import { InteractiveSign } from '../objects/InteractiveSign'
import { day } from './WorldLighting'

const DECK_Y = 0.78

/** The dock where the walk begins, on posts, running out over the lagoon. */
function Dock() {
  const length = 13
  const z0 = 29.5
  return (
    <group position={[2, 0, z0 + length / 2]}>
      <RoundedBox args={[2.6, 0.2, length]} radius={0.06} position={[0, DECK_Y, 0]} material={surfaceMaterial('planks', PALETTE.wood, [0.5, 0.5])} castShadow receiveShadow />
      {Array.from({ length: 7 }, (_, i) =>
        [-1.2, 1.2].map((x) => (
          <mesh key={`${i}${x}`} position={[x, 0.2, -length / 2 + 0.6 + i * ((length - 1.2) / 6)]} material={toon(PALETTE.woodDark)} castShadow>
            <cylinderGeometry args={[0.13, 0.15, 1.9, 8]} />
          </mesh>
        )),
      )}
      {/* two mooring bollards at the end */}
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, DECK_Y + 0.28, length / 2 - 0.4]} material={toon(PALETTE.woodDark)} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.46, 10]} />
        </mesh>
      ))}
    </group>
  )
}

/** A little sailing boat moored by the dock, rocking on the swell. */
function Boat() {
  const ref = useRef<THREE.Group>(null)
  const sail = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.lineTo(0, 3.1)
    s.lineTo(1.9, 0.1)
    s.lineTo(0, 0)
    return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false })
  }, [])
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = experience.reducedMotion ? 0 : clock.elapsedTime
    ref.current.position.y = 0.12 + Math.sin(t * 1.1) * 0.08
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.04
    ref.current.rotation.x = Math.sin(t * 0.7 + 1) * 0.025
  })
  return (
    <group position={[-1.6, 0, 37.5]} rotation-y={-0.2}>
      <group ref={ref}>
        <RoundedBox args={[1.5, 0.8, 3.6]} radius={0.35} smoothness={4} position={[0, 0.15, 0]} material={toon(PALETTE.roofTeal)} castShadow />
        <RoundedBox args={[1.2, 0.12, 3.1]} radius={0.05} position={[0, 0.56, 0]} material={surfaceMaterial('planks', PALETTE.wood, [0.5, 0.5])} />
        <mesh position={[0, 2.3, 0.3]} material={toon(PALETTE.woodDark)} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 3.6, 8]} />
        </mesh>
        <mesh geometry={sail} position={[0.04, 0.85, 0.35]} rotation-y={-Math.PI / 2} material={toon(PALETTE.cloud)} castShadow />
      </group>
    </group>
  )
}

/**
 * The lighthouse: the island's signal. Its lantern is the only red on the
 * island; it pulses slowly, and its beam shows as the light goes down.
 */
function Lighthouse() {
  const [x, z] = LANDMARKS.lighthouse
  const lantern = useMemo(() => new THREE.MeshBasicMaterial({ color: PALETTE.red, toneMapped: false }), [])
  const beamMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffc9a8',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const beam = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const low = useMemo(() => new THREE.Color('#5a1d16'), [])
  const high = useMemo(() => new THREE.Color(PALETTE.red).multiplyScalar(1.6), [])
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime % 3.2
    const pulse = experience.reducedMotion ? 1 : t < 1.1 ? Math.sin((t / 1.1) * Math.PI) : 0
    lantern.color.lerpColors(low, high, 0.35 + 0.65 * pulse)
    beamMat.opacity = 0.05 + 0.16 * day.t
    if (beam.current && !experience.reducedMotion) beam.current.rotation.y += dt * 0.5
    if (light.current) light.current.intensity = (4 + 22 * day.t) * (0.4 + 0.6 * pulse)
  })
  const H = 5.4
  return (
    <group position={[x, GROUND.grass, z]}>
      {/* rocks at its foot */}
      {[
        [1.6, 0.9, 0.6, 1.1],
        [-1.4, 1.2, -0.2, 0.9],
        [0.3, -1.6, 1.1, 1.2],
      ].map(([rx, rz, rr, s], i) => (
        <mesh key={i} position={[rx, 0.1, rz]} rotation-y={rr} scale={[s * 1.2, s * 0.7, s]} material={toon(PALETTE.stone)} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.8, 0]} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]} material={toon(PALETTE.stone)} castShadow receiveShadow>
        <cylinderGeometry args={[1.9, 2.1, 0.5, 18]} />
      </mesh>
      <mesh position={[0, 0.5 + H / 2, 0]} material={toon(PALETTE.wall)} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.45, H, 20]} />
      </mesh>
      {[0.3, 0.62].map((f) => (
        <mesh key={f} position={[0, 0.5 + H * f, 0]} material={toon(PALETTE.roofSage)}>
          <cylinderGeometry args={[1.45 - 0.4 * f + 0.02, 1.45 - 0.4 * f + 0.06, 0.45, 20]} />
        </mesh>
      ))}
      <RoundedBox args={[0.7, 1.2, 0.2]} radius={0.08} position={[0, 1.1, 1.38]} rotation-x={0.07} material={toon(PALETTE.woodDark)} />
      {/* gallery, lantern room, cap */}
      <mesh position={[0, 0.55 + H, 0]} material={toon(PALETTE.woodDark)} castShadow>
        <cylinderGeometry args={[1.45, 1.45, 0.16, 20]} />
      </mesh>
      <mesh position={[0, 1.15 + H, 0]} material={lantern}>
        <cylinderGeometry args={[0.72, 0.72, 1.05, 16]} />
      </mesh>
      <mesh position={[0, 2.1 + H, 0]} material={toon(PALETTE.woodDark)} castShadow>
        <coneGeometry args={[1.0, 0.9, 16]} />
      </mesh>
      <mesh position={[0, 2.66 + H, 0]} material={toon(PALETTE.woodDark)}>
        <sphereGeometry args={[0.16, 10, 8]} />
      </mesh>
      <pointLight ref={light} position={[0, 1.2 + H, 0]} color={PALETTE.red} distance={16} decay={1.6} />
      <group ref={beam} position={[0, 1.15 + H, 0]}>
        {[0, Math.PI].map((r) => (
          <mesh key={r} rotation={[0, r, Math.PI / 2]} position={[Math.cos(r) * 11, 0, -Math.sin(r) * 11]} material={beamMat}>
            <coneGeometry args={[2.4, 22, 18, 1, true]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function IslandArrival() {
  return (
    <group>
      <Dock />
      <Boat />
      <Lighthouse />
      <InteractiveSign text="Île Signal" sub="Louis R. — portfolio" position={[-1.4, GROUND.grass, 27]} rotation-y={0.62} width={2.8} height={1.7} />
    </group>
  )
}
