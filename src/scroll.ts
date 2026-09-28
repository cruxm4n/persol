import Lenis from 'lenis'
import { useEffect } from 'react'
import { flight, setUi } from './store'

let lenis: Lenis | null = null

/** Viewport-centre position of each chapter's centre, in document px. */
let centres: number[] = []

function measure() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'))
  centres = els.map((el) => {
    const r = el.getBoundingClientRect()
    return r.top + window.scrollY + r.height / 2
  })
}

function chapterAt(scrollY: number) {
  if (!centres.length) return 0
  const probe = scrollY + window.innerHeight / 2
  if (probe <= centres[0]) return 0
  const last = centres.length - 1
  if (probe >= centres[last]) return last
  for (let i = 0; i < last; i++) {
    const a = centres[i]
    const b = centres[i + 1]
    if (probe >= a && probe <= b) return i + (probe - a) / (b - a)
  }
  return last
}

function update(scrollY: number) {
  flight.chapter = chapterAt(scrollY)
  setUi({ active: Math.round(flight.chapter) })
  if (flight.chapter > 0.15) setUi({ started: true })
}

export function scrollToChapter(index: number) {
  const el = document.querySelectorAll<HTMLElement>('[data-chapter]')[index]
  if (!el) return
  const r = el.getBoundingClientRect()
  const target = r.top + window.scrollY + r.height / 2 - window.innerHeight / 2
  if (lenis) lenis.scrollTo(target, { duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else window.scrollTo({ top: target, behavior: flight.reducedMotion ? 'auto' : 'smooth' })
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
