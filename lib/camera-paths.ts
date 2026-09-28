import * as THREE from 'three'
import { easeInOut } from './motion-config'
import { PANEL_Y } from './scene-config'

/**
 * Camera paths are authored as keys along an act's progress. Between two keys
 * the camera travels on a Catmull-Rom spline (no corners), and the local time
 * is eased so it leaves slowly and lands softly on every key: each key is a
 * composed frame the reader can rest on.
 */
export type CameraKey = {
  p: number
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
  /** tilt-shift strength at this key: 0 sharp, 1 strong miniature effect */
  miniature: number
}

const Y = PANEL_Y

/** Act 01 — Signal: from the poster, back to the model, round it, towards Act 02. */
export const SIGNAL_PATH: CameraKey[] = [
  // the poster fills the frame: nothing tells yet that it is small
  { p: 0, pos: [0.5, Y + 0.25, 11.4], target: [0.3, Y, 0], fov: 30, miniature: 0 },
  // step back: the billboard, its lamps, its catwalk
  { p: 0.26, pos: [9.5, Y + 3.6, 21], target: [0, Y - 1.4, 0], fov: 30, miniature: 0.35 },
  // the reveal: it stands on a plinth, on a drafting table, at 1:50
  { p: 0.52, pos: [24, Y + 15, 41], target: [-1, 3, 1.5], fov: 28, miniature: 0.7 },
  // round the back, low: the next act is waiting in the dark
  { p: 0.78, pos: [-30, Y + 2.4, 17], target: [-3, 6, -16], fov: 30, miniature: 0.8 },
  // lean in towards it
  { p: 1, pos: [-14, Y + 0.5, -5], target: [-5, 6, -32], fov: 36, miniature: 0.5 },
]

/** Where the camera starts before the opening sequence pulls it to the first key. */
export const SIGNAL_INTRO = { pos: [0.2, Y + 0.1, 8.4] as [number, number, number] }

export type CameraSample = { pos: THREE.Vector3; target: THREE.Vector3; fov: number; miniature: number }

export function makeSampler(keys: CameraKey[]) {
  const pos = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal')
  const tgt = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.target)), false, 'centripetal')
  const n = keys.length - 1

  return (p: number, out: CameraSample) => {
    let i = 0
    while (i < n - 1 && p > keys[i + 1].p) i++
    const a = keys[i]
    const b = keys[i + 1]
    const t = easeInOut(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))))
    const u = (i + t) / n
    pos.getPoint(u, out.pos)
    tgt.getPoint(u, out.target)
    out.fov = a.fov + (b.fov - a.fov) * t
    out.miniature = a.miniature + (b.miniature - a.miniature) * t
    return out
  }
}
