'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'
import { experience, setUi } from './experience-store'
import { zoneAt } from './scene-config'

const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

/** The route's progress is simply how far down the page the reader is. */
function update(y: number) {
  const p = Math.min(1, Math.max(0, y / maxScroll()))
  experience.progress = p
  setUi({ zone: zoneAt(p) })
  if (y > 8) setUi({ scrolled: true })
}

/** Scrolling — wheel, trackpad, touch, keys — is the only thing that moves the walk. */
export function useScrollDriver(enabled: boolean) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    experience.reducedMotion = reduce
    // the opening holds the page still until the camera has settled
    if (!enabled) {
      document.documentElement.classList.add('is-held')
      return () => document.documentElement.classList.remove('is-held')
    }

    let lenis: Lenis | null = null
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.8, touchMultiplier: 1.4 })
      lenis.on('scroll', () => update(window.scrollY))
    }
    let raf = 0
    const loop = (t: number) => {
      lenis?.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onScroll = () => update(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update(window.scrollY)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      lenis?.destroy()
    }
  }, [enabled])
}
