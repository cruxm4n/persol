import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { stats } from '../content'
import { RUNWAY, ground } from './anchors'
import { COLORS, GLOW } from './palette'
import { FONT, fadeTree, glow, presence, progress } from './util'

const LEN = 50
const WIDTH = 15
const Z0 = RUNWAY.z + LEN / 2
const ROW = 10.5

/** Results painted on an airstrip, lit by sequenced approach lights. */
export function ResultsRunway() {
  const root = useRef<THREE.Group>(null)
  const lights = useRef<THREE.InstancedMesh>(null)
  const numbers = useRef<(THREE.Group | null)[]>([])
  const g0 = useMemo(() => ground(RUNWAY.x, RUNWAY.z), [])

  const lightPos = useMemo(() => {
    const out: THREE.Vector3[] = []
    for (let i = 0; i <= 20; i++) {
      const z = Z0 - (i / 20) * LEN
      out.push(new THREE.Vector3(-WIDTH / 2, 0.15, z - RUNWAY.z), new THREE.Vector3(WIDTH / 2, 0.15, z - RUNWAY.z))
    }
    return out
  }, [])

  const paint = useMemo(() => {
    const pts: number[] = []
    const seg = (x0: number, z0: number, x1: number, z1: number) => pts.push(x0, 0.04, z0, x1, 0.04, z1)
    seg(-WIDTH / 2, LEN / 2, -WIDTH / 2, -LEN / 2)
    seg(WIDTH / 2, LEN / 2, WIDTH / 2, -LEN / 2)
    // centreline dashes
    for (let z = LEN / 2 - 2; z > -LEN / 2 + 2; z -= 3) seg(0, z, 0, z - 1.4)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), c: new THREE.Color() }), [])
  const on = useMemo(() => glow(COLORS.signal, GLOW), [])
  const off = useMemo(() => new THREE.Color(COLORS.steel), [])

  useFrame(({ clock }) => {
    const k = presence(6, 1.25)
    if (root.current) fadeTree(root.current, Math.max(k, 0.0))
    const reveal = progress(5.25, 6)
    numbers.current.forEach((g, i) => {
      if (!g) return
      const r = THREE.MathUtils.clamp(reveal * 1.6 - i * 0.2, 0, 1)
      const e = 1 - Math.pow(1 - r, 3)
      g.scale.setScalar(0.85 + e * 0.15)
      fadeTree(g, e * k)
    })
    const inst = lights.current
    if (!inst) return
    const t = clock.elapsedTime
    lightPos.forEach((p, i) => {
      tmp.m.makeTranslation(p.x, p.y, p.z)
      inst.setMatrixAt(i, tmp.m)
      const row = Math.floor(i / 2)
      const chase = ((t * 14 - row) % 21 + 21) % 21 < 1.6
      inst.setColorAt(i, chase ? on : off)
    })
    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
  })

  return (
    <group ref={root} position={[RUNWAY.x, g0, RUNWAY.z]}>
      {/* dark apron so the paint reads against the contours */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <planeGeometry args={[WIDTH + 1.2, LEN + 1.2]} />
        <meshBasicMaterial color={COLORS.night} transparent opacity={0.85} />
      </mesh>
      <lineSegments geometry={paint}>
        <lineBasicMaterial color={COLORS.bone} transparent opacity={0.7} />
      </lineSegments>
      {/* threshold piano keys */}
      {[-1, 1].map((end) =>
        Array.from({ length: 8 }, (_, j) => (
          <mesh key={`${end}-${j}`} rotation-x={-Math.PI / 2} position={[-WIDTH / 2 + 1.2 + j * 1.8, 0.05, end * (LEN / 2 - 1.6)]}>
            <planeGeometry args={[0.9, 2.4]} />
            <meshBasicMaterial color={COLORS.bone} transparent opacity={0.55} />
          </mesh>
        )),
      )}
      <instancedMesh ref={lights} args={[undefined, undefined, lightPos.length]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {stats.map((s, i) => (
        <group
          key={s.label}
          ref={(g) => (numbers.current[i] = g)}
          position={[0, 0.06, LEN / 2 - 7 - i * ROW]}
          rotation-x={-Math.PI / 2}
        >
          <Text font={FONT.serif} fontSize={6.2} color={COLORS.bone} anchorX="center" anchorY="middle" letterSpacing={-0.02}>
            {s.value}
          </Text>
          <Text
            font={FONT.mono}
            fontSize={0.55}
            letterSpacing={0.22}
            color={COLORS.signal}
            position={[0, -3.4, 0]}
            anchorX="center"
            anchorY="middle"
          >
            {s.label.toUpperCase()}
          </Text>
        </group>
      ))}
    </group>
  )
}
