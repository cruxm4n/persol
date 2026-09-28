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
