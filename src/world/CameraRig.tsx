import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { flight } from '../store'
import { BRAND_SPAN, brandStakes, curve, future, sideAt } from './line'

/**
 * The camera is always placed relative to the career line: `u` along it, then
 * `back` / `side` / `h` in the line's own frame. Two chapters pull out to an
 * overview pose instead (hero, parcours) so the whole line can be read.
 */
type Key = {
  c: number
  u: number
  back?: number
  side?: number
  h?: number
  ahead?: number
  tside?: number
  /** blend toward overview pose A (hero) / B (parcours) */
  a?: number
  b?: number
}

const OVERVIEW_A = { pos: new THREE.Vector3(-34, 34, 40), target: new THREE.Vector3(6, 0, -150) }
const OVERVIEW_B = { pos: new THREE.Vector3(-92, 88, -130), target: new THREE.Vector3(8, 0, -230) }

const hold = (c: number, k: Omit<Key, 'c'>, spread = 0.2): Key[] => [
  { c: c - spread, ...k },
  { c, ...k },
  { c: c + spread, ...k },
]

const PLAN: Key[] = [
  { c: 0, u: 0, a: 1 },
  { c: 0.2, u: 0, a: 1 },
  ...hold(1, { u: 0.03, back: 12, side: -7, h: 4, ahead: 0.08, tside: -2 }),
  { c: 1.62, u: 0.105, back: 18, side: 17, h: 8, ahead: 0.05, tside: 9 },
  { c: 2.42, u: 0.6, back: 18, side: 17, h: 8, ahead: 0.05, tside: 9 },
  ...hold(3, { u: 0.66, back: 13, side: -8, h: 5, ahead: 0.06, tside: -2 }),
  ...hold(4, { u: 0.72, back: 13, side: -8, h: 5, ahead: 0.06, tside: -2 }),
  ...hold(5, { u: 0.78, back: 13, side: -8, h: 6, ahead: 0.06, tside: -2 }),
  ...hold(6, { u: 0.86, back: 13, side: -8, h: 6, ahead: 0.06, tside: -2 }),
  ...hold(7, { u: 0.95, b: 1 }, 0.25),
  { c: 7.8, u: 1, back: 11, side: -6, h: 3, ahead: 0.08, tside: -3 },
  { c: 8, u: 1, back: 11, side: -6, h: 3, ahead: 0.08, tside: -3 },
]

const DEFAULTS = { back: 12, side: -7, h: 4, ahead: 0.06, tside: -2, a: 0, b: 0 }
const FIELDS = ['u', 'back', 'side', 'h', 'ahead', 'tside', 'a', 'b'] as const
type Pose = Record<(typeof FIELDS)[number], number>

function interpolate(c: number): Pose {
  const last = PLAN.length - 1
  let i = 0
  while (i < last - 1 && c > PLAN[i + 1].c) i++
  const k0 = { ...DEFAULTS, ...PLAN[i] }
  const k1 = { ...DEFAULTS, ...PLAN[i + 1] }
  const span = k1.c - k0.c
  const raw = span > 0 ? THREE.MathUtils.clamp((c - k0.c) / span, 0, 1) : 0
  const t = raw * raw * (3 - 2 * raw)
  const out = {} as Pose
  for (const f of FIELDS) out[f] = k0[f] + (k1[f] - k0[f]) * t
  return out
}

/** Point on the line, continuing onto the dashed future past today. */
function pointAt(u: number, out: THREE.Vector3) {
  if (u <= 1) return out.copy(curve.getPointAt(Math.max(0, u)))
  return out.copy(future.getPointAt(Math.min(1, (u - 1) / 0.12)))
}

export function CameraRig() {
  const { camera, size } = useThree()
  const tmp = useMemo(
    () => ({
      p: new THREE.Vector3(),
      s: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      target: new THREE.Vector3(),
      stake: new THREE.Vector3(),
      stake2: new THREE.Vector3(),
      bp: new THREE.Vector3(),
    }),
    [],
  )

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = size.width / size.height < 0.8 ? 62 : 42
    cam.updateProjectionMatrix()
  }, [camera, size])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    flight.smooth = THREE.MathUtils.damp(flight.smooth, flight.chapter, flight.reducedMotion ? 30 : 3, dt)
    const k = interpolate(flight.smooth)
    // In the brand chapter the camera follows the index row being read.
    const inBrands = THREE.MathUtils.smoothstep(flight.smooth, 1.5, 1.7) * (1 - THREE.MathUtils.smoothstep(flight.smooth, 2.3, 2.5))
    flight.brandSmooth = THREE.MathUtils.damp(flight.brandSmooth, flight.brand, flight.reducedMotion ? 30 : 3, dt)
    const last = brandStakes.length - 1
    const bf = THREE.MathUtils.clamp(flight.brandSmooth, 0, last)
    const uBrand = BRAND_SPAN[0] + (BRAND_SPAN[1] - BRAND_SPAN[0]) * (bf / last)
    if (inBrands > 0) k.u = THREE.MathUtils.lerp(k.u, uBrand, inBrands)
    flight.u = k.u

    const u = THREE.MathUtils.clamp(k.u, 0, 1)
    pointAt(u, tmp.p)
    tmp.tan.copy(curve.getTangentAt(u))
    sideAt(u, tmp.s)
    tmp.pos
      .copy(tmp.p)
      .addScaledVector(tmp.tan, -k.back)
      .addScaledVector(tmp.s, k.side)
    tmp.pos.y += k.h
    pointAt(k.u + k.ahead, tmp.target).addScaledVector(tmp.s, k.tside)

    if (inBrands > 0) {
      // look straight at the stake of the row being read, from above the line
      const i0 = Math.floor(bf)
      const i1 = Math.min(last, i0 + 1)
      const a = brandStakes[i0]
      const b = brandStakes[i1]
      tmp.stake.set(a.base.x, a.top, a.base.z).lerp(tmp.stake2.set(b.base.x, b.top, b.base.z), bf - i0)
      pointAt(uBrand, tmp.bp)
      tmp.bp.addScaledVector(curve.getTangentAt(uBrand), -17)
      tmp.bp.y += 8
      tmp.pos.lerp(tmp.bp, inBrands)
      tmp.stake.addScaledVector(sideAt(uBrand, tmp.s), 1.2)
      tmp.target.lerp(tmp.stake, inBrands)
    }
    if (k.a > 0) {
      tmp.pos.lerp(OVERVIEW_A.pos, k.a)
      tmp.target.lerp(OVERVIEW_A.target, k.a)
    }
    if (k.b > 0) {
      tmp.pos.lerp(OVERVIEW_B.pos, k.b)
      tmp.target.lerp(OVERVIEW_B.target, k.b)
    }

    camera.position.copy(tmp.pos)
    camera.lookAt(tmp.target)
  })

  return null
}
