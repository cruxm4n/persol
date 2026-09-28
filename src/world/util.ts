import * as THREE from 'three'
import { flight } from '../store'

export const FONT = {
  serif: 'fonts/instrument-serif-latin-400-normal.woff',
  serifItalic: 'fonts/instrument-serif-latin-400-italic.woff',
  mono: 'fonts/jetbrains-mono-latin-500-normal.woff',
  sans: 'fonts/inter-tight-latin-600-normal.woff',
}

/** 1 when chapter `i` is centred, fading to 0 at `spread` chapters away. */
export function presence(i: number, spread = 1) {
  const d = Math.abs(flight.smooth - i)
  const x = THREE.MathUtils.clamp(1 - d / spread, 0, 1)
  return x * x * (3 - 2 * x)
}

/** Progress through a window of the flight, clamped 0..1. */
export function progress(from: number, to: number) {
  return THREE.MathUtils.clamp((flight.smooth - from) / (to - from), 0, 1)
}

type Fadeable = THREE.Material & { opacity: number; userData: { baseOpacity?: number } }

/** Multiply the opacity of every material under `root` by `k`. */
export function fadeTree(root: THREE.Object3D, k: number) {
  root.traverse((o) => {
    // troika text: fade through its own opacity channel only
    const t = o as unknown as { fillOpacity?: number; userData: { baseFill?: number } }
    if (typeof t.fillOpacity === 'number') {
      if (t.userData.baseFill === undefined) t.userData.baseFill = t.fillOpacity
      t.fillOpacity = t.userData.baseFill * k
      return
    }
    const m = (o as THREE.Mesh).material as Fadeable | Fadeable[] | undefined
    if (!m) return
    for (const mat of Array.isArray(m) ? m : [m]) {
      if (mat.userData.baseOpacity === undefined) {
        mat.userData.baseOpacity = mat.opacity
        mat.transparent = true
        mat.needsUpdate = true
      }
      mat.opacity = mat.userData.baseOpacity * k
    }
  })
  root.visible = k > 0.002
}

export const glow = (hex: string, k: number) => new THREE.Color(hex).multiplyScalar(k)

let dot: THREE.Texture | null = null
/** Soft round sprite so point clouds read as lights, not squares. */
export function dotTexture() {
  if (dot) return dot
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.9)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  dot = new THREE.CanvasTexture(c)
  return dot
}
