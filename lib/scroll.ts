'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'
import { experience, setUi } from './experience-store'

let lenis: Lenis | null = null
let bands: { top: number; bottom: number }[] = []

function measure() {
  bands = Array.from(document.querySelectorAll<HTMLElement>('[data-act]')).map((el) => {
    const r = el.getBoundingClientRect()
    return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY }
  })
}

/**
 * Each act's progress runs from its top reaching the top of the viewport (0)
 * to its bottom reaching the bottom of the viewport (1): the act's scene fills
 * the screen for its whole length.
 */
function update(y: number) {
  const vh = window.innerHeight
  let act = 0
  bands.forEach((b, i) => {
    const len = Math.max(1, b.bottom - b.top - vh)
    experience.acts[i] = Math.min(1, Math.max(0, (y - b.top) / len))
    if (y + vh / 2 >= b.top) act = i
  })
  setUi({ act })
  if (y > 8) setUi({ scrolled: true })
}

export function scrollToAct(i: number) {
  const b = bands[i]
  if (!b) return
  if (lenis) lenis.scrollTo(b.top, { duration: 2.2, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else window.scrollTo({ top: b.top, behavior: experience.reducedMotion ? 'auto' : 'smooth' })
}

/** Freeze the page behind an overlay. */
export function pauseScroll(paused: boolean) {
  if (!lenis) return
  if (paused) lenis.stop()
  else lenis.start()
}

export function useScrollDriver(enabled: boolean) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    experience.reducedMotion = reduce
    // the opening sequence holds the page still until it has played
    if (!enabled) {
      document.documentElement.classList.add('is-held')
      return () => document.documentElement.classList.remove('is-held')
    }

    measure()
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.85, touchMultiplier: 1.3 })
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
      experience.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      experience.pointerY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    const ro = new ResizeObserver(onResize)
    ro.observe(document.body)
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
  }, [enabled])
}
