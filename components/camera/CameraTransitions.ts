import { ZONES, type ZoneId } from '@/lib/scene-config'
import { clamp01, smooth } from '@/lib/motion-config'

/**
 * How far the walk is through a zone, 0 before it and 1 after it.
 * Places use it to wake up as the camera arrives (posters turn, lights come
 * on, modules assemble) without any say in where the camera goes.
 */
export function zoneProgress(p: number, id: ZoneId) {
  const z = ZONES.find((z) => z.id === id)!
  return clamp01((p - z.range[0]) / (z.range[1] - z.range[0]))
}

/** 0 → 1 over the first part of the zone's hold: "the place is waking up". */
export function wake(p: number, id: ZoneId, length = 0.6) {
  const z = ZONES.find((z) => z.id === id)!
  const start = z.range[0]
  const end = z.hold[0] + (z.hold[1] - z.hold[0]) * length
  return smooth(clamp01((p - start) / (end - start)))
}

/** Time of day along the route: morning (0) to sunset (1), held until the workshop. */
export function daylight(p: number) {
  return smooth(clamp01((p - 0.55) / 0.4))
}
