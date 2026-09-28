import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { flight } from '../store'
import { holdAlong, stopWeight } from './util'
import { attention, systems } from './stops/layout'
import { STOP_U, curve, future, sideAt, stopCentre } from './line'

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
// Parcours: high on the line's right, the career read from the side, 2018 on the left
const OVERVIEW_B = { pos: new THREE.Vector3(255, 175, -330), target: new THREE.Vector3(4, 0, -215) }

const hold = (c: number, k: Omit<Key, 'c'>, spread = 0.2): Key[] => [
  { c: c - spread, ...k },
  { c, ...k },
  { c: c + spread, ...k },
]

/** Chapters: 0 hero, 1 brands, 2 profile, 3–5 stops, 6 parcours, 7 contact. */
const STOP_CHAPTER = 3
const PLAN: Key[] = [
  { c: 0, u: 0, a: 1 },
  { c: 0.2, u: 0, a: 1 },
  ...hold(1, { u: 0.02, back: 14, side: -9, h: 6, ahead: 0.1, tside: -1 }),
  ...hold(2, { u: 0.05, back: 12, side: -7, h: 4, ahead: 0.08, tside: -2 }),
  // each stop's own camera takes over while its section is on screen (see below)
  ...STOP_U.flatMap((u, i) => hold(STOP_CHAPTER + i, { u, back: 14, side: -8, h: 6, ahead: 0.05, tside: 6 }, 0.3)),
  ...hold(6, { u: 0.95, b: 1 }, 0.25),
  { c: 6.8, u: 1, back: 11, side: -6, h: 3, ahead: 0.08, tside: -3 },
  { c: 7, u: 1, back: 11, side: -6, h: 3, ahead: 0.08, tside: -3 },
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

const AXO_FOV = 10
const ISO_ELEVATION = Math.atan(1 / Math.SQRT2)

export function CameraRig() {
  const { camera, size, scene } = useThree()
  const base = useMemo(() => ({ fov: 42 }), [])
  const tmp = useMemo(
    () => ({
      p: new THREE.Vector3(),
      s: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      target: new THREE.Vector3(),
      stopPos: new THREE.Vector3(),
      stopLook: new THREE.Vector3(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      network: stopCentre(1),
    }),
    [],
  )

  useEffect(() => {
    base.fov = size.width / size.height < 0.8 ? 62 : 42
  }, [base, size])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const rate = flight.reducedMotion ? 30 : 3
    flight.smooth = THREE.MathUtils.damp(flight.smooth, flight.chapter, rate, dt)
    for (let i = 0; i < 3; i++) flight.stopsSmooth[i] = THREE.MathUtils.damp(flight.stopsSmooth[i], flight.stops[i], rate, dt)
    const k = interpolate(flight.smooth)

    const w = [stopWeight(0), stopWeight(1), stopWeight(2)]
    w.forEach((wi, i) => {
      if (wi > 0) k.u = THREE.MathUtils.lerp(k.u, STOP_U[i], wi)
    })
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

    let fovTarget = base.fov
    let fogExtra = 0

    // Stop 01: an editorial travelling on a rail facing the panels, holding on each
    if (w[0] > 0) {
      const p = flight.stopsSmooth[0]
      const marks = flight.marks[0]
      const panels = attention.panels
      const f = marks.length ? holdAlong(marks, p) : 0
      const i0 = Math.min(panels.length - 1, Math.floor(f))
      const i1 = Math.min(panels.length - 1, i0 + 1)
      const t = f - i0
      const a = panels[i0]
      const b = panels[i1]
      tmp.a.copy(a.centre).lerp(b.centre, t)
      let frame = THREE.MathUtils.lerp(a.frame, b.frame, t)
      // push in on the main panel while its case study is read
      if (i0 === 0 && t < 0.5) frame -= 3 * flight.cases[0] * (1 - t * 2)
      // approach: wide and slightly upstream before the first stop
      const approach = marks.length ? 1 - THREE.MathUtils.smoothstep(p, 0.04, marks[0]) : 1
      tmp.stopLook.copy(tmp.a)
      tmp.stopPos
        .copy(tmp.a)
        .addScaledVector(attention.normal, frame + approach * 16)
        .addScaledVector(attention.along, -approach * 14)
      tmp.stopPos.y += 0.6 + approach * 7
      tmp.pos.lerp(tmp.stopPos, w[0])
      tmp.target.lerp(tmp.stopLook, w[0])
    }

    // Stop 02: organic orbit around the network, a long arc breathing in and out
    if (w[1] > 0) {
      const p = flight.stopsSmooth[1]
      const tan = curve.getTangentAt(STOP_U[1])
      const theta = Math.atan2(-tan.x, -tan.z) + Math.PI * 0.15 + p * Math.PI * 0.7
      const radius = 36 - 7 * Math.sin(Math.PI * p)
      const height = 9 + 6 * Math.sin(Math.PI * 2 * p * 0.75)
      tmp.stopPos.set(Math.sin(theta) * radius, height, Math.cos(theta) * radius).add(tmp.network)
      tmp.stopLook.copy(tmp.network)
      tmp.stopLook.y -= 1
      tmp.pos.lerp(tmp.stopPos, w[1])
      tmp.target.lerp(tmp.stopLook, w[1])
    }

    // Stop 03: a dolly zoom into axonometry, then quarter turns, one per step
    if (w[2] > 0) {
      const p = flight.stopsSmooth[2]
      const marks = flight.marks[2]
      const dolly = w[2] * THREE.MathUtils.smoothstep(p, 0.02, 0.16)
      const fov = THREE.MathUtils.lerp(base.fov, AXO_FOV, dolly)
      // keep the stack the same size on screen while the lens narrows
      const dist = 15 / Math.tan(THREE.MathUtils.degToRad(fov / 2))
      const steps = marks.length ? [marks[0], ...marks.slice(0, -1).map((m, i) => (m + marks[i + 1]) / 2), ...marks.slice(1)] : []
      const turn = steps.length > 1 ? holdAlong([...new Set(steps)].sort((x, y) => x - y), p, 0.25) : 0
      const az = systems.rotationY + Math.PI / 4 + (turn * Math.PI) / 2
      tmp.stopLook.copy(systems.centre)
      tmp.stopPos
        .set(
          Math.cos(ISO_ELEVATION) * Math.sin(az),
          Math.sin(ISO_ELEVATION),
          Math.cos(ISO_ELEVATION) * Math.cos(az),
        )
        .multiplyScalar(dist)
        .add(systems.centre)
      tmp.pos.lerp(tmp.stopPos, w[2])
      tmp.target.lerp(tmp.stopLook, w[2])
      fovTarget = THREE.MathUtils.lerp(base.fov, fov, w[2])
      fogExtra = Math.max(0, dist - 30) * w[2]
    }

    if (k.a > 0) {
      tmp.pos.lerp(OVERVIEW_A.pos, k.a)
      tmp.target.lerp(OVERVIEW_A.target, k.a)
    }
    if (k.b > 0) {
      tmp.pos.lerp(OVERVIEW_B.pos, k.b)
      tmp.target.lerp(OVERVIEW_B.target, k.b)
      fogExtra = Math.max(fogExtra, 320 * k.b)
    }

    camera.position.copy(tmp.pos)
    camera.lookAt(tmp.target)

    // lens: narrower for the axonometry; picture shifted away from the text column
    const cam = camera as THREE.PerspectiveCamera
    const wide = size.width / size.height > 1.1
    // filmOffset is in film millimetres: scale it by the lens so the shift stays
    // the same fraction of the frame at any field of view
    const halfWidth = Math.tan(THREE.MathUtils.degToRad(fovTarget / 2)) * cam.aspect
    const film = wide ? 0.42 * (w[1] - w[0] - w[2]) * cam.getFilmWidth() * halfWidth : 0
    if (Math.abs(cam.fov - fovTarget) > 1e-3 || Math.abs(cam.filmOffset - film) > 1e-3) {
      cam.fov = fovTarget
      cam.filmOffset = film
      cam.far = 600 + fogExtra
      cam.updateProjectionMatrix()
    }
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = 50 + fogExtra
      scene.fog.far = 250 + fogExtra
    }
  })

  return null
}
