import Lenis from 'lenis'
import { useEffect } from 'react'
import { flight, setUi } from './store'

let lenis: Lenis | null = null

type Band = { top: number; bottom: number }

/** Viewport-centre position of each chapter's centre, in document px. */
let centres: number[] = []
/** Extent of each stop section, in stop order. */
let stopBands: (Band | null)[] = []
/** Extent of each case study. */
let projectBands: (Band & { id: string })[] = []
/** Sticky track of each stop's main case study. */
let caseBands: ((Band & { steps: number }) | null)[] = []

const band = (el: HTMLElement): Band => {
  const r = el.getBoundingClientRect()
  return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY }
}

function measure() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'))
  centres = els.map((el) => {
    const b = band(el)
    return (b.top + b.bottom) / 2
  })
  stopBands = [0, 1, 2].map((i) => {
    const el = document.querySelector<HTMLElement>(`[data-stop="${i}"]`)
    return el ? band(el) : null
  })
  caseBands = [0, 1, 2].map((i) => {
    const el = document.querySelector<HTMLElement>(`[data-case-track="${i}"]`)
    return el ? { ...band(el), steps: Number(el.dataset.steps) || 1 } : null
  })
  // where each project of a stop sits, as progress through that stop
  flight.marks = stopBands.map((s, i) => {
    const el = document.querySelector<HTMLElement>(`[data-stop="${i}"]`)
    if (!s || !el) return []
    return Array.from(el.querySelectorAll<HTMLElement>('[data-project]')).map((p) => {
      const b = band(p)
      // a pinned track is "at" its project from its first third
      const at = p.dataset.caseTrack ? b.top + (b.bottom - b.top) * 0.35 : (b.top + b.bottom) / 2
      return (at - s.top) / (s.bottom - s.top)
    })
  })
  projectBands = Array.from(document.querySelectorAll<HTMLElement>('[data-project]')).map((el) => ({
    ...band(el),
    id: el.dataset.project!,
  }))
}

/** Fractional index of the row at the viewport centre (piecewise linear). */
function indexAt(list: number[], scrollY: number) {
  if (!list.length) return 0
  const probe = scrollY + window.innerHeight / 2
  if (probe <= list[0]) return 0
  const last = list.length - 1
  if (probe >= list[last]) return last
  for (let i = 0; i < last; i++) {
    if (probe >= list[i] && probe <= list[i + 1]) return i + (probe - list[i]) / (list[i + 1] - list[i])
  }
  return last
}

function update(scrollY: number) {
  const probe = scrollY + window.innerHeight / 2
  flight.chapter = indexAt(centres, scrollY)
  stopBands.forEach((b, i) => {
    flight.stops[i] = b ? Math.min(1, Math.max(0, (probe - b.top) / (b.bottom - b.top))) : 0
  })
  let phase = -1
  caseBands.forEach((b, i) => {
    if (!b) return
    // the sticky sheet pins at the top: progress runs while the track scrolls under it
    const p = (scrollY + window.innerHeight * 0.3 - b.top) / (b.bottom - b.top - window.innerHeight * 0.7)
    flight.cases[i] = Math.min(1, Math.max(0, p))
    if (p >= 0 && p <= 1.05) phase = Math.min(b.steps - 1, Math.floor(Math.min(0.999, Math.max(0, p)) * b.steps))
  })
  const project = projectBands.find((b) => probe >= b.top && probe <= b.bottom)?.id ?? null
  const inStop = flight.stops.some((v) => v > 0.02 && v < 0.98)
  setUi({ active: Math.round(flight.chapter), project, phase, inStop })
  if (flight.chapter > 0.15) setUi({ started: true })
}

function scrollToY(target: number) {
  if (lenis) lenis.scrollTo(target, { duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else window.scrollTo({ top: target, behavior: flight.reducedMotion ? 'auto' : 'smooth' })
}

export function scrollToChapter(index: number) {
  const el = document.querySelectorAll<HTMLElement>('[data-chapter]')[index]
  if (!el) return
  const r = el.getBoundingClientRect()
  scrollToY(r.top + window.scrollY + r.height / 2 - window.innerHeight / 2)
}

/** Bring an element's top to a third of the viewport. */
export function scrollToElement(el: HTMLElement) {
  scrollToY(el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.18)
}

/** Freeze the page behind an overlay (the brand index). */
export function pauseScroll(paused: boolean) {
  if (!lenis) return
  if (paused) lenis.stop()
  else lenis.start()
}

export function useScrollDriver() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    flight.reducedMotion = reduce

    measure()
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 })
      lenis.on('scroll', () => update(window.scrollY))
    }

    let raf = 0
    const loop = (t: number) => {
      lenis?.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onScroll = () => update(window.scrollY)
    const onResize = () => {
      measure()
      update(window.scrollY)
    }
    const onPointer = (e: PointerEvent) => {
      flight.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      flight.pointerY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    const ro = new ResizeObserver(onResize)
    ro.observe(document.body)
    document.fonts?.ready.then(onResize)
    update(window.scrollY)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      ro.disconnect()
      lenis?.destroy()
      lenis = null
    }
  }, [])
}
