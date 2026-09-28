/**
 * Île Signal: one small island, walked along a single path by scrolling.
 * Units are metres. The island lies along z, the dock in the south (+z), the
 * quay in the north (−z), where the sun sets at the end of the route.
 */

import { DA, derived } from './da'

export type ZoneId = 'arrival' | 'studio' | 'attention' | 'community' | 'system' | 'contact'

export type Zone = {
  id: ZoneId
  number: string
  title: string
  /** share of the whole route, 0..1 */
  range: [number, number]
  /** while the camera holds on the place: when the text is on screen */
  hold: [number, number]
  /** centre of the place on the island */
  at: [number, number, number]
}

export const ZONES: Zone[] = [
  { id: 'arrival', number: '01', title: 'Accueil', range: [0, 0.13], hold: [0, 0.055], at: [2, 0, 24] },
  { id: 'studio', number: '02', title: 'Expertise', range: [0.13, 0.29], hold: [0.16, 0.26], at: [-11, 0, 11] },
  { id: 'attention', number: '03', title: 'Chiffres clés', range: [0.29, 0.47], hold: [0.32, 0.43], at: [10, 0, 1] },
  { id: 'community', number: '04', title: 'Références', range: [0.47, 0.65], hold: [0.5, 0.61], at: [-10, 0, -11] },
  { id: 'system', number: '05', title: 'Stack technique', range: [0.65, 0.83], hold: [0.68, 0.79], at: [9, 0, -18] },
  { id: 'contact', number: '06', title: 'Contact', range: [0.83, 1], hold: [0.9, 1.01], at: [0, 0, -30] },
]

export const zoneAt = (p: number) => {
  for (let i = ZONES.length - 1; i >= 0; i--) if (p >= ZONES[i].range[0]) return i
  return 0
}

/** Page length in viewport heights: the whole walk. */
export const ROUTE_LENGTH = { desktop: 11, mobile: 13 }

/** Heights of the island's layers. */
export const GROUND = {
  water: 0,
  sand: 0.35,
  grass: 0.85,
}

/**
 * The scene's colours, by role. They all come from the official palette in
 * lib/da.ts (directly, or derived from it); the lighthouse's signal red is
 * the one accent outside it.
 */
const D = derived()
export const PALETTE = {
  sand: DA.cliff,
  sandDeep: D.woodDark,
  path: DA.path,
  grass: DA.grass,
  grassDeep: D.grassDeep,
  leaf: DA.foliage,
  leafLight: D.foliageLight,
  leafDeep: D.foliageDeep,
  trunk: DA.trunk,
  lagoon: DA.sea,
  lagoonDeep: DA.sea,
  wall: D.wall,
  wallWarm: D.wallWarm,
  roof: DA.roofs,
  roofSage: D.roofSage,
  roofTeal: D.roofTeal,
  roofSand: D.roofSand,
  wood: D.wood,
  woodDark: D.woodDark,
  stone: D.stone,
  ink: D.ink,
  cloud: D.cloud,
  lamp: D.lamp,
  red: '#e0301e',
}

/** Sky and light from morning (0) to sunset (1). */
export const DAYLIGHT = {
  morning: { zenith: '#9cc9d6', horizon: '#f6e6cf', sun: '#fff1d6', sunIntensity: 2.6, hemi: 1.15, fog: '#e9e3d4' },
  sunset: { zenith: '#6f7fa6', horizon: '#f5b98a', sun: '#ffb27a', sunIntensity: 1.9, hemi: 0.7, fog: '#e8b894' },
}
