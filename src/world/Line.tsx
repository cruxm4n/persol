import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { flight } from '../store'
import { COLORS } from './palette'
import { FONT, anyStop } from './util'
import { GROUND_Y, curve, future, milestones, sideAt } from './line'

const SAMPLES = 900
const INTRO_SECONDS = 2.6

/** The career line: dashed where it is planned, inked where the reader has been. */
export function CareerLine() {
  const intro = useRef(0)
  const size = useThree((s) => s.size)

  const parts = useMemo(() => {
    const pts = curve.getSpacedPoints(SAMPLES)

    const planned = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineDashedMaterial({
        color: COLORS.graphite,
        dashSize: 0.9,
        gapSize: 0.7,
      }),
    )
    planned.computeLineDistances()

    const ahead = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(future.getSpacedPoints(80)),
      new THREE.LineDashedMaterial({
        color: COLORS.graphite,
        dashSize: 0.4,
        gapSize: 1.2,
        transparent: true,
        opacity: 0.7,
      }),
    )
    ahead.computeLineDistances()

    // Inked part: constant 2.5px on screen whatever the distance, like a pen stroke.
    const inkGeo = new LineGeometry()
    inkGeo.setPositions(pts.flatMap((p) => [p.x, p.y, p.z]))
    const inkMat = new LineMaterial({
      color: COLORS.ink,
      linewidth: 2.5,
      worldUnits: false,
    })
    const ink = new Line2(inkGeo, inkMat)

    // Elevation reading: the line's shadow on the ground and plumb lines down to it.
    const shadow = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, GROUND_Y + 0.02, p.z))),
      new THREE.LineBasicMaterial({
        color: COLORS.graphite,
        transparent: true,
        opacity: 0.45,
      }),
    )
    const plumb: THREE.Vector3[] = []
    for (let i = 0; i <= SAMPLES; i += 12) {
      const p = pts[i]
      plumb.push(p, new THREE.Vector3(p.x, GROUND_Y, p.z))
    }
    const plumbs = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(plumb),
      new THREE.LineBasicMaterial({
        color: COLORS.graphite,
        transparent: true,
        opacity: 0.22,
      }),
    )

    // Milestone ticks cross the line horizontally.
    const ticks: THREE.Vector3[] = []
    for (const m of milestones) {
      const p = curve.getPointAt(m.u)
      const s = sideAt(m.u)
      ticks.push(p.clone().addScaledVector(s, -1.4), p.clone().addScaledVector(s, 1.4))
    }
    const tickLines = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(ticks),
      new THREE.LineBasicMaterial({ color: COLORS.ink }),
    )

    return {
      planned,
      ahead,
      ink,
      shadow,
      plumbs,
      tickLines,
      count: pts.length,
    }
  }, [])

  const labels = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    // dated labels step aside while a stop (a theme, not a date) is on screen
    // and in Contact, where the page itself says it
    if (labels.current) labels.current.visible = anyStop() < 0.25 && flight.smooth < 6.5
    intro.current = Math.min(1, intro.current + delta / (flight.reducedMotion ? 0.01 : INTRO_SECONDS))
    const e = 1 - Math.pow(1 - intro.current, 3)
    parts.planned.geometry.setDrawRange(0, Math.floor(parts.count * e))
    parts.shadow.geometry.setDrawRange(0, Math.floor(parts.count * e))
    parts.ahead.visible = e >= 1

    const drawn = THREE.MathUtils.clamp(flight.u + 0.015, 0, 1)
    parts.ink.geometry.instanceCount = Math.floor((parts.count - 1) * drawn)
    ;(parts.ink.material as LineMaterial).resolution.set(size.width, size.height)
  })

  const start = curve.getPointAt(0)
  const end = curve.getPointAt(1)

  return (
    <group>
      <primitive object={parts.planned} />
      <primitive object={parts.ahead} />
      <primitive object={parts.shadow} />
      <primitive object={parts.plumbs} />
      <primitive object={parts.tickLines} />
      <primitive object={parts.ink} />

      {/* the one red mark: where the line stands today */}
      <mesh position={end}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color={COLORS.red} />
      </mesh>

      <group ref={labels}>
        <Billboard position={[start.x, start.y + 1.6, start.z]} lockX lockZ>
          <Text font={FONT.mono} fontSize={0.9} color={COLORS.ink} anchorX="center" anchorY="bottom">
            2018
          </Text>
        </Billboard>

        {milestones.map((m) => {
          const p = curve.getPointAt(m.u)
          const last = m.u === 1
          return (
            <Billboard key={m.title} position={[p.x, p.y + (last ? 1.4 : 1.8), p.z]} lockX lockZ>
              {!last && m.u > 0 && (
                <Text
                  font={FONT.mono}
                  fontSize={0.42}
                  color={COLORS.graphite}
                  anchorX="center"
                  anchorY="bottom"
                  position={[0, 0.9, 0]}
                >
                  {m.at}
                </Text>
              )}
              {m.u > 0 && (
                <Text font={FONT.sans} fontSize={last ? 1.1 : 0.8} color={COLORS.ink} anchorX="center" anchorY="bottom">
                  {last ? "Aujourd'hui" : m.title}
                </Text>
              )}
            </Billboard>
          )
        })}
      </group>
    </group>
  )
}
