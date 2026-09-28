/**
 * One quality profile per device class, decided once at start.
 * Mobile is not the desktop shrunk: it walks its own, closer camera path
 * through a lighter island (fewer trees, flowers, clouds; no post effects).
 */
export type Profile = {
  mobile: boolean
  /** portrait screens get their own camera path */
  portrait: boolean
  dpr: [number, number]
  shadows: boolean
  shadowMapSize: number
  /** 0..1: how much small vegetation and detail is scattered */
  density: number
  effects: 'full' | 'lite'
}

export function getProfile(): Profile {
  if (typeof window === 'undefined') return desktop
  const portrait = window.innerHeight > window.innerWidth
  // ?q=low forces the light profile (testing, or a slow machine)
  if (new URLSearchParams(window.location.search).get('q') === 'low') return { ...mobile, portrait }
  const small = window.matchMedia('(max-width: 760px)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (small || coarse) return { ...mobile, portrait }
  return { ...desktop, portrait }
}

const desktop: Profile = {
  mobile: false,
  portrait: false,
  dpr: [1, 1.75],
  shadows: true,
  shadowMapSize: 2048,
  density: 1,
  effects: 'full',
}

const mobile: Profile = {
  mobile: true,
  portrait: true,
  dpr: [1, 1.5],
  shadows: true,
  shadowMapSize: 1024,
  density: 0.45,
  effects: 'lite',
}
