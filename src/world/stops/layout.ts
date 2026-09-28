import * as THREE from 'three'
import { stops } from '../../lib/portfolio-data'
import { GROUND_Y, STOP_U, curve, sideAt, stopCentre } from '../line'

/** Horizontal tangent of the line at u. */
function flatTangent(u: number) {
  return curve.getTangentAt(u).setY(0).normalize()
}

/* ---------- Stop 01: panels hung along the line ---------- */

export type PanelSpot = {
  /** centre of the panel */
  centre: THREE.Vector3
  width: number
  height: number
  /** how far the camera stands back to frame it */
  frame: number
}

const A_U = STOP_U[0]
export const attention = (() => {
  const line = curve.getPointAt(A_U)
  const side = sideAt(A_U)
  const tan = flatTangent(A_U)
  const origin = line.clone().addScaledVector(side, 10)
  // the panels face the line: the reader stands on the line to look at them
  const normal = side.clone().negate()
  const rotationY = Math.atan2(normal.x, normal.z)
  const bottom = line.y - 2.2
  const sizes = stops[0].projects.map((_, i) => (i === 0 ? { w: 9, h: 6.2 } : { w: 5.4, h: 3.8 }))
  let s = 0
  const panels: PanelSpot[] = sizes.map((z, i) => {
    if (i > 0) s += sizes[i - 1].w / 2 + 2.6 + z.w / 2
    return {
      centre: origin.clone().addScaledVector(tan, -s).setY(bottom + z.h / 2),
      width: z.w,
      height: z.h,
      frame: i === 0 ? 16.5 : 10,
    }
  })
  // seen from the line, panels run left to right: the reading direction is -tangent
  const along = tan.clone().negate()
  return { line, side, tan, along, normal, rotationY, panels, bottom }
})()

/* ---------- Stop 03: a workflow as an exploded stack of plates ---------- */

export const PLATES = ['Brief', 'Production', 'Validation', 'Diffusion', 'Reporting']
export const PLATE = { w: 10, d: 7 }

export const systems = (() => {
  const centre = stopCentre(2)
  const tan = flatTangent(STOP_U[2])
  const rotationY = Math.atan2(tan.x, tan.z)
  // exit: the plates lie down side by side on the ground, as a plan
  const ground = PLATES.map((_, i) =>
    centre
      .clone()
      .addScaledVector(tan, (i - (PLATES.length - 1) / 2) * (PLATE.d + 1.5))
      .setY(GROUND_Y + 0.06),
  )
  return { centre, tan, rotationY, ground, base: centre.y - 4 }
})()

/** Vertical gap between plates for a given explosion 0..1. */
export const plateGap = (explode: number) => 0.5 + 3.3 * explode
