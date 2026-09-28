import { useSyncExternalStore } from 'react'

/**
 * Shared state between the page and the WebGL world.
 * `experience` is mutable and read every frame; `ui` changes rarely and
 * re-renders React through useUi.
 */
export const experience = {
  /** progress through each act, 0 before it, 1 after it */
  acts: [0, 0, 0, 0, 0] as number[],
  /** the same, damped by the camera: what is actually on screen */
  actsSmooth: [0, 0, 0, 0, 0] as number[],
  /** 0..1 through the opening sequence (lights switching on) */
  intro: 0,
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
}

type Ui = {
  /** index of the act at the viewport centre */
  act: number
  /** the world has rendered its first frame */
  ready: boolean
  /** the loader has left: the opening sequence can play */
  entered: boolean
  archiveOpen: boolean
  /** the reader has scrolled at least once */
  scrolled: boolean
}

let ui: Ui = { act: 0, ready: false, entered: false, archiveOpen: false, scrolled: false }
const listeners = new Set<() => void>()

export function setUi(patch: Partial<Ui>) {
  let changed = false
  for (const k in patch) if (ui[k as keyof Ui] !== patch[k as keyof Ui]) changed = true
  if (!changed) return
  ui = { ...ui, ...patch }
  listeners.forEach((l) => l())
}

export const getUi = () => ui

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
