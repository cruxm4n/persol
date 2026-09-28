'use client'

import { useEffect, useRef } from 'react'
import { experience, useUi } from '@/lib/experience-store'
import { ACTS } from '@/lib/scene-config'

/**
 * Where the reader is: act number over five, its name, and five segments that
 * fill as each act is crossed. Written straight to the DOM every frame.
 */
export function ProgressIndicator() {
  const act = useUi((s) => s.act)
  const fills = useRef<(HTMLSpanElement | null)[]>([])
  useEffect(() => {
    let raf = 0
    const tick = () => {
      fills.current.forEach((el, i) => el && (el.style.transform = `scaleX(${experience.actsSmooth[i].toFixed(4)})`))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const current = ACTS[act]
  return (
    <div className="progress" aria-label={`Acte ${current.number} sur 05 : ${current.title}`} role="status">
      <p className="progress-count">
        <span className="progress-now" key={current.number}>
          {current.number}
        </span>
        <span className="progress-total">/ 05</span>
      </p>
      <p className="progress-title" key={current.title}>
        {current.title}
      </p>
      <div className="progress-track" aria-hidden="true">
        {ACTS.map((a, i) => (
          <span key={a.id} className={`progress-seg ${i === act ? 'is-current' : ''}`}>
            <span ref={(el) => void (fills.current[i] = el)} className="progress-fill" />
          </span>
        ))}
      </div>
    </div>
  )
}
