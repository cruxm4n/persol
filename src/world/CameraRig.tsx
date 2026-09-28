import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { flight, getUi } from '../store'
import { NETWORK_EYE, MISSION_TARGET, MISSION_VIEW, SCREENS } from './anchors'
import { heightAt } from './terrain'

type V3 = readonly [number, number, number]
type Key = [c: number, pos: V3, target: V3]

/** Flight plan: one pose per chapter (integers) plus in-between waypoints. */
const PLAN: Key[] = [
  [0, [0, 3.2, 17], [0, 1.6, 0]],
  [0.5, [2, 10, -22], [4, 9, -70]],
  [1, NETWORK_EYE, [-2.5, 10.5, -78]],
  [1.5, [-3, 12, -104], [-3, 9, -140]],
  [2, [-8, 8.8, -148], [-3, 8.5, -190]],
  [2.5, [-5, 11, -212], [-6, 7, -250]],
  [3, MISSION_VIEW.pos, MISSION_TARGET],
  [3.5, [-18, 9, -290], [-3, 9, -330]],
  [4, [-22, 4.2, -309], [-5, 13, -330]],
  [5, [-24, 35, -308], [-3, 12, -334]],
  [5.5, [-8, 40, -362], [0, 0, -398]],
  [6, [-7, 36, -373], [1, 0, -404]],
  [6.5, [-2, 27, -424], [6, 4, -470]],
  [7, [-8, 21, -440], [4, 3, -478]],
  [7.5, [-5, 12, -510], [-2, 5, -560]],
  [8, [-6.5, 5, -531], [-6, 5.5, -560]],
]

const P = PLAN.map((k) => new THREE.Vector3(...k[1]))
const T = PLAN.map((k) => new THREE.Vector3(...k[2]))

function catmull(pts: THREE.Vector3[], i: number, t: number, out: THREE.Vector3) {
  const p0 = pts[Math.max(0, i - 1)]
  const p1 = pts[i]
  const p2 = pts[Math.min(pts.length - 1, i + 1)]
  const p3 = pts[Math.min(pts.length - 1, i + 2)]
  const t2 = t * t
  const t3 = t2 * t
  for (const axis of ['x', 'y', 'z'] as const) {
    out[axis] =
      0.5 *
      (2 * p1[axis] +
        (-p0[axis] + p2[axis]) * t +
        (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 +
        (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t3)
  }
  return out
}

/** Slow down around each chapter so the camera "holds" while text is read. */
function dwell(c: number) {
  const i = Math.floor(c)
  const f = c - i
  return i + f - (Math.sin(2 * Math.PI * f) / (2 * Math.PI)) * 0.82
}

function sample(c: number, pos: THREE.Vector3, target: THREE.Vector3) {
  const last = PLAN.length - 1
  if (c >= PLAN[last][0]) {
    pos.copy(P[last])
    target.copy(T[last])
    return
  }
  let i = 0
  while (i < last - 1 && c > PLAN[i + 1][0]) i++
  const span = PLAN[i + 1][0] - PLAN[i][0]
  const t = THREE.MathUtils.clamp((c - PLAN[i][0]) / span, 0, 1)
  catmull(P, i, t, pos)
  catmull(T, i, t, target)
}

export function CameraRig() {
  const { camera, size } = useThree()
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      target: new THREE.Vector3(),
      look: new THREE.Vector3(0, 1.6, 0),
      focus: new THREE.Vector3(),
      right: new THREE.Vector3(),
      prevX: 0,
      bank: 0,
    }),
    [],
  )

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = size.width / size.height < 0.8 ? 64 : 48
    cam.updateProjectionMatrix()
  }, [camera, size])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const prev = flight.smooth
    flight.smooth = THREE.MathUtils.damp(flight.smooth, flight.chapter, flight.reducedMotion ? 20 : 3.2, dt)
    flight.velocity = (flight.smooth - prev) / Math.max(dt, 1e-3)

    const c = dwell(flight.smooth)
    sample(c, tmp.pos, tmp.target)

    // Project focus: lean toward the selected screen.
    const fp = getUi().focusProject
    const nearProjects = Math.max(0, 1 - Math.abs(flight.smooth - 3) * 2)
    if (fp !== null && nearProjects > 0) {
      const s = SCREENS[fp]
      tmp.focus.set(s.x, s.y + 3, s.z)
      tmp.target.lerp(tmp.focus, 0.45 * nearProjects)
    }

    // Drone feel: hover, pointer parallax, banking.
    const t = clock.elapsedTime
    const hover = flight.reducedMotion ? 0 : 1
    tmp.right.subVectors(tmp.target, tmp.pos).cross(camera.up).normalize()
    tmp.pos.addScaledVector(tmp.right, flight.pointerX * 0.9 * hover)
    tmp.pos.y += (-flight.pointerY * 0.55 + Math.sin(t * 0.9) * 0.18) * hover
    tmp.pos.x += Math.sin(t * 0.53) * 0.12 * hover

    camera.position.lerp(tmp.pos, 1 - Math.exp(-dt * 6))
    tmp.look.lerp(tmp.target, 1 - Math.exp(-dt * 6))
    camera.lookAt(tmp.look)

    const lateral = (camera.position.x - tmp.prevX) / Math.max(dt, 1e-3)
    tmp.prevX = camera.position.x
    tmp.bank = THREE.MathUtils.damp(tmp.bank, THREE.MathUtils.clamp(-lateral * 0.006, -0.08, 0.08), 3, dt)
    camera.rotateZ(tmp.bank * hover)

    flight.altitude = camera.position.y - heightAt(camera.position.x, camera.position.z)
    tmp.right.subVectors(tmp.look, camera.position)
    flight.heading = (THREE.MathUtils.radToDeg(Math.atan2(tmp.right.x, -tmp.right.z)) + 360) % 360
    flight.speed = Math.abs(flight.velocity) * 60
  })

  return null
}
