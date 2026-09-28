'use client'

import type { ReactNode } from 'react'
import { brands, categories, clientsSection, contact, expertises, identity, SHOW_GAPS, stats, tools } from '@/lib/portfolio-data'
import { useUi } from '@/lib/experience-store'
import { ZONES, type ZoneId } from '@/lib/scene-config'
import { TextReveal } from '../ui/TextReveal'

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <p className="figure">
      <span className="figure-value">{value}</span>
      <span className="figure-label">{label}</span>
    </p>
  )
}

const gap = SHOW_GAPS ? <span className="gap">À compléter</span> : null

/**
 * One chapter of the walk: a section of the page as long as its place's
 * share of the route, so the camera reaches the place as the chapter
 * arrives. Its panel stays in view (sticky) while the place is held.
 */
type Render = (active: boolean) => ReactNode

function Chapter({ zone, index, length, children, className = '' }: { zone: ZoneId; index: number; length: number; children: Render; className?: string }) {
  const active = useUi((s) => s.zone === index && s.entered)
  const z = ZONES[index]
  const last = index === ZONES.length - 1
  // the page's scroll length is `length` viewports; the last chapter also holds the final screen
  const height = `${(z.range[1] - z.range[0]) * length * 100 + (last ? 100 : 0)}svh`
  return (
    <section id={zone} className={`chapter chapter--${zone} ${active ? 'is-active' : ''} ${className}`} style={{ height }} aria-label={z.title}>
      <div className="panel">
        <p className="kicker">
          <span className="kicker-index">{z.number}</span>
          <span className="kicker-rule" aria-hidden="true" />
          <span>{z.title}</span>
        </p>
        {children(active)}
      </div>
    </section>
  )
}

/**
 * The portfolio's chapters, in the page, over the island. Only the site's
 * own words; each figure also lives in its place on the island (the
 * studio's sign, the street's posters, the village's banner). Nothing to
 * click: scrolling is the only way on.
 */
export function Chapters({ length }: { length: number }) {
  const C = Chapter
  return (
    <main className="chapters">
      <C zone="arrival" index={0} length={length}>
        {(on) => (
          <>
            <TextReveal as="h1" className="hero" text={identity.name} show={on} />
            <p className="role">{identity.role}</p>
            <p className="lead">{identity.description}</p>
            {identity.available && (
              <p className="available">
                <span aria-hidden="true" />
                Disponible
              </p>
            )}
          </>
        )}
      </C>

      <C zone="studio" index={1} length={length}>
        {(on) => (
          <>
            <TextReveal as="h2" className="title" text="Expertise" show={on} />
            <ol className="expertises">
              {expertises.map((e, i) => (
                <li key={e.id}>
                  <span className="list-index">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{e.title}</h3>
                  <p>{e.text}</p>
                </li>
              ))}
            </ol>
            <Figure {...stats.since} />
          </>
        )}
      </C>

      <C zone="attention" index={2} length={length}>
        {(on) => (
          <>
            <TextReveal as="h2" className="title" text="Chiffres clés" show={on} />
            <div className="figures">
              <Figure {...stats.campaigns} />
              <Figure {...stats.budget} />
            </div>
          </>
        )}
      </C>

      <C zone="community" index={3} length={length}>
        {(on) => (
          <>
            <TextReveal as="h2" className="title" text={clientsSection.title} show={on} />
            <p className="note">{clientsSection.note}</p>
            <Figure {...stats.clients} />
            <dl className="brands">
              {categories.map((c) => (
                <div key={c}>
                  <dt>{c}</dt>
                  <dd>
                    {brands
                      .filter((b) => b.category === c)
                      .map((b) => b.name)
                      .join(' · ')}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </C>

      <C zone="system" index={4} length={length}>
        {(on) => (
          <>
            <TextReveal as="h2" className="title" text="Stack technique" show={on} />
            <dl className="stack">
              {tools.map((t) => (
                <div key={t.group}>
                  <dt>{t.group}</dt>
                  <dd>{t.items.join(' · ')}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </C>

      <C zone="contact" index={5} length={length} className="chapter--center">
        {(on) => (
          <>
            <TextReveal as="h2" className="title title--contact" text={contact.title} show={on} />
            <p className="lead">{contact.line}</p>
            <dl className="channels">
              <div>
                <dt>Email</dt>
                <dd>{contact.email || gap}</dd>
              </div>
              <div>
                <dt>LinkedIn</dt>
                <dd>{contact.linkedin || gap}</dd>
              </div>
            </dl>
          </>
        )}
      </C>
    </main>
  )
}
