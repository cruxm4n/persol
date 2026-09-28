'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { setUi, useUi } from '@/lib/experience-store'
import { loadFonts } from '@/lib/materials'

/**
 * The island is being set up: fonts, painted surfaces, shaders. The counter
 * follows that real work (with a short floor so it can be read), then the
 * sheet lifts like morning mist.
 */
export function Loader() {
  const ready = useUi((s) => s.ready)
  const [fonts, setFonts] = useState(false)
  const [gone, setGone] = useState(false)
  const count = useRef<HTMLSpanElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const progress = useRef({ v: 0 })

  useEffect(() => {
    loadFonts().finally(() => setFonts(true))
  }, [])

  useEffect(() => {
    const p = progress.current
    const render = () => {
      if (count.current) count.current.textContent = String(Math.round(p.v)).padStart(3, '0')
      root.current?.style.setProperty('--load', String(p.v / 100))
    }
    const target = fonts && ready ? 100 : fonts ? 80 : 40
    const tw = gsap.to(p, { v: target, duration: target === 100 ? 0.6 : 1.4, ease: 'power2.out', onUpdate: render })
    if (target === 100) {
      tw.eventCallback('onComplete', () => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        gsap.to(root.current, {
          opacity: 0,
          y: -24,
          duration: reduce ? 0.01 : 1.1,
          ease: 'power2.inOut',
          delay: 0.15,
          onStart: () => setUi({ entered: true }),
          onComplete: () => setGone(true),
        })
      })
    }
    return () => {
      tw.kill()
    }
  }, [fonts, ready])

  if (gone) return null
  return (
    <div ref={root} className="loader" role="status" aria-live="polite">
      <p className="loader-name">Île Signal</p>
      <p className="loader-caption">Louis R. · Digital Marketing Manager</p>
      <span className="loader-track" aria-hidden="true">
        <span className="loader-line" />
      </span>
      <span ref={count} className="loader-count">
        000
      </span>
    </div>
  )
}
