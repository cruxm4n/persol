import * as THREE from 'three'
import { flight } from '../store'

export const FONT = {
  sans: 'fonts/archivo-latin-500-normal.woff',
  mono: 'fonts/martian-mono-latin-400-normal.woff',
}

/** 1 when chapter `i` is centred, fading to 0 at `spread` chapters away. */
export function presence(i: number, spread = 1) {
  const d = Math.abs(flight.smooth - i)
  const x = THREE.MathUtils.clamp(1 - d / spread, 0, 1)
  return x * x * (3 - 2 * x)
}

/** 1 while stop `i`'s section fills the screen, easing in and out at its edges. */
export function stopWeight(i: number) {
  const p = flight.stopsSmooth[i]
  return THREE.MathUtils.smoothstep(p, 0, 0.12) * (1 - THREE.MathUtils.smoothstep(p, 0.9, 1))
}

/** Strongest stop presence: dated marks step aside while any stop is on screen. */
export function anyStop() {
  return Math.max(stopWeight(0), stopWeight(1), stopWeight(2))
}

/**
 * Fractional index along `marks` for progress `p`, easing hard into each mark:
 * the camera travels between marks and holds on them (precise stops).
 */
export function holdAlong(marks: number[], p: number, hold = 0.3) {
  if (marks.length < 2) return 0
  if (p <= marks[0]) return 0
  const last = marks.length - 1
  if (p >= marks[last]) return last
  let i = 0
  while (i < last - 1 && p > marks[i + 1]) i++
  const t = (p - marks[i]) / (marks[i + 1] - marks[i])
  return i + THREE.MathUtils.smoothstep(t, hold, 1 - hold)
}
