import { useSyncExternalStore } from 'react'

/**
 * Shared state between the DOM narrative and the WebGL world.
 * `chapter` is a float: 2.0 means chapter 2 is centred in the viewport,
 * 2.5 means we are halfway to chapter 3. The render loop reads the mutable
 * fields directly; React only re-renders on the discrete ones.
 */
export const flight = {
  chapter: 0,
  smooth: 0,
  velocity: 0,
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
  /** position of the camera along the career line, 0 (2018) to 1 (today) */
  u: 0,
  /** progress through each stop section, 0 before it to 1 after it (index = stop order) */
  stops: [0, 0, 0] as number[],
  stopsSmooth: [0, 0, 0] as number[],
  /** progress through the main case study of each stop (its sticky track) */
  cases: [0, 0, 0] as number[],
  /** progress (within its stop) at which each project of each stop is centred */
  marks: [[], [], []] as number[][],
}

type UiState = {
  active: number
  focusProject: number | null
  /** id of the case study at the viewport centre */
  project: string | null
  indexOpen: boolean
  /** which step of the main case's role is being shown, per stop */
  phase: number
  /** a stop section is on screen */
  inStop: boolean
  started: boolean
  ready: boolean
}

let ui: UiState = { active: 0, focusProject: null, project: null, indexOpen: false, phase: -1, inStop: false, started: false, ready: false }
const listeners = new Set<() => void>()

export function setUi(patch: Partial<UiState>) {
  let changed = false
  for (const k in patch) {
    const key = k as keyof UiState
    if (ui[key] !== patch[key]) changed = true
  }
  if (!changed) return
  ui = { ...ui, ...patch }
  listeners.forEach((l) => l())
}

export const getUi = () => ui

export function useUi<T>(select: (s: UiState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => select(ui),
  )
}
