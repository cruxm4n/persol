import { useEffect, useRef } from 'react'
import { chapters, identity } from '../content'
import { scrollToChapter } from '../scroll'
import { flight, useUi } from '../store'

const pad = (n: number, len: number, digits = 0) => {
  const s = Math.abs(n).toFixed(digits)
  return s.padStart(len + (digits ? digits + 1 : 0), '0')
}

/** Drone-style telemetry, updated outside React at display rate. */
function Telemetry() {
  const alt = useRef<HTMLSpanElement>(null)
  const cap = useRef<HTMLSpanElement>(null)
  const vit = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (alt.current) alt.current.textContent = pad(flight.altitude, 3, 1)
      if (cap.current) cap.current.textContent = pad(Math.round(flight.heading), 3)
      if (vit.current) vit.current.textContent = pad(Math.min(99, flight.speed), 2)
      if (bar.current) bar.current.style.transform = `scaleX(${flight.smooth / (chapters.length - 1)})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <div className="hud-telemetry" aria-hidden="true">
        <span>
          ALT <b ref={alt}>000.0</b> m
        </span>
        <span>
          CAP <b ref={cap}>000</b>°
        </span>
        <span>
          VIT <b ref={vit}>00</b>
        </span>
      </div>
      <div className="hud-progress" aria-hidden="true">
        <div ref={bar} />
      </div>
    </>
  )
}

export function Hud() {
  const active = useUi((s) => s.active)
  const current = chapters[active]

  return (
    <header className="hud">
      <a className="hud-mark" href="#lancement" onClick={(e) => (e.preventDefault(), scrollToChapter(0))}>
        <span className="hud-logo">{identity.initials}</span>
        <span className="hud-id">
          {identity.name}
          <em>{identity.role}</em>
        </span>
      </a>

      <div className="hud-chapter" aria-live="polite">
        <span className="hud-code">CH.{current.code}</span>
        <span>{current.label}</span>
      </div>

      <div className="hud-right">
        {identity.available && (
          <span className="hud-status">
            <i /> Disponible
          </span>
        )}
        <a
          className="hud-cta"
          href="#contact"
          onClick={(e) => (e.preventDefault(), scrollToChapter(chapters.length - 1))}
        >
          Contact
        </a>
      </div>

      <nav className="hud-rail" aria-label="Chapitres">
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={i === active ? 'is-active' : i < active ? 'is-past' : ''}
                onClick={() => scrollToChapter(i)}
                aria-current={i === active ? 'step' : undefined}
              >
                <span className="rail-code">{c.code}</span>
                <span className="rail-label">{c.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Telemetry />
    </header>
  )
}
