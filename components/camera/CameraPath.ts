import * as THREE from 'three'
import type { CameraKey } from '@/lib/camera-paths'
import { easeInOut } from '@/lib/motion-config'

export type CameraSample = { pos: THREE.Vector3; target: THREE.Vector3; fov: number; blur: number }

/**
 * Between two keys the camera travels on a Catmull-Rom spline (no corners);
 * local time is eased so it leaves slowly and lands softly on every key.
 */
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
    out.blur = a.blur + (b.blur - a.blur) * t
    return out
  }
}
