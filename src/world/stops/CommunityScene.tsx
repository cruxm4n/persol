import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { flight } from '../../store'
import { COLORS } from '../palette'
import { FONT } from '../util'
import { STOP_U, curve, stopCentre } from '../line'

/**
 * Stop 02 — Community Engine.
 * A schematic network: one brand, a ring of profiles, their communities.
 * It grows out of the line on entry, then its links are drawn one role step
 * at a time (strategy → activation → coordination → reporting). On exit the
 * nodes settle on a grid: the community hands over to the system of Stop 03.
 * Node counts are illustrative, never data.
 */

const STOP = 1
const PROFILES = 7
const ARC_SEG = 14

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Edge = { a: number; b: number; delay: number }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => 1 - Math.pow(1 - x, 3)

function build() {
  const r = rng(20180)
  const centre = stopCentre(STOP)
  const anchor = curve.getPointAt(STOP_U[STOP]).sub(centre)

  // node 0 = brand, 1..P = profiles, then community members
  const pos: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)]
  const kind: number[] = [0]
  const delay: number[] = [0]
  for (let i = 0; i < PROFILES; i++) {
    const a = (i / PROFILES) * Math.PI * 2 + (r() - 0.5) * 0.5
    const rad = 7 + r() * 3.5
    pos.push(new THREE.Vector3(Math.cos(a) * rad, (r() - 0.5) * 5, Math.sin(a) * rad))
    kind.push(1)
    delay.push(0.15 + (i / PROFILES) * 0.35)
  }
  const members: Edge[] = []
  const clusters: number[][] = []
  for (let i = 1; i <= PROFILES; i++) {
    const out = pos[i].clone().setY(0).normalize()
    const n = 4 + Math.floor(r() * 5)
    const cluster: number[] = []
    for (let j = 0; j < n; j++) {
      const p = pos[i]
        .clone()
        .addScaledVector(out, 2.2 + r() * 2.4)
        .add(new THREE.Vector3((r() - 0.5) * 3.2, (r() - 0.5) * 2.6, (r() - 0.5) * 3.2))
      cluster.push(pos.length)
      members.push({ a: i, b: pos.length, delay: r() })
      pos.push(p)
      kind.push(2)
      delay.push(0.45 + r() * 0.55)
    }
    clusters.push(cluster)
  }

  const spokes: Edge[] = Array.from({ length: PROFILES }, (_, i) => ({ a: 0, b: i + 1, delay: i / PROFILES }))
  // coordination: profiles talk to each other, and neighbouring communities overlap
  const cross: Edge[] = []
  for (let i = 1; i <= PROFILES; i++) cross.push({ a: i, b: (i % PROFILES) + 1, delay: r() })
  cross.push({ a: 1, b: 4, delay: r() }, { a: 3, b: 6, delay: r() })
  for (let c = 0; c < clusters.length; c++) {
    const A = clusters[c]
    const B = clusters[(c + 1) % clusters.length]
    cross.push({ a: A[Math.floor(r() * A.length)], b: B[Math.floor(r() * B.length)], delay: r() })
  }
  // reporting: every profile reports back to the brand, along a raised arc
  const reports: Edge[] = Array.from({ length: PROFILES }, (_, i) => ({ a: i + 1, b: 0, delay: r() }))

  // exit: snap onto a lattice, flattened into layers
  const grid = pos.map((p) => new THREE.Vector3(Math.round(p.x / 3) * 3, Math.round(p.y / 2.5) * 2.5, Math.round(p.z / 3) * 3))

  return { centre, anchor, pos, kind, delay, grid, spokes, members, cross, reports }
}

function segments(count: number, color: string, opacity: number) {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3))
  const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  const lines = new THREE.LineSegments(geo, mat)
  lines.frustumCulled = false
  return lines
}

export function CommunityScene() {
  const net = useMemo(build, [])
  const smooth = useRef({ case: 0 })
  const brand = useRef<THREE.Mesh>(null)
  const profiles = useRef<THREE.InstancedMesh>(null)
  const dots = useRef<THREE.InstancedMesh>(null)
  const labels = useRef<(THREE.Object3D | null)[]>([])
  const texts = useRef<({ fillOpacity: number } | null)[]>([])

  const lines = useMemo(
    () => ({
      spokes: segments(net.spokes.length, COLORS.ink, 1),
      members: segments(net.members.length, COLORS.graphite, 0.55),
      cross: segments(net.cross.length, COLORS.ink, 0.7),
      reports: segments(net.reports.length * ARC_SEG, COLORS.graphite, 0.8),
    }),
    [net],
  )

  const memberIds = useMemo(() => net.kind.flatMap((k, i) => (k === 2 ? [i] : [])), [net])
  const cur = useMemo(() => net.pos.map((p) => p.clone()), [net])
  const m4 = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const sc = useMemo(() => new THREE.Vector3(), [])
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])
  const mid = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const rate = flight.reducedMotion ? 30 : 3
    smooth.current.case = THREE.MathUtils.damp(smooth.current.case, flight.cases[STOP], rate, dt)
    const p = flight.stopsSmooth[STOP]
    const grow = THREE.MathUtils.smoothstep(p, 0.01, 0.2)
    const snap = THREE.MathUtils.smoothstep(p, 0.86, 1)
    const phase = (k: number) => clamp01(smooth.current.case * 4 - k)

    // node positions: out of the line, into the network, onto the grid
    const g: number[] = []
    for (let i = 0; i < cur.length; i++) {
      const gi = ease(clamp01((grow * 1.6 - net.delay[i] * 0.6)))
      g.push(gi)
      cur[i].copy(net.anchor).lerp(net.pos[i], gi).lerp(net.grid[i], snap)
    }

    if (brand.current) {
      brand.current.position.copy(cur[0])
      brand.current.scale.setScalar(Math.max(0.001, g[0]))
    }
    if (profiles.current) {
      for (let i = 0; i < PROFILES; i++) {
        m4.compose(cur[i + 1], q, sc.setScalar(Math.max(0.001, g[i + 1])))
        profiles.current.setMatrixAt(i, m4)
      }
      profiles.current.instanceMatrix.needsUpdate = true
    }
    if (dots.current) {
      // communities appear with activation, not before
      const act = phase(1)
      memberIds.forEach((id, j) => {
        const s = Math.max(0.001, g[id] * ease(clamp01(act * 1.8 - net.delay[id] * 0.8)))
        m4.compose(cur[id], q, sc.setScalar(s))
        dots.current!.setMatrixAt(j, m4)
      })
      dots.current.instanceMatrix.needsUpdate = true
    }

    const draw = (target: THREE.LineSegments, edges: Edge[], t: number) => {
      const arr = (target.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
      edges.forEach((e, i) => {
        const f = ease(clamp01(t * 1.6 - e.delay * 0.6))
        a.copy(cur[e.a])
        b.copy(a).lerp(cur[e.b], f)
        a.toArray(arr, i * 6)
        b.toArray(arr, i * 6 + 3)
      })
      target.geometry.getAttribute('position').needsUpdate = true
    }
    draw(lines.spokes, net.spokes, phase(0) * grow)
    draw(lines.members, net.members, phase(1))
    draw(lines.cross, net.cross, phase(2))

    // reporting arcs rise above the network and come back down on the brand
    const rep = phase(3)
    const arr = (lines.reports.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
    net.reports.forEach((e, i) => {
      const f = ease(clamp01(rep * 1.6 - e.delay * 0.6))
      const from = cur[e.a]
      const to = cur[e.b]
      mid.copy(from).lerp(to, 0.5)
      mid.y += 4 + from.distanceTo(to) * 0.25
      for (let s = 0; s < ARC_SEG; s++) {
        const t0 = Math.min(f, s / ARC_SEG)
        const t1 = Math.min(f, (s + 1) / ARC_SEG)
        for (const [t, off] of [
          [t0, 0],
          [t1, 3],
        ] as const) {
          // quadratic Bézier from → mid → to
          const u = 1 - t
          a.set(0, 0, 0)
            .addScaledVector(from, u * u)
            .addScaledVector(mid, 2 * u * t)
            .addScaledVector(to, t * t)
          a.toArray(arr, (i * ARC_SEG + s) * 6 + off)
        }
      }
    })
    lines.reports.geometry.getAttribute('position').needsUpdate = true

    // three schematic labels, each arriving with the step that introduces it
    const show = [grow * (1 - snap), phase(0) * (1 - snap), phase(1) * (1 - snap)]
    const at = [cur[0], cur[1], cur[memberIds[0]]]
    labels.current.forEach((l, i) => l && l.position.copy(at[i]).setY(at[i].y + (i === 0 ? 1.3 : 0.9)))
    texts.current.forEach((t, i) => t && (t.fillOpacity = show[i]))
  })

  const LABELS = ['Marque', 'Profil', 'Communauté']

  return (
    <group position={net.centre}>
      <primitive object={lines.spokes} />
      <primitive object={lines.members} />
      <primitive object={lines.cross} />
      <primitive object={lines.reports} />
      <mesh ref={brand}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={COLORS.ink} />
      </mesh>
      <instancedMesh ref={profiles} args={[undefined, undefined, PROFILES]} frustumCulled={false}>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshBasicMaterial color={COLORS.ink} />
      </instancedMesh>
      <instancedMesh ref={dots} args={[undefined, undefined, memberIds.length]} frustumCulled={false}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshBasicMaterial color={COLORS.graphite} />
      </instancedMesh>
      {LABELS.map((label, i) => (
        <Billboard key={label} ref={(el) => void (labels.current[i] = el)}>
          <Text
            ref={(el: unknown) => void (texts.current[i] = el as { fillOpacity: number } | null)}
            font={i === 0 ? FONT.sans : FONT.mono}
            fontSize={i === 0 ? 0.6 : 0.36}
            color={i === 0 ? COLORS.ink : COLORS.graphite}
            anchorX="center"
            anchorY="bottom"
            fillOpacity={0}
          >
            {label}
          </Text>
        </Billboard>
      ))}
    </group>
  )
}
