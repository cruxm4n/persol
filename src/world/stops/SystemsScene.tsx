import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { flight } from '../../store'
import { COLORS } from '../palette'
import { FONT } from '../util'
import { PLATE, PLATES, plateGap, systems } from './layout'

/**
 * Stop 03 — Future Systems.
 * A workflow drawn as an exploded axonometric: one plate per stage, stacked.
 * The stack opens on entry, its orthogonal connectors are routed one by one
 * as the case study is read, and on exit the plates lie down side by side on
 * the ground, like a plan, handing over to the overview of the whole line.
 */

const STOP = 2
const SEG = 4
const PER_GAP = 2

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

export function SystemsScene() {
  const plates = useRef<(THREE.Group | null)[]>([])
  const smooth = useRef(0)

  const layout = useMemo(() => {
    const r = rng(2026)
    // three task nodes per plate, kept off the label corner
    const nodes = PLATES.map(() =>
      Array.from({ length: 3 }, (_, i) => new THREE.Vector2(-3 + i * 3 + (r() - 0.5) * 1.2, -1.5 + r() * 4)),
    )
    const links: { k: number; a: number; b: number }[] = []
    for (let k = 0; k < PLATES.length - 1; k++) {
      for (let j = 0; j < PER_GAP; j++) links.push({ k, a: Math.floor(r() * 3), b: Math.floor(r() * 3) })
    }
    return { nodes, links }
  }, [])

  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(PLATE.w, 0.12, PLATE.d)), [])
  const connectors = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(layout.links.length * SEG * 6), 3))
    const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: COLORS.ink }))
    l.frustumCulled = false
    return l
  }, [layout])

  const local = useMemo(() => PLATES.map(() => new THREE.Vector3()), [])
  const groundLocal = useMemo(
    () =>
      systems.ground.map((g) => {
        const v = g.clone().sub(systems.centre)
        return v.applyAxisAngle(new THREE.Vector3(0, 1, 0), -systems.rotationY)
      }),
    [],
  )
  const pts = useMemo(() => Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    smooth.current = THREE.MathUtils.damp(smooth.current, flight.cases[STOP], flight.reducedMotion ? 30 : 3, dt)
    const p = flight.stopsSmooth[STOP]
    const explode = THREE.MathUtils.smoothstep(p, 0.08, 0.32)
    const flat = THREE.MathUtils.smoothstep(p, 0.86, 1)
    const gap = plateGap(explode)

    PLATES.forEach((_, k) => {
      local[k].set(0, (k - (PLATES.length - 1) / 2) * gap, 0).lerp(groundLocal[k], flat)
      plates.current[k]?.position.copy(local[k])
    })

    // connectors: routed orthogonally, drawn one after another while reading
    const arr = (connectors.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
    const drawn = Math.max(smooth.current, flat) * layout.links.length
    layout.links.forEach((l, i) => {
      const a = layout.nodes[l.k][l.a]
      const b = layout.nodes[l.k + 1][l.b]
      const A = local[l.k]
      const B = local[l.k + 1]
      const midY = (A.y + B.y) / 2 + 0.06
      pts[0].set(A.x + a.x, A.y + 0.06, A.z + a.y)
      pts[1].set(pts[0].x, midY, pts[0].z)
      pts[2].set(B.x + b.x, midY, pts[0].z)
      pts[3].set(B.x + b.x, midY, B.z + b.y)
      pts[4].set(B.x + b.x, B.y + 0.06, B.z + b.y)
      const f = THREE.MathUtils.clamp(drawn - i, 0, 1) * SEG
      for (let s = 0; s < SEG; s++) {
        const t = THREE.MathUtils.clamp(f - s, 0, 1)
        tmp.copy(pts[s]).lerp(pts[s + 1], t)
        pts[s].toArray(arr, (i * SEG + s) * 6)
        ;(t > 0 ? tmp : pts[s]).toArray(arr, (i * SEG + s) * 6 + 3)
      }
    })
    connectors.geometry.getAttribute('position').needsUpdate = true
  })

  return (
    <group position={systems.centre} rotation-y={systems.rotationY}>
      {PLATES.map((name, k) => (
        <group key={name} ref={(el) => void (plates.current[k] = el)}>
          <mesh>
            <boxGeometry args={[PLATE.w, 0.12, PLATE.d]} />
            <meshBasicMaterial color={COLORS.paper} />
          </mesh>
          <lineSegments geometry={edges}>
            <lineBasicMaterial color={COLORS.ink} />
          </lineSegments>
          {layout.nodes[k].map((n, i) => (
            <mesh key={i} position={[n.x, 0.12, n.y]}>
              <boxGeometry args={[0.55, 0.12, 0.55]} />
              <meshBasicMaterial color={COLORS.ink} />
            </mesh>
          ))}
          <Text
            font={FONT.mono}
            fontSize={0.42}
            color={COLORS.ink}
            rotation-x={-Math.PI / 2}
            position={[-PLATE.w / 2 + 0.4, 0.08, -PLATE.d / 2 + 0.4]}
            anchorX="left"
            anchorY="top"
          >
            {`${String(k + 1).padStart(2, '0')}  ${name}`}
          </Text>
        </group>
      ))}
      <primitive object={connectors} />
    </group>
  )
}
