import * as THREE from 'three'
import { journey } from '../content'

/**
 * The career as one line in space: t = 0 is 2018, t = 1 is today.
 * Everything in the world hangs off this curve.
 */
const CONTROL: [number, number, number][] = [
  [0, 0, 0],
  [-14, 2, -50],
  [6, 4, -110],
  [22, 7, -170],
  [8, 10, -230],
  [-16, 12, -290],
  [-6, 15, -350],
  [10, 18, -420],
]

export const GROUND_Y = -7

export const curve = new THREE.CatmullRomCurve3(
  CONTROL.map((p) => new THREE.Vector3(...p)),
  false,
  'centripetal',
)

/** The part not yet written: a short dashed continuation past today. */
export const future = new THREE.CatmullRomCurve3(
  [curve.getPointAt(1), new THREE.Vector3(18, 19.5, -450), new THREE.Vector3(20, 20, -490)],
  false,
  'centripetal',
)

const START = 2018
const NOW = new Date().getFullYear() + new Date().getMonth() / 12
export const yearAt = (y: number) => (y - START) / (NOW - START)
export const years = Array.from({ length: Math.floor(NOW) - START + 1 }, (_, i) => START + i)

const up = new THREE.Vector3(0, 1, 0)

/** Horizontal normal of the line at u (points to the line's right). */
export function sideAt(u: number, out = new THREE.Vector3()) {
  return out.crossVectors(curve.getTangentAt(THREE.MathUtils.clamp(u, 0, 1)), up).normalize()
}

/**
 * The three stops sit along the line as stations of the visit. Their order is
 * thematic, not chronological: no year is shown near them.
 */
export const STOP_U = [0.2, 0.4, 0.62] as const

/** Where a stop's scene is built: beside the line, on its right-hand side. */
export function stopCentre(i: number, out = new THREE.Vector3()) {
  const u = STOP_U[i]
  return out.copy(curve.getPointAt(u)).addScaledVector(sideAt(u), 13).setY(curve.getPointAt(u).y + 2)
}

/** Only 2018 and today are dated; intermediate steps stay undated on purpose. */
export const milestones = journey.map((j, i) => ({ ...j, u: i / (journey.length - 1) }))
