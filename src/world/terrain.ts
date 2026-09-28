/** Deterministic procedural landscape shared by the terrain mesh and everything placed on it. */

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

function noise(x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

function fbm(x: number, y: number) {
  let v = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < 5; i++) {
    v += amp * noise(x * f, y * f)
    f *= 2.03
    amp *= 0.5
  }
  return v
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Flat landing zones: [x, z, radius] */
const PADS: [number, number, number][] = [
  [0, 0, 16],
  [0, -560, 18],
]

/** Flat rectangles: [xMin, xMax, zMin, zMax] */
const STRIPS: [number, number, number, number][] = [[-4, 18, -436, -374]]

export const TERRAIN = {
  width: 460,
  zStart: 90,
  zEnd: -680,
}

export function heightAt(x: number, z: number) {
  const corridorHalf = 24 + 9 * Math.sin(z * 0.017) + 5 * Math.sin(z * 0.043 + 1.3)
  const outside = smoothstep(corridorHalf, corridorHalf + 46, Math.abs(x))
  const ridges = Math.pow(fbm(x * 0.017 + 11.3, z * 0.017 - 4.1), 1.7)
  const floor = (fbm(x * 0.05, z * 0.05) - 0.5) * 2.4

  let pad = 1
  for (const [px, pz, r] of PADS) {
    const d = Math.hypot(x - px, z - pz)
    pad = Math.min(pad, smoothstep(r, r + 14, d))
  }
  for (const [x0, x1, z0, z1] of STRIPS) {
    const dx = Math.max(x0 - x, 0, x - x1)
    const dz = Math.max(z0 - z, 0, z - z1)
    pad = Math.min(pad, smoothstep(0, 12, Math.hypot(dx, dz)))
  }
  return floor * pad + outside * ridges * 62 * (0.35 + 0.65 * pad)
}
