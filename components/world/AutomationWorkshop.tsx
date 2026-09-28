'use client'

import { useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { span } from '@/lib/motion-config'
import { surfaceMaterial, toon } from '@/lib/materials'
import { tools } from '@/lib/portfolio-data'
import { moduleScreen } from '@/lib/signage'
import { GROUND, PALETTE, ZONES } from '@/lib/scene-config'
import { wake } from '../camera/CameraTransitions'
import { CozyHouse } from '../objects/CozyHouse'
import { DataModule } from '../objects/DataModule'
import { useGlow } from './useGlow'

const zone = ZONES.find((z) => z.id === 'system')!
const [r0] = zone.range

const BELT = { x: -0.6, z: 1.35, y: 0.95, length: 8.4 }
const SHEETS = 7

/** A windmill whose sails turn faster as the workshop wakes. */
function Windmill(props: ThreeElements['group']) {
  const rotor = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (!rotor.current || experience.reducedMotion) return
    rotor.current.rotation.z -= dt * (0.25 + 1.8 * wake(experience.smooth, 'system'))
  })
  return (
    <group {...props}>
      <mesh position={[0, 2.6, 0]} material={toon(PALETTE.wall)} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 1.05, 5.2, 10]} />
      </mesh>
      <mesh position={[0, 5.7, 0]} material={toon(PALETTE.roofSage)} castShadow>
        <coneGeometry args={[1.05, 1.3, 10]} />
      </mesh>
      <group ref={rotor} position={[0, 5, 0.95]}>
        <mesh material={toon(PALETTE.woodDark)} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.18, 0.18, 0.4, 10]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation-z={(i * Math.PI) / 2}>
            <mesh position={[0, 1.55, 0.05]} material={toon(PALETTE.woodDark)} castShadow>
              <boxGeometry args={[0.1, 2.9, 0.08]} />
            </mesh>
            <mesh position={[0.28, 1.75, 0.08]} material={toon(PALETTE.cloud)} castShadow>
              <boxGeometry args={[0.46, 2.2, 0.03]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** The belt, and listing paper riding along it from one module to the next. */
function Conveyor() {
  const sheets = useRef<(THREE.Mesh | null)[]>([])
  const paper = surfaceMaterial('listing', '#ffffff', [1, 1])
  const offset = useRef(0)
  useFrame((_, dt) => {
    const k = wake(experience.smooth, 'system')
    if (!experience.reducedMotion) offset.current = (offset.current + dt * 0.35 * k) % 1
    sheets.current.forEach((m, i) => {
      if (!m) return
      const u = (i / SHEETS + offset.current) % 1
      m.position.x = -BELT.length / 2 + 0.5 + u * (BELT.length - 1)
      // sheets appear only once the machines are in place
      m.scale.setScalar(THREE.MathUtils.clamp((k - 0.5) * 3, 0, 1))
    })
  })
  const rollers = useMemo(() => Array.from({ length: 9 }, (_, i) => -BELT.length / 2 + 0.4 + i * ((BELT.length - 0.8) / 8)), [])
  return (
    <group position={[BELT.x, 0, BELT.z]}>
      <RoundedBox args={[BELT.length, 0.2, 1.1]} radius={0.06} position={[0, BELT.y, 0]} material={toon(PALETTE.woodDark)} receiveShadow castShadow />
      {rollers.map((x) => (
        <mesh key={x} position={[x, BELT.y - 0.04, 0.58]} rotation-x={Math.PI / 2} material={toon(PALETTE.stone)}>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 10]} />
        </mesh>
      ))}
      {[-BELT.length / 2 + 0.3, 0, BELT.length / 2 - 0.3].map((x) =>
        [-0.42, 0.42].map((z) => (
          <mesh key={`${x}${z}`} position={[x, BELT.y / 2, z]} material={toon(PALETTE.woodDark)}>
            <boxGeometry args={[0.12, BELT.y, 0.12]} />
          </mesh>
        )),
      )}
      {Array.from({ length: SHEETS }, (_, i) => (
        <mesh key={i} ref={(el) => void (sheets.current[i] = el)} position={[0, BELT.y + 0.115, 0]} rotation-x={-Math.PI / 2} material={paper} castShadow>
          <planeGeometry args={[0.72, 0.9]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Zone 05 — the workshop: four modules, one per stack of tools, drop into
 * place one after the other and light their screens; then the belt starts,
 * listing paper runs between them and the windmill picks up speed.
 */
export function AutomationWorkshop() {
  const glow = useGlow((p) => wake(p, 'system'))
  const colors = [PALETTE.roofTeal, PALETTE.roofSand, PALETTE.roofSage, PALETTE.wallWarm]
  const screens = useMemo(() => tools.map((t) => moduleScreen(t.group, t.items)), [])
  const modules = tools.map((_, i) => ({ x: -4.5 + i * 2.55, color: colors[i], screen: screens[i] }))
  return (
    <group position={[zone.at[0], GROUND.grass, zone.at[2]]} rotation-y={-0.88}>
      <CozyHouse position={[-0.6, 0, -3.4]} w={6.4} d={3.6} h={3} roof={PALETTE.roofSage} windowMaterial={glow} chimney />
      <Windmill position={[4.9, 0, -3]} rotation-y={0.3} />
      {modules.map((m, i) => (
        <DataModule
          key={i}
          position={[m.x, 0, -0.5]}
          size={[2.1, 1.9, 1.4]}
          color={m.color}
          screen={m.screen}
          assemble={(p) => span(p, r0 + 0.008 + i * 0.012, r0 + 0.03 + i * 0.012)}
        />
      ))}
      <Conveyor />
    </group>
  )
}
