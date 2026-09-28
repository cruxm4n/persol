import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { journey } from '../content'
import { TRAJECTORY, ground } from './anchors'
import { COLORS, GLOW } from './palette'
import { FONT, fadeTree, glow, presence, progress } from './util'

const SEGMENTS = 400

/** Career path drawn onto the terrain as the drone flies over it. */
export function Trajectory() {
  const root = useRef<THREE.Group>(null)
  const lit = useRef<THREE.Mesh>(null)
  const markers = useRef<(THREE.Group | null)[]>([])

  const { tube, ghost, stops } = useMemo(() => {
    const span = TRAJECTORY.zEnd - TRAJECTORY.zStart
    const ctrl = [
      [-6, 0],
      [4, 0.18],
      [-1, 0.38],
      [12, 0.58],
      [8, 0.78],
      [20, 1],
    ].map(([x, f]) => {
      const z = TRAJECTORY.zStart + span * f
      return new THREE.Vector3(x, ground(x, z) + 0.5, z)
    })
    const path = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal')
    // hug the ground along the whole path
    const pts = path.getSpacedPoints(SEGMENTS).map((p) => new THREE.Vector3(p.x, ground(p.x, p.z) + 0.45, p.z))
    const hugged = new THREE.CatmullRomCurve3(pts)
    const tube = new THREE.TubeGeometry(hugged, SEGMENTS, 0.16, 8, false)
    const ghost = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineDashedMaterial({ color: COLORS.steel, dashSize: 0.6, gapSize: 0.5, transparent: true, opacity: 0.8 }),
    )
    ghost.computeLineDistances()
    const stops = journey.map((_, i) => hugged.getPointAt(i / (journey.length - 1)))
    return { tube, ghost, stops }
  }, [])

  useFrame(() => {
    const k = presence(7, 1.3)
    if (root.current) fadeTree(root.current, k)
    const p = progress(6.35, 7.15)
    const idxCount = tube.index ? tube.index.count : 0
    tube.setDrawRange(0, Math.floor(idxCount * p / 6) * 6)
    markers.current.forEach((m, i) => {
      if (!m) return
      const at = i / (journey.length - 1)
      const r = THREE.MathUtils.clamp((p - at) * 8 + 1, 0, 1)
      m.scale.setScalar(Math.max(0.001, r))
    })
  })

  return (
    <group ref={root}>
      <primitive object={ghost} />
      <mesh ref={lit} geometry={tube}>
        <meshBasicMaterial color={glow(COLORS.signal, GLOW)} toneMapped={false} />
      </mesh>
      {stops.map((s, i) => (
        <group key={i} ref={(g) => (markers.current[i] = g)} position={s}>
          <mesh position-y={2.2}>
            <boxGeometry args={[0.05, 4.4, 0.05]} />
            <meshBasicMaterial color={COLORS.bone} transparent opacity={0.7} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={0.05}>
            <ringGeometry args={[0.7, 0.85, 40]} />
            <meshBasicMaterial color={glow(COLORS.signal, 2)} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
          <Billboard position={[0, 4.8, 0]}>
            <Text font={FONT.mono} fontSize={0.34} letterSpacing={0.14} color={COLORS.signal} anchorX="center" anchorY="bottom" position={[0, 0.85, 0]}>
              {journey[i].at.toUpperCase()}
            </Text>
            <Text font={FONT.sans} fontSize={0.62} color={COLORS.bone} anchorX="center" anchorY="bottom" maxWidth={8} textAlign="center">
              {journey[i].title}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
