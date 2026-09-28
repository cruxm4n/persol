import * as THREE from 'three'
import { DESKTOP_PATH, PORTRAIT_PATH } from './camera-paths'
import { ZONES } from './scene-config'

/**
 * The island's outline and the path across it. Everything placed on the
 * island (trees, flowers, rocks) asks these helpers where it may stand.
 */

const RX = 18
const RZ = 31

/** Distance from the centre to the shore in the direction θ (x = cos, z = sin). */
export function shoreRadius(theta: number) {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const ellipse = 1 / Math.sqrt((c * c) / (RX * RX) + (s * s) / (RZ * RZ))
  return ellipse * (1 + 0.055 * Math.sin(3 * theta + 1.2) + 0.035 * Math.sin(5 * theta + 2.1) + 0.02 * Math.sin(9 * theta))
}

/** 0 at the centre, 1 on the grass edge, >1 outside. */
export function islandDistance(x: number, z: number) {
  const r = Math.hypot(x, z)
  return r / shoreRadius(Math.atan2(z, x))
}

/** The outline as a shape in the XY plane (y = −z world), ready to extrude flat. */
export function islandShape(scale = 1, points = 96) {
  const pts: THREE.Vector2[] = []
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2
    const r = shoreRadius(t) * scale
    pts.push(new THREE.Vector2(Math.cos(t) * r, -Math.sin(t) * r))
  }
  return new THREE.Shape(pts)
}

/** The sandy path, from the dock to the quay, past every place. */
export const PATH_POINTS: [number, number][] = [
  [2, 27],
  [1, 21],
  [-3, 16.5],
  [-6.5, 13.5],
  [-3.5, 9],
  [2, 5],
  [5.5, 2],
  [4, -3],
  [-1, -7],
  [-3.5, -10.5],
  [-1, -14],
  [4, -17],
  [1, -19],
  [-2.5, -23],
  [-1.5, -27],
  [0, -28.5],
]

export const pathCurve = new THREE.CatmullRomCurve3(
  PATH_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  'centripetal',
)

const pathSamples = pathCurve.getSpacedPoints(240)

export function distanceToPath(x: number, z: number) {
  let d = Infinity
  for (const p of pathSamples) d = Math.min(d, Math.hypot(p.x - x, p.z - z))
  return d
}

/** Low camera positions along both paths: nothing tall may stand there. */
const cameraSamples = [DESKTOP_PATH, PORTRAIT_PATH].flatMap((keys) => {
  const c = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal')
  return c.getSpacedPoints(160).filter((p) => p.y < 14)
})

export function distanceToCamera(x: number, z: number) {
  let d = Infinity
  for (const p of cameraSamples) d = Math.min(d, Math.hypot(p.x - x, p.z - z))
  return d
}

/** Room kept clear around each place, in metres. */
const PLACE_RADIUS: Record<string, number> = { arrival: 5, studio: 6.5, attention: 8, community: 8.5, system: 8, contact: 6 }

/** Landmarks that are not places of the route but need their ground: [x, z, radius]. */
export const LANDMARKS = {
  lighthouse: [11.5, 19.5, 3.5],
  home: [5.5, -25, 4],
  dockFoot: [2, 29, 2.5],
} as const

export function distanceToPlaces(x: number, z: number) {
  let d = Infinity
  for (const zone of ZONES) d = Math.min(d, Math.hypot(zone.at[0] - x, zone.at[2] - z) - PLACE_RADIUS[zone.id])
  for (const [lx, lz, r] of Object.values(LANDMARKS)) d = Math.min(d, Math.hypot(lx - x, lz - z) - r)
  return d
}

/** A small seeded random, so the island is the same on every visit. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
}

/** Scatter `count` points on the grass that pass `ok`. */
export function scatter(count: number, seed: number, ok: (x: number, z: number) => boolean, maxTries = count * 40) {
  const r = rng(seed)
  const out: { x: number; z: number; r: () => number }[] = []
  for (let i = 0; i < maxTries && out.length < count; i++) {
    const t = r() * Math.PI * 2
    const d = Math.sqrt(r()) * 0.94
    const x = Math.cos(t) * shoreRadius(t) * d
    const z = Math.sin(t) * shoreRadius(t) * d
    if (ok(x, z)) out.push({ x, z, r })
  }
  return out
}
