'use client'

import { useEffect, useRef } from 'react'

/**
 * A printer's crop mark instead of an arrow. It trails the pointer slightly
 * and opens into a frame over anything clickable. Mouse only.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia('(pointer: fine)').matches) return
    document.documentElement.classList.add('has-cursor')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pos = { x: -100, y: -100, tx: -100, ty: -100 }
    let raf = 0
    const tick = () => {
      const k = reduce ? 1 : 0.28
      pos.x += (pos.tx - pos.x) * k
      pos.y += (pos.ty - pos.y) * k
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    const move = (e: PointerEvent) => {
      pos.tx = e.clientX
      pos.ty = e.clientY
      const hit = (e.target as HTMLElement | null)?.closest('a, button, [data-cursor]')
      el.classList.toggle('is-frame', !!hit)
    }
    const leave = () => el.classList.add('is-away')
    const enter = () => el.classList.remove('is-away')
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    document.addEventListener('pointerenter', enter)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('pointerenter', enter)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])
  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <span className="cursor-mark cursor-mark--tl" />
      <span className="cursor-mark cursor-mark--tr" />
      <span className="cursor-mark cursor-mark--bl" />
      <span className="cursor-mark cursor-mark--br" />
      <span className="cursor-dot" />
    </div>
  )
}
