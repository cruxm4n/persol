import { useLayoutEffect, useRef } from 'react'
import { brands, type Brand } from '../lib/portfolio-data'
import { logoPaths } from '../lib/logos'
import { identity } from '../content'
import { setUi } from '../store'

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Symbols and wordmarks have very different shapes. Crop each logo to its own
 * bounds, then size it by area so a wide wordmark and a square symbol carry
 * the same visual weight.
 */
const AREA = 3.1 * 3.1 // em²
const MAX_W = 10.5 // em

function Logo({ brand }: { brand: Brand }) {
  const svg = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    const el = svg.current
    const path = el?.querySelector('path')
    if (!el || !path) return
    const b = path.getBBox()
    if (!b.width || !b.height) return
    const ratio = b.width / b.height
    let h = Math.sqrt(AREA / ratio)
    if (h * ratio > MAX_W) h = MAX_W / ratio
    el.setAttribute('viewBox', `${b.x} ${b.y} ${b.width} ${b.height}`)
    el.style.height = `${h}em`
    el.style.width = `${h * ratio}em`
  }, [])

  if (brand.logo) return <img className="wall-logo" src={brand.logo} alt="" />
  const d = logoPaths[brand.id]
  if (!d)
    return (
      <span className="wall-word" aria-hidden="true">
        {brand.name}
      </span>
    )
  return (
    <svg ref={svg} className="wall-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  )
}

/**
 * The brands, shown as what they are: the strongest proof of the work.
 * Grouped by sector, each logo in ink on paper, with its name set beside it.
 */
export function BrandWall({ chapter }: { chapter: number }) {
  const sectors = [...new Set(brands.map((b) => b.category))].map((c) => ({
    label: c,
    list: brands.filter((b) => b.category === c),
  }))

  return (
    <section id="marques" data-chapter={chapter} className="wall" aria-labelledby="marques-title">
      <div className="wall-head">
        <p className="section-label">Marques</p>
        <h2 id="marques-title" className="wall-count">
          {brands.length}
          <span>marques accompagnées depuis {identity.since}</span>
        </h2>
        <p className="wall-note">En direct ou via agence, de la stratégie au reporting.</p>
        <ul className="wall-legend">
          {sectors.map((s) => (
            <li key={s.label}>
              <a href={`#secteur-${slug(s.label)}`}>{s.label}</a>
              <span>{String(s.list.length).padStart(2, '0')}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="wall-index" onClick={() => setUi({ indexOpen: true })}>
          Voir l'Index : marque, projet, année
        </button>
      </div>

      <div className="wall-body">
        {sectors.map((s) => (
          <section key={s.label} id={`secteur-${slug(s.label)}`} className="wall-sector" aria-label={s.label}>
            <h3 className="wall-sector-title">
              {s.label}
              <span>{String(s.list.length).padStart(2, '0')}</span>
            </h3>
            <ul className="wall-grid">
              {s.list.map((b) => (
                <li key={b.id}>
                  <Logo brand={b} />
                  <span className="wall-name">{b.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="wall-foot">
          Logos reproduits en une seule encre ; les marques restent la propriété de leurs détenteurs.
        </p>
      </div>
    </section>
  )
}
