import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { expertises, stack } from '../content'
import { STRATA, ground } from './anchors'
import { COLORS, GLOW } from './palette'
import { FONT, fadeTree, glow, presence } from './util'

const LEVELS = [6.5, 12, 17.5, 23]
const RADII = [7.5, 8.6, 9.7, 10.8]

function ringGeometry(r: number, ticks: number) {
  const pts: number[] = []
  const seg = 180
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2
    const a1 = ((i + 1) / seg) * Math.PI * 2
    pts.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r)
  }
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2
    const l = i % 5 === 0 ? 0.6 : 0.25
    pts.push(Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(a) * (r - l), 0, Math.sin(a) * (r - l))
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

/**
 * Expertises + Instruments: a vertical structure — four disciplines as floors,
 * the tools of each stack category orbiting as instruments on its ring.
 */
export function InstrumentTower() {
  const root = useRef<THREE.Group>(null)
  const rings = useRef<(THREE.Group | null)[]>([])
  const g0 = useMemo(() => ground(STRATA.x, STRATA.z), [])
  const geos = useMemo(() => RADII.map((r) => ringGeometry(r, 120)), [])
  const spine = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 27, 0)]),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const k = Math.max(presence(4, 1.3), presence(5, 1.3))
    if (root.current) fadeTree(root.current, k)
    rings.current.forEach((r, i) => {
      if (r) r.rotation.y = t * (i % 2 ? -0.05 : 0.04) + i
    })
  })

  return (
    <group ref={root} position={[STRATA.x, g0, STRATA.z]}>
      <lineSegments geometry={spine}>
        <lineBasicMaterial color={glow(COLORS.signal, GLOW)} toneMapped={false} />
      </lineSegments>

      {LEVELS.map((y, i) => (
        <group key={i} position-y={y}>
          {/* floor disc */}
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[RADII[i], 72]} />
            <meshBasicMaterial color={COLORS.bone} transparent opacity={0.035} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <lineSegments geometry={geos[i]}>
            <lineBasicMaterial color={COLORS.bone} transparent opacity={0.5} />
          </lineSegments>
          <mesh>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshBasicMaterial color={glow(COLORS.signal, GLOW)} toneMapped={false} />
          </mesh>

          {/* discipline, anchored on the spine */}
          <Billboard position={[0, 0.6, 0]}>
            <Text font={FONT.mono} fontSize={0.3} letterSpacing={0.14} color={COLORS.signal} anchorX="left" anchorY="bottom" position={[0.5, 0.45, 0]}>
              {`${expertises[i].id} · ${stack[i].label.toUpperCase()}`}
            </Text>
            <Text font={FONT.sans} fontSize={0.62} color={COLORS.bone} anchorX="left" anchorY="top" position={[0.5, 0.4, 0]} maxWidth={9}>
              {expertises[i].title}
            </Text>
          </Billboard>

          {/* instruments orbiting the floor */}
          <group ref={(g) => (rings.current[i] = g)}>
            {stack[i].tools.map((tool, j) => {
              const a = (j / stack[i].tools.length) * Math.PI * 2
              const r = RADII[i]
              return (
                <group key={tool} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
                  <mesh>
                    <boxGeometry args={[0.18, 0.18, 0.18]} />
                    <meshBasicMaterial color={glow(COLORS.bone, 1.4)} toneMapped={false} />
                  </mesh>
                  <Billboard position={[0, 0.35, 0]}>
                    <Text font={FONT.mono} fontSize={0.36} letterSpacing={0.04} color={COLORS.bone} anchorX="center" anchorY="bottom">
                      {tool}
                    </Text>
                  </Billboard>
                </group>
              )
            })}
          </group>
        </group>
      ))}
    </group>
  )
}
