'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { setUi, useUi } from '@/lib/experience-store'
import { loadFonts } from '@/lib/textures'

/**
 * The model is being assembled: fonts, textures drawn from them, shaders.
 * The counter follows that real work (with a short floor so it can be read),
 * then the sheet lifts off the stage like a cover.
 */
export function Loader() {
  const ready = useUi((s) => s.ready)
  const [fonts, setFonts] = useState(false)
  const [gone, setGone] = useState(false)
  const count = useRef<HTMLSpanElement>(null)
  const line = useRef<HTMLSpanElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const progress = useRef({ v: 0 })

  useEffect(() => {
    loadFonts().finally(() => setFonts(true))
  }, [])

  // creep towards 80 while waiting, finish once everything is there
  useEffect(() => {
    const p = progress.current
    const render = () => {
      if (count.current) count.current.textContent = String(Math.round(p.v)).padStart(3, '0')
      if (line.current) line.current.style.transform = `scaleX(${p.v / 100})`
    }
    const target = fonts && ready ? 100 : fonts ? 80 : 45
    const tw = gsap.to(p, { v: target, duration: target === 100 ? 0.7 : 1.4, ease: 'power2.out', onUpdate: render })
    if (target === 100) {
      tw.eventCallback('onComplete', () => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        gsap.to(root.current, {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: reduce ? 0.01 : 1.05,
          ease: 'expo.inOut',
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
      <p className="loader-name">Louis R.</p>
      <p className="loader-caption">
        <span>Montage de la maquette</span>
        <span className="loader-scale">Éch. 1:50</span>
      </p>
      <span ref={count} className="loader-count">
        000
      </span>
      <span className="loader-track" aria-hidden="true">
        <span ref={line} className="loader-line" />
      </span>
    </div>
  )
}
