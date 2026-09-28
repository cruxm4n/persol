/**
 * One quality profile per device class, decided once at start.
 * Mobile keeps the composition; it drops what costs and is least seen.
 */
export type Profile = {
  mobile: boolean
  dpr: [number, number]
  /** soft (PCSS) shadows on the key light */
  softShadows: boolean
  shadowMapSize: number
  /** light the poster with real spotlights, or fake it with emissive */
  spotLights: boolean
  effects: 'full' | 'lite'
  /** narrower screens need a wider lens to keep the same framing */
  fovScale: number
}

export function getProfile(): Profile {
  if (typeof window === 'undefined') return desktop
  // ?q=low forces the light profile (testing, or a slow machine)
  if (new URLSearchParams(window.location.search).get('q') === 'low') return { ...mobile, fovScale: 1 }
  const small = window.matchMedia('(max-width: 760px)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (small || coarse) {
    const portrait = window.innerHeight > window.innerWidth
    return { ...mobile, fovScale: portrait ? 1.55 : 1.1 }
  }
  return desktop
}

const desktop: Profile = {
  mobile: false,
  dpr: [1, 1.75],
  softShadows: true,
  shadowMapSize: 2048,
  spotLights: true,
  effects: 'full',
  fovScale: 1,
}

const mobile: Profile = {
  mobile: true,
  dpr: [1, 1.5],
  softShadows: false,
  shadowMapSize: 1024,
  spotLights: false,
  effects: 'lite',
  fovScale: 1.5,
}
