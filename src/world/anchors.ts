import { heightAt } from './terrain'

const ground = (x: number, z: number) => heightAt(x, z)

export const LAUNCH = { x: 0, z: 0 }
export const NETWORK = { x: 3, y: 11, z: -78 }
export const NETWORK_EYE = [-14, 12, -52] as const
export const DISTRICT = { zStart: -118, zEnd: -222 }

/** Camera pose for the missions chapter; the screens are laid out on an arc around it. */
export const MISSION_VIEW = { pos: [-12, 7, -242] as const, yaw: Math.PI - 0.3 }
const VIEW_DIST = 26
export const MISSION_TARGET = [
  MISSION_VIEW.pos[0] + Math.sin(MISSION_VIEW.yaw) * VIEW_DIST,
  6.4,
  MISSION_VIEW.pos[2] + Math.cos(MISSION_VIEW.yaw) * VIEW_DIST,
] as const

export const SCREENS = [0, 1, 2].map((i) => {
  const a = MISSION_VIEW.yaw - (0.07 + i * 0.235)
  const d = 23 + i * 1.5
  const x = MISSION_VIEW.pos[0] + Math.sin(a) * d
  const z = MISSION_VIEW.pos[2] + Math.cos(a) * d
  const g = ground(x, z)
  return { x, z, g, y: Math.max(g + 2.2, 4.6 + [0.6, -0.4, 1.1][i]) }
})

export const STRATA = { x: 4, z: -332 }
export const RUNWAY = { x: 7, z: -405 }
export const TRAJECTORY = { zStart: -446, zEnd: -512 }
export const LANDING = { x: 4, z: -560 }

export { ground }
