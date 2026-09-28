import { useSyncExternalStore } from 'react'

/**
 * Shared state between the page and the WebGL world.
 * `experience` is mutable and read every frame; `ui` changes rarely and
 * re-renders React through useUi.
 */
export const experience = {
  /** 0..1 along the whole route, straight from the scroll */
  progress: 0,
  /** the same, damped by the camera: what is actually on screen */
  smooth: 0,
  /** 0..1 through the opening (the camera settling onto the island) */
  intro: 0,
  reducedMotion: false,
}

type Ui = {
  /** index of the zone on screen */
  zone: number
  /** the world has rendered its first frames */
  ready: boolean
  /** the loader has left */
  entered: boolean
  scrolled: boolean
}

let ui: Ui = { zone: 0, ready: false, entered: false, scrolled: false }
const listeners = new Set<() => void>()

export function setUi(patch: Partial<Ui>) {
  let changed = false
  for (const k in patch) if (ui[k as keyof Ui] !== patch[k as keyof Ui]) changed = true
  if (!changed) return
  ui = { ...ui, ...patch }
  listeners.forEach((l) => l())
}

export function useUi<T>(select: (s: Ui) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => select(ui),
    () => select(ui),
  )
}
