'use client'

import { useEffect, useRef } from 'react'
import { experience, useUi } from '@/lib/experience-store'
import { ZONES } from '@/lib/scene-config'

/**
 * Where the reader is on the walk: « 03 / 06 », the place's name, and six
 * small segments that fill as each place is crossed.
 */
export function ProgressIndicator() {
  const zone = useUi((s) => s.zone)
  const fills = useRef<(HTMLSpanElement | null)[]>([])
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = experience.smooth
      fills.current.forEach((el, i) => {
        if (!el) return
        const [a, b] = ZONES[i].range
        el.style.transform = `scaleX(${Math.min(1, Math.max(0, (p - a) / (b - a))).toFixed(4)})`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const current = ZONES[zone]
  return (
    <div className="progress">
      <p className="progress-count">
        <span className="progress-now" key={current.number}>
          {current.number}
        </span>
        <span className="progress-total">/ {String(ZONES.length).padStart(2, '0')}</span>
        <span className="progress-title">{current.title}</span>
      </p>
      <div className="progress-track">
        {ZONES.map((z, i) => (
          <span key={z.id} className={`progress-seg ${i === zone ? 'is-current' : ''}`}>
            <span ref={(el) => void (fills.current[i] = el)} className="progress-fill" />
          </span>
        ))}
      </div>
    </div>
  )
}
